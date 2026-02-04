// Trial Reminder Email Templates
// Sent at key points during trial

import { Resend } from 'resend'

// Lazy-init resend to avoid errors at build time
let resendInstance: Resend | null = null
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY)
  }
  return resendInstance
}

// Get base URL from environment or fallback
const getBaseUrl = () => process.env.NEXT_PUBLIC_APP_URL || 'https://eagleeye.work'

interface ReminderData {
  email: string
  name: string
  daysLeft: number
  trialEndsAt: Date
}

/**
 * Day 1: Welcome to trial
 */
export async function sendWelcomeEmail(data: ReminderData): Promise<boolean> {
  const resend = getResend()
  if (!resend) return false

  const baseUrl = getBaseUrl()

  try {
    await resend.emails.send({
      from: 'EagleEye <hello@eagleeye.work>',
      to: data.email,
      subject: '🦅 Welcome to EagleEye - Your 7-day trial starts now!',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 20px; background: #0a0a0a; color: #fafafa;">
          <div style="text-align: center; margin-bottom: 32px;">
            <span style="font-size: 32px;">🦅</span>
            <h1 style="color: #fafafa; margin: 16px 0 0 0; font-size: 24px;">Welcome to EagleEye!</h1>
          </div>
          
          <p style="font-size: 16px; line-height: 1.6;">Hi ${data.name},</p>
          
          <p style="font-size: 16px; line-height: 1.6;">Your <strong>7-day free trial</strong> has started. You have full access to all Solo plan features.</p>
          
          <div style="background: #1a1a1a; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <h3 style="margin: 0 0 16px 0; color: #60a5fa; font-size: 16px;">What you can do now:</h3>
            <ul style="color: #a1a1aa; margin: 0; padding-left: 20px; line-height: 1.8;">
              <li>Connect WhatsApp Business, Slack, Asana & more</li>
              <li>Get AI-powered priority scoring</li>
              <li>Receive real-time notifications</li>
              <li>Daily digest via Slack DM</li>
              <li>90-day signal history</li>
            </ul>
          </div>

          <div style="background: #172554; border: 1px solid #1e40af; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
            <p style="margin: 0; color: #93c5fd; font-size: 14px;">
              <strong>No charge until ${data.trialEndsAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}.</strong><br>
              Cancel anytime with one click.
            </p>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${baseUrl}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
              Go to Dashboard →
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #27272a; margin: 32px 0;">

          <p style="color: #52525b; font-size: 13px; text-align: center; margin: 0;">
            Questions? Just reply to this email. We read every message.
          </p>
        </div>
      `,
    })
    return true
  } catch (error) {
    console.error('Failed to send welcome email:', error)
    return false
  }
}

/**
 * Day 11: 3 days left reminder
 */
export async function sendDay3Reminder(data: ReminderData): Promise<boolean> {
  const resend = getResend()
  if (!resend) return false

  const baseUrl = getBaseUrl()

  try {
    await resend.emails.send({
      from: 'EagleEye <hello@eagleeye.work>',
      to: data.email,
      subject: '⏰ 3 days left in your EagleEye trial',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 20px; background: #0a0a0a; color: #fafafa;">
          <div style="text-align: center; margin-bottom: 32px;">
            <span style="font-size: 32px;">⏰</span>
            <h1 style="color: #fafafa; margin: 16px 0 0 0; font-size: 24px;">3 days left in your trial</h1>
          </div>
          
          <p style="font-size: 16px; line-height: 1.6;">Hi ${data.name},</p>
          
          <p style="font-size: 16px; line-height: 1.6;">Just a heads up: your EagleEye trial ends on <strong>${data.trialEndsAt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</strong>.</p>

          <div style="background: #1a1a1a; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <h3 style="margin: 0 0 16px 0; color: #22c55e; font-size: 16px;">What happens next?</h3>
            <ul style="color: #a1a1aa; margin: 0; padding-left: 20px; line-height: 1.8;">
              <li>Your card will be charged on ${data.trialEndsAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</li>
              <li>You'll continue with uninterrupted access</li>
              <li>Cancel anytime before then at no charge</li>
            </ul>
          </div>

          <p style="color: #a1a1aa; font-size: 15px; line-height: 1.6;">
            If EagleEye isn't right for you, no worries!<br>
            <a href="${baseUrl}/dashboard/billing" style="color: #60a5fa; text-decoration: underline;">Manage your subscription here</a> before your trial ends.
          </p>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${baseUrl}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
              Continue Using EagleEye →
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #27272a; margin: 32px 0;">

          <p style="color: #52525b; font-size: 13px; text-align: center; margin: 0;">
            Questions about billing? Reply to this email anytime.
          </p>
        </div>
      `,
    })
    return true
  } catch (error) {
    console.error('Failed to send day 3 reminder:', error)
    return false
  }
}

/**
 * Day 13: Tomorrow reminder
 */
export async function sendDay1Reminder(data: ReminderData): Promise<boolean> {
  const resend = getResend()
  if (!resend) return false

  const baseUrl = getBaseUrl()

  try {
    await resend.emails.send({
      from: 'EagleEye <hello@eagleeye.work>',
      to: data.email,
      subject: '🔔 Your EagleEye trial ends tomorrow',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 20px; background: #0a0a0a; color: #fafafa;">
          <div style="text-align: center; margin-bottom: 32px;">
            <span style="font-size: 32px;">🔔</span>
            <h1 style="color: #fafafa; margin: 16px 0 0 0; font-size: 24px;">Final reminder: Trial ends tomorrow</h1>
          </div>
          
          <p style="font-size: 16px; line-height: 1.6;">Hi ${data.name},</p>
          
          <p style="font-size: 16px; line-height: 1.6;">Your EagleEye trial ends <strong>tomorrow</strong>.</p>

          <div style="background: #172554; border: 1px solid #1d4ed8; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
            <p style="margin: 0; color: #93c5fd; font-size: 15px;">
              <strong>Tomorrow (${data.trialEndsAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}):</strong><br>
              Your Solo plan will begin.
            </p>
          </div>

          <div style="background: #1a1a1a; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <p style="margin: 0 0 12px 0; font-size: 15px;">
              <strong style="color: #22c55e;">Want to continue?</strong><br>
              <span style="color: #a1a1aa;">Do nothing. You're all set!</span>
            </p>
            <p style="margin: 0; font-size: 15px;">
              <strong style="color: #f97316;">Want to cancel?</strong><br>
              <span style="color: #a1a1aa;"><a href="${baseUrl}/dashboard/billing" style="color: #60a5fa;">Cancel here</a> before tomorrow.</span>
            </p>
          </div>

          <hr style="border: none; border-top: 1px solid #27272a; margin: 32px 0;">

          <p style="color: #52525b; font-size: 13px; text-align: center; margin: 0;">
            Thank you for trying EagleEye. We hope it's been helpful!<br>
            Reply to this email if you have any questions.
          </p>
        </div>
      `,
    })
    return true
  } catch (error) {
    console.error('Failed to send day 1 reminder:', error)
    return false
  }
}

/**
 * Trial expired (if payment fails after 7 days)
 */
export async function sendTrialExpiredEmail(data: { email: string; name: string }): Promise<boolean> {
  const resend = getResend()
  if (!resend) return false

  const baseUrl = getBaseUrl()

  try {
    await resend.emails.send({
      from: 'EagleEye <hello@eagleeye.work>',
      to: data.email,
      subject: '😢 Your EagleEye trial has ended',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 20px; background: #0a0a0a; color: #fafafa;">
          <div style="text-align: center; margin-bottom: 32px;">
            <span style="font-size: 32px;">😢</span>
            <h1 style="color: #fafafa; margin: 16px 0 0 0; font-size: 24px;">Your trial has ended</h1>
          </div>
          
          <p style="font-size: 16px; line-height: 1.6;">Hi ${data.name},</p>
          
          <p style="font-size: 16px; line-height: 1.6;">Your 7-day EagleEye trial has ended. Your account is now in limited mode.</p>

          <div style="background: #1a1a1a; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <h3 style="margin: 0 0 16px 0; color: #f97316; font-size: 16px;">What's limited now:</h3>
            <ul style="color: #a1a1aa; margin: 0; padding-left: 20px; line-height: 1.8;">
              <li>AI-powered priority scoring disabled</li>
              <li>Real-time notifications paused</li>
              <li>History limited to 7 days</li>
              <li>Slack digest disabled</li>
            </ul>
          </div>

          <p style="font-size: 16px; line-height: 1.6;">Ready to get your signals back?</p>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${baseUrl}/dashboard/billing" style="display: inline-block; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
              Reactivate My Account →
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #27272a; margin: 32px 0;">

          <p style="color: #52525b; font-size: 13px; text-align: center; margin: 0;">
            We'd love to have you back.<br>
            Reply if you have questions or feedback on how we can improve.
          </p>
        </div>
      `,
    })
    return true
  } catch (error) {
    console.error('Failed to send trial expired email:', error)
    return false
  }
}

/**
 * Payment successful - welcome to paid
 */
export async function sendPaymentSuccessEmail(data: { email: string; name: string; tier: string; amount: number }): Promise<boolean> {
  const resend = getResend()
  if (!resend) return false

  const baseUrl = getBaseUrl()

  try {
    await resend.emails.send({
      from: 'EagleEye <hello@eagleeye.work>',
      to: data.email,
      subject: '✅ Welcome to EagleEye ' + data.tier + '!',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 20px; background: #0a0a0a; color: #fafafa;">
          <div style="text-align: center; margin-bottom: 32px;">
            <span style="font-size: 32px;">🎉</span>
            <h1 style="color: #22c55e; margin: 16px 0 0 0; font-size: 24px;">Payment Successful!</h1>
          </div>
          
          <p style="font-size: 16px; line-height: 1.6;">Hi ${data.name},</p>
          
          <p style="font-size: 16px; line-height: 1.6;">Thank you for subscribing to EagleEye <strong>${data.tier}</strong>!</p>

          <div style="background: #052e16; border: 1px solid #166534; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <table style="width: 100%; color: #86efac; font-size: 15px;">
              <tr>
                <td style="padding: 4px 0;"><strong>Plan:</strong></td>
                <td style="padding: 4px 0; text-align: right;">${data.tier}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0;"><strong>Amount:</strong></td>
                <td style="padding: 4px 0; text-align: right;">$${data.amount}/month</td>
              </tr>
              <tr>
                <td style="padding: 4px 0;"><strong>Billing:</strong></td>
                <td style="padding: 4px 0; text-align: right;">Monthly, auto-renew</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 16px; line-height: 1.6;">You now have full access to all ${data.tier} features. Keep surfacing what matters!</p>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${baseUrl}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
              Go to Dashboard →
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #27272a; margin: 32px 0;">

          <p style="color: #52525b; font-size: 13px; text-align: center; margin: 0;">
            Manage your subscription anytime at <a href="${baseUrl}/dashboard/billing" style="color: #60a5fa;">Dashboard → Billing</a>
          </p>
        </div>
      `,
    })
    return true
  } catch (error) {
    console.error('Failed to send payment success email:', error)
    return false
  }
}

/**
 * Payment failed - card declined
 */
export async function sendPaymentFailedEmail(data: { email: string; name: string; retryDate: Date }): Promise<boolean> {
  const resend = getResend()
  if (!resend) return false

  const baseUrl = getBaseUrl()

  try {
    await resend.emails.send({
      from: 'EagleEye <hello@eagleeye.work>',
      to: data.email,
      subject: '⚠️ Payment failed - Action required',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 20px; background: #0a0a0a; color: #fafafa;">
          <div style="text-align: center; margin-bottom: 32px;">
            <span style="font-size: 32px;">⚠️</span>
            <h1 style="color: #f97316; margin: 16px 0 0 0; font-size: 24px;">Payment Failed</h1>
          </div>
          
          <p style="font-size: 16px; line-height: 1.6;">Hi ${data.name},</p>
          
          <p style="font-size: 16px; line-height: 1.6;">We couldn't process your payment. This usually happens when:</p>
          
          <ul style="color: #a1a1aa; line-height: 1.8; font-size: 15px;">
            <li>Your card has expired</li>
            <li>Insufficient funds</li>
            <li>Your bank blocked the transaction</li>
          </ul>

          <div style="background: #451a03; border: 1px solid #c2410c; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
            <p style="margin: 0; color: #fdba74; font-size: 15px;">
              <strong>Please update your payment method</strong><br>
              We'll retry on ${data.retryDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${baseUrl}/dashboard/billing" style="display: inline-block; background: linear-gradient(135deg, #f97316, #ea580c); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
              Update Payment Method →
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #27272a; margin: 32px 0;">

          <p style="color: #52525b; font-size: 13px; text-align: center; margin: 0;">
            Need help? Reply to this email or contact support@eagleeye.work
          </p>
        </div>
      `,
    })
    return true
  } catch (error) {
    console.error('Failed to send payment failed email:', error)
    return false
  }
}

/**
 * Subscription cancelled confirmation
 */
export async function sendCancellationEmail(data: { email: string; name: string; accessUntil: Date }): Promise<boolean> {
  const resend = getResend()
  if (!resend) return false

  const baseUrl = getBaseUrl()

  try {
    await resend.emails.send({
      from: 'EagleEye <hello@eagleeye.work>',
      to: data.email,
      subject: 'Your EagleEye subscription has been cancelled',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 20px; background: #0a0a0a; color: #fafafa;">
          <div style="text-align: center; margin-bottom: 32px;">
            <span style="font-size: 32px;">👋</span>
            <h1 style="color: #fafafa; margin: 16px 0 0 0; font-size: 24px;">Subscription Cancelled</h1>
          </div>
          
          <p style="font-size: 16px; line-height: 1.6;">Hi ${data.name},</p>
          
          <p style="font-size: 16px; line-height: 1.6;">Your EagleEye subscription has been cancelled as requested.</p>

          <div style="background: #172554; border: 1px solid #1e40af; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
            <p style="margin: 0; color: #93c5fd; font-size: 15px;">
              <strong>You still have access until</strong><br>
              <span style="font-size: 20px; font-weight: bold;">${data.accessUntil.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
            </p>
          </div>

          <p style="color: #a1a1aa; font-size: 15px; line-height: 1.6;">
            After this date, your account will switch to limited mode. Your data will be preserved for 30 days in case you decide to return.
          </p>

          <p style="font-size: 16px; line-height: 1.6;">Changed your mind?</p>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${baseUrl}/dashboard/billing" style="display: inline-block; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
              Reactivate Subscription →
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #27272a; margin: 32px 0;">

          <p style="color: #52525b; font-size: 13px; text-align: center; margin: 0;">
            We'd love your feedback on why you cancelled.<br>
            Reply to this email to let us know how we can improve.
          </p>
        </div>
      `,
    })
    return true
  } catch (error) {
    console.error('Failed to send cancellation email:', error)
    return false
  }
}

/**
 * Account deletion warning - sent 24 hours before deletion
 */
export async function sendAccountDeletionWarningEmail(data: { email: string; name: string; deletionDate: Date }): Promise<boolean> {
  const resend = getResend()
  if (!resend) return false

  const baseUrl = getBaseUrl()

  try {
    await resend.emails.send({
      from: 'EagleEye <hello@eagleeye.work>',
      to: data.email,
      subject: '🚨 URGENT: Your EagleEye account will be deleted tomorrow',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 20px; background: #0a0a0a; color: #fafafa;">
          <div style="text-align: center; margin-bottom: 32px;">
            <span style="font-size: 48px;">🚨</span>
            <h1 style="color: #ef4444; margin: 16px 0 0 0; font-size: 24px;">Account Deletion Warning</h1>
          </div>
          
          <p style="font-size: 16px; line-height: 1.6;">Hi ${data.name},</p>
          
          <p style="font-size: 16px; line-height: 1.6;">Your payment failed and we've been unable to charge your card. Your EagleEye account is scheduled for deletion.</p>

          <div style="background: #450a0a; border: 2px solid #dc2626; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
            <p style="margin: 0; color: #fca5a5; font-size: 15px;">
              <strong>Your account will be deleted on</strong><br>
              <span style="font-size: 24px; font-weight: bold; color: #ef4444;">${data.deletionDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
            </p>
          </div>

          <p style="font-size: 16px; line-height: 1.6; color: #fca5a5;">
            <strong>All your data will be permanently lost</strong>, including:
          </p>
          
          <ul style="color: #a1a1aa; line-height: 1.8; font-size: 15px;">
            <li>Integration connections (Asana, Linear, Slack, etc.)</li>
            <li>Historical insights and signals</li>
            <li>Notification preferences and settings</li>
          </ul>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${baseUrl}/dashboard/billing" style="display: inline-block; background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 18px;">
              Update Payment Now →
            </a>
          </div>

          <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6; text-align: center;">
            Having trouble? Reply to this email or contact <a href="mailto:support@eagleeye.work" style="color: #60a5fa;">support@eagleeye.work</a><br>
            We can help you restore access.
          </p>

          <hr style="border: none; border-top: 1px solid #27272a; margin: 32px 0;">

          <p style="color: #52525b; font-size: 13px; text-align: center; margin: 0;">
            This is an automated message. Your subscription will resume immediately once payment is successful.
          </p>
        </div>
      `,
    })
    return true
  } catch (error) {
    console.error('Failed to send account deletion warning email:', error)
    return false
  }
}

/**
 * Account deleted confirmation
 */
export async function sendAccountDeletedEmail(data: { email: string; name: string }): Promise<boolean> {
  const resend = getResend()
  if (!resend) return false

  const baseUrl = getBaseUrl()

  try {
    await resend.emails.send({
      from: 'EagleEye <hello@eagleeye.work>',
      to: data.email,
      subject: 'Your EagleEye account has been deleted',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 20px; background: #0a0a0a; color: #fafafa;">
          <div style="text-align: center; margin-bottom: 32px;">
            <span style="font-size: 32px;">👋</span>
            <h1 style="color: #71717a; margin: 16px 0 0 0; font-size: 24px;">Account Deleted</h1>
          </div>
          
          <p style="font-size: 16px; line-height: 1.6;">Hi ${data.name},</p>
          
          <p style="font-size: 16px; line-height: 1.6;">Your EagleEye account has been deleted due to payment failure.</p>

          <div style="background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <p style="margin: 0; color: #a1a1aa; font-size: 15px; line-height: 1.6;">
              All your data, integrations, and settings have been permanently removed from our systems.
            </p>
          </div>

          <p style="font-size: 16px; line-height: 1.6;">Want to come back? You're always welcome!</p>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${baseUrl}/signup" style="display: inline-block; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
              Start Fresh →
            </a>
          </div>

          <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6; text-align: center;">
            If you believe this was a mistake, contact <a href="mailto:support@eagleeye.work" style="color: #60a5fa;">support@eagleeye.work</a> within 7 days<br>
            and we may be able to help recover your account.
          </p>

          <hr style="border: none; border-top: 1px solid #27272a; margin: 32px 0;">

          <p style="color: #52525b; font-size: 13px; text-align: center; margin: 0;">
            Thank you for trying EagleEye. We hope to see you again!
          </p>
        </div>
      `,
    })
    return true
  } catch (error) {
    console.error('Failed to send account deleted email:', error)
    return false
  }
}
