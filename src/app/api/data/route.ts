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

// ============================================================================
// APPRECIATION DETECTION - Reactions that indicate kudos/celebration
// ============================================================================

// Reactions that indicate appreciation/celebration (without colons)
const APPRECIATION_REACTIONS = [
  'tada', 'party_popper', 'partying_face', '100', 'fire', 'sparkles',
  'star', 'star2', 'clap', 'raised_hands', 'pray', 'trophy', 'medal',
  'first_place_medal', 'second_place_medal', 'third_place_medal',
  'heart', 'heart_eyes', 'rocket', 'confetti_ball', 'balloon',
  'thumbsup', '+1', 'ok_hand', 'muscle', 'crown', 'gem', 'sparkling_heart',
  'heavy_check_mark', 'white_check_mark', 'checkered_flag',
]

function hasAppreciationReactions(reactions: Array<{ name: string; count: number }> | undefined): boolean {
  if (!reactions || reactions.length === 0) return false
  return reactions.some(r => APPRECIATION_REACTIONS.includes(r.name) && r.count >= 2)
}

function getReactionCount(reactions: Array<{ name: string; count: number }> | undefined): number {
  if (!reactions) return 0
  return reactions.reduce((sum, r) => sum + r.count, 0)
}

// ============================================================================
// SMART DEDUPLICATION - Thread collapse & duplicate detection
// If Person A posts appreciation and 10 people reply with "congrats!", 
// we only show the parent post, not all the replies
// ============================================================================

// Patterns that indicate a "me too" or congratulatory reply
const CONGRATS_REPLY_PATTERNS = [
  /^(congrats|congratulations|congradulations|well done|amazing|awesome|great|nice|woo|yay|🎉|🙌|👏|💪|🔥|❤️|💖|👍)+[\s!.,]*$/i,
  /^(so happy for you|happy for you|proud of you|way to go|keep it up)+[\s!.,]*$/i,
  /^(you deserve it|well deserved|you earned it)+[\s!.,]*$/i,
  /^\+1[\s!.,]*$/i,
  /^(same|ditto|agreed|this|^)+[\s!.,]*$/i,
]

function isCongratsReply(text: string): boolean {
  const lower = text.toLowerCase().trim()
  // Short messages (< 6 words) that match congrats patterns
  const wordCount = lower.split(/\s+/).length
  if (wordCount > 8) return false // Longer messages might have real content
  
  for (const pattern of CONGRATS_REPLY_PATTERNS) {
    if (pattern.test(lower)) return true
  }
  
  // Check for emoji-only replies
  const emojiOnly = /^[\s\p{Emoji_Presentation}\p{Extended_Pictographic}]+$/u
  if (emojiOnly.test(text.trim())) return true
  
  return false
}

// Deduplicate signals - collapse threads, remove duplicates
function deduplicateSignals(signals: CommunicationSignal[]): CommunicationSignal[] {
  const uniqueById = new Map<string, CommunicationSignal>()
  const contentDedup = new Map<string, CommunicationSignal>()
  const threadParents = new Map<string, CommunicationSignal>() // Track parent messages of threads
  
  // First pass: identify parent messages
  for (const signal of signals) {
    const metadata = signal.raw_metadata as { reply_count?: number; thread_ts?: string; parent_ts?: string }
    
    // If this has replies, it's a parent message - track it
    if (metadata?.reply_count && metadata.reply_count > 0) {
      threadParents.set(signal.source_message_id, signal)
    }
  }
  
  // Second pass: filter and deduplicate
  for (const signal of signals) {
    const metadata = signal.raw_metadata as { thread_ts?: string; parent_ts?: string }
    const snippet = signal.snippet || ''
    
    // Create a truly unique key combining source and message ID
    const uniqueKey = `${signal.source}:${signal.source_message_id}`
    
    // Skip if we've already seen this exact message
    if (uniqueById.has(uniqueKey)) {
      console.log(`[Dedup] Skipping exact duplicate ID: ${uniqueKey}`)
      continue
    }
    
    // Skip if this is a reply in a kudos/celebration thread and it's just a "congrats" reply
    if (metadata?.thread_ts || metadata?.parent_ts) {
      const parentTs = metadata.thread_ts || metadata.parent_ts
      const parent = threadParents.get(parentTs || '')
      
      if (parent && (parent.signal_type === 'kudos' || parent.signal_type === 'celebration')) {
        if (isCongratsReply(snippet)) {
          console.log(`[Dedup] Skipping congrats reply: "${snippet.slice(0, 50)}"`)
          continue // Skip this reply, we already have the parent
        }
      }
    }
    
    // Content-based deduplication: same content within 5 minutes = duplicate
    const contentKey = `${signal.channel_id || 'nochannel'}:${normalizeForDedup(snippet)}`
    const existing = contentDedup.get(contentKey)
    
    if (existing) {
      const existingTime = new Date(existing.timestamp).getTime()
      const currentTime = new Date(signal.timestamp).getTime()
      const timeDiff = Math.abs(currentTime - existingTime)
      
      // If same content within 5 minutes, skip
      if (timeDiff < 5 * 60 * 1000) {
        console.log(`[Dedup] Skipping content duplicate: "${snippet.slice(0, 50)}"`)
        continue
      }
    }
    
    // Add to our tracking maps
    uniqueById.set(uniqueKey, signal)
    contentDedup.set(contentKey, signal)
  }
  
  return Array.from(uniqueById.values())
}

// Normalize text for deduplication comparison
function normalizeForDedup(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ')     // Normalize whitespace
    .trim()
    .slice(0, 100)            // Compare first 100 chars
}

// ============================================================================
// NOISE FILTERING - EagleEye's Core USP
// We ONLY surface actionable signals, not chit-chat
// ============================================================================

const NOISE_PATTERNS = [
  /^(hi|hey|hello|yo|sup|hiya|howdy)[\s!.,]*$/i,
  /^(hi|hey|hello)\s+(there|all|everyone|team|folks)[\s!.,]*$/i,
  /^good\s+(morning|afternoon|evening|night)[\s!.,]*$/i,
  /^(thanks|thank you|thx|ty)[\s!.,]*$/i,
  /^(ok|okay|k|kk|cool|great|nice|awesome|perfect|sounds good|got it|noted|ack)[\s!.,]*$/i,
  /^(yes|no|yep|nope|yeah|nah|sure|yup)[\s!.,]*$/i,
  /^(👍|👎|✅|❌|🎉|😊|🙏|💯|🔥|👀|😄|😂|🤣|lol|lmao|haha)+[\s]*$/i,
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

function isNoiseMessage(text: string): boolean {
  const lower = text.toLowerCase().trim()
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length
  
  // Very short messages (< 4 words) without urgency = noise
  if (wordCount < 4) {
    const hasUrgency = /urgent|asap|critical|blocked|help|deadline|p0|p1/.test(lower)
    if (!hasUrgency) return true
  }
  
  // Check against noise patterns
  for (const pattern of NOISE_PATTERNS) {
    if (pattern.test(lower)) return true
  }
  
  // NOTE: We no longer filter appreciation messages - they become 'kudos' signals!
  // This helps surface positivity in the workplace
  
  return false
}

// ============================================================================

// Classify a Slack message into signal type with confidence score
function classifySlackMessage(text: string, botUserId: string): { signalType: SignalType; confidence: number } {
  const lower = text.toLowerCase()
  
  // ============================================================================
  // CRITICAL/URGENT SIGNALS FIRST - Check these before anything else!
  // ============================================================================
  
  // Blockers - someone is stuck (check first!)
  if (lower.includes('blocked') || lower.includes('stuck') || lower.includes("can't proceed") || lower.includes('cannot proceed')) {
    return { signalType: 'blocker', confidence: 0.95 }
  }
  
  // Escalations - urgent matters
  if (lower.includes('urgent') || lower.includes('asap') || lower.includes('immediately') || lower.includes('critical') || lower.includes('p0') || lower.includes('p1') || lower.includes('emergency')) {
    return { signalType: 'escalation', confidence: 0.95 }
  }
  
  // "Big issue" / "major problem" patterns = urgent (check early!)
  if ((lower.includes('big') || lower.includes('major') || lower.includes('serious') || lower.includes('significant')) && 
      (lower.includes('issue') || lower.includes('problem') || lower.includes('bug') || lower.includes('error'))) {
    return { signalType: 'urgent', confidence: 0.9 }
  }
  
  // "Otherwise" with negative outcome = urgent
  if (lower.includes('otherwise') && (lower.includes('issue') || lower.includes('problem') || lower.includes('fail') || lower.includes('break') || lower.includes('bad'))) {
    return { signalType: 'urgent', confidence: 0.85 }
  }
  
  // "Today" with action words = urgent
  if (lower.includes('today') && (lower.includes('need to') || lower.includes('deploy') || lower.includes('release') || lower.includes('fix') || lower.includes('ship') || lower.includes('must') || lower.includes('have to'))) {
    return { signalType: 'urgent', confidence: 0.85 }
  }
  
  // Decisions needed
  if (lower.includes('approve') || lower.includes('sign off') || lower.includes('decision needed') || lower.includes('need your input') || lower.includes('need approval')) {
    return { signalType: 'decision_needed', confidence: 0.85 }
  }
  
  // ============================================================================
  // POSITIVE SIGNALS - Surface appreciation and wins!
  // ============================================================================
  
  // Kudos / Appreciation - someone giving props
  const kudosPatterns = [
    /\b(great|amazing|awesome|excellent|fantastic|outstanding|incredible)\s+(work|job|effort)/i,
    /\b(thank you|thanks)\s+(so much|for|to)\s+\w+/i,
    /\b(kudos|props|shoutout|shout-out|hats off)\s+(to|for)/i,
    /\b(well done|nice work|good job|nailed it|crushed it|killed it)/i,
    /\b(appreciate|grateful|thankful)\s+(your|the|all)/i,
    /\bthank\s+you\s+@/i, // thanking someone specifically
    /🎉.*(@|team|everyone|all)/i, // celebration with mention
    /🙏\s*(@|\w+)/i, // prayer hands thanking someone
    // NEW: Recognition patterns
    /\b(recognize|recognise|recognizing)\s+\w+/i, // "recognize Sam"
    /\bcontributed\s+(a lot|greatly|significantly)/i, // "contributed a lot"
    /\b(keep going|keep it up|keep up the (good |great )?work)/i, // encouragement
    /\b(proud of|impressed by|impressed with)\s+/i,
    /\b(shout out|big thanks|special thanks)\s+(to|for)/i,
    /\b(stellar|superb|brilliant|exceptional)\s+(work|job|effort|performance)/i,
    /\b(you'?re|you are)\s+(amazing|awesome|the best|fantastic)/i,
  ]
  
  for (const pattern of kudosPatterns) {
    if (pattern.test(text)) {
      return { signalType: 'kudos', confidence: 0.9 }
    }
  }
  
  // Celebration - team wins, launches, milestones
  const celebrationPatterns = [
    /\b(shipped|launched|released|deployed|went live|is live)\b/i,
    /\b(congrats|congratulations|congradulations)\b/i,
    /\b(celebrate|celebrating|celebration)\b/i,
    /\bwe did it\b/i,
    /\b(big win|huge win|major win)\b/i,
    /🎉|🚀|🎊|🥳|🏆|💪|✨/,
    /\bwelcome\s+(to the team|aboard)/i,
    /\b(promotion|promoted)\b/i,
  ]
  
  for (const pattern of celebrationPatterns) {
    if (pattern.test(text)) {
      return { signalType: 'celebration', confidence: 0.8 }
    }
  }
  
  // Milestone - project/work milestones
  const milestonePatterns = [
    /\b(milestone|completed|finished|done with|wrapped up)\b.*\b(project|feature|sprint|phase)\b/i,
    /\b(hit|reached|achieved)\s+(our|the)?\s*(goal|target|milestone|deadline)/i,
    /\b(100%|complete|completed)\b/i,
    /\bmerged\s+(the|this)?\s*(pr|pull request|feature)/i,
  ]
  
  for (const pattern of milestonePatterns) {
    if (pattern.test(text)) {
      return { signalType: 'milestone', confidence: 0.75 }
    }
  }
  
  // ============================================================================
  // MEDIUM CONFIDENCE - Contextual signals
  // ============================================================================
  
  // Direct mentions with actionable content
  if (text.includes(`<@${botUserId}>`) || text.includes('@channel') || text.includes('@here')) {
    const hasProblem = lower.includes('issue') || lower.includes('problem') || lower.includes('error') || lower.includes('bug')
    const hasAsk = lower.includes('can you') || lower.includes('could you') || lower.includes('please') || lower.includes('need')
    const hasUpdate = lower.includes('update') || lower.includes('status') || lower.includes('progress')
    
    if (hasProblem || hasAsk || hasUpdate) {
      return { signalType: 'mention', confidence: 0.8 }
    }
    // Mention without clear action
    return { signalType: 'mention', confidence: 0.5 }
  }
  
  // Questions that need answers (not rhetorical)
  if (text.includes('?')) {
    if (lower.includes('can you') || lower.includes('could you') || lower.includes('would you') || lower.includes('do you know') || lower.includes('any update') || lower.includes('what\'s the status')) {
      return { signalType: 'question', confidence: 0.7 }
    }
    // Generic question
    if (lower.includes('what') || lower.includes('how') || lower.includes('when') || lower.includes('where') || lower.includes('who')) {
      return { signalType: 'question', confidence: 0.55 }
    }
  }
  
  // Deadlines with specific dates
  if (lower.includes('deadline') || lower.includes('by eod') || lower.includes('by end of') || lower.includes('by friday') || lower.includes('by monday') || lower.includes('due today') || lower.includes('due tomorrow')) {
    return { signalType: 'urgent', confidence: 0.85 }
  }
  
  // Review requests - need attention
  if (lower.includes('review') || lower.includes('pr ready') || lower.includes('ready for review') || lower.includes('needs review') || lower.includes('please review') || lower.includes('can you review') || lower.includes('take a look')) {
    return { signalType: 'decision_needed', confidence: 0.75 }
  }
  
  // Action requests
  if ((lower.includes('can you') || lower.includes('could you') || lower.includes('please')) && 
      (lower.includes('check') || lower.includes('look') || lower.includes('help') || lower.includes('send') || lower.includes('share') || lower.includes('update'))) {
    return { signalType: 'mention', confidence: 0.7 }
  }
  
  // Commitments - someone saying they'll do something
  if ((lower.includes("i'll") || lower.includes("i will") || lower.includes("will have") || lower.includes("will get")) && 
      (lower.includes('ready') || lower.includes('done') || lower.includes('finished') || lower.includes('completed') || lower.includes('by'))) {
    return { signalType: 'mention', confidence: 0.6 }
  }
  
  // Explicit FYI
  if (lower.includes('fyi') || lower.includes('heads up') || lower.includes('just letting you know') || lower.startsWith('update:')) {
    return { signalType: 'fyi', confidence: 0.65 }
  }
  
  // Default: Low confidence FYI - will be filtered in most modes
  return { signalType: 'fyi', confidence: 0.3 }
}

// Get Slack client (from env or user's OAuth token)
async function getSlackClient(userId: string, supabase: SupabaseClient) {
  // First check if user has OAuth token stored
  const { data: integration } = await supabase
    .from('integrations')
    .select('access_token')
    .eq('user_id', userId)
    .eq('provider', 'slack')
    .eq('is_active', true)
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

// Get Asana token (from database or env)
async function getAsanaToken(userId: string, supabase: SupabaseClient): Promise<string | null> {
  // First check if user has token stored in database
  const { data: integration } = await supabase
    .from('integrations')
    .select('access_token')
    .eq('user_id', userId)
    .eq('provider', 'asana')
    .eq('is_active', true)
    .single()

  if (integration?.access_token) {
    return integration.access_token
  }

  // Fall back to env token (for testing)
  return process.env.ASANA_ACCESS_TOKEN || null
}

// Get Linear token (from database or env)
async function getLinearToken(userId: string, supabase: SupabaseClient): Promise<string | null> {
  // First check if user has token stored in database
  const { data: integration } = await supabase
    .from('integrations')
    .select('access_token')
    .eq('user_id', userId)
    .eq('provider', 'linear' as 'slack') // Cast to bypass type check
    .eq('is_active', true)
    .single()

  if (integration?.access_token) {
    return integration.access_token
  }

  // Fall back to env token (for testing)
  return process.env.LINEAR_API_KEY || null
}

// Fetch real messages from Slack with time window
async function fetchSlackSignals(client: WebClient, timeWindow: TimeWindow): Promise<CommunicationSignal[]> {
  const signals: CommunicationSignal[] = []
  const oldest = (timeWindow.start.getTime() / 1000).toString()
  const latest = (timeWindow.end.getTime() / 1000).toString() // Also filter by end time!
  
  console.log(`[Slack] Time window: ${timeWindow.start.toISOString()} to ${timeWindow.end.toISOString()}`)
  
  try {
    // Get list of public channels the bot can see
    // Note: private_channel requires groups:read scope which may not be available
    const channelsResult = await client.conversations.list({
      types: 'public_channel',
      limit: 100
    })

    if (!channelsResult.channels) {
      console.log('[Slack] No channels found')
      return signals
    }
    
    // Log channel status for debugging
    const memberChannels = channelsResult.channels.filter(c => c.is_member)
    console.log(`[Slack] Found ${channelsResult.channels.length} channels, bot is member of ${memberChannels.length}`)

    // Get bot user ID to detect mentions
    const authResult = await client.auth.test()
    const botUserId = authResult.user_id

    // Fetch messages from time window for each channel where bot is a member
    for (const channel of memberChannels.slice(0, 15)) { // Increased to 15 channels
      if (!channel.id) continue

      try {
        console.log(`[Slack] Fetching messages from #${channel.name} (${new Date(timeWindow.start).toISOString()} to ${new Date(timeWindow.end).toISOString()})`)
        const historyResult = await client.conversations.history({
          channel: channel.id,
          oldest, // Only fetch messages since time window start
          latest, // Only fetch messages until time window end
          limit: 100, // More messages since we're filtering by time
        })

        if (!historyResult.messages) continue
        console.log(`[Slack] Found ${historyResult.messages.length} messages in #${channel.name}`)

        for (const message of historyResult.messages) {
          if (!message.text || message.subtype) continue // Skip system messages

          // *** CRITICAL: Filter out noise messages ***
          if (isNoiseMessage(message.text)) {
            console.log(`[Noise Filter] Skipping: "${message.text.slice(0, 50)}"`)
            continue // Skip greetings, acknowledgements, trivial messages
          }

          // Classify the message with confidence scoring
          let { signalType, confidence } = classifySlackMessage(message.text, botUserId || '')
          
          // Override classification if message has appreciation reactions
          const reactions = (message as { reactions?: Array<{ name: string; count: number }> }).reactions
          if (hasAppreciationReactions(reactions)) {
            // Message got lots of appreciation reactions = kudos/celebration!
            const totalReactions = getReactionCount(reactions)
            signalType = totalReactions >= 5 ? 'celebration' : 'kudos'
            confidence = Math.min(0.95, 0.7 + (totalReactions * 0.05))
            console.log(`[Slack] Promoted to ${signalType} due to ${totalReactions} appreciation reactions`)
          }
          
          console.log(`[Slack] Message classified as ${signalType} (confidence: ${confidence}): "${message.text.slice(0, 60)}..."`)
          
          // Skip low-confidence signals - lowered to 0.3 to show more signals
          if (confidence < 0.3) {
            console.log(`[Low Confidence] Skipping (${confidence}): "${message.text.slice(0, 50)}"`)
            continue
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

          // Fetch thread replies for context if this is an important signal
          let threadContext = ''
          const replyCount = (message as { reply_count?: number }).reply_count || 0
          if (replyCount > 0 && ['blocker', 'escalation', 'decision_needed', 'mention'].includes(signalType)) {
            try {
              const threadResult = await client.conversations.replies({
                channel: channel.id,
                ts: message.ts || '',
                limit: 5, // Get latest 5 replies for context
              })
              if (threadResult.messages && threadResult.messages.length > 1) {
                const replies = threadResult.messages.slice(1) // Skip parent message
                threadContext = replies.map(r => r.text?.slice(0, 100)).join(' | ')
              }
            } catch {
              // Thread fetch failed, continue without context
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
              reactions: reactions,
              reaction_count: getReactionCount(reactions),
              has_appreciation: hasAppreciationReactions(reactions),
              thread_context: threadContext || undefined,
              reply_count: replyCount,
              confidence,
            },
            created_at: new Date().toISOString(),
          })
        }
      } catch (err) {
        console.error(`Failed to fetch history for channel ${channel.name}:`, err)
      }
    }
  } catch (err: unknown) {
    // Check for specific Slack API errors
    const slackError = err as { code?: string; data?: { error?: string } }
    if (slackError.code === 'slack_webapi_platform_error') {
      const errorType = slackError.data?.error || 'unknown'
      if (errorType === 'missing_scope') {
        console.error('[Slack] Token missing required scopes. Need: channels:read, channels:history, users:read')
        throw new Error('SLACK_MISSING_SCOPE: Your Slack token is missing required permissions. Please reconnect Slack with a token that has channels:read, channels:history, and users:read scopes.')
      }
      if (errorType === 'invalid_auth' || errorType === 'token_revoked') {
        console.error('[Slack] Token is invalid or revoked')
        throw new Error('SLACK_INVALID_TOKEN: Your Slack token is invalid or has been revoked. Please reconnect Slack.')
      }
    }
    console.error('Failed to fetch Slack channels:', err)
    throw err // Re-throw to be handled by caller
  }

  // Sort by timestamp descending (newest first)
  return signals.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

// Fetch tasks from Asana
async function fetchAsanaSignals(token: string, timeWindow: TimeWindow): Promise<CommunicationSignal[]> {
  const signals: CommunicationSignal[] = []
  const ASANA_API = 'https://app.asana.com/api/1.0'
  
  try {
    // Get user's workspaces
    const wsRes = await fetch(`${ASANA_API}/workspaces`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const wsData = await wsRes.json()
    const workspaces = wsData.data || []
    
    if (workspaces.length === 0) {
      console.log('[Asana] No workspaces found')
      return signals
    }
    
    // Get tasks assigned to me, modified in time window
    const workspace = workspaces[0]
    const modifiedSince = timeWindow.start.toISOString()
    
    // Fetch tasks with more fields including subtasks and stories (comments)
    const tasksRes = await fetch(
      `${ASANA_API}/tasks?workspace=${workspace.gid}&assignee=me&modified_since=${modifiedSince}&opt_fields=name,notes,due_on,completed,permalink_url,projects.name,assignee.name,created_at,modified_at,num_subtasks,liked,num_likes`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    )
    const tasksData = await tasksRes.json()
    const tasks = tasksData.data || []
    
    console.log(`[Asana] Found ${tasks.length} tasks modified since ${modifiedSince}`)
    
    // Also fetch recent comments/stories on user's tasks for appreciation signals
    let recentComments: Array<{ task_name: string; text: string; created_by: { name: string }; created_at: string }> = []
    try {
      // Get user's recent activity for comments/likes
      const userRes = await fetch(`${ASANA_API}/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const userData = await userRes.json()
      const userGid = userData.data?.gid
      
      if (userGid) {
        const activityRes = await fetch(
          `${ASANA_API}/users/${userGid}/user_task_list?workspace=${workspace.gid}&opt_fields=gid`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        )
        const activityData = await activityRes.json()
        console.log('[Asana] User activity fetched')
      }
    } catch (commentErr) {
      console.log('[Asana] Could not fetch comments:', commentErr)
    }
    
    for (const task of tasks) {
      // Filter by time window end - skip tasks modified after our window
      const taskModifiedAt = new Date(task.modified_at || task.created_at)
      if (taskModifiedAt > timeWindow.end) {
        console.log(`[Asana] Skipping task modified after window: ${task.name}`)
        continue
      }
      
      // Determine signal type based on task properties
      let signalType: SignalType = 'fyi'
      let confidence = 0.6
      
      // Check task name/notes for urgent keywords FIRST (highest priority)
      const taskText = `${task.name} ${task.notes || ''}`.toLowerCase()
      
      // URGENT patterns - check these first!
      if (taskText.includes('urgent') || taskText.includes('asap') || taskText.includes('critical') || 
          taskText.includes('breaking') || taskText.includes('emergency') || taskText.includes('p0') || taskText.includes('p1')) {
        signalType = 'urgent'
        confidence = 0.95
      }
      // BLOCKER patterns
      else if (taskText.includes('blocked') || taskText.includes('blocker') || taskText.includes('stuck') || 
               taskText.includes("can't proceed") || taskText.includes('cannot proceed')) {
        signalType = 'blocker'
        confidence = 0.95
      }
      // NEEDS ATTENTION patterns
      else if (taskText.includes('need attention') || taskText.includes('needs attention') || 
               taskText.includes('action required') || taskText.includes('please review') ||
               taskText.includes('waiting on') || taskText.includes('help needed')) {
        signalType = 'decision_needed'
        confidence = 0.9
      }
      // POSITIVE patterns - appreciation/celebration
      else if (taskText.includes('celebrate') || taskText.includes('congrats') || taskText.includes('kudos') || 
               taskText.includes('great work') || taskText.includes('well done') || taskText.includes('thank')) {
        signalType = 'celebration'
        confidence = 0.85
      }
      // Check for appreciation - task was liked
      else if (task.liked || task.num_likes > 0) {
        signalType = 'kudos'
        confidence = 0.85
      }
      // Check for completion - milestone achieved!
      else if (task.completed) {
        signalType = 'milestone'
        confidence = 0.9
      }
      // Check due dates for urgency
      else if (task.due_on) {
        const dueDate = new Date(task.due_on)
        const now = new Date()
        const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysUntilDue < 0) {
          signalType = 'blocker' // Overdue
          confidence = 0.95
        } else if (daysUntilDue <= 1) {
          signalType = 'urgent' // Due today/tomorrow
          confidence = 0.9
        } else if (daysUntilDue <= 3) {
          signalType = 'decision_needed' // Due soon
          confidence = 0.7
        }
      }
      
      // Check for subtasks - more complex work
      if (task.num_subtasks && task.num_subtasks > 3) {
        // Big task with many subtasks - might need attention
        if (signalType === 'fyi') signalType = 'mention'
      }
      
      const projectName = task.projects?.[0]?.name || 'Asana'
      
      signals.push({
        id: `asana-${task.gid}`,
        user_id: '',
        source: 'asana',
        source_message_id: task.gid,
        channel_id: workspace.gid,
        channel_name: projectName,
        sender_name: task.assignee?.name || 'Asana',
        signal_type: signalType,
        snippet: task.name + (task.notes ? `: ${task.notes.slice(0, 100)}` : ''),
        timestamp: task.modified_at || task.created_at,
        is_read: false,
        is_actioned: task.completed || false,
        is_from_monitored_channel: true,
        detected_via: 'asana_task',
        message_url: task.permalink_url || '',
        raw_metadata: {
          full_context: task.notes || task.name,
          due_on: task.due_on,
          completed: task.completed,
          project: projectName,
          num_subtasks: task.num_subtasks || 0,
          liked: task.liked || false,
          num_likes: task.num_likes || 0,
          confidence,
        },
        created_at: new Date().toISOString(),
      })
    }
  } catch (err) {
    console.error('[Asana] API error:', err)
    throw err
  }
  
  return signals.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

// Fetch issues from Linear
async function fetchLinearSignals(token: string, timeWindow: TimeWindow): Promise<CommunicationSignal[]> {
  const signals: CommunicationSignal[] = []
  const LINEAR_API = 'https://api.linear.app/graphql'
  
  try {
    const modifiedSince = timeWindow.start.toISOString()
    const modifiedUntil = timeWindow.end.toISOString()
    
    console.log(`[Linear] Time window: ${modifiedSince} to ${modifiedUntil}`)
    
    const res = await fetch(LINEAR_API, {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query {
            viewer {
              assignedIssues(
                filter: { 
                  updatedAt: { 
                    gte: "${modifiedSince}",
                    lte: "${modifiedUntil}"
                  } 
                }
                first: 50
              ) {
                nodes {
                  id
                  identifier
                  title
                  description
                  priority
                  state { name type }
                  dueDate
                  url
                  updatedAt
                  createdAt
                  project { name }
                  assignee { name }
                }
              }
            }
          }
        `
      }),
    })
    
    const data = await res.json()
    const issues = data.data?.viewer?.assignedIssues?.nodes || []
    
    console.log(`[Linear] Found ${issues.length} issues modified since ${modifiedSince}`)
    
    for (const issue of issues) {
      // Determine signal type based on priority and state
      let signalType: SignalType = 'fyi'
      
      if (issue.priority === 1) signalType = 'blocker' // Urgent
      else if (issue.priority === 2) signalType = 'urgent' // High
      else if (issue.state?.type === 'completed') signalType = 'milestone'
      else if (issue.state?.type === 'started') signalType = 'mention'
      
      if (issue.dueDate) {
        const dueDate = new Date(issue.dueDate)
        const now = new Date()
        const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        if (daysUntilDue < 0) signalType = 'blocker'
        else if (daysUntilDue <= 1) signalType = 'urgent'
      }
      
      signals.push({
        id: `linear-${issue.id}`,
        user_id: '',
        source: 'linear',
        source_message_id: issue.id,
        channel_id: issue.project?.name || 'Linear',
        channel_name: issue.project?.name || 'Linear',
        sender_name: issue.assignee?.name || 'Linear',
        signal_type: signalType,
        snippet: `${issue.identifier}: ${issue.title}`,
        timestamp: issue.updatedAt || issue.createdAt,
        is_read: false,
        is_actioned: issue.state?.type === 'completed',
        is_from_monitored_channel: true,
        detected_via: 'linear_issue',
        message_url: issue.url || '',
        raw_metadata: {
          full_context: issue.description || issue.title,
          priority: issue.priority,
          state: issue.state?.name,
          dueDate: issue.dueDate,
        },
        created_at: new Date().toISOString(),
      })
    }
  } catch (err) {
    console.error('[Linear] API error:', err)
    throw err
  }
  
  return signals.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

// Filter signals based on intent mode
// EagleEye's USP: Each mode surfaces ONLY what's truly important for that context
// ============================================================================
// MODE PHILOSOPHY:
// - calm: Vacation/disconnect - only show emergencies
// - on_the_go: Commuting - critical + things you might want to celebrate
// - focus: Deep work - blockers only, but include YOUR wins for motivation
// - work: Full workday - everything actionable + team positivity
// ============================================================================
function filterSignalsByMode(signals: CommunicationSignal[], mode: IntentMode): CommunicationSignal[] {
  switch (mode) {
    case 'calm':
      // VACATION MODE: Critical + positive vibes only
      // Include kudos/celebrations - good to see positivity even on vacation!
      return signals.filter(s => 
        s.signal_type === 'blocker' || 
        s.signal_type === 'escalation' || 
        s.signal_type === 'decision_needed' ||
        s.signal_type === 'kudos' ||           // Appreciation boosts mood
        s.signal_type === 'celebration' ||     // Team wins
        s.signal_type === 'milestone'          // Progress
      )
    
    case 'on_the_go':
      // COMMUTE MODE: Critical items + ALL positivity (great for commute mood!)
      return signals.filter(s => 
        s.signal_type === 'blocker' || 
        s.signal_type === 'escalation' || 
        s.signal_type === 'decision_needed' ||
        s.signal_type === 'mention' ||
        s.signal_type === 'urgent' ||
        s.signal_type === 'kudos' ||           // See appreciation
        s.signal_type === 'celebration' ||     // See wins
        s.signal_type === 'milestone'          // Progress updates
      )
    
    case 'focus':
      // DEEP WORK MODE: Blockers + achievements for motivation
      // Positive signals keep you motivated during deep work!
      return signals.filter(s => 
        s.signal_type === 'blocker' || 
        s.signal_type === 'escalation' ||
        s.signal_type === 'urgent' ||
        s.signal_type === 'milestone' ||       // See your progress
        s.signal_type === 'kudos' ||           // Recognition motivates
        s.signal_type === 'celebration'        // Wins inspire
      )
    
    case 'work':
    default:
      // STANDARD WORK MODE: Everything actionable + ALL signals
      // Full visibility including FYI for complete awareness
      return signals.filter(s => 
        s.signal_type === 'blocker' || 
        s.signal_type === 'escalation' || 
        s.signal_type === 'decision_needed' ||
        s.signal_type === 'mention' ||
        s.signal_type === 'question' ||
        s.signal_type === 'urgent' ||
        s.signal_type === 'kudos' ||           // Team appreciation
        s.signal_type === 'celebration' ||     // Team wins
        s.signal_type === 'milestone' ||       // Progress updates
        s.signal_type === 'fyi'                // Include FYI for full awareness
      )
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
  const kudos = signals.filter(s => s.signal_type === 'kudos').length
  const celebrations = signals.filter(s => s.signal_type === 'celebration').length
  const milestones = signals.filter(s => s.signal_type === 'milestone').length
  const positiveTotal = kudos + celebrations + milestones

  const parts: string[] = []
  
  // Action items first
  if (blockers > 0) parts.push(`${blockers} blocker${blockers > 1 ? 's' : ''} need attention`)
  if (decisions > 0) parts.push(`${decisions} decision${decisions > 1 ? 's' : ''} pending`)
  if (mentions > 0) parts.push(`${mentions} @mention${mentions > 1 ? 's' : ''}`)
  if (questions > 0) parts.push(`${questions} question${questions > 1 ? 's' : ''} for you`)
  
  // Positivity signals - different phrasing based on mode
  if (positiveTotal > 0) {
    if (mode === 'work') {
      if (kudos > 0 && celebrations > 0) {
        parts.push(`🎉 ${kudos} shoutout${kudos > 1 ? 's' : ''} & ${celebrations} win${celebrations > 1 ? 's' : ''} to celebrate`)
      } else if (kudos > 0) {
        parts.push(`🙏 ${kudos} team shoutout${kudos > 1 ? 's' : ''}`)
      } else if (celebrations > 0) {
        parts.push(`🎉 ${celebrations} team win${celebrations > 1 ? 's' : ''} to celebrate`)
      }
      if (milestones > 0) {
        parts.push(`✅ ${milestones} milestone${milestones > 1 ? 's' : ''} completed`)
      }
    } else if (mode === 'focus' && milestones > 0) {
      parts.push(`✅ ${milestones} milestone${milestones > 1 ? 's' : ''} achieved`)
    } else if (mode === 'on_the_go' && (kudos > 0 || celebrations > 0)) {
      parts.push(`🎉 ${positiveTotal} positive update${positiveTotal > 1 ? 's' : ''}`)
    }
  }

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
    // Check which tools are connected from DATABASE (not just env vars)
    const connectedTools: string[] = []
    
    // Get Slack client - use user's OAuth token first, or env token for testing
    let slackClient: WebClient | null = null
    
    if (user) {
      slackClient = await getSlackClient(user.id, supabase)
      
      // Also check database for other integrations the user has connected
      const { data: userIntegrations } = await supabase
        .from('integrations')
        .select('provider')
        .eq('user_id', user.id)
        .eq('is_active', true)
      
      if (userIntegrations) {
        for (const integration of userIntegrations) {
          const provider = (integration as { provider: string }).provider
          if (provider && !connectedTools.includes(provider)) {
            connectedTools.push(provider)
          }
        }
      }
    } else if (hasEnvToken) {
      slackClient = new WebClient(process.env.SLACK_BOT_TOKEN)
    }
    
    // Add slack to connected tools if we have a client (may already be there from DB)
    if (slackClient && !connectedTools.includes('slack')) {
      connectedTools.push('slack')
    }
    
    // Only add env-based integrations if no user (demo/testing mode)
    if (!user) {
      if (process.env.ASANA_ACCESS_TOKEN && !connectedTools.includes('asana')) connectedTools.push('asana')
      if (process.env.LINEAR_API_KEY && !connectedTools.includes('linear')) connectedTools.push('linear')
    }
    
    let allSignals: CommunicationSignal[] = []
    let dataSource = connectedTools.length > 0 ? connectedTools.join('+') : 'none'
    let slackError: string | null = null
    let debugInfo: Record<string, unknown> = {}

    if (slackClient) {
      try {
        console.log('[Data] Fetching Slack signals with time window:', {
          start: timeWindow.start.toISOString(),
          end: timeWindow.end.toISOString(),
          daysCovered: timeWindow.daysCovered
        })
        const slackSignals = await fetchSlackSignals(slackClient, timeWindow)
        console.log(`[Data] Fetched ${slackSignals.length} signals from Slack`)
        debugInfo.slackSignalsCount = slackSignals.length
        debugInfo.slackSampleSignals = slackSignals.slice(0, 3).map(s => ({
          type: s.signal_type,
          snippet: s.snippet?.slice(0, 50),
          channel: s.channel_name
        }))
        allSignals = slackSignals.map(s => ({ ...s, user_id: user?.id || 'demo' }))
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown Slack error'
        console.error('[Slack] Error fetching signals:', errorMessage)
        slackError = errorMessage
        debugInfo.slackError = errorMessage
        // Remove slack from connected tools since it's broken
        const slackIdx = connectedTools.indexOf('slack')
        if (slackIdx > -1) connectedTools.splice(slackIdx, 1)
      }
    } else {
      console.log('[Data] No Slack client available')
      debugInfo.noSlackClient = true
    }
    
    // Fetch Asana tasks - check database first, then env
    const asanaToken = user ? await getAsanaToken(user.id, supabase) : process.env.ASANA_ACCESS_TOKEN
    if (asanaToken) {
      try {
        console.log('[Asana] Fetching tasks with token from', user ? 'database' : 'env')
        
        // Direct Asana API call instead of using IntegrationManager
        const asanaSignals = await fetchAsanaSignals(asanaToken, timeWindow)
        console.log(`[Asana] Fetched ${asanaSignals.length} signals`)
        debugInfo.asanaSignalsCount = asanaSignals.length
        
        for (const signal of asanaSignals) {
          allSignals.push({
            ...signal,
            user_id: user?.id || 'demo'
          })
        }
        
        if (!connectedTools.includes('asana')) {
          connectedTools.push('asana')
        }
      } catch (asanaError) {
        console.error('[Asana] Failed to fetch signals:', asanaError)
        debugInfo.asanaError = asanaError instanceof Error ? asanaError.message : 'Unknown error'
      }
    }
    
    // Fetch Linear issues - check database first, then env
    const linearToken = user ? await getLinearToken(user.id, supabase) : process.env.LINEAR_API_KEY
    if (linearToken) {
      try {
        console.log('[Linear] Fetching issues with token from', user ? 'database' : 'env')
        
        const linearSignals = await fetchLinearSignals(linearToken, timeWindow)
        console.log(`[Linear] Fetched ${linearSignals.length} signals`)
        debugInfo.linearSignalsCount = linearSignals.length
        
        for (const signal of linearSignals) {
          allSignals.push({
            ...signal,
            user_id: user?.id || 'demo'
          })
        }
        
        if (!connectedTools.includes('linear')) {
          connectedTools.push('linear')
        }
      } catch (linearError) {
        console.error('[Linear] Failed to fetch signals:', linearError)
        debugInfo.linearError = linearError instanceof Error ? linearError.message : 'Unknown error'
      }
    }

    // =========================================================================
    // FETCH WHATSAPP SIGNALS FROM DATABASE
    // Unlike Slack/Asana/Linear which we poll, WhatsApp comes via webhooks
    // =========================================================================
    if (user && connectedTools.includes('whatsapp')) {
      try {
        console.log('[WhatsApp] Fetching signals from database')
        
        const { data: whatsappSignals, error: waError } = await supabase
          .from('communication_signals')
          .select('*')
          .eq('user_id', user.id)
          .eq('source', 'whatsapp')
          .gte('timestamp', timeWindow.start.toISOString())
          .lte('timestamp', timeWindow.end.toISOString())
          .order('timestamp', { ascending: false })
        
        if (waError) {
          console.error('[WhatsApp] DB error:', waError)
          debugInfo.whatsappError = waError.message
        } else if (whatsappSignals && whatsappSignals.length > 0) {
          // Filter out greeting/casual messages that slipped through before filtering was added
          const GREETING_PATTERNS = [
            /^(hi|hello|hey|hii+|hola|howdy)[\s!,\.]*$/i,
            /^(how are you|how r u|how're you|wassup|whats up|what's up)[\s!?]*$/i,
            /^(good morning|good afternoon|good evening|good night|gm|gn)[\s!]*$/i,
            /^(thanks|thank you|thx|ty)[\s!]*$/i,
            /^(ok|okay|k|kk|alright|sure|yes|no|yep|nope|yeah|yea|nah)[\s!]*$/i,
            /^(bye|goodbye|see you|ttyl|later)[\s!]*$/i,
          ]
          
          const filteredSignals = whatsappSignals.filter(wa => {
            const waAny = wa as Record<string, any>
            const snippet = (waAny.snippet || waAny.content_preview || '').toLowerCase().trim()
            // Skip if matches greeting pattern
            for (const pattern of GREETING_PATTERNS) {
              if (pattern.test(snippet)) {
                console.log(`[WhatsApp] Filtering out greeting: "${snippet}"`)
                return false
              }
            }
            return true
          })
          
          console.log(`[WhatsApp] Found ${whatsappSignals.length} signals, kept ${filteredSignals.length} after filtering`)
          debugInfo.whatsappSignalsCount = filteredSignals.length
          
          for (const wa of filteredSignals) {
            // Map database fields to CommunicationSignal type
            const waRecord = wa as Record<string, any>
            allSignals.push({
              id: waRecord.id,
              user_id: waRecord.user_id,
              source: 'whatsapp' as any,
              source_message_id: waRecord.source_message_id || waRecord.message_id || waRecord.id,
              channel_id: waRecord.channel_id || 'dm',
              channel_name: waRecord.channel_name || 'WhatsApp DM',
              sender_name: waRecord.sender_name,
              signal_type: waRecord.signal_type as any,
              snippet: waRecord.snippet || waRecord.content_preview,
              timestamp: waRecord.timestamp || waRecord.created_at,
              is_read: waRecord.is_read ?? false,
              is_actioned: waRecord.is_actioned ?? false,
              raw_metadata: waRecord.raw_metadata || waRecord.raw_data,
              created_at: waRecord.created_at,
            })
          }
        } else {
          console.log('[WhatsApp] No signals found in database for time window')
          debugInfo.whatsappSignalsCount = 0
        }
      } catch (waError) {
        console.error('[WhatsApp] Failed to fetch signals:', waError)
        debugInfo.whatsappError = waError instanceof Error ? waError.message : 'Unknown error'
      }
    }

    // =========================================================================
    // SMART DEDUPLICATION - Remove noise, collapse threads, detect duplicates
    // =========================================================================
    console.log(`[Dedup] Before: ${allSignals.length} signals`)
    const dedupedSignals = deduplicateSignals(allSignals)
    console.log(`[Dedup] After: ${dedupedSignals.length} signals (removed ${allSignals.length - dedupedSignals.length})`)
    debugInfo.deduplication = {
      before: allSignals.length,
      after: dedupedSignals.length,
      removed: allSignals.length - dedupedSignals.length
    }

    // Categorize signals instead of mode filtering
    // Categories: needs_attention, kudos_wins, fyi
    const needsAttentionTypes = ['blocker', 'escalation', 'urgent', 'decision_needed']
    const kudosWinsTypes = ['kudos', 'celebration', 'milestone']
    const fyiTypes = ['fyi', 'mention', 'question']
    
    const needsAttention = dedupedSignals.filter(s => s.signal_type && needsAttentionTypes.includes(s.signal_type))
    const kudosWins = dedupedSignals.filter(s => s.signal_type && kudosWinsTypes.includes(s.signal_type))
    const fyiSignals = dedupedSignals.filter(s => s.signal_type && fyiTypes.includes(s.signal_type))
    
    // All signals sorted by importance (urgent first, then kudos, then fyi)
    const sortedSignals = [...needsAttention, ...kudosWins, ...fyiSignals]
    
    // Generate brief with all signals (not mode filtered)
    const briefText = generateBriefFromSignals(allSignals, mode, timeWindow)

    // For now, work items come from PM tools (not yet implemented)
    // TODO: Fetch from Asana/Linear when connected
    const workItems: WorkItem[] = []

    // Get empty state message if no signals
    const emptyState = allSignals.length === 0 ? interpretEmptyResults(timeWindow) : null

    // ========================================================================
    // WORKSPACE TYPE DETECTION (lightweight - auto-detect from connected tools)
    // This helps frontend display contextually relevant labels
    // ========================================================================
    type WorkspaceType = 'smb' | 'enterprise' | 'tech' | 'hybrid'
    let workspaceType: WorkspaceType = 'hybrid'
    
    const hasWhatsApp = connectedTools.includes('whatsapp')
    const hasSlack = connectedTools.includes('slack')
    const hasTeams = connectedTools.includes('teams')
    const hasPMTools = connectedTools.some(t => ['linear', 'jira', 'github', 'asana'].includes(t))
    
    if (hasWhatsApp && !hasSlack && !hasTeams) {
      workspaceType = 'smb' // WhatsApp-only = SMB/retail
    } else if ((hasSlack || hasTeams) && hasPMTools) {
      workspaceType = 'tech' // Slack/Teams + PM tools = tech team
    } else if ((hasSlack || hasTeams) && !hasWhatsApp) {
      workspaceType = 'enterprise' // Just Slack/Teams = enterprise
    } else {
      workspaceType = 'hybrid' // Mix of everything
    }

    return NextResponse.json({
      mode, // Keep for backwards compatibility but not used for filtering
      dataSource,
      connectedTools,
      workspaceType, // NEW: helps frontend customize labels
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
        needs_attention: needsAttention, // Now returns actual signals!
        kudos_wins: kudosWins,           // New category
        fyi_items: fyiSignals,           // Updated
        handled_items: workItems.filter(w => w.status === 'done'),
        coverage_percentage: 100,
        total_items_processed: allSignals.length,
        items_surfaced: sortedSignals.length,
      },
      signals: sortedSignals.slice(0, 50), // Limit to 50 signals
      // Categorized signals for easier UI rendering
      categories: {
        needs_attention: needsAttention,
        kudos_wins: kudosWins,
        fyi: fyiSignals,
      },
      emptyState,
      stats: {
        needsAttention: needsAttention.length,
        kudosWins: kudosWins.length,
        fyi: fyiSignals.length,
        handled: 0,
        signals: sortedSignals.length,
        totalItems: workItems.length,
        totalSignals: allSignals.length,
      },
      // Include any integration errors so UI can display them
      integrationErrors: slackError ? { slack: slackError } : undefined,
      debug: debugInfo,
      fetchedAt: new Date().toISOString(), // For debugging
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
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
