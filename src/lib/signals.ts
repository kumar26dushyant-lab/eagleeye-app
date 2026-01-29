const BLOCKING_KEYWORDS = ['blocked', 'waiting', 'pending', 'on hold', 'depends', 'stuck']
const ESCALATION_KEYWORDS = ['urgent', 'asap', 'critical', 'escalat', 'emergency', 'blocker', 'p0', 'p1']

// POSITIVE SIGNALS - Celebrate wins, not just problems!
const APPRECIATION_KEYWORDS = ['thank', 'thanks', 'great job', 'well done', 'awesome', 'amazing', 'excellent', 'kudos', 'shoutout', 'appreciate', 'fantastic', 'brilliant', 'proud of', 'crushed it', 'nailed it', 'killed it']
const MILESTONE_KEYWORDS = ['launched', 'shipped', 'completed', 'released', 'achieved', 'milestone', 'reached', 'hit the goal', 'done!', 'finished', 'accomplished', 'delivered', 'went live', 'production', 'deployed']
const POSITIVE_COMMENT_KEYWORDS = ['love this', 'looks great', 'perfect', 'exactly what', 'nice work', 'impressive', 'solid', 'clean', 'beautiful']

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
}

export type SignalType = 'problem' | 'positive' | 'neutral'

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
}): SignalFlags {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const titleLower = item.title.toLowerCase()
  const statusLower = item.status?.toLowerCase() || ''
  const descriptionLower = item.description?.toLowerCase() || ''
  
  // Combine all text for analysis (title, description, comments)
  const allText = [titleLower, descriptionLower, ...(item.comments || []).map(c => c.toLowerCase())].join(' ')

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

  return { 
    hasCommitment, 
    hasTimePressure, 
    hasMovementGap, 
    hasDependency, 
    hasEscalation,
    hasAppreciation,
    hasMilestone,
    hasPositiveFeedback
  }
}

/**
 * CORE RULE:
 * Surface ONLY IF: (commitment AND time_pressure AND (movement_gap OR dependency)) OR escalation
 * ALSO Surface positive signals: appreciation, milestones, positive feedback
 */
export function shouldSurface(flags: SignalFlags): SurfaceResult {
  // POSITIVE SIGNALS (celebrate wins!)
  if (flags.hasMilestone) {
    return { surface: true, reason: '🎉 Milestone achieved!', confidence: 0.9, signalType: 'positive' }
  }

  if (flags.hasAppreciation) {
    return { surface: true, reason: '👏 Team appreciation', confidence: 0.85, signalType: 'positive' }
  }

  if (flags.hasPositiveFeedback) {
    return { surface: true, reason: '✨ Positive feedback', confidence: 0.8, signalType: 'positive' }
  }

  // PROBLEM SIGNALS
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
