import OpenAI from 'openai'
import type { WorkItem, CommunicationSignal, IntentMode } from '@/types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface BriefInput {
  needsAttention: WorkItem[]
  fyiItems: WorkItem[]
  handledItems: WorkItem[]
  signals: CommunicationSignal[]
  totalWatched: number
  totalSurfaced: number
  coveragePercent: number
  intentMode: IntentMode
  userName?: string
}

export async function generateBriefText(input: BriefInput): Promise<string> {
  const { needsAttention, fyiItems, handledItems, signals, totalWatched, totalSurfaced, coveragePercent, intentMode, userName } = input

  const greeting = getGreeting()
  const modeLabel = getModeLabel(intentMode)

  const prompt = `Generate a concise, professional daily brief for a decision-intelligence dashboard. Be direct and actionable.

Context:
- User: ${userName || 'there'}
- Mode: ${modeLabel}
- Coverage: ${coveragePercent}%
- Total watched: ${totalWatched}
- Total surfaced: ${totalSurfaced}

Items needing attention (${needsAttention.length}):
${needsAttention.map((item) => `- "${item.title}" (${item.assignee || 'Unassigned'}, due: ${item.due_date || 'No date'}) - ${item.surface_reason}`).join('\n') || 'None'}

FYI items (${fyiItems.length}):
${fyiItems.map((item) => `- "${item.title}"`).join('\n') || 'None'}

Handled without user (${handledItems.length}):
${handledItems.length} items were resolved automatically.

Communication signals (${signals.length}):
${signals.map((s) => `- ${s.signal_type} in ${s.channel_name || 'channel'}`).join('\n') || 'None detected'}

Generate a brief (max 150 words) that:
1. Starts with "${greeting}"
2. Summarizes what needs attention first
3. Mentions FYI items briefly if any
4. Notes handled items count
5. Ends with a confident, professional tone

Do NOT use bullet points or lists. Write in flowing prose suitable for audio playback.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are EagleEye, a professional executive assistant that provides concise daily briefs. Be direct, confident, and actionable. Never use filler words or unnecessary pleasantries.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    max_tokens: 300,
    temperature: 0.7,
  })

  return response.choices[0]?.message?.content || generateFallbackBrief(input)
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function getModeLabel(mode: IntentMode): string {
  const labels: Record<IntentMode, string> = {
    calm: 'Calm (critical only)',
    on_the_go: 'On-the-Go (critical + high)',
    work: 'Work (standard)',
    focus: 'Focus (full snapshot)',
  }
  return labels[mode] || 'Work'
}

function generateFallbackBrief(input: BriefInput): string {
  const { needsAttention, handledItems, totalWatched, totalSurfaced } = input
  const greeting = getGreeting()

  if (needsAttention.length === 0) {
    return `${greeting}! Your dashboard is clear. ${handledItems.length} items were handled without you. Watching ${totalWatched} items total.`
  }

  const topItem = needsAttention[0]
  return `${greeting}! ${needsAttention.length} item${needsAttention.length > 1 ? 's need' : ' needs'} your attention. Top priority: "${topItem.title}" ${topItem.due_date ? `due ${topItem.due_date}` : ''}. ${handledItems.length} items handled automatically. Coverage: ${totalWatched} watched, ${totalSurfaced} surfaced.`
}
