import { WebClient, ConversationsHistoryResponse, ConversationsListResponse } from '@slack/web-api'

// Types for Slack integration
export interface SlackChannel {
  id: string
  name: string
  is_private: boolean
  is_member: boolean
  num_members?: number
  topic?: string
  purpose?: string
}

export interface SlackMessage {
  ts: string
  user: string
  text: string
  channel: string
  channel_name?: string
  thread_ts?: string
  reply_count?: number
  reactions?: Array<{ name: string; count: number }>
}

export interface SlackUser {
  id: string
  name: string
  real_name: string
  email?: string
  is_bot: boolean
  profile?: {
    image_72?: string
    title?: string
  }
}

export interface SlackMention {
  message: SlackMessage
  channel: SlackChannel
  sender: SlackUser | null
  timestamp: Date
  message_url: string
}

// Create Slack client
export function createSlackClient(token?: string): WebClient {
  const botToken = token || process.env.SLACK_BOT_TOKEN
  if (!botToken) {
    throw new Error('SLACK_BOT_TOKEN is not configured')
  }
  return new WebClient(botToken)
}

// Get all channels the bot has access to
export async function getSlackChannels(client: WebClient): Promise<SlackChannel[]> {
  const channels: SlackChannel[] = []
  let cursor: string | undefined

  do {
    const result: ConversationsListResponse = await client.conversations.list({
      types: 'public_channel,private_channel',
      exclude_archived: true,
      limit: 200,
      cursor,
    })

    if (result.channels) {
      for (const channel of result.channels) {
        if (channel.id && channel.name) {
          channels.push({
            id: channel.id,
            name: channel.name,
            is_private: channel.is_private || false,
            is_member: channel.is_member || false,
            num_members: channel.num_members,
            topic: channel.topic?.value,
            purpose: channel.purpose?.value,
          })
        }
      }
    }

    cursor = result.response_metadata?.next_cursor
  } while (cursor)

  return channels
}

// Get recent messages from a channel
export async function getChannelMessages(
  client: WebClient,
  channelId: string,
  limit: number = 100,
  oldest?: string
): Promise<SlackMessage[]> {
  const result: ConversationsHistoryResponse = await client.conversations.history({
    channel: channelId,
    limit,
    oldest,
  })

  if (!result.messages) return []

  return result.messages.map((msg) => ({
    ts: msg.ts || '',
    user: msg.user || '',
    text: msg.text || '',
    channel: channelId,
    thread_ts: msg.thread_ts,
    reply_count: msg.reply_count,
    reactions: msg.reactions?.map((r) => ({ name: r.name || '', count: r.count || 0 })),
  }))
}

// Get user info
export async function getSlackUser(client: WebClient, userId: string): Promise<SlackUser | null> {
  try {
    const result = await client.users.info({ user: userId })
    if (!result.user) return null

    return {
      id: result.user.id || '',
      name: result.user.name || '',
      real_name: result.user.real_name || result.user.name || '',
      email: result.user.profile?.email,
      is_bot: result.user.is_bot || false,
      profile: {
        image_72: result.user.profile?.image_72,
        title: result.user.profile?.title,
      },
    }
  } catch {
    return null
  }
}

// Get the authenticated user's ID
export async function getAuthenticatedUserId(client: WebClient): Promise<string> {
  const result = await client.auth.test()
  return result.user_id || ''
}

// Find messages that mention a specific user
export async function findMentions(
  client: WebClient,
  userId: string,
  channels: SlackChannel[],
  hoursBack: number = 24
): Promise<SlackMention[]> {
  const mentions: SlackMention[] = []
  const oldest = String((Date.now() - hoursBack * 60 * 60 * 1000) / 1000)
  const userCache = new Map<string, SlackUser | null>()

  // Get workspace info for message URLs
  const authResult = await client.auth.test()
  const teamId = authResult.team_id

  for (const channel of channels) {
    if (!channel.is_member) continue

    try {
      const messages = await getChannelMessages(client, channel.id, 100, oldest)

      for (const message of messages) {
        // Check if message mentions the user
        const mentionPattern = new RegExp(`<@${userId}>`, 'g')
        if (mentionPattern.test(message.text)) {
          // Get sender info (with caching)
          let sender = userCache.get(message.user)
          if (sender === undefined) {
            sender = await getSlackUser(client, message.user)
            userCache.set(message.user, sender)
          }

          // Build message URL
          const messageUrl = `https://slack.com/app_redirect?team=${teamId}&channel=${channel.id}&message_ts=${message.ts}`

          mentions.push({
            message: { ...message, channel_name: channel.name },
            channel,
            sender,
            timestamp: new Date(parseFloat(message.ts) * 1000),
            message_url: messageUrl,
          })
        }
      }
    } catch (error) {
      // Channel might not be accessible, skip it
      console.warn(`Could not read channel ${channel.name}:`, error)
    }
  }

  // Sort by timestamp (newest first)
  mentions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

  return mentions
}

// Convert Slack mention to our signal format
export function mentionToSignal(mention: SlackMention, userId: string) {
  // Determine signal type based on message content
  let signalType: 'mention' | 'urgent' | 'question' | 'escalation' = 'mention'
  const text = mention.message.text.toLowerCase()

  if (text.includes('urgent') || text.includes('asap') || text.includes('immediately')) {
    signalType = 'urgent'
  } else if (text.includes('?') || text.includes('question') || text.includes('can you') || text.includes('could you')) {
    signalType = 'question'
  } else if (text.includes('escalat') || text.includes('critical') || text.includes('blocker')) {
    signalType = 'escalation'
  }

  // Calculate priority score based on various factors
  let priorityScore = 50 // Base score

  // Boost for urgency keywords
  if (signalType === 'urgent') priorityScore += 30
  if (signalType === 'escalation') priorityScore += 25
  if (signalType === 'question') priorityScore += 10

  // Boost for reactions (people care about this message)
  const reactionCount = mention.message.reactions?.reduce((sum, r) => sum + r.count, 0) || 0
  priorityScore += Math.min(reactionCount * 2, 10)

  // Boost for thread replies
  if (mention.message.reply_count && mention.message.reply_count > 0) {
    priorityScore += Math.min(mention.message.reply_count * 3, 15)
  }

  // Cap at 100
  priorityScore = Math.min(priorityScore, 100)

  return {
    id: `slack-${mention.message.ts}`,
    user_id: userId,
    source: 'slack' as const,
    source_message_id: mention.message.ts,
    channel_id: mention.channel.id,
    channel_name: `#${mention.channel.name}`,
    sender_name: mention.sender?.real_name || mention.sender?.name || 'Unknown',
    signal_type: signalType,
    snippet: mention.message.text.replace(/<@[A-Z0-9]+>/g, '@user').slice(0, 200),
    timestamp: mention.timestamp.toISOString(),
    is_read: false,
    is_actioned: false,
    is_from_monitored_channel: true,
    detected_via: 'direct_mention' as const,
    message_url: mention.message_url,
    raw_metadata: {
      sender_role: mention.sender?.profile?.title || undefined,
      priority_score: priorityScore,
      full_context: mention.message.text,
      reactions: mention.message.reactions,
      reply_count: mention.message.reply_count,
    },
    created_at: new Date().toISOString(),
  }
}

// Test Slack connection
export async function testSlackConnection(token?: string): Promise<{
  success: boolean
  workspace?: string
  user?: string
  channels?: number
  error?: string
}> {
  try {
    const client = createSlackClient(token)
    const result = await client.auth.test()
    
    // Also get channel count
    const channels = await getSlackChannels(client)
    
    return {
      success: true,
      workspace: result.team || undefined,
      user: result.user || undefined,
      channels: channels.filter(c => c.is_member).length,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
