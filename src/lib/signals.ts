const BLOCKING_KEYWORDS = ['blocked', 'waiting', 'pending', 'on hold', 'depends', 'stuck']
const ESCALATION_KEYWORDS = ['urgent', 'asap', 'critical', 'escalat', 'emergency', 'blocker', 'p0', 'p1']

// POSITIVE SIGNALS - Celebrate wins, not just problems!
const APPRECIATION_KEYWORDS = ['thank', 'thanks', 'great job', 'well done', 'awesome', 'amazing', 'excellent', 'kudos', 'shoutout', 'appreciate', 'fantastic', 'brilliant', 'proud of', 'crushed it', 'nailed it', 'killed it']
const MILESTONE_KEYWORDS = ['launched', 'shipped', 'completed', 'released', 'achieved', 'milestone', 'reached', 'hit the goal', 'done!', 'finished', 'accomplished', 'delivered', 'went live', 'production', 'deployed']
const POSITIVE_COMMENT_KEYWORDS = ['love this', 'looks great', 'perfect', 'exactly what', 'nice work', 'impressive', 'solid', 'clean', 'beautiful']

// NEGATIVE BEHAVIOR SIGNALS - Detect conflict, aggression, harassment
const AGGRESSION_KEYWORDS = [
  'stupid', 'idiot', 'incompetent', 'useless', 'pathetic', 'ridiculous', 'absurd',
  'wtf', 'bs', 'bullshit', 'crap', 'damn', 'hell', 'pissed', 'furious',
  'unacceptable', 'disaster', 'failure', 'blame', 'fault', 'mess', 'garbage'
]
const HARASSMENT_KEYWORDS = [
  'hate', 'disgusting', 'worthless', 'loser', 'fired', 'quit', 'leave',
  'threatening', 'attack', 'target', 'bully', 'harass', 'discriminat'
]
const CONFLICT_INDICATORS = [
  'disagree strongly', 'absolutely wrong', 'no way', 'never going to',
  'this is unacceptable', 'completely wrong', 'totally disagree', 'are you serious',
  'you always', 'you never', 'your fault', 'stop doing', 'fed up'
]

// LONG DISCUSSION THRESHOLDS
const LONG_DISCUSSION_MESSAGE_COUNT = 10 // More than 10 messages = long discussion
const LONG_DISCUSSION_PARTICIPANT_COUNT = 3 // More than 3 people = multi-party discussion

export interface SignalFlags {
  hasCommitment: boolean
  hasTimePressure: boolean
  hasMovementGap: boolean
  hasDependency: boolean
  hasEscalation: boolean
  // Positive signals
  hasAppreciation: boolean
  hasMilestone: boolean
  hasPositiveFeedback: boolean
  // Negative behavior signals
  hasAggression: boolean
  hasHarassment: boolean
  hasConflict: boolean
  // Discussion signals
  isLongDiscussion: boolean
  discussionParticipantCount: number
  discussionMessageCount: number
}

export type SignalType = 'problem' | 'positive' | 'neutral' | 'negative' | 'discussion'

export interface SurfaceResult {
  surface: boolean
  reason: string | null
  confidence: number
  signalType: SignalType
}

export function detectSignals(item: {
  title: string
  owner_name: string | null
  due_date: string | null
  status: string | null
  last_activity_at: string | null
  description?: string | null
  comments?: string[] | null
  // Thread/discussion data
  thread_messages?: Array<{ author: string; text: string }> | null
  reply_count?: number | null
  participant_count?: number | null
}): SignalFlags {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const titleLower = item.title.toLowerCase()
  const statusLower = item.status?.toLowerCase() || ''
  const descriptionLower = item.description?.toLowerCase() || ''
  
  // Combine all text for analysis (title, description, comments, thread messages)
  const threadTexts = (item.thread_messages || []).map(m => m.text.toLowerCase())
  const allText = [titleLower, descriptionLower, ...(item.comments || []).map(c => c.toLowerCase()), ...threadTexts].join(' ')

  // 1. Commitment: Has owner + due date
  const hasCommitment = !!(item.owner_name && item.due_date)

  // 2. Time Pressure: Due within 3 days
  let hasTimePressure = false
  if (item.due_date) {
    const due = new Date(item.due_date)
    const daysUntilDue = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    hasTimePressure = daysUntilDue <= 3
  }

  // 3. Movement Gap: No activity 3+ days when due within 7 days
  let hasMovementGap = false
  if (item.last_activity_at && item.due_date) {
    const daysSinceActivity = Math.floor(
      (now.getTime() - new Date(item.last_activity_at).getTime()) / (1000 * 60 * 60 * 24)
    )
    const daysUntilDue = Math.ceil(
      (new Date(item.due_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    )
    hasMovementGap = daysSinceActivity >= 3 && daysUntilDue <= 7
  }

  // 4. Dependency
  const hasDependency = BLOCKING_KEYWORDS.some(
    (kw) => statusLower.includes(kw) || titleLower.includes(kw)
  )

  // 5. Escalation
  const hasEscalation = ESCALATION_KEYWORDS.some((kw) => titleLower.includes(kw))

  // 6. POSITIVE: Appreciation detected
  const hasAppreciation = APPRECIATION_KEYWORDS.some((kw) => allText.includes(kw))

  // 7. POSITIVE: Milestone achieved
  const hasMilestone = MILESTONE_KEYWORDS.some((kw) => allText.includes(kw))

  // 8. POSITIVE: Positive feedback in comments
  const hasPositiveFeedback = POSITIVE_COMMENT_KEYWORDS.some((kw) => allText.includes(kw))

  // 9. NEGATIVE: Aggression detected
  const hasAggression = AGGRESSION_KEYWORDS.some((kw) => allText.includes(kw))

  // 10. NEGATIVE: Harassment indicators
  const hasHarassment = HARASSMENT_KEYWORDS.some((kw) => allText.includes(kw))

  // 11. NEGATIVE: Conflict/disagreement escalation
  const hasConflict = CONFLICT_INDICATORS.some((kw) => allText.includes(kw))

  // 12. DISCUSSION: Long discussion detection
  const discussionMessageCount = item.reply_count || (item.thread_messages?.length || 0)
  const discussionParticipantCount = item.participant_count || 
    (item.thread_messages ? new Set(item.thread_messages.map(m => m.author)).size : 0)
  const isLongDiscussion = discussionMessageCount >= LONG_DISCUSSION_MESSAGE_COUNT || 
    discussionParticipantCount >= LONG_DISCUSSION_PARTICIPANT_COUNT

  return { 
    hasCommitment, 
    hasTimePressure, 
    hasMovementGap, 
    hasDependency, 
    hasEscalation,
    hasAppreciation,
    hasMilestone,
    hasPositiveFeedback,
    hasAggression,
    hasHarassment,
    hasConflict,
    isLongDiscussion,
    discussionParticipantCount,
    discussionMessageCount
  }
}

/**
 * CORE RULE:
 * Surface ONLY IF: (commitment AND time_pressure AND (movement_gap OR dependency)) OR escalation
 * ALSO Surface positive signals: appreciation, milestones, positive feedback
 * ALSO Surface negative signals: aggression, harassment, conflict
 * ALSO Surface discussion signals: long threads with many participants
 */
export function shouldSurface(flags: SignalFlags): SurfaceResult {
  // 🚨 NEGATIVE SIGNALS (highest priority - immediate attention needed)
  if (flags.hasHarassment) {
    return { 
      surface: true, 
      reason: '🚨 Harassment detected - requires immediate attention', 
      confidence: 0.98, 
      signalType: 'negative' 
    }
  }

  if (flags.hasAggression) {
    return { 
      surface: true, 
      reason: '⚠️ Aggressive language detected', 
      confidence: 0.92, 
      signalType: 'negative' 
    }
  }

  if (flags.hasConflict) {
    return { 
      surface: true, 
      reason: '⚡ Conflict escalation detected', 
      confidence: 0.88, 
      signalType: 'negative' 
    }
  }

  // 💬 DISCUSSION SIGNALS (needs summary)
  if (flags.isLongDiscussion) {
    const participantInfo = flags.discussionParticipantCount && flags.discussionParticipantCount >= 3 
      ? ` with ${flags.discussionParticipantCount} participants` 
      : ''
    const messageInfo = flags.discussionMessageCount 
      ? ` (${flags.discussionMessageCount} messages)` 
      : ''
    return { 
      surface: true, 
      reason: `💬 Long discussion${participantInfo}${messageInfo} - summary available`, 
      confidence: 0.75, 
      signalType: 'discussion' 
    }
  }

  // 🎉 POSITIVE SIGNALS (celebrate wins!)
  if (flags.hasMilestone) {
    return { surface: true, reason: '🎉 Milestone achieved!', confidence: 0.9, signalType: 'positive' }
  }

  if (flags.hasAppreciation) {
    return { surface: true, reason: '👏 Team appreciation', confidence: 0.85, signalType: 'positive' }
  }

  if (flags.hasPositiveFeedback) {
    return { surface: true, reason: '✨ Positive feedback', confidence: 0.8, signalType: 'positive' }
  }

  // 🔴 PROBLEM SIGNALS
  if (flags.hasEscalation) {
    return { surface: true, reason: 'Escalation detected', confidence: 0.95, signalType: 'problem' }
  }

  if (flags.hasCommitment && flags.hasTimePressure) {
    if (flags.hasMovementGap) {
      return { surface: true, reason: 'Deadline approaching with no activity', confidence: 0.85, signalType: 'problem' }
    }
    if (flags.hasDependency) {
      return { surface: true, reason: 'Deadline approaching with dependency', confidence: 0.85, signalType: 'problem' }
    }
  }

  return { surface: false, reason: null, confidence: 0, signalType: 'neutral' }
}

/**
 * Generate a concise summary of a long discussion thread
 * This creates a structured summary suitable for executive review
 */
export function generateDiscussionSummary(messages: Array<{ author: string; text: string; timestamp?: string }>): {
  summary: string
  keyPoints: string[]
  participants: string[]
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed'
  actionItems: string[]
} {
  const participants = [...new Set(messages.map(m => m.author))]
  const allText = messages.map(m => m.text.toLowerCase()).join(' ')
  
  // Detect overall sentiment
  const positiveCount = APPRECIATION_KEYWORDS.concat(POSITIVE_COMMENT_KEYWORDS).filter(kw => allText.includes(kw)).length
  const negativeCount = AGGRESSION_KEYWORDS.concat(CONFLICT_INDICATORS).filter(kw => allText.includes(kw)).length
  
  let sentiment: 'positive' | 'neutral' | 'negative' | 'mixed' = 'neutral'
  if (positiveCount > 0 && negativeCount > 0) {
    sentiment = 'mixed'
  } else if (positiveCount > negativeCount + 1) {
    sentiment = 'positive'
  } else if (negativeCount > positiveCount + 1) {
    sentiment = 'negative'
  }

  // Extract potential action items (messages with action verbs)
  const actionVerbs = ['need to', 'should', 'will', 'must', 'let\'s', 'please', 'can you', 'would you', 'action:', 'todo:', 'next step']
  const actionItems = messages
    .filter(m => actionVerbs.some(v => m.text.toLowerCase().includes(v)))
    .slice(0, 5)
    .map(m => m.text.substring(0, 150) + (m.text.length > 150 ? '...' : ''))

  // Extract key discussion points (first messages from each unique participant)
  const keyPoints = participants
    .map(p => {
      const firstMessage = messages.find(m => m.author === p)
      return firstMessage ? `${p}: ${firstMessage.text.substring(0, 100)}${firstMessage.text.length > 100 ? '...' : ''}` : null
    })
    .filter(Boolean)
    .slice(0, 4) as string[]

  // Generate summary
  const summary = `Discussion with ${participants.length} participants over ${messages.length} messages. ` +
    `Main contributors: ${participants.slice(0, 3).join(', ')}${participants.length > 3 ? ` and ${participants.length - 3} others` : ''}.`

  return {
    summary,
    keyPoints,
    participants,
    sentiment,
    actionItems
  }
}

/**
 * Analyze a message for negative behavior indicators
 * Returns details about detected issues for moderation/HR flagging
 */
export function analyzeNegativeBehavior(text: string, author: string): {
  hasIssues: boolean
  severity: 'low' | 'medium' | 'high' | 'critical'
  categories: Array<'aggression' | 'harassment' | 'conflict' | 'inappropriate'>
  flaggedPhrases: string[]
  recommendedAction: string
} {
  const textLower = text.toLowerCase()
  const categories: Array<'aggression' | 'harassment' | 'conflict' | 'inappropriate'> = []
  const flaggedPhrases: string[] = []

  // Check for aggression
  const aggressionMatches = AGGRESSION_KEYWORDS.filter(kw => textLower.includes(kw))
  if (aggressionMatches.length > 0) {
    categories.push('aggression')
    flaggedPhrases.push(...aggressionMatches)
  }

  // Check for harassment
  const harassmentMatches = HARASSMENT_KEYWORDS.filter(kw => textLower.includes(kw))
  if (harassmentMatches.length > 0) {
    categories.push('harassment')
    flaggedPhrases.push(...harassmentMatches)
  }

  // Check for conflict
  const conflictMatches = CONFLICT_INDICATORS.filter(kw => textLower.includes(kw))
  if (conflictMatches.length > 0) {
    categories.push('conflict')
    flaggedPhrases.push(...conflictMatches)
  }

  const hasIssues = categories.length > 0

  // Determine severity
  let severity: 'low' | 'medium' | 'high' | 'critical' = 'low'
  if (categories.includes('harassment')) {
    severity = 'critical'
  } else if (categories.includes('aggression') && flaggedPhrases.length > 2) {
    severity = 'high'
  } else if (categories.includes('aggression') || flaggedPhrases.length > 1) {
    severity = 'medium'
  }

  // Recommend action based on severity
  let recommendedAction = 'No action needed'
  if (severity === 'critical') {
    recommendedAction = 'Immediate HR review required - potential harassment'
  } else if (severity === 'high') {
    recommendedAction = 'Manager notification recommended - aggressive behavior pattern'
  } else if (severity === 'medium') {
    recommendedAction = 'Monitor conversation - conflict escalating'
  } else if (hasIssues) {
    recommendedAction = 'Continue monitoring - minor friction detected'
  }

  return {
    hasIssues,
    severity,
    categories,
    flaggedPhrases: [...new Set(flaggedPhrases)], // Remove duplicates
    recommendedAction
  }
}
