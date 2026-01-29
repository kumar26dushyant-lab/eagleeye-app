const SLACK_BASE_URL = 'https://slack.com/api'

export interface SlackChannel {
  id: string
  name: string
  is_private: boolean
  is_member: boolean
}

export interface SlackMessage {
  ts: string
  text: string
  user: string
}

const SLACK_SCOPES = [
  'channels:read',
  'channels:history',
  'users:read',
  'users:read.email',
  'chat:write',
  'im:write',
].join(',')

export function getSlackAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: process.env.SLACK_CLIENT_ID!,
    redirect_uri: process.env.SLACK_REDIRECT_URI!,
    scope: SLACK_SCOPES,
  })
  return `https://slack.com/oauth/v2/authorize?${params.toString()}`
}

export async function exchangeSlackCode(code: string): Promise<{
  access_token: string
  team: { id: string; name: string }
}> {
  const response = await fetch(`${SLACK_BASE_URL}/oauth.v2.access`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: process.env.SLACK_CLIENT_ID!,
      client_secret: process.env.SLACK_CLIENT_SECRET!,
      code,
      redirect_uri: process.env.SLACK_REDIRECT_URI!,
    }),
  })

  const data = await response.json()
  
  if (!data.ok) {
    throw new Error(`Slack token exchange failed: ${data.error}`)
  }

  return {
    access_token: data.access_token,
    team: data.team,
  }
}

export async function getSlackChannels(accessToken: string): Promise<SlackChannel[]> {
  const response = await fetch(
    `${SLACK_BASE_URL}/conversations.list?types=public_channel,private_channel&exclude_archived=true`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  const data = await response.json()
  
  if (!data.ok) {
    throw new Error(`Failed to fetch channels: ${data.error}`)
  }

  return data.channels.map((ch: { id: string; name: string; is_private: boolean; is_member: boolean }) => ({
    id: ch.id,
    name: ch.name,
    is_private: ch.is_private,
    is_member: ch.is_member,
  }))
}

export async function getChannelHistory(
  accessToken: string,
  channelId: string,
  limit: number = 100
): Promise<SlackMessage[]> {
  const response = await fetch(
    `${SLACK_BASE_URL}/conversations.history?channel=${channelId}&limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  const data = await response.json()
  
  if (!data.ok) {
    // Fail silent - might not have access
    return []
  }

  return data.messages || []
}

export async function sendSlackMessage(
  accessToken: string,
  channel: string,
  text: string
): Promise<boolean> {
  const response = await fetch(`${SLACK_BASE_URL}/chat.postMessage`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ channel, text }),
  })

  const data = await response.json()
  return data.ok
}

/**
 * Get thread replies for a message
 * This is crucial for understanding full context of conversations
 */
export async function getThreadReplies(
  accessToken: string,
  channelId: string,
  threadTs: string,
  limit: number = 50
): Promise<SlackMessage[]> {
  const response = await fetch(
    `${SLACK_BASE_URL}/conversations.replies?channel=${channelId}&ts=${threadTs}&limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  const data = await response.json()
  
  if (!data.ok) {
    return []
  }

  // First message is the parent, rest are replies
  return data.messages?.slice(1) || []
}

/**
 * Get messages with their thread replies for full context
 */
export async function getChannelMessagesWithThreads(
  accessToken: string,
  channelId: string,
  limit: number = 50
): Promise<Array<SlackMessage & { replies?: SlackMessage[] }>> {
  const messages = await getChannelHistory(accessToken, channelId, limit)
  
  // Get thread replies for messages that have them
  const messagesWithThreads = await Promise.all(
    messages.map(async (msg) => {
      // Check if message has thread replies (reply_count > 0)
      if ((msg as any).reply_count > 0) {
        const replies = await getThreadReplies(accessToken, channelId, msg.ts)
        return { ...msg, replies }
      }
      return msg
    })
  )

  return messagesWithThreads
}

// Signal detection from Slack messages (metadata only, no content storage)
const SLACK_ESCALATION_PATTERNS = [
  /\burgent\b/i,
  /\basap\b/i,
  /\bcritical\b/i,
  /\bblocked\b/i,
  /\bblocker\b/i,
  /\bemergency\b/i,
  /\bp0\b/i,
  /\bp1\b/i,
  /\bescalat/i,
]

export function detectSlackSignals(messages: SlackMessage[]): {
  hasEscalation: boolean
  signalCount: number
  latestSignalTs: string | null
} {
  let signalCount = 0
  let latestSignalTs: string | null = null

  for (const msg of messages) {
    const hasSignal = SLACK_ESCALATION_PATTERNS.some((pattern) => pattern.test(msg.text))
    if (hasSignal) {
      signalCount++
      if (!latestSignalTs || msg.ts > latestSignalTs) {
        latestSignalTs = msg.ts
      }
    }
  }

  return {
    hasEscalation: signalCount > 0,
    signalCount,
    latestSignalTs,
  }
}
