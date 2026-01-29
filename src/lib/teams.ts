// Microsoft Teams Integration Library
// Handles OAuth flow and message fetching for Teams

interface TeamsChannel {
  id: string
  displayName: string
  description: string | null
  membershipType: string
  webUrl: string
}

interface TeamsTeam {
  id: string
  displayName: string
  description: string | null
  channels?: TeamsChannel[]
}

interface TeamsMessage {
  id: string
  createdDateTime: string
  lastModifiedDateTime: string | null
  importance: string
  messageType: string
  body: {
    contentType: string
    content: string
  }
  from: {
    user: {
      id: string
      displayName: string
      email?: string
    } | null
    application: {
      id: string
      displayName: string
    } | null
  } | null
  channelIdentity: {
    teamId: string
    channelId: string
  }
  mentions: Array<{
    id: number
    mentionText: string
    mentioned: {
      user?: {
        id: string
        displayName: string
      }
    }
  }>
  reactions?: Array<{
    reactionType: string
    user: {
      displayName: string
    }
  }>
}

interface TeamsChat {
  id: string
  topic: string | null
  chatType: string
  createdDateTime: string
  lastUpdatedDateTime: string
  members: Array<{
    displayName: string
    email: string
  }>
}

export async function getTeamsJoinedTeams(accessToken: string): Promise<TeamsTeam[]> {
  const response = await fetch('https://graph.microsoft.com/v1.0/me/joinedTeams', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch Teams')
  }

  const data = await response.json()
  return data.value
}

export async function getTeamsChannels(accessToken: string, teamId: string): Promise<TeamsChannel[]> {
  const response = await fetch(
    `https://graph.microsoft.com/v1.0/teams/${teamId}/channels`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error('Failed to fetch Teams channels')
  }

  const data = await response.json()
  return data.value
}

export async function getTeamsChannelMessages(
  accessToken: string,
  teamId: string,
  channelId: string,
  since?: string
): Promise<TeamsMessage[]> {
  let url = `https://graph.microsoft.com/v1.0/teams/${teamId}/channels/${channelId}/messages?$top=50`
  
  if (since) {
    url += `&$filter=lastModifiedDateTime gt ${since}`
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    // Might not have permission for this channel
    return []
  }

  const data = await response.json()
  return data.value || []
}

export async function getTeamsChats(accessToken: string): Promise<TeamsChat[]> {
  const response = await fetch(
    'https://graph.microsoft.com/v1.0/me/chats?$expand=members&$top=50',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    return []
  }

  const data = await response.json()
  return data.value || []
}

export async function getTeamsChatMessages(
  accessToken: string,
  chatId: string,
  since?: string
): Promise<TeamsMessage[]> {
  let url = `https://graph.microsoft.com/v1.0/me/chats/${chatId}/messages?$top=50`
  
  if (since) {
    url += `&$filter=lastModifiedDateTime gt ${since}`
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    return []
  }

  const data = await response.json()
  return data.value || []
}

export function normalizeTeamsMessage(
  message: TeamsMessage,
  channelName: string,
  teamName: string,
  currentUserId: string
) {
  const isMentioned = message.mentions?.some(
    m => m.mentioned.user?.id === currentUserId
  ) || false

  const isHighImportance = message.importance === 'high' || message.importance === 'urgent'
  
  // Strip HTML from content
  let textContent = message.body.content
  if (message.body.contentType === 'html') {
    textContent = textContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  }

  // Detect signals
  const lowerContent = textContent.toLowerCase()
  const hasUrgentKeywords = /\b(urgent|asap|emergency|critical|blocker|blocked|help|issue|problem|deadline)\b/i.test(textContent)
  const hasQuestion = textContent.includes('?') && isMentioned

  let signalType: 'mention' | 'urgent' | 'question' | 'fyi' | null = null
  
  if (isHighImportance || (isMentioned && hasUrgentKeywords)) {
    signalType = 'urgent'
  } else if (hasQuestion) {
    signalType = 'question'
  } else if (isMentioned) {
    signalType = 'mention'
  }

  return {
    id: message.id,
    source: 'teams' as const,
    channel: channelName,
    team: teamName,
    sender: message.from?.user?.displayName || message.from?.application?.displayName || 'Unknown',
    content: textContent.slice(0, 500),
    timestamp: message.createdDateTime,
    is_mentioned: isMentioned,
    is_high_importance: isHighImportance,
    signal_type: signalType,
    mentions_count: message.mentions?.length || 0,
    reactions_count: message.reactions?.length || 0,
  }
}
