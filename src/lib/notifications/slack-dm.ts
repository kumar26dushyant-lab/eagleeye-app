// Slack Bot DM Notifications
// Sends brief summaries directly to users in Slack (where they already are!)

import { WebClient } from '@slack/web-api'

interface SlackNotifyConfig {
  userId: string          // EagleEye user ID
  slackUserId: string     // Slack user ID to DM
  slackToken: string      // Bot token with chat:write scope
  frequency: 'realtime' | 'daily' | 'weekly'
}

interface SignalSummary {
  blockers: number
  decisions: number
  mentions: number
  overdueTasks: number
  topItems: Array<{
    source: string
    title: string
    urgency: 'high' | 'medium' | 'low'
    url: string
  }>
}

/**
 * Send brief summary as Slack DM
 * User receives it right in Slack - no need to open another app!
 */
export async function sendSlackDM(
  config: SlackNotifyConfig,
  summary: SignalSummary
): Promise<{ success: boolean; ts?: string; error?: string }> {
  
  const client = new WebClient(config.slackToken)
  const { blockers, decisions, overdueTasks, topItems } = summary
  
  // Skip if nothing important for non-daily
  const totalUrgent = blockers + overdueTasks
  if (totalUrgent === 0 && config.frequency !== 'daily') {
    return { success: true, ts: 'skipped' }
  }

  try {
    // Build Slack Block Kit message
    const blocks = buildSlackBlocks(summary)
    const text = buildFallbackText(summary)

    // Open DM channel with user
    const dmResponse = await client.conversations.open({
      users: config.slackUserId,
    })

    if (!dmResponse.channel?.id) {
      throw new Error('Failed to open DM channel')
    }

    // Send the message
    const response = await client.chat.postMessage({
      channel: dmResponse.channel.id,
      blocks,
      text, // Fallback for notifications
    })

    return { success: true, ts: response.ts }
  } catch (error) {
    console.error('[SlackNotify] Failed to send DM:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

function buildSlackBlocks(summary: SignalSummary): any[] {
  const { blockers, decisions, mentions, overdueTasks, topItems } = summary
  const blocks: any[] = []

  // Header
  blocks.push({
    type: 'header',
    text: {
      type: 'plain_text',
      text: '🦅 EagleEye Brief',
      emoji: true,
    },
  })

  // Stats section
  const stats: string[] = []
  if (blockers > 0) stats.push(`🔴 *${blockers}* blockers`)
  if (overdueTasks > 0) stats.push(`⚠️ *${overdueTasks}* overdue`)
  if (decisions > 0) stats.push(`📋 *${decisions}* decisions`)
  if (mentions > 0) stats.push(`💬 *${mentions}* mentions`)

  if (stats.length > 0) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: stats.join('  •  '),
      },
    })
  }

  blocks.push({ type: 'divider' })

  // Top items
  if (topItems.length > 0) {
    const itemsText = topItems.slice(0, 5).map((item, i) => {
      const emoji = item.urgency === 'high' ? '🔴' : item.urgency === 'medium' ? '🟡' : '⚪'
      return `${emoji} *<${item.url}|${item.title}>*\n     _${item.source}_`
    }).join('\n\n')

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Needs attention:*\n\n${itemsText}`,
      },
    })
  } else {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '✅ *All clear!* Nothing urgent right now.',
      },
    })
  }

  // Action button
  blocks.push({
    type: 'actions',
    elements: [
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: '📊 Open Dashboard',
          emoji: true,
        },
        url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.eagleeye.com'}/dashboard`,
        style: 'primary',
      },
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: '⚙️ Settings',
          emoji: true,
        },
        url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.eagleeye.com'}/settings/notifications`,
      },
    ],
  })

  // Footer
  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `_Sent by EagleEye • ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}_`,
      },
    ],
  })

  return blocks
}

function buildFallbackText(summary: SignalSummary): string {
  const { blockers, decisions, overdueTasks, topItems } = summary
  const urgent = blockers + overdueTasks
  
  if (urgent > 0) {
    return `🔴 EagleEye: ${urgent} urgent items need your attention`
  }
  if (decisions > 0) {
    return `📋 EagleEye: ${decisions} decisions waiting for you`
  }
  if (topItems.length > 0) {
    return `🦅 EagleEye Brief: ${topItems.length} items to review`
  }
  return '✅ EagleEye: All clear! Nothing urgent.'
}

/**
 * Send real-time alert for high-priority items
 * (For users who want instant notifications)
 */
export async function sendRealtimeAlert(
  config: SlackNotifyConfig,
  item: { source: string; title: string; url: string; urgency: 'high' }
): Promise<{ success: boolean }> {
  
  const client = new WebClient(config.slackToken)

  try {
    const dmResponse = await client.conversations.open({
      users: config.slackUserId,
    })

    if (!dmResponse.channel?.id) {
      throw new Error('Failed to open DM channel')
    }

    await client.chat.postMessage({
      channel: dmResponse.channel.id,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `🔴 *Urgent from ${item.source}*\n\n<${item.url}|${item.title}>`,
          },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: '_Real-time alert from EagleEye_',
            },
          ],
        },
      ],
      text: `🔴 Urgent: ${item.title}`,
    })

    return { success: true }
  } catch (error) {
    console.error('[SlackNotify] Realtime alert failed:', error)
    return { success: false }
  }
}
