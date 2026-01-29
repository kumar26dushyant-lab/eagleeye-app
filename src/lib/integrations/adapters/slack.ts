// Slack Integration Adapter
// Normalizes Slack data to UnifiedSignal format

import { WebClient } from '@slack/web-api'
import type { 
  IntegrationAdapter, 
  IntegrationHealth, 
  UnifiedSignal, 
  SignalCategory 
} from '../types'

// Required scopes (READ-ONLY - we never write to Slack)
export const SLACK_REQUIRED_SCOPES = [
  'channels:history',   // Read public channel messages
  'channels:read',      // List channels
  'channels:join',      // Join public channels (so we can read them)
  'users:read',         // Get user info
  'users:read.email',   // Get user emails (for cross-tool matching)
  'team:read',          // Get workspace info
] as const

// We explicitly DO NOT request:
// - im:history (private DMs)
// - groups:history (private channels)
// - Any write scopes

export class SlackAdapter implements IntegrationAdapter {
  source = 'slack' as const
  private client: WebClient
  private userCache: Map<string, { name: string; email?: string }> = new Map()

  constructor(token: string) {
    this.client = new WebClient(token)
  }

  async checkHealth(): Promise<IntegrationHealth> {
    try {
      const [auth, team] = await Promise.all([
        this.client.auth.test(),
        this.client.team.info(),
      ])

      const scopes = (auth.response_metadata as { scopes?: string[] })?.scopes || []
      const missingScopes = SLACK_REQUIRED_SCOPES.filter(s => !scopes.includes(s))

      // Count channels we can read
      const channels = await this.client.conversations.list({
        types: 'public_channel',
        limit: 100,
      })
      const memberChannels = channels.channels?.filter(c => c.is_member) || []

      return {
        source: 'slack',
        connected: true,
        status: missingScopes.length > 0 ? 'degraded' : 'healthy',
        workspaceName: team.team?.name || 'Unknown',
        workspaceId: team.team?.id,
        connectedAt: new Date().toISOString(),
        lastSyncAt: new Date().toISOString(),
        lastSyncSuccess: true,
        signalCount: memberChannels.length,
        scopes,
        missingScopes: missingScopes.length > 0 ? missingScopes : undefined,
        needsReauth: missingScopes.length > 0,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return {
        source: 'slack',
        connected: false,
        status: 'error',
        lastSyncSuccess: false,
        lastSyncError: message,
        needsReauth: message.includes('invalid_auth') || message.includes('token'),
      }
    }
  }

  async fetchSignals(since?: Date): Promise<UnifiedSignal[]> {
    const signals: UnifiedSignal[] = []
    const oldest = since ? (since.getTime() / 1000).toString() : undefined

    try {
      // Get public channels the bot is in
      const channelsResult = await this.client.conversations.list({
        types: 'public_channel',
        limit: 50,
      })

      if (!channelsResult.channels) return signals

      // Process channels in parallel (limited to 10)
      const memberChannels = channelsResult.channels
        .filter(c => c.id && c.is_member)
        .slice(0, 10)

      const channelSignals = await Promise.all(
        memberChannels.map(channel => this.fetchChannelSignals(channel.id!, channel.name || 'unknown', oldest))
      )

      return channelSignals.flat().sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
    } catch (error) {
      console.error('[Slack] Failed to fetch signals:', error)
      return signals
    }
  }

  private async fetchChannelSignals(
    channelId: string, 
    channelName: string, 
    oldest?: string
  ): Promise<UnifiedSignal[]> {
    const signals: UnifiedSignal[] = []

    try {
      const history = await this.client.conversations.history({
        channel: channelId,
        limit: 25,
        oldest,
      })

      if (!history.messages) return signals

      for (const message of history.messages) {
        if (!message.text || !message.ts || message.subtype) continue

        // Classify the message
        const { category, confidence } = this.classifyMessage(message.text)
        
        // Get sender info
        const sender = message.user ? await this.getUserInfo(message.user) : null

        // Build unified signal
        signals.push({
          id: `slack-${channelId}-${message.ts}`,
          source: 'slack',
          sourceId: message.ts,
          
          category,
          confidence,
          
          title: this.extractTitle(message.text),
          snippet: message.text.slice(0, 300),
          fullContext: message.text,
          
          sender: sender?.name,
          senderEmail: sender?.email,
          
          timestamp: new Date(parseFloat(message.ts) * 1000).toISOString(),
          
          url: `https://slack.com/archives/${channelId}/p${message.ts.replace('.', '')}`,
          channel: `#${channelName}`,
          
          metadata: {
            reactions: message.reactions,
            threadTs: message.thread_ts,
            replyCount: message.reply_count,
          },
        })
      }
    } catch (error) {
      console.error(`[Slack] Failed to fetch channel ${channelName}:`, error)
    }

    return signals
  }

  /**
   * Classify a message into a signal category
   * This is the "intelligence" layer
   */
  private classifyMessage(text: string): { category: SignalCategory; confidence: number } {
    const lower = text.toLowerCase()

    // High confidence patterns
    if (lower.includes('blocked') || lower.includes('stuck') || lower.includes("can't proceed")) {
      return { category: 'blocker', confidence: 0.9 }
    }
    
    if (lower.includes('approve') || lower.includes('sign off') || lower.includes('decision needed')) {
      return { category: 'decision', confidence: 0.85 }
    }

    if (lower.includes('urgent') || lower.includes('asap') || lower.includes('immediately')) {
      return { category: 'escalation', confidence: 0.85 }
    }

    // Medium confidence patterns
    if (text.includes('@') || lower.includes('hey ') || lower.includes('hi ')) {
      // Check if it's a direct mention with task
      if (lower.includes('can you') || lower.includes('could you') || lower.includes('please')) {
        return { category: 'commitment', confidence: 0.7 }
      }
      return { category: 'mention', confidence: 0.75 }
    }

    if (text.includes('?') || lower.includes('what') || lower.includes('how') || lower.includes('when')) {
      return { category: 'question', confidence: 0.7 }
    }

    if (lower.includes('deadline') || lower.includes('due') || lower.includes('by eod') || lower.includes('by end of')) {
      return { category: 'deadline', confidence: 0.75 }
    }

    if (lower.includes('fyi') || lower.includes('heads up') || lower.includes('just letting you know')) {
      return { category: 'update', confidence: 0.8 }
    }

    // Default to update with low confidence
    return { category: 'update', confidence: 0.3 }
  }

  /**
   * Extract a short title from message text
   */
  private extractTitle(text: string): string {
    // Remove Slack formatting
    const clean = text
      .replace(/<@[A-Z0-9]+>/g, '@user')  // Replace user mentions
      .replace(/<#[A-Z0-9]+\|([^>]+)>/g, '#$1')  // Replace channel mentions
      .replace(/<[^>]+>/g, '')  // Remove other links
      .trim()

    // Take first sentence or first 100 chars
    const firstSentence = clean.split(/[.!?]/)[0]
    return firstSentence.length > 100 ? firstSentence.slice(0, 97) + '...' : firstSentence
  }

  /**
   * Get user info (with caching)
   */
  private async getUserInfo(userId: string): Promise<{ name: string; email?: string } | null> {
    if (this.userCache.has(userId)) {
      return this.userCache.get(userId)!
    }

    try {
      const result = await this.client.users.info({ user: userId })
      const user = result.user
      if (!user) return null

      const info = {
        name: user.real_name || user.name || 'Unknown',
        email: user.profile?.email,
      }
      this.userCache.set(userId, info)
      return info
    } catch {
      return null
    }
  }

  // OAuth helpers
  static getAuthUrl(clientId: string, redirectUri: string, state: string): string {
    const scopes = SLACK_REQUIRED_SCOPES.join(',')
    return `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`
  }

  static async handleCallback(
    code: string, 
    clientId: string, 
    clientSecret: string, 
    redirectUri: string
  ): Promise<{ accessToken: string; teamName: string; teamId: string }> {
    const response = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    })

    const data = await response.json()
    if (!data.ok) {
      throw new Error(data.error || 'OAuth failed')
    }

    return {
      accessToken: data.access_token,
      teamName: data.team?.name || 'Unknown',
      teamId: data.team?.id || '',
    }
  }
}
