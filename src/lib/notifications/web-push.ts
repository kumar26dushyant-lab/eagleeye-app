// Web Push Notifications - Works in browsers (no app needed!)
// Uses Service Workers for background notifications

import webpush from 'web-push'

// VAPID keys for web push - generate these once and keep them
// In production: Store in environment variables
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:hello@eagleeye.app'

// Configure web-push if keys are available
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
}

export interface PushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export interface PushNotification {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  url?: string
  urgency?: 'very-low' | 'low' | 'normal' | 'high'
}

/**
 * Send a push notification to a subscribed browser
 */
export async function sendPushNotification(
  subscription: PushSubscription,
  notification: PushNotification
): Promise<boolean> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn('[WebPush] VAPID keys not configured')
    return false
  }

  try {
    const payload = JSON.stringify({
      title: notification.title,
      body: notification.body,
      icon: notification.icon || '/icon-192.png',
      badge: notification.badge || '/badge-72.png',
      tag: notification.tag || 'eagleeye-notification',
      data: {
        url: notification.url || '/dashboard',
      },
    })

    await webpush.sendNotification(subscription, payload, {
      urgency: notification.urgency || 'normal',
    })

    console.log('[WebPush] Notification sent successfully')
    return true
  } catch (error: any) {
    console.error('[WebPush] Failed to send notification:', error)
    
    // If subscription is no longer valid, return false so we can clean up
    if (error.statusCode === 410) {
      console.log('[WebPush] Subscription expired or unsubscribed')
      return false
    }
    
    throw error
  }
}

/**
 * Send urgent alert notification
 */
export async function sendUrgentAlert(
  subscription: PushSubscription,
  title: string,
  body: string,
  url?: string
): Promise<boolean> {
  return sendPushNotification(subscription, {
    title,
    body,
    urgency: 'high',
    tag: 'urgent-alert',
    url,
  })
}

/**
 * Send blocker detected notification
 */
export async function sendBlockerAlert(
  subscription: PushSubscription,
  taskTitle: string,
  blockerReason: string
): Promise<boolean> {
  return sendPushNotification(subscription, {
    title: '🚨 Blocker Detected',
    body: `${taskTitle}: ${blockerReason}`,
    urgency: 'high',
    tag: 'blocker-alert',
    url: '/dashboard?filter=blockers',
  })
}

/**
 * Generate VAPID keys (run once to set up)
 */
export function generateVAPIDKeys(): { publicKey: string; privateKey: string } {
  const keys = webpush.generateVAPIDKeys()
  return {
    publicKey: keys.publicKey,
    privateKey: keys.privateKey,
  }
}

/**
 * Get public key for client-side subscription
 */
export function getPublicVAPIDKey(): string {
  return VAPID_PUBLIC_KEY
}
