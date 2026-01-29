export type IntentMode = 'calm' | 'on_the_go' | 'work' | 'focus'

export function calculateImportance(item: {
  due_date: string | null
  last_activity_at: string | null
  has_dependency: boolean
  has_escalation: boolean
}): number {
  let score = 0
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  if (item.due_date) {
    const daysUntilDue = Math.ceil(
      (new Date(item.due_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    )
    if (daysUntilDue < 0) {
      // Overdue - higher score for more overdue
      score += Math.min(40 + Math.abs(daysUntilDue) * 2, 60)
    } else if (daysUntilDue === 0) {
      score += 35
    } else if (daysUntilDue === 1) {
      score += 28
    } else if (daysUntilDue <= 3) {
      score += 15
    }
  }

  if (item.last_activity_at) {
    const daysSince = Math.floor(
      (now.getTime() - new Date(item.last_activity_at).getTime()) / (1000 * 60 * 60 * 24)
    )
    if (daysSince >= 7) score += 25
    else if (daysSince >= 5) score += 20
    else if (daysSince >= 3) score += 15
  }

  if (item.has_dependency) score += 15
  if (item.has_escalation) score += 20

  return Math.min(score, 100)
}

export function getThreshold(mode: IntentMode): number {
  switch (mode) {
    case 'calm':
      return 80
    case 'on_the_go':
      return 60
    case 'work':
      return 40
    case 'focus':
      return 20
    default:
      return 40
  }
}

export const MODE_CONFIG: Record<IntentMode, { icon: string; label: string; description: string }> = {
  calm: {
    icon: '🏖️',
    label: 'Calm',
    description: 'Critical only (vacation)',
  },
  on_the_go: {
    icon: '🚗',
    label: 'On-the-Go',
    description: 'Critical + high (commute)',
  },
  work: {
    icon: '💼',
    label: 'Work',
    description: 'Standard (default)',
  },
  focus: {
    icon: '🎯',
    label: 'Focus',
    description: 'Full snapshot (pre-meeting)',
  },
}
