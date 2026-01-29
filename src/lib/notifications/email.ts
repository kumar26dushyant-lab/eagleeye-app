// Email service using Resend - modern, founder-friendly email API
import { Resend } from 'resend'

// Lazy-init resend to avoid errors at build time when env vars aren't available
let resendInstance: Resend | null = null
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY)
  }
  return resendInstance
}

export interface EmailDigestData {
  recipientEmail: string
  recipientName: string
  date: string
  summary: {
    totalTasks: number
    critical: number
    blockers: number
    overdue: number
    completedToday: number
  }
  topPriorities: Array<{
    title: string
    source: string
    urgency: 'critical' | 'high' | 'medium' | 'low'
    dueDate?: string
    url?: string
  }>
  blockers: Array<{
    title: string
    reason: string
    waitingOn?: string
    url?: string
  }>
  upcomingDeadlines: Array<{
    title: string
    dueDate: string
    daysLeft: number
    url?: string
  }>
  quickWins: Array<{
    title: string
    estimatedTime: string
    url?: string
  }>
}

/**
 * Generate HTML email template for daily digest
 */
function generateDigestHTML(data: EmailDigestData): string {
  const urgencyColors = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#22c55e',
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your EagleEye Brief</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    
    <!-- Header -->
    <div style="text-align: center; padding: 30px 0; border-bottom: 1px solid #27272a;">
      <h1 style="margin: 0; color: #fafafa; font-size: 24px;">
        🦅 Your EagleEye Brief
      </h1>
      <p style="margin: 10px 0 0; color: #a1a1aa; font-size: 14px;">
        ${data.date} • Good morning, ${data.recipientName}
      </p>
    </div>

    <!-- Summary Stats -->
    <div style="padding: 25px 0; border-bottom: 1px solid #27272a;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="text-align: center; padding: 10px;">
            <div style="font-size: 28px; font-weight: bold; color: #fafafa;">${data.summary.totalTasks}</div>
            <div style="font-size: 12px; color: #a1a1aa; text-transform: uppercase;">Active Tasks</div>
          </td>
          <td style="text-align: center; padding: 10px;">
            <div style="font-size: 28px; font-weight: bold; color: #ef4444;">${data.summary.critical}</div>
            <div style="font-size: 12px; color: #a1a1aa; text-transform: uppercase;">Critical</div>
          </td>
          <td style="text-align: center; padding: 10px;">
            <div style="font-size: 28px; font-weight: bold; color: #f97316;">${data.summary.blockers}</div>
            <div style="font-size: 12px; color: #a1a1aa; text-transform: uppercase;">Blockers</div>
          </td>
          <td style="text-align: center; padding: 10px;">
            <div style="font-size: 28px; font-weight: bold; color: #22c55e;">${data.summary.completedToday}</div>
            <div style="font-size: 12px; color: #a1a1aa; text-transform: uppercase;">Done Today</div>
          </td>
        </tr>
      </table>
    </div>

    ${data.blockers.length > 0 ? `
    <!-- Blockers (Highlighted) -->
    <div style="padding: 25px 0; border-bottom: 1px solid #27272a;">
      <h2 style="margin: 0 0 15px; color: #ef4444; font-size: 16px; font-weight: 600;">
        🚨 Blockers Requiring Attention
      </h2>
      ${data.blockers.map(b => `
        <div style="background: #1c1917; border-left: 3px solid #ef4444; padding: 12px 15px; margin-bottom: 10px; border-radius: 0 8px 8px 0;">
          <div style="color: #fafafa; font-weight: 500;">${b.title}</div>
          <div style="color: #a1a1aa; font-size: 13px; margin-top: 5px;">${b.reason}</div>
          ${b.waitingOn ? `<div style="color: #ef4444; font-size: 12px; margin-top: 5px;">Waiting on: ${b.waitingOn}</div>` : ''}
        </div>
      `).join('')}
    </div>
    ` : ''}

    <!-- Top Priorities -->
    <div style="padding: 25px 0; border-bottom: 1px solid #27272a;">
      <h2 style="margin: 0 0 15px; color: #fafafa; font-size: 16px; font-weight: 600;">
        🎯 Today's Top Priorities
      </h2>
      ${data.topPriorities.slice(0, 5).map((p, i) => `
        <div style="display: flex; align-items: flex-start; padding: 12px 0; ${i < data.topPriorities.length - 1 ? 'border-bottom: 1px solid #27272a;' : ''}">
          <div style="width: 24px; height: 24px; background: ${urgencyColors[p.urgency]}20; color: ${urgencyColors[p.urgency]}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; margin-right: 12px; flex-shrink: 0;">
            ${i + 1}
          </div>
          <div style="flex: 1;">
            <div style="color: #fafafa; font-weight: 500;">${p.title}</div>
            <div style="color: #a1a1aa; font-size: 12px; margin-top: 3px;">
              ${p.source} ${p.dueDate ? `• Due: ${p.dueDate}` : ''}
            </div>
          </div>
        </div>
      `).join('')}
    </div>

    ${data.quickWins.length > 0 ? `
    <!-- Quick Wins -->
    <div style="padding: 25px 0; border-bottom: 1px solid #27272a;">
      <h2 style="margin: 0 0 15px; color: #22c55e; font-size: 16px; font-weight: 600;">
        ⚡ Quick Wins (under 30 min)
      </h2>
      ${data.quickWins.slice(0, 3).map(q => `
        <div style="background: #052e16; padding: 10px 15px; margin-bottom: 8px; border-radius: 8px;">
          <span style="color: #fafafa;">${q.title}</span>
          <span style="color: #22c55e; font-size: 12px; margin-left: 8px;">~${q.estimatedTime}</span>
        </div>
      `).join('')}
    </div>
    ` : ''}

    ${data.upcomingDeadlines.length > 0 ? `
    <!-- Upcoming Deadlines -->
    <div style="padding: 25px 0; border-bottom: 1px solid #27272a;">
      <h2 style="margin: 0 0 15px; color: #f97316; font-size: 16px; font-weight: 600;">
        📅 Upcoming Deadlines
      </h2>
      ${data.upcomingDeadlines.slice(0, 4).map(d => `
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #27272a;">
          <span style="color: #fafafa;">${d.title}</span>
          <span style="color: ${d.daysLeft <= 1 ? '#ef4444' : d.daysLeft <= 3 ? '#f97316' : '#a1a1aa'}; font-size: 13px;">
            ${d.daysLeft === 0 ? 'Today!' : d.daysLeft === 1 ? 'Tomorrow' : `${d.daysLeft} days`}
          </span>
        </div>
      `).join('')}
    </div>
    ` : ''}

    <!-- CTA -->
    <div style="padding: 30px 0; text-align: center;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" 
         style="display: inline-block; background: #2563eb; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
        Open Dashboard →
      </a>
      <p style="color: #71717a; font-size: 13px; margin-top: 15px;">
        Need to adjust what you see? <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings/notifications" style="color: #60a5fa;">Update preferences</a>
      </p>
    </div>

    <!-- Footer -->
    <div style="padding: 20px 0; text-align: center; border-top: 1px solid #27272a;">
      <p style="color: #52525b; font-size: 12px; margin: 0;">
        EagleEye • Your Decision Intelligence Layer<br>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings/notifications" style="color: #52525b;">Unsubscribe</a> • 
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/help" style="color: #52525b;">Help</a>
      </p>
    </div>

  </div>
</body>
</html>
  `.trim()
}

/**
 * Generate plain text version for email clients that don't support HTML
 */
function generateDigestText(data: EmailDigestData): string {
  let text = `
🦅 YOUR EAGLEEYE BRIEF
${data.date}

Good morning, ${data.recipientName}!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 AT A GLANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• ${data.summary.totalTasks} active tasks
• ${data.summary.critical} critical
• ${data.summary.blockers} blockers
• ${data.summary.completedToday} completed today
`

  if (data.blockers.length > 0) {
    text += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 BLOCKERS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${data.blockers.map(b => `• ${b.title}\n  → ${b.reason}${b.waitingOn ? `\n  Waiting on: ${b.waitingOn}` : ''}`).join('\n\n')}
`
  }

  text += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 TOP PRIORITIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${data.topPriorities.slice(0, 5).map((p, i) => `${i + 1}. ${p.title} (${p.source})`).join('\n')}
`

  if (data.quickWins.length > 0) {
    text += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ QUICK WINS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${data.quickWins.slice(0, 3).map(q => `• ${q.title} (~${q.estimatedTime})`).join('\n')}
`
  }

  text += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Open Dashboard: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard

Update preferences: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings/notifications
`

  return text.trim()
}

/**
 * Send daily digest email
 */
export async function sendDigestEmail(data: EmailDigestData): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY not configured')
    return false
  }

  const resend = getResend()
  if (!resend) return false

  try {
    const { error } = await resend.emails.send({
      from: 'EagleEye <digest@eagleeye.app>',
      to: data.recipientEmail,
      subject: `🦅 Your Brief: ${data.summary.critical} critical, ${data.summary.blockers} blockers`,
      html: generateDigestHTML(data),
      text: generateDigestText(data),
    })

    if (error) {
      console.error('[Email] Failed to send:', error)
      return false
    }

    console.log('[Email] Digest sent to:', data.recipientEmail)
    return true
  } catch (error) {
    console.error('[Email] Error:', error)
    return false
  }
}

/**
 * Send urgent alert email (for real-time notifications)
 */
export async function sendUrgentEmail(
  to: string,
  subject: string,
  title: string,
  body: string,
  ctaUrl?: string
): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY not configured')
    return false
  }

  const resend = getResend()
  if (!resend) return false

  try {
    const { error } = await resend.emails.send({
      from: 'EagleEye Alerts <alerts@eagleeye.app>',
      to,
      subject: `🚨 ${subject}`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #ef4444; margin: 0 0 15px;">${title}</h1>
          <p style="color: #333; font-size: 16px; line-height: 1.5;">${body}</p>
          ${ctaUrl ? `<a href="${ctaUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 15px;">View Details →</a>` : ''}
        </div>
      `,
    })

    return !error
  } catch (error) {
    console.error('[Email] Urgent email error:', error)
    return false
  }
}

export { generateDigestHTML, generateDigestText }
