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

        // IMPORTANT: Skip noise/trivial messages BEFORE classifying
        if (this.isNoiseMessage(message.text)) {
          continue
        }

        // Classify the message
        const { category, confidence } = this.classifyMessage(message.text)
        
        // Only include signals with meaningful confidence
        // This filters out low-value "update" signals
        if (confidence < 0.5) continue
        
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
   * Check if a message is noise/trivial and should be filtered out
   * EagleEye's core value: ONLY surface actionable signals, not chit-chat
   */
  private isNoiseMessage(text: string): boolean {
    const lower = text.toLowerCase().trim()
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length
    
    // FILTER OUT: Very short messages (under 4 words) unless they have urgency signals
    if (wordCount < 4) {
      const hasUrgency = /urgent|asap|critical|blocked|help|deadline/.test(lower)
      if (!hasUrgency) return true
    }
    
    // FILTER OUT: Pure greetings and pleasantries
    const NOISE_PATTERNS = [
      /^(hi|hey|hello|yo|sup|hiya|howdy)[\s!.,]*$/i,
      /^(hi|hey|hello)\s+(there|all|everyone|team|folks)[\s!.,]*$/i,
      /^good\s+(morning|afternoon|evening|night)[\s!.,]*$/i,
      /^(thanks|thank you|thx|ty)[\s!.,]*$/i,
      /^(ok|okay|k|kk|cool|great|nice|awesome|perfect|sounds good|got it|noted|ack)[\s!.,]*$/i,
      /^(yes|no|yep|nope|yeah|nah|sure|yup)[\s!.,]*$/i,
      /^(👍|👎|✅|❌|🎉|😊|🙏|💯|🔥|👀|😄|😂|🤣|lol|lmao|haha)+$/i,
      /^(brb|bbl|gtg|ttyl|afk|omw)[\s!.,]*$/i,
      /^i'?m\s+(here|back|around|online|available)[\s!.,]*$/i,
      /^(good to see you|nice to see you|glad you'?re here)[\s!.,]*$/i,
      /^(bye|goodbye|cya|see ya|later|have a good one)[\s!.,]*$/i,
      /^(morning|afternoon)[\s!.,]*$/i,
      /^welcome[\s!.,]*$/i,
      /^(happy|glad)\s+to\s+(help|assist)[\s!.,]*$/i,
      /^(no problem|no worries|np|nw|anytime)[\s!.,]*$/i,
      /^same[\s!.,]*$/i,
      /^(agreed|exactly|right|true|indeed)[\s!.,]*$/i,
      /^\+1[\s!.,]*$/i,
      /^(what'?s up|how'?s it going|how are you)[\s!.,?]*$/i,
    ]
    
    for (const pattern of NOISE_PATTERNS) {
      if (pattern.test(lower)) return true
    }
    
    // FILTER OUT: Messages that are just reactions/acknowledgements with nothing actionable
    // These often slip through: "awesome thanks!", "nice work!", "sounds good to me!"
    const ACKNOWLEDGEMENT_ONLY = /^(that'?s\s+)?(awesome|amazing|great|nice|cool|perfect|excellent|wonderful|fantastic|brilliant)\s*(work|job|stuff)?[\s!.,]*$/i
    if (ACKNOWLEDGEMENT_ONLY.test(lower)) return true
    
    return false
  }

  /**
   * Classify a message into a signal category
   * This is the "intelligence" layer
   */
  private classifyMessage(text: string): { category: SignalCategory; confidence: number } {
    const lower = text.toLowerCase()

    // High confidence patterns - clear signals
    if (lower.includes('blocked') || lower.includes('stuck') || lower.includes("can't proceed") || lower.includes('cannot proceed')) {
      return { category: 'blocker', confidence: 0.9 }
    }
    
    if (lower.includes('approve') || lower.includes('sign off') || lower.includes('decision needed') || lower.includes('need your input')) {
      return { category: 'decision', confidence: 0.85 }
    }

    if (lower.includes('urgent') || lower.includes('asap') || lower.includes('immediately') || lower.includes('critical') || lower.includes('p0') || lower.includes('p1')) {
      return { category: 'escalation', confidence: 0.85 }
    }

    // Medium confidence patterns - need more context
    if (lower.includes('deadline') || lower.includes('due') || lower.includes('by eod') || lower.includes('by end of') || lower.includes('by friday') || lower.includes('by monday')) {
      return { category: 'deadline', confidence: 0.75 }
    }

    // Questions that actually need answers (not rhetorical)
    if ((text.includes('?') && (lower.includes('can you') || lower.includes('could you') || lower.includes('would you') || lower.includes('do you know') || lower.includes('any update')))) {
      return { category: 'question', confidence: 0.7 }
    }

    // Direct mentions with actionable content
    if (text.includes('@')) {
      // Must have some substance beyond just the mention
      const hasProblem = lower.includes('issue') || lower.includes('problem') || lower.includes('error') || lower.includes('bug')
      const hasAsk = lower.includes('can you') || lower.includes('could you') || lower.includes('please') || lower.includes('need')
      const hasUpdate = lower.includes('update') || lower.includes('status') || lower.includes('progress')
      
      if (hasProblem || hasAsk || hasUpdate) {
        return { category: 'mention', confidence: 0.75 }
      }
      // Mentions without clear action = low confidence
      return { category: 'mention', confidence: 0.4 }
    }

    // Commitments - someone saying they'll do something
    if (lower.includes("i'll") || lower.includes("i will") || lower.includes("will have") || lower.includes("will get")) {
      if (lower.includes('ready') || lower.includes('done') || lower.includes('finished') || lower.includes('completed')) {
        return { category: 'commitment', confidence: 0.7 }
      }
    }

    // General questions
    if (text.includes('?') && (lower.includes('what') || lower.includes('how') || lower.includes('when') || lower.includes('where') || lower.includes('who'))) {
      return { category: 'question', confidence: 0.55 }
    }

    // FYI/updates - only if explicitly marked
    if (lower.includes('fyi') || lower.includes('heads up') || lower.includes('just letting you know') || lower.includes('update:')) {
      return { category: 'update', confidence: 0.65 }
    }

    // Default to update with very low confidence - these get filtered
    return { category: 'update', confidence: 0.25 }
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
