// Real data API - fetches from connected integrations (Slack, Asana, Linear)
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { WebClient } from '@slack/web-api'
import type { IntentMode } from '@/lib/importance'
import type { CommunicationSignal, WorkItem, SignalType } from '@/types'
import { SupabaseClient } from '@supabase/supabase-js'
import { IntegrationManager } from '@/lib/integrations/manager'
import { 
  getTimeWindow, 
  getMultiDayWindow,
  interpretEmptyResults, 
  detectTimezone,
  formatTimezone,
  type TimeWindow 
} from '@/lib/timeWindow'

// Get Slack client (from env or user's OAuth token)
async function getSlackClient(userId: string, supabase: SupabaseClient) {
  // First check if user has OAuth token stored
  const { data: integration } = await supabase
    .from('integrations')
    .select('access_token')
    .eq('user_id', userId)
    .eq('provider', 'slack')
    .eq('status', 'active')
    .single()

  if (integration?.access_token) {
    return new WebClient(integration.access_token)
  }

  // Fall back to env token (for testing)
  if (process.env.SLACK_BOT_TOKEN) {
    return new WebClient(process.env.SLACK_BOT_TOKEN)
  }

  return null
}

// Fetch real messages from Slack with time window
async function fetchSlackSignals(client: WebClient, timeWindow: TimeWindow): Promise<CommunicationSignal[]> {
  const signals: CommunicationSignal[] = []
  const oldest = (timeWindow.start.getTime() / 1000).toString()
  
  try {
    // Get list of channels the bot is in (public only - private requires extra scope)
    const channelsResult = await client.conversations.list({
      types: 'public_channel',
      limit: 50
    })

    if (!channelsResult.channels) return signals

    // Get bot user ID to detect mentions
    const authResult = await client.auth.test()
    const botUserId = authResult.user_id

    // Fetch messages from time window for each channel
    for (const channel of channelsResult.channels.slice(0, 10)) { // Limit to 10 channels
      if (!channel.id || !channel.is_member) continue

      try {
        const historyResult = await client.conversations.history({
          channel: channel.id,
          oldest, // Only fetch messages since time window start
          limit: 100, // More messages since we're filtering by time
        })

        if (!historyResult.messages) continue

        for (const message of historyResult.messages) {
          if (!message.text || message.subtype) continue // Skip system messages

          // Detect signal type
          let signalType: SignalType = 'fyi'
          
          // Check for @mentions
          if (message.text.includes(`<@${botUserId}>`) || message.text.includes('@channel') || message.text.includes('@here')) {
            signalType = 'mention'
          }
          // Check for questions
          else if (message.text.includes('?') || message.text.toLowerCase().includes('can you') || message.text.toLowerCase().includes('could you')) {
            signalType = 'question'
          }
          // Check for blockers
          else if (message.text.toLowerCase().includes('blocked') || message.text.toLowerCase().includes('stuck') || message.text.toLowerCase().includes('help')) {
            signalType = 'blocker'
          }
          // Check for decisions
          else if (message.text.toLowerCase().includes('decide') || message.text.toLowerCase().includes('approve') || message.text.toLowerCase().includes('sign off')) {
            signalType = 'decision_needed'
          }

          // Get sender info
          let senderName = 'Unknown'
          if (message.user) {
            try {
              const userInfo = await client.users.info({ user: message.user })
              senderName = userInfo.user?.real_name || userInfo.user?.name || 'Unknown'
            } catch {
              // User lookup failed, use ID
              senderName = message.user
            }
          }

          signals.push({
            id: message.ts || `slack-${Date.now()}`,
            user_id: '', // Will be set by caller
            source: 'slack',
            source_message_id: message.ts || '',
            channel_id: channel.id,
            channel_name: channel.name || 'unknown',
            sender_name: senderName,
            signal_type: signalType,
            snippet: message.text.slice(0, 200) + (message.text.length > 200 ? '...' : ''),
            timestamp: message.ts ? new Date(parseFloat(message.ts) * 1000).toISOString() : new Date().toISOString(),
            is_read: false,
            is_actioned: false,
            is_from_monitored_channel: true,
            detected_via: 'channel_monitor',
            message_url: `https://slack.com/archives/${channel.id}/p${message.ts?.replace('.', '')}`,
            raw_metadata: {
              full_context: message.text,
              reactions: message.reactions,
            },
            created_at: new Date().toISOString(),
          })
        }
      } catch (err) {
        console.error(`Failed to fetch history for channel ${channel.name}:`, err)
      }
    }
  } catch (err) {
    console.error('Failed to fetch Slack channels:', err)
  }

  // Sort by timestamp descending (newest first)
  return signals.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

// Filter signals based on intent mode
function filterSignalsByMode(signals: CommunicationSignal[], mode: IntentMode): CommunicationSignal[] {
  switch (mode) {
    case 'calm':
      // Only critical - blockers and decisions
      return signals.filter(s => s.signal_type === 'blocker' || s.signal_type === 'decision_needed')
    case 'on_the_go':
      // High priority - mentions, blockers, decisions
      return signals.filter(s => s.signal_type && ['mention', 'blocker', 'decision_needed'].includes(s.signal_type))
    case 'focus':
      // Blockers only
      return signals.filter(s => s.signal_type === 'blocker')
    case 'work':
    default:
      // Everything
      return signals
  }
}

// Generate brief text from real signals
function generateBriefFromSignals(
  signals: CommunicationSignal[], 
  mode: IntentMode,
  timeWindow: TimeWindow
): string {
  const mentions = signals.filter(s => s.signal_type === 'mention').length
  const questions = signals.filter(s => s.signal_type === 'question').length
  const blockers = signals.filter(s => s.signal_type === 'blocker').length
  const decisions = signals.filter(s => s.signal_type === 'decision_needed').length

  const parts: string[] = []
  
  if (blockers > 0) parts.push(`${blockers} blocker${blockers > 1 ? 's' : ''} need attention`)
  if (decisions > 0) parts.push(`${decisions} decision${decisions > 1 ? 's' : ''} pending`)
  if (mentions > 0) parts.push(`${mentions} @mention${mentions > 1 ? 's' : ''}`)
  if (questions > 0) parts.push(`${questions} question${questions > 1 ? 's' : ''} for you`)

  if (parts.length === 0) {
    // Use empty message based on time window
    const empty = interpretEmptyResults(timeWindow)
    return empty.message
  }

  // Use time window label in brief
  return `${timeWindow.label}: ${parts.join(', ')}.`
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  // Allow unauthenticated access when using env token (for testing)
  const hasEnvToken = !!process.env.SLACK_BOT_TOKEN
  
  if (!user && !hasEnvToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const mode = (searchParams.get('mode') || 'work') as IntentMode
  const timePreset = searchParams.get('time') || 'today' // today, yesterday, 3days, week
  const userTimezone = searchParams.get('tz') || detectTimezone() // User's timezone
  
  // Validate mode
  if (!['calm', 'on_the_go', 'work', 'focus'].includes(mode)) {
    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 })
  }

  // Get time window based on preset (full days, 00:00-23:59 in user's timezone)
  let timeWindow: TimeWindow
  
  switch (timePreset) {
    case 'yesterday':
      timeWindow = getTimeWindow(1, userTimezone) // Yesterday only
      break
    case '3days':
      timeWindow = getMultiDayWindow(3, userTimezone) // Last 3 days
      break
    case 'week':
      timeWindow = getMultiDayWindow(7, userTimezone) // Last 7 days
      break
    case 'today':
    default:
      timeWindow = getMultiDayWindow(1, userTimezone) // Today (since midnight)
      break
  }

  try {
    // Check which tools are connected
    const connectedTools: string[] = []
    
    // Get Slack client - use env token if no user, or user's OAuth token
    let slackClient: WebClient | null = null
    
    if (user) {
      slackClient = await getSlackClient(user.id, supabase)
    } else if (hasEnvToken) {
      slackClient = new WebClient(process.env.SLACK_BOT_TOKEN)
    }
    
    if (slackClient) connectedTools.push('slack')
    if (process.env.ASANA_ACCESS_TOKEN) connectedTools.push('asana')
    if (process.env.LINEAR_API_KEY) connectedTools.push('linear')
    
    let allSignals: CommunicationSignal[] = []
    let dataSource = connectedTools.length > 0 ? connectedTools.join('+') : 'none'

    if (slackClient) {
      const slackSignals = await fetchSlackSignals(slackClient, timeWindow)
      allSignals = slackSignals.map(s => ({ ...s, user_id: user?.id || 'demo' }))
    }
    
    // Fetch Asana tasks using IntegrationManager
    if (process.env.ASANA_ACCESS_TOKEN) {
      try {
        const manager = IntegrationManager.fromEnv()
        const asanaAdapter = manager.getAdapter('asana')
        
        if (asanaAdapter) {
          const asanaSignals = await asanaAdapter.fetchSignals(timeWindow.start)
          
          // Convert UnifiedSignal to CommunicationSignal format
          for (const signal of asanaSignals) {
            // Get project name from metadata safely
            const projects = signal.metadata?.projects as string[] | undefined
            const projectName = projects?.[0] || 'Asana'
            
            const commSignal: CommunicationSignal = {
              id: signal.id,
              user_id: user?.id || 'demo',
              source: 'asana',
              source_message_id: signal.sourceId,
              channel_id: '',
              channel_name: projectName,
              sender_name: signal.owner || 'Asana Task',
              signal_type: signal.category === 'deadline' ? 'blocker' : 
                          signal.category === 'commitment' ? 'decision_needed' : 'fyi',
              snippet: signal.title,
              timestamp: signal.timestamp,
              is_read: false,
              is_actioned: false,
              is_from_monitored_channel: true,
              detected_via: 'asana_task',
              message_url: signal.url || '',
              raw_metadata: {
                full_context: signal.fullContext || signal.title,
                asana_data: signal.metadata,
                confidence: signal.confidence,
              },
              created_at: new Date().toISOString(),
            }
            allSignals.push(commSignal)
          }
        }
      } catch (asanaError) {
        console.error('[Asana] Failed to fetch signals:', asanaError)
      }
    }

    // Filter by mode
    const filteredSignals = filterSignalsByMode(allSignals, mode)
    
    // Generate brief with time context
    const briefText = generateBriefFromSignals(filteredSignals, mode, timeWindow)

    // For now, work items come from PM tools (not yet implemented)
    // TODO: Fetch from Asana/Linear when connected
    const workItems: WorkItem[] = []

    // Get empty state message if no signals
    const emptyState = allSignals.length === 0 ? interpretEmptyResults(timeWindow) : null

    return NextResponse.json({
      mode,
      dataSource,
      connectedTools,
      timeWindow: {
        start: timeWindow.start.toISOString(),
        end: timeWindow.end.toISOString(),
        label: timeWindow.label,
        daysCovered: timeWindow.daysCovered,
        timezone: timeWindow.timezone,
        timezoneDisplay: formatTimezone(timeWindow.timezone),
      },
      brief: {
        brief_text: briefText,
        needs_attention: workItems.filter(w => w.urgency === 'high'),
        fyi_items: workItems.filter(w => w.urgency === 'medium'),
        handled_items: workItems.filter(w => w.status === 'done'),
        coverage_percentage: 100,
        total_items_processed: allSignals.length,
        items_surfaced: filteredSignals.length,
      },
      signals: filteredSignals.slice(0, 50), // Limit to 50 signals
      emptyState,
      stats: {
        needsAttention: filteredSignals.filter(s => s.signal_type && ['blocker', 'decision_needed', 'mention'].includes(s.signal_type)).length,
        fyi: filteredSignals.filter(s => s.signal_type === 'fyi' || s.signal_type === 'question').length,
        handled: 0,
        signals: filteredSignals.length,
        totalItems: workItems.length,
        totalSignals: allSignals.length,
      }
    })
  } catch (error) {
    console.error('Failed to fetch real data:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
