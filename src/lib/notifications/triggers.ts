// Notification Trigger Service
// Called when important events occur to send push/realtime notifications

import { createClient } from '@supabase/supabase-js'
import { sendPushNotification, sendBlockerAlert, sendUrgentAlert, PushSubscription } from './web-push'
import { sendEmailDigest } from './email-digest'

// Use service role for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface NotificationEvent {
  type: 'blocker' | 'overdue' | 'urgent_mention' | 'escalation' | 'milestone'
  userId: string
  title: string
  body: string
  url?: string
  metadata?: Record<string, any>
}

/**
 * Check if user has realtime alerts enabled and trigger notifications
 */
export async function triggerRealtimeNotification(event: NotificationEvent): Promise<boolean> {
  try {
    // Get user's notification settings
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('email, notification_settings')
      .eq('id', event.userId)
      .single()

    if (profileError || !profile) {
      console.log('[NotificationTrigger] User not found:', event.userId)
      return false
    }

    const settings = profile.notification_settings as {
      realtimeAlertsEnabled?: boolean
      pushEnabled?: boolean
      realtimeChannels?: string[]
      emailEnabled?: boolean
    } | null

    // Check if realtime alerts are enabled
    if (!settings?.realtimeAlertsEnabled) {
      console.log('[NotificationTrigger] Realtime alerts disabled for user')
      return false
    }

    const channels = settings.realtimeChannels || ['email']
    let notificationSent = false

    // Send push notification if enabled
    if (settings.pushEnabled && channels.includes('push')) {
      const pushSent = await sendPushToUser(event.userId, event)
      notificationSent = notificationSent || pushSent
    }

    // Send email for realtime if enabled
    if (settings.emailEnabled && channels.includes('email')) {
      // For urgent events, send immediate email
      if (event.type === 'blocker' || event.type === 'escalation') {
        await sendUrgentEmail(profile.email, event)
        notificationSent = true
      }
    }

    // Log the notification
    await logNotification(event.userId, 'realtime', notificationSent ? 'sent' : 'skipped', {
      event_type: event.type,
      title: event.title,
    })

    return notificationSent
  } catch (error) {
    console.error('[NotificationTrigger] Error:', error)
    return false
  }
}

/**
 * Send push notification to all user's subscribed devices
 */
async function sendPushToUser(userId: string, event: NotificationEvent): Promise<boolean> {
  try {
    // Get all push subscriptions for user
    const { data: subscriptions, error } = await supabaseAdmin
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', userId)

    if (error || !subscriptions || subscriptions.length === 0) {
      console.log('[NotificationTrigger] No push subscriptions for user')
      return false
    }

    let anySent = false
    const expiredEndpoints: string[] = []

    // Send to all devices
    for (const sub of subscriptions) {
      const pushSub: PushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      }

      let success = false
      try {
        switch (event.type) {
          case 'blocker':
            success = await sendBlockerAlert(pushSub, event.title, event.body)
            break
          case 'escalation':
          case 'urgent_mention':
            success = await sendUrgentAlert(pushSub, event.title, event.body, event.url)
            break
          default:
            success = await sendPushNotification(pushSub, {
              title: event.title,
              body: event.body,
              url: event.url,
              urgency: event.type === 'overdue' ? 'high' : 'normal',
            })
        }
      } catch (err: any) {
        // If subscription is expired (410 Gone), mark for cleanup
        if (err?.statusCode === 410) {
          expiredEndpoints.push(sub.endpoint)
        }
      }

      if (success) anySent = true
    }

    // Clean up expired subscriptions
    if (expiredEndpoints.length > 0) {
      await supabaseAdmin
        .from('push_subscriptions')
        .delete()
        .eq('user_id', userId)
        .in('endpoint', expiredEndpoints)
      
      console.log('[NotificationTrigger] Cleaned up', expiredEndpoints.length, 'expired subscriptions')
    }

    return anySent
  } catch (error) {
    console.error('[NotificationTrigger] Push error:', error)
    return false
  }
}

/**
 * Send urgent email notification
 */
async function sendUrgentEmail(email: string, event: NotificationEvent): Promise<void> {
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)

  const emoji = event.type === 'blocker' ? '🚨' : event.type === 'escalation' ? '⚠️' : '📢'
  
  await resend.emails.send({
    from: 'EagleEye Alerts <alerts@eagleeye.work>',
    to: email,
    subject: `${emoji} ${event.title}`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <div style="background: #FEF2F2; border: 1px solid #FEE2E2; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h2 style="margin: 0 0 10px; color: #DC2626;">${emoji} ${event.title}</h2>
          <p style="margin: 0; color: #7F1D1D;">${event.body}</p>
        </div>
        ${event.url ? `
          <a href="${event.url}" style="display: inline-block; background: #2563EB; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">
            View in Dashboard →
          </a>
        ` : ''}
        <p style="margin-top: 20px; font-size: 12px; color: #9CA3AF;">
          Sent by EagleEye • <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings/notifications" style="color: #6B7280;">Manage alerts</a>
        </p>
      </body>
      </html>
    `,
    text: `${event.title}\n\n${event.body}\n\n${event.url ? `View: ${event.url}` : ''}`,
  })
}

/**
 * Trigger notification for a blocker detected
 */
export async function notifyBlockerDetected(
  userId: string,
  taskTitle: string,
  blockerReason: string,
  taskUrl?: string
): Promise<boolean> {
  return triggerRealtimeNotification({
    type: 'blocker',
    userId,
    title: 'Blocker Detected',
    body: `${taskTitle}: ${blockerReason}`,
    url: taskUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?filter=blockers`,
  })
}

/**
 * Trigger notification for overdue task
 */
export async function notifyTaskOverdue(
  userId: string,
  taskTitle: string,
  daysPast: number,
  taskUrl?: string
): Promise<boolean> {
  return triggerRealtimeNotification({
    type: 'overdue',
    userId,
    title: 'Task Overdue',
    body: `"${taskTitle}" is ${daysPast} day${daysPast > 1 ? 's' : ''} past due`,
    url: taskUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  })
}

/**
 * Trigger notification for urgent mention
 */
export async function notifyUrgentMention(
  userId: string,
  senderName: string,
  snippet: string,
  channelName?: string,
  messageUrl?: string
): Promise<boolean> {
  return triggerRealtimeNotification({
    type: 'urgent_mention',
    userId,
    title: `Urgent from ${senderName}`,
    body: channelName ? `in #${channelName}: ${snippet}` : snippet,
    url: messageUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  })
}

/**
 * Trigger notification for escalation
 */
export async function notifyEscalation(
  userId: string,
  title: string,
  description: string,
  url?: string
): Promise<boolean> {
  return triggerRealtimeNotification({
    type: 'escalation',
    userId,
    title: 'Escalation Alert',
    body: `${title}: ${description}`,
    url: url || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  })
}

/**
 * Log notification to database
 */
async function logNotification(
  userId: string,
  type: string,
  status: 'sent' | 'failed' | 'skipped',
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await supabaseAdmin
      .from('notification_log')
      .insert({
        user_id: userId,
        notification_type: type,
        status,
        metadata,
      })
  } catch (err) {
    console.error('[NotificationTrigger] Failed to log:', err)
  }
}

/**
 * Process work items and send notifications for blockers/overdue
 * Call this after syncing work items
 */
export async function processWorkItemNotifications(
  userId: string,
  items: Array<{
    id: string
    title: string
    is_blocked?: boolean
    due_date?: string
    url?: string
  }>
): Promise<{ blockers: number; overdue: number }> {
  const results = { blockers: 0, overdue: 0 }
  const now = new Date()

  for (const item of items) {
    // Check for blockers
    if (item.is_blocked) {
      const sent = await notifyBlockerDetected(userId, item.title, 'Task is blocked', item.url)
      if (sent) results.blockers++
    }

    // Check for overdue
    if (item.due_date) {
      const dueDate = new Date(item.due_date)
      if (dueDate < now) {
        const daysPast = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
        const sent = await notifyTaskOverdue(userId, item.title, daysPast, item.url)
        if (sent) results.overdue++
      }
    }
  }

  return results
}

/**
 * Process communication signals and send notifications for urgent mentions
 * Call this after syncing Slack/Teams messages
 */
export async function processSignalNotifications(
  userId: string,
  signals: Array<{
    id: string
    signal_type: string
    sender_name?: string
    snippet?: string
    channel_name?: string
    url?: string
  }>
): Promise<{ notified: number }> {
  let notified = 0

  for (const signal of signals) {
    if (signal.signal_type === 'urgent' || signal.signal_type === 'escalation') {
      const sent = await notifyUrgentMention(
        userId,
        signal.sender_name || 'Someone',
        signal.snippet || 'Needs your attention',
        signal.channel_name,
        signal.url
      )
      if (sent) notified++
    }
  }

  return { notified }
}
