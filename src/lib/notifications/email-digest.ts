// Email Digest Service
// Sends daily/weekly brief summaries to users via email

import { Resend } from 'resend'

// Lazy-init resend to avoid errors at build time
let resend: Resend | null = null
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY)
  }
  return resend
}

interface DigestConfig {
  userId: string
  email: string
  frequency: 'daily' | 'weekly' | 'realtime'
  timezone: string
  preferredTime: string // "09:00" format
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
 * Generate and send email digest
 */
export async function sendEmailDigest(
  config: DigestConfig,
  summary: SignalSummary
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  
  const { email, frequency } = config
  const { blockers, decisions, mentions, overdueTasks, topItems } = summary
  
  // Skip if nothing important
  const totalImportant = blockers + decisions + overdueTasks
  if (totalImportant === 0 && frequency !== 'daily') {
    return { success: true, messageId: 'skipped-no-items' }
  }

  const resendClient = getResend()
  if (!resendClient) {
    console.warn('[EmailDigest] Resend API key not configured')
    return { success: false, error: 'Email service not configured' }
  }

  const subject = generateSubject(summary, frequency)
  const html = generateEmailHTML(summary, frequency)
  const text = generateEmailText(summary)

  try {
    const response = await resendClient.emails.send({
      from: 'EagleEye <brief@eagleeye.work>',
      to: email,
      subject,
      html,
      text,
    })

    return { success: true, messageId: response.data?.id }
  } catch (error) {
    console.error('[EmailDigest] Failed to send:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

function generateSubject(summary: SignalSummary, frequency: string): string {
  const { blockers, decisions, overdueTasks } = summary
  const urgent = blockers + overdueTasks
  
  if (urgent > 0) {
    return `🔴 ${urgent} urgent item${urgent > 1 ? 's' : ''} need your attention`
  }
  if (decisions > 0) {
    return `📋 ${decisions} decision${decisions > 1 ? 's' : ''} waiting for you`
  }
  return frequency === 'daily' 
    ? `✅ Your daily brief - all clear!`
    : `📊 Your weekly EagleEye summary`
}

function generateEmailHTML(summary: SignalSummary, frequency: string): string {
  const { blockers, decisions, mentions, overdueTasks, topItems } = summary
  
  const statsSection = `
    <div style="display: flex; gap: 16px; margin: 20px 0;">
      ${blockers > 0 ? `<div style="background: #FEE2E2; padding: 12px 20px; border-radius: 8px;">
        <div style="font-size: 24px; font-weight: bold; color: #DC2626;">${blockers}</div>
        <div style="font-size: 12px; color: #7F1D1D;">Blockers</div>
      </div>` : ''}
      ${overdueTasks > 0 ? `<div style="background: #FEF3C7; padding: 12px 20px; border-radius: 8px;">
        <div style="font-size: 24px; font-weight: bold; color: #D97706;">${overdueTasks}</div>
        <div style="font-size: 12px; color: #78350F;">Overdue</div>
      </div>` : ''}
      ${decisions > 0 ? `<div style="background: #DBEAFE; padding: 12px 20px; border-radius: 8px;">
        <div style="font-size: 24px; font-weight: bold; color: #2563EB;">${decisions}</div>
        <div style="font-size: 12px; color: #1E3A8A;">Decisions</div>
      </div>` : ''}
      ${mentions > 0 ? `<div style="background: #E0E7FF; padding: 12px 20px; border-radius: 8px;">
        <div style="font-size: 24px; font-weight: bold; color: #4F46E5;">${mentions}</div>
        <div style="font-size: 12px; color: #312E81;">Mentions</div>
      </div>` : ''}
    </div>
  `

  const itemsList = topItems.slice(0, 5).map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #E5E7EB;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 12px; background: #F3F4F6; padding: 2px 8px; border-radius: 4px;">${item.source}</span>
          <span style="color: ${item.urgency === 'high' ? '#DC2626' : item.urgency === 'medium' ? '#D97706' : '#6B7280'};">●</span>
        </div>
        <a href="${item.url}" style="color: #111827; text-decoration: none; font-weight: 500;">
          ${item.title}
        </a>
      </td>
    </tr>
  `).join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #F9FAFB;">
      <div style="background: white; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="font-size: 24px; margin: 0;">🦅 EagleEye</h1>
          <p style="color: #6B7280; margin: 8px 0;">Your ${frequency} brief</p>
        </div>

        <!-- Quick Stats -->
        ${statsSection}

        <!-- Top Items -->
        ${topItems.length > 0 ? `
          <h2 style="font-size: 16px; margin: 24px 0 12px;">Needs Your Attention</h2>
          <table style="width: 100%; border-collapse: collapse;">
            ${itemsList}
          </table>
        ` : `
          <div style="text-align: center; padding: 40px; background: #F0FDF4; border-radius: 8px;">
            <div style="font-size: 32px;">✅</div>
            <p style="color: #166534; margin: 8px 0;">All clear! Nothing urgent today.</p>
          </div>
        `}

        <!-- CTA -->
        <div style="text-align: center; margin-top: 24px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://eagleeye.work'}/dashboard" 
             style="display: inline-block; background: #2563EB; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">
            Open Dashboard →
          </a>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 32px; padding-top: 16px; border-top: 1px solid #E5E7EB;">
          <p style="font-size: 12px; color: #9CA3AF;">
            Sent by EagleEye • <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings/notifications" style="color: #6B7280;">Manage preferences</a>
          </p>
        </div>

      </div>
    </body>
    </html>
  `
}

function generateEmailText(summary: SignalSummary): string {
  const { blockers, decisions, mentions, overdueTasks, topItems } = summary
  
  let text = `🦅 EAGLEEYE BRIEF\n${'='.repeat(40)}\n\n`
  
  if (blockers > 0) text += `🔴 ${blockers} Blockers\n`
  if (overdueTasks > 0) text += `⚠️ ${overdueTasks} Overdue tasks\n`
  if (decisions > 0) text += `📋 ${decisions} Decisions needed\n`
  if (mentions > 0) text += `💬 ${mentions} Mentions\n`
  
  if (topItems.length > 0) {
    text += `\nTOP ITEMS:\n${'-'.repeat(40)}\n`
    topItems.slice(0, 5).forEach((item, i) => {
      text += `${i + 1}. [${item.source}] ${item.title}\n   ${item.url}\n\n`
    })
  } else {
    text += `\n✅ All clear! Nothing urgent today.\n`
  }
  
  text += `\n${'='.repeat(40)}\nOpen dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard\n`
  
  return text
}

/**
 * Schedule digest for a user (called by cron)
 */
export async function scheduleDigest(
  config: DigestConfig, 
  getSignals: () => Promise<SignalSummary>
): Promise<void> {
  const now = new Date()
  const userTime = new Date(now.toLocaleString('en-US', { timeZone: config.timezone }))
  const currentHour = userTime.getHours()
  const preferredHour = parseInt(config.preferredTime.split(':')[0])
  
  // Only send at preferred time (within the hour)
  if (currentHour !== preferredHour) {
    return
  }
  
  const summary = await getSignals()
  await sendEmailDigest(config, summary)
}
