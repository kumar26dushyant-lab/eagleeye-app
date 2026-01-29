// Service Worker for Push Notifications
// This enables browser notifications even when the app is closed

const CACHE_NAME = 'eagleeye-v1'

// Listen for push events
self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()
  
  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/badge-72.png',
    tag: data.tag || 'eagleeye-notification',
    data: data.data || {},
    vibrate: [200, 100, 200],
    requireInteraction: data.urgency === 'high',
    actions: [
      { action: 'open', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'dismiss') return

  const url = event.notification.data?.url || '/dashboard'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If there's already a window open, focus it
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(url)
            return client.focus()
          }
        }
        // Otherwise open a new window
        if (clients.openWindow) {
          return clients.openWindow(url)
        }
      })
  )
})

// Handle subscription change (browser renewed subscription)
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    self.registration.pushManager.subscribe(event.oldSubscription.options)
      .then((subscription) => {
        // Send new subscription to server
        return fetch('/api/notifications/subscription', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            oldEndpoint: event.oldSubscription?.endpoint,
            newSubscription: subscription.toJSON(),
          }),
        })
      })
  )
})

// Basic service worker lifecycle
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker installing')
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activated')
  event.waitUntil(clients.claim())
})
