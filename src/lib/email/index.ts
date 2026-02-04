// Email Service - Centralized email sending with Resend
import { Resend } from 'resend'
import * as templates from './templates'

let resend: Resend | null = null

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY)
  }
  return resend
}

type SendEmailResult = {
  success: boolean
  messageId?: string
  error?: string
}

// Base send function
async function sendEmail(params: {
  to: string | string[]
  subject: string
  html: string
  from?: string
  replyTo?: string
}): Promise<SendEmailResult> {
  const client = getResend()
  
  if (!client) {
    console.error('[Email] Resend not configured')
    return { success: false, error: 'Email service not configured' }
  }
  
  try {
    const result = await client.emails.send({
      from: params.from || 'EagleEye <noreply@eagleeye.work>',
      to: Array.isArray(params.to) ? params.to : [params.to],
      subject: params.subject,
      html: params.html,
      replyTo: params.replyTo,
    })
    
    console.log('[Email] Sent successfully:', { to: params.to, subject: params.subject })
    return { success: true, messageId: result.data?.id }
  } catch (error: any) {
    console.error('[Email] Failed to send:', error?.message || error)
    return { success: false, error: error?.message || 'Failed to send email' }
  }
}

// ============================================
// HIGH-LEVEL EMAIL FUNCTIONS
// ============================================

export async function sendWelcomeEmail(params: {
  to: string
  userName?: string
  confirmationLink: string
}): Promise<SendEmailResult> {
  const { subject, html } = templates.welcomeEmail({
    userName: params.userName,
    confirmationLink: params.confirmationLink,
  })
  
  return sendEmail({
    to: params.to,
    subject,
    html,
  })
}

export async function sendPaymentConfirmationEmail(params: {
  to: string
  userName?: string
  planName: string
  amount: string
  loginLink?: string
}): Promise<SendEmailResult> {
  const { subject, html } = templates.paymentConfirmationEmail({
    userName: params.userName,
    planName: params.planName,
    amount: params.amount,
    loginLink: params.loginLink || 'https://eagleeye.work/login',
  })
  
  return sendEmail({
    to: params.to,
    subject,
    html,
    from: 'EagleEye <billing@eagleeye.work>',
  })
}

export async function sendSupportTicketConfirmation(params: {
  to: string
  ticketId: string
  subject: string
  userName?: string
}): Promise<SendEmailResult> {
  const { subject: emailSubject, html } = templates.supportTicketConfirmationEmail({
    ticketId: params.ticketId,
    subject: params.subject,
    userName: params.userName,
  })
  
  return sendEmail({
    to: params.to,
    subject: emailSubject,
    html,
    from: 'EagleEye Support <support@eagleeye.work>',
    replyTo: 'support@eagleeye.work',
  })
}

export async function sendSupportTicketToAdmin(params: {
  ticketId: string
  subject: string
  message: string
  userEmail: string
  userName?: string
}): Promise<SendEmailResult> {
  const adminEmail = process.env.SUPPORT_EMAIL || 'kumar26.dushyant@gmail.com'
  const { subject: emailSubject, html } = templates.supportTicketAdminEmail({
    ticketId: params.ticketId,
    subject: params.subject,
    message: params.message,
    userEmail: params.userEmail,
    userName: params.userName,
  })
  
  return sendEmail({
    to: adminEmail,
    subject: emailSubject,
    html,
    from: 'EagleEye Support <support@eagleeye.work>',
    replyTo: params.userEmail,
  })
}

export async function sendIntegrationConnectedEmail(params: {
  to: string
  integrationName: string
  userName?: string
}): Promise<SendEmailResult> {
  const { subject, html } = templates.integrationConnectedEmail({
    integrationName: params.integrationName,
    userName: params.userName,
  })
  
  return sendEmail({
    to: params.to,
    subject,
    html,
  })
}

export async function sendIntegrationDisconnectedEmail(params: {
  to: string
  integrationName: string
  userName?: string
  reason?: string
}): Promise<SendEmailResult> {
  const { subject, html } = templates.integrationDisconnectedEmail({
    integrationName: params.integrationName,
    userName: params.userName,
    reason: params.reason,
  })
  
  return sendEmail({
    to: params.to,
    subject,
    html,
  })
}

export async function sendIntegrationFailedEmail(params: {
  to: string
  integrationName: string
  userName?: string
  errorDetails?: string
}): Promise<SendEmailResult> {
  const { subject, html } = templates.integrationFailedEmail({
    integrationName: params.integrationName,
    userName: params.userName,
    errorDetails: params.errorDetails,
  })
  
  return sendEmail({
    to: params.to,
    subject,
    html,
  })
}

export async function sendTrialEndingEmail(params: {
  to: string
  userName?: string
  daysRemaining: number
  upgradeLink?: string
}): Promise<SendEmailResult> {
  const { subject, html } = templates.trialEndingEmail({
    userName: params.userName,
    daysRemaining: params.daysRemaining,
    upgradeLink: params.upgradeLink || 'https://eagleeye.work/pricing',
  })
  
  return sendEmail({
    to: params.to,
    subject,
    html,
  })
}

export async function sendSubscriptionCancelledEmail(params: {
  to: string
  userName?: string
}): Promise<SendEmailResult> {
  const { subject, html } = templates.subscriptionCancelledEmail({
    userName: params.userName,
  })
  
  return sendEmail({
    to: params.to,
    subject,
    html,
    from: 'EagleEye <billing@eagleeye.work>',
  })
}
