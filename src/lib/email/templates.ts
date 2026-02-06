// Professional Email Templates for EagleEye
// All transactional emails sent via Resend

// Logo URL - hosted on our domain
const LOGO_URL = 'https://eagleeye.work/icon-512.png';

export const emailStyles = {
  container: `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    max-width: 600px;
    margin: 0 auto;
    background: #0a0a0a;
    color: #fafafa;
    border-radius: 16px;
    overflow: hidden;
  `,
  header: `
    background: linear-gradient(135deg, #0a0a0a 0%, #18181b 100%);
    padding: 40px 32px;
    text-align: center;
    border-bottom: 1px solid #27272a;
  `,
  logo: `
    color: #22d3ee;
    font-size: 32px;
    font-weight: bold;
    margin: 0 0 8px 0;
  `,
  tagline: `
    color: #71717a;
    font-size: 14px;
    margin: 0;
  `,
  body: `
    padding: 32px;
  `,
  title: `
    color: #fafafa;
    font-size: 24px;
    font-weight: 600;
    margin: 0 0 16px 0;
  `,
  text: `
    color: #a1a1aa;
    font-size: 16px;
    line-height: 1.6;
    margin: 0 0 16px 0;
  `,
  highlight: `
    background: #18181b;
    border-left: 4px solid #22d3ee;
    padding: 20px;
    border-radius: 0 8px 8px 0;
    margin: 24px 0;
  `,
  highlightLabel: `
    color: #71717a;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin: 0 0 8px 0;
  `,
  highlightValue: `
    color: #22d3ee;
    font-size: 20px;
    font-weight: 600;
    margin: 0;
  `,
  button: `
    display: inline-block;
    background: linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%);
    color: #0a0a0a;
    font-weight: 600;
    padding: 14px 32px;
    border-radius: 8px;
    text-decoration: none;
    margin: 24px 0;
  `,
  secondaryButton: `
    display: inline-block;
    background: transparent;
    color: #22d3ee;
    font-weight: 500;
    padding: 12px 24px;
    border: 1px solid #27272a;
    border-radius: 8px;
    text-decoration: none;
    margin: 8px 0;
  `,
  infoBox: `
    background: #18181b;
    border: 1px solid #27272a;
    border-radius: 8px;
    padding: 16px;
    margin: 16px 0;
  `,
  warningBox: `
    background: #451a03;
    border: 1px solid #92400e;
    border-radius: 8px;
    padding: 16px;
    margin: 16px 0;
  `,
  successBox: `
    background: #052e16;
    border: 1px solid #166534;
    border-radius: 8px;
    padding: 16px;
    margin: 16px 0;
  `,
  footer: `
    padding: 24px 32px;
    text-align: center;
    border-top: 1px solid #27272a;
    background: #09090b;
  `,
  footerText: `
    color: #52525b;
    font-size: 12px;
    margin: 0;
  `,
  footerLink: `
    color: #71717a;
    text-decoration: none;
  `,
}

// Base template wrapper
function baseTemplate(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 20px; background: #000;">
      <div style="${emailStyles.container}">
        <div style="${emailStyles.header}">
          <img src="${LOGO_URL}" alt="EagleEye" width="64" height="64" style="display: block; margin: 0 auto 12px auto; border-radius: 12px;" />
          <h1 style="${emailStyles.logo}">EagleEye</h1>
          <p style="${emailStyles.tagline}">Own the Signal. Master the Chaos.</p>
        </div>
        <div style="${emailStyles.body}">
          ${content}
        </div>
        <div style="${emailStyles.footer}">
          <p style="${emailStyles.footerText}">
            © ${new Date().getFullYear()} EagleEye • <a href="https://eagleeye.work" style="${emailStyles.footerLink}">eagleeye.work</a>
          </p>
          <p style="${emailStyles.footerText}; margin-top: 8px;">
            <a href="https://eagleeye.work/privacy" style="${emailStyles.footerLink}">Privacy Policy</a> • 
            <a href="https://eagleeye.work/terms" style="${emailStyles.footerLink}">Terms of Service</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

// ============================================
// WELCOME & ACTIVATION EMAIL
// ============================================
export function welcomeEmail(params: {
  userName?: string;
  confirmationLink: string;
}): { subject: string; html: string } {
  const { userName, confirmationLink } = params
  const greeting = userName ? `Hey ${userName}` : 'Welcome'
  
  return {
    subject: '🦅 Welcome to EagleEye - Activate Your Account',
    html: baseTemplate(`
      <h2 style="${emailStyles.title}">${greeting}, welcome to EagleEye!</h2>
      
      <p style="${emailStyles.text}">
        You're about to transform how you start your workday. No more drowning in notifications 
        from Slack, WhatsApp, Asana, and a dozen other apps. EagleEye brings it all together 
        into one focused daily brief.
      </p>
      
      <div style="${emailStyles.successBox}">
        <p style="color: #4ade80; margin: 0; font-weight: 500;">✓ Your account is ready</p>
        <p style="color: #86efac; margin: 8px 0 0 0; font-size: 14px;">
          Click the button below to activate your account and start your 7-day free trial.
        </p>
      </div>
      
      <div style="text-align: center;">
        <a href="${confirmationLink}" style="${emailStyles.button}">
          Activate My Account →
        </a>
      </div>
      
      <p style="${emailStyles.text}">
        <strong style="color: #fafafa;">What happens next?</strong>
      </p>
      
      <div style="${emailStyles.infoBox}">
        <p style="color: #fafafa; margin: 0 0 12px 0;">📱 <strong>Connect your tools</strong> (2 min)</p>
        <p style="color: #a1a1aa; margin: 0 0 16px 0; font-size: 14px;">
          Link WhatsApp Business, Slack, Asana, Jira, or any tools you use daily.
        </p>
        
        <p style="color: #fafafa; margin: 0 0 12px 0;">🎯 <strong>Set your priorities</strong> (1 min)</p>
        <p style="color: #a1a1aa; margin: 0 0 16px 0; font-size: 14px;">
          Tell us what matters most - we'll learn your patterns over time.
        </p>
        
        <p style="color: #fafafa; margin: 0 0 12px 0;">☀️ <strong>Get your first brief</strong></p>
        <p style="color: #a1a1aa; margin: 0; font-size: 14px;">
          Wake up to a clear, AI-powered summary of what needs your attention today.
        </p>
      </div>
      
      <p style="${emailStyles.text}; font-size: 14px; color: #71717a;">
        If the button doesn't work, copy and paste this link into your browser:<br>
        <a href="${confirmationLink}" style="color: #22d3ee; word-break: break-all;">${confirmationLink}</a>
      </p>
    `)
  }
}

// ============================================
// PAYMENT CONFIRMATION EMAIL
// ============================================
export function paymentConfirmationEmail(params: {
  userName?: string;
  planName: string;
  amount: string;
  loginLink: string;
}): { subject: string; html: string } {
  const { userName, planName, amount, loginLink } = params
  const greeting = userName ? `Hi ${userName}` : 'Hi there'
  
  return {
    subject: `🎉 Payment Confirmed - Welcome to EagleEye ${planName}!`,
    html: baseTemplate(`
      <h2 style="${emailStyles.title}">${greeting}, you're all set!</h2>
      
      <p style="${emailStyles.text}">
        Thank you for subscribing to EagleEye. Your payment has been processed successfully.
      </p>
      
      <div style="${emailStyles.highlight}">
        <p style="${emailStyles.highlightLabel}">Your Plan</p>
        <p style="${emailStyles.highlightValue}">${planName} - ${amount}/month</p>
      </div>
      
      <div style="${emailStyles.successBox}">
        <p style="color: #4ade80; margin: 0; font-weight: 500;">✓ Payment confirmed</p>
        <p style="color: #86efac; margin: 8px 0 0 0; font-size: 14px;">
          Your subscription is now active. Let's get you set up!
        </p>
      </div>
      
      <div style="text-align: center;">
        <a href="${loginLink}" style="${emailStyles.button}">
          Go to Dashboard →
        </a>
      </div>
      
      <p style="${emailStyles.text}">
        <strong style="color: #fafafa;">Quick start checklist:</strong>
      </p>
      
      <div style="${emailStyles.infoBox}">
        <p style="color: #a1a1aa; margin: 0 0 8px 0;">☐ Connect your first integration (Slack, WhatsApp, Asana...)</p>
        <p style="color: #a1a1aa; margin: 0 0 8px 0;">☐ Set your preferred brief time</p>
        <p style="color: #a1a1aa; margin: 0;">☐ Configure notification preferences</p>
      </div>
      
      <p style="${emailStyles.text}; font-size: 14px;">
        Questions? Just reply to this email or reach out at 
        <a href="mailto:support@eagleeye.work" style="color: #22d3ee;">support@eagleeye.work</a>
      </p>
    `)
  }
}

// ============================================
// SUPPORT TICKET CONFIRMATION EMAIL
// ============================================
export function supportTicketConfirmationEmail(params: {
  ticketId: string;
  subject: string;
  userName?: string;
}): { subject: string; html: string } {
  const { ticketId, subject: ticketSubject, userName } = params
  const greeting = userName ? `Hi ${userName}` : 'Hi there'
  
  return {
    subject: `[${ticketId}] We received your support request`,
    html: baseTemplate(`
      <h2 style="${emailStyles.title}">${greeting}, we've got your message!</h2>
      
      <p style="${emailStyles.text}">
        Thank you for reaching out to EagleEye Support. We've received your request and 
        our team will get back to you as soon as possible.
      </p>
      
      <div style="${emailStyles.highlight}">
        <p style="${emailStyles.highlightLabel}">Ticket ID</p>
        <p style="${emailStyles.highlightValue}">${ticketId}</p>
      </div>
      
      <div style="${emailStyles.infoBox}">
        <p style="color: #71717a; margin: 0 0 4px 0; font-size: 12px;">SUBJECT</p>
        <p style="color: #fafafa; margin: 0;">${ticketSubject}</p>
      </div>
      
      <div style="${emailStyles.infoBox}">
        <p style="color: #fafafa; margin: 0 0 8px 0;">⏱️ <strong>Expected Response Time</strong></p>
        <p style="color: #a1a1aa; margin: 0;">
          We typically respond within <strong style="color: #22d3ee;">24-48 hours</strong> during business days.
          For urgent issues, we aim to respond even faster.
        </p>
      </div>
      
      <p style="${emailStyles.text}">
        <strong style="color: #fafafa;">While you wait:</strong>
      </p>
      
      <ul style="color: #a1a1aa; padding-left: 20px; margin: 0 0 24px 0;">
        <li style="margin-bottom: 8px;">Check our <a href="https://eagleeye.work/dashboard/support" style="color: #22d3ee;">Help Center</a> for common solutions</li>
        <li style="margin-bottom: 8px;">Reply to this email to add more details to your ticket</li>
        <li>Reference your ticket ID (${ticketId}) in all communications</li>
      </ul>
      
      <p style="${emailStyles.text}; font-size: 14px; color: #71717a;">
        Thank you for your patience. We're here to help!
      </p>
    `)
  }
}

// ============================================
// SUPPORT TICKET NOTIFICATION (TO ADMIN)
// ============================================
export function supportTicketAdminEmail(params: {
  ticketId: string;
  subject: string;
  message: string;
  userEmail: string;
  userName?: string;
}): { subject: string; html: string } {
  const { ticketId, subject: ticketSubject, message, userEmail, userName } = params
  
  return {
    subject: `[SUPPORT] ${ticketId} - ${ticketSubject}`,
    html: baseTemplate(`
      <h2 style="${emailStyles.title}">🎫 New Support Ticket</h2>
      
      <div style="${emailStyles.highlight}">
        <p style="${emailStyles.highlightLabel}">Ticket ID</p>
        <p style="${emailStyles.highlightValue}">${ticketId}</p>
      </div>
      
      <div style="${emailStyles.infoBox}">
        <p style="color: #71717a; margin: 0 0 4px 0; font-size: 12px;">FROM</p>
        <p style="color: #fafafa; margin: 0;">${userName || 'User'} &lt;${userEmail}&gt;</p>
      </div>
      
      <div style="${emailStyles.infoBox}">
        <p style="color: #71717a; margin: 0 0 4px 0; font-size: 12px;">SUBJECT</p>
        <p style="color: #fafafa; margin: 0;">${ticketSubject}</p>
      </div>
      
      <div style="${emailStyles.infoBox}">
        <p style="color: #71717a; margin: 0 0 4px 0; font-size: 12px;">MESSAGE</p>
        <p style="color: #fafafa; margin: 0; white-space: pre-wrap;">${message}</p>
      </div>
      
      <p style="${emailStyles.text}; font-size: 14px; color: #71717a;">
        Reply directly to this email to respond to the customer.
      </p>
    `)
  }
}

// ============================================
// INTEGRATION CONNECTED EMAIL
// ============================================
export function integrationConnectedEmail(params: {
  integrationName: string;
  userName?: string;
}): { subject: string; html: string } {
  const { integrationName, userName } = params
  const greeting = userName ? `Hi ${userName}` : 'Hi there'
  
  return {
    subject: `✅ ${integrationName} connected to EagleEye`,
    html: baseTemplate(`
      <h2 style="${emailStyles.title}">${greeting}, ${integrationName} is connected!</h2>
      
      <div style="${emailStyles.successBox}">
        <p style="color: #4ade80; margin: 0; font-weight: 500;">✓ Integration Active</p>
        <p style="color: #86efac; margin: 8px 0 0 0; font-size: 14px;">
          Your ${integrationName} account is now linked to EagleEye.
        </p>
      </div>
      
      <p style="${emailStyles.text}">
        EagleEye will now include signals from ${integrationName} in your daily brief. 
        This means you'll never miss important messages, tasks, or updates.
      </p>
      
      <div style="${emailStyles.infoBox}">
        <p style="color: #fafafa; margin: 0 0 12px 0;">📊 <strong>What we'll track:</strong></p>
        <ul style="color: #a1a1aa; margin: 0; padding-left: 20px;">
          <li>New messages and mentions</li>
          <li>Urgent or time-sensitive items</li>
          <li>Tasks assigned to you</li>
          <li>Updates on items you're following</li>
        </ul>
      </div>
      
      <div style="text-align: center;">
        <a href="https://eagleeye.work/dashboard/integrations" style="${emailStyles.secondaryButton}">
          Manage Integrations
        </a>
      </div>
    `)
  }
}

// ============================================
// INTEGRATION DISCONNECTED EMAIL
// ============================================
export function integrationDisconnectedEmail(params: {
  integrationName: string;
  userName?: string;
  reason?: string;
}): { subject: string; html: string } {
  const { integrationName, userName, reason } = params
  const greeting = userName ? `Hi ${userName}` : 'Hi there'
  
  return {
    subject: `⚠️ ${integrationName} disconnected from EagleEye`,
    html: baseTemplate(`
      <h2 style="${emailStyles.title}">${greeting}, heads up about your integration</h2>
      
      <div style="${emailStyles.warningBox}">
        <p style="color: #fbbf24; margin: 0; font-weight: 500;">⚠️ Integration Disconnected</p>
        <p style="color: #fcd34d; margin: 8px 0 0 0; font-size: 14px;">
          Your ${integrationName} integration has been disconnected.
        </p>
      </div>
      
      ${reason ? `
        <div style="${emailStyles.infoBox}">
          <p style="color: #71717a; margin: 0 0 4px 0; font-size: 12px;">REASON</p>
          <p style="color: #fafafa; margin: 0;">${reason}</p>
        </div>
      ` : ''}
      
      <p style="${emailStyles.text}">
        Your daily brief will no longer include updates from ${integrationName} until you reconnect it.
        This might have happened because:
      </p>
      
      <ul style="color: #a1a1aa; padding-left: 20px; margin: 0 0 24px 0;">
        <li style="margin-bottom: 8px;">You manually disconnected it</li>
        <li style="margin-bottom: 8px;">Your access token expired</li>
        <li style="margin-bottom: 8px;">Permissions were revoked in ${integrationName}</li>
        <li>There was an authentication error</li>
      </ul>
      
      <div style="text-align: center;">
        <a href="https://eagleeye.work/dashboard/integrations" style="${emailStyles.button}">
          Reconnect ${integrationName} →
        </a>
      </div>
      
      <p style="${emailStyles.text}; font-size: 14px; color: #71717a;">
        Need help? Contact us at <a href="mailto:support@eagleeye.work" style="color: #22d3ee;">support@eagleeye.work</a>
      </p>
    `)
  }
}

// ============================================
// INTEGRATION FAILED EMAIL
// ============================================
export function integrationFailedEmail(params: {
  integrationName: string;
  userName?: string;
  errorDetails?: string;
}): { subject: string; html: string } {
  const { integrationName, userName, errorDetails } = params
  const greeting = userName ? `Hi ${userName}` : 'Hi there'
  
  return {
    subject: `🔴 ${integrationName} sync failed - Action required`,
    html: baseTemplate(`
      <h2 style="${emailStyles.title}">${greeting}, there's an issue with ${integrationName}</h2>
      
      <div style="${emailStyles.warningBox}">
        <p style="color: #f87171; margin: 0; font-weight: 500;">🔴 Sync Failed</p>
        <p style="color: #fca5a5; margin: 8px 0 0 0; font-size: 14px;">
          We couldn't sync your ${integrationName} data. Your daily brief may be incomplete.
        </p>
      </div>
      
      ${errorDetails ? `
        <div style="${emailStyles.infoBox}">
          <p style="color: #71717a; margin: 0 0 4px 0; font-size: 12px;">ERROR DETAILS</p>
          <p style="color: #fafafa; margin: 0; font-family: monospace; font-size: 13px;">${errorDetails}</p>
        </div>
      ` : ''}
      
      <p style="${emailStyles.text}">
        <strong style="color: #fafafa;">How to fix this:</strong>
      </p>
      
      <div style="${emailStyles.infoBox}">
        <p style="color: #fafafa; margin: 0 0 12px 0;">1️⃣ <strong>Try reconnecting</strong></p>
        <p style="color: #a1a1aa; margin: 0 0 16px 0; font-size: 14px;">
          Disconnect and reconnect the integration to refresh your credentials.
        </p>
        
        <p style="color: #fafafa; margin: 0 0 12px 0;">2️⃣ <strong>Check permissions</strong></p>
        <p style="color: #a1a1aa; margin: 0 0 16px 0; font-size: 14px;">
          Make sure EagleEye still has the required permissions in ${integrationName}.
        </p>
        
        <p style="color: #fafafa; margin: 0 0 12px 0;">3️⃣ <strong>Contact support</strong></p>
        <p style="color: #a1a1aa; margin: 0; font-size: 14px;">
          If the problem persists, we're here to help.
        </p>
      </div>
      
      <div style="text-align: center;">
        <a href="https://eagleeye.work/dashboard/integrations" style="${emailStyles.button}">
          Check Integration →
        </a>
      </div>
    `)
  }
}

// ============================================
// TRIAL ENDING REMINDER EMAIL
// ============================================
export function trialEndingEmail(params: {
  userName?: string;
  daysRemaining: number;
  upgradeLink: string;
}): { subject: string; html: string } {
  const { userName, daysRemaining, upgradeLink } = params
  const greeting = userName ? `Hi ${userName}` : 'Hi there'
  const urgency = daysRemaining <= 1 ? '⏰' : '📅'
  
  return {
    subject: `${urgency} Your EagleEye trial ends in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`,
    html: baseTemplate(`
      <h2 style="${emailStyles.title}">${greeting}, your trial is ending soon!</h2>
      
      <div style="${emailStyles.highlight}">
        <p style="${emailStyles.highlightLabel}">Trial Ends In</p>
        <p style="${emailStyles.highlightValue}">${daysRemaining} day${daysRemaining === 1 ? '' : 's'}</p>
      </div>
      
      <p style="${emailStyles.text}">
        We hope you've been enjoying your focused, AI-powered daily briefs! 
        To keep getting your personalized summaries without interruption, 
        upgrade to a paid plan before your trial ends.
      </p>
      
      <div style="${emailStyles.infoBox}">
        <p style="color: #fafafa; margin: 0 0 12px 0;"><strong>What you'll lose if you don't upgrade:</strong></p>
        <ul style="color: #a1a1aa; margin: 0; padding-left: 20px;">
          <li>Daily AI-powered briefs</li>
          <li>Integration syncing</li>
          <li>Audio brief feature</li>
          <li>Priority signals detection</li>
        </ul>
      </div>
      
      <div style="text-align: center;">
        <a href="${upgradeLink}" style="${emailStyles.button}">
          Upgrade Now →
        </a>
      </div>
      
      <p style="${emailStyles.text}; font-size: 14px; color: #71717a;">
        Questions about pricing? Reply to this email and we'll help you find the right plan.
      </p>
    `)
  }
}

// ============================================
// SUBSCRIPTION CANCELLED EMAIL
// ============================================
export function subscriptionCancelledEmail(params: {
  userName?: string;
}): { subject: string; html: string } {
  const { userName } = params
  const greeting = userName ? `Hi ${userName}` : 'Hi there'
  
  return {
    subject: `We're sorry to see you go 💔`,
    html: baseTemplate(`
      <h2 style="${emailStyles.title}">${greeting}, your subscription has been cancelled</h2>
      
      <p style="${emailStyles.text}">
        Your EagleEye subscription has been cancelled and your data has been removed. 
        We're sad to see you go, but we understand.
      </p>
      
      <div style="${emailStyles.infoBox}">
        <p style="color: #fafafa; margin: 0 0 12px 0;"><strong>What's been removed:</strong></p>
        <ul style="color: #a1a1aa; margin: 0; padding-left: 20px;">
          <li>All integration connections</li>
          <li>Your signals and brief history</li>
          <li>Account settings and preferences</li>
        </ul>
      </div>
      
      <p style="${emailStyles.text}">
        If you change your mind, you're always welcome back! Just sign up again at 
        <a href="https://eagleeye.work" style="color: #22d3ee;">eagleeye.work</a>.
      </p>
      
      <p style="${emailStyles.text}; color: #71717a;">
        We'd love to know why you left. If you have a moment, reply to this email 
        with any feedback - it helps us improve.
      </p>
      
      <p style="${emailStyles.text}">
        Thank you for trying EagleEye. We hope to see you again!
      </p>
    `)
  }
}
