'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Mail, MessageSquare, Bell, Clock, Check, Loader2, Smartphone, Globe, Send, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

interface NotificationSettings {
  // Email digest
  emailEnabled: boolean
  emailFrequency: 'daily' | 'weekly' | 'realtime'
  emailTime: string // "09:00"
  
  // Slack DM
  slackDMEnabled: boolean
  slackDMFrequency: 'daily' | 'weekly' | 'realtime'
  slackDMTime: string
  
  // Real-time alerts
  realtimeAlertsEnabled: boolean
  realtimeChannels: ('email' | 'slack' | 'push')[]
  
  // Timezone
  timezone: string
}

const DEFAULT_SETTINGS: NotificationSettings = {
  emailEnabled: true,
  emailFrequency: 'daily',
  emailTime: '09:00',
  slackDMEnabled: false,
  slackDMFrequency: 'daily',
  slackDMTime: '09:00',
  realtimeAlertsEnabled: false,
  realtimeChannels: ['email'],
  timezone: 'UTC',
}

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    // Detect timezone
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone
      setSettings(s => ({ ...s, timezone: detected }))
    } catch {}
    
    // Load saved settings
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/settings/notifications')
      if (res.ok) {
        const data = await res.json()
        if (data.settings) {
          setSettings({ ...DEFAULT_SETTINGS, ...data.settings })
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveSettings = async () => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      })
      
      if (res.ok) {
        toast.success('Notification preferences saved!')
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      toast.error('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  // Preview email digest in new tab
  const previewEmailDigest = () => {
    window.open('/api/notifications/test-email', '_blank')
  }

  // Send test email
  const [sendingTest, setSendingTest] = useState(false)
  const sendTestEmail = async () => {
    const email = prompt('Enter email to send test digest:')
    if (!email) return
    
    setSendingTest(true)
    try {
      const res = await fetch('/api/notifications/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      
      if (data.success) {
        toast.success(`Test email sent to ${email}`)
      } else if (data.setup) {
        toast.error('Email service not configured yet')
        console.log('Setup instructions:', data.setup)
      } else {
        toast.error(data.error || 'Failed to send test email')
      }
    } catch (error) {
      toast.error('Failed to send test email')
    } finally {
      setSendingTest(false)
    }
  }

  // Request push notification permission
  const [pushEnabled, setPushEnabled] = useState(false)
  const enablePushNotifications = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      toast.error('Push notifications are not supported in this browser')
      return
    }

    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js')
      
      // Request permission
      const permission = await Notification.requestPermission()
      
      if (permission !== 'granted') {
        toast.error('Notification permission denied')
        return
      }

      // Get push subscription
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      })

      // Save subscription to server
      await fetch('/api/notifications/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      })

      setPushEnabled(true)
      toast.success('Push notifications enabled!')
    } catch (error: any) {
      console.error('Push setup error:', error)
      if (error.message?.includes('applicationServerKey')) {
        toast.error('Push notifications not configured. VAPID keys needed.')
      } else {
        toast.error('Failed to enable push notifications')
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Notification Preferences</h1>
            <p className="text-sm text-muted-foreground">
              Choose how EagleEye reaches you
            </p>
          </div>
        </div>

        {/* Key message */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4 mb-8"
        >
          <p className="text-sm">
            <strong>💡 No need to check another tool!</strong><br />
            EagleEye sends your brief directly to your email or Slack.
            Open the dashboard only when you want to dig deeper.
          </p>
        </motion.div>

        {/* Email Digest */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-lg p-6 mb-4"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Mail className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <h2 className="font-semibold">Email Digest</h2>
                <p className="text-sm text-muted-foreground">
                  Receive your brief in your inbox
                </p>
              </div>
            </div>
            <Switch
              checked={settings.emailEnabled}
              onCheckedChange={(checked) => 
                setSettings(s => ({ ...s, emailEnabled: checked }))
              }
            />
          </div>
          
          {settings.emailEnabled && (
            <div className="space-y-4 pt-4 border-t border-border">
              <div>
                <label className="text-sm font-medium mb-2 block">Frequency</label>
                <div className="flex gap-2">
                  {(['daily', 'weekly'] as const).map((freq) => (
                    <button
                      key={freq}
                      onClick={() => setSettings(s => ({ ...s, emailFrequency: freq }))}
                      className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                        settings.emailFrequency === freq
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      {freq.charAt(0).toUpperCase() + freq.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Delivery Time</label>
                <select
                  value={settings.emailTime}
                  onChange={(e) => setSettings(s => ({ ...s, emailTime: e.target.value }))}
                  className="w-full p-2 rounded-lg border border-border bg-background"
                >
                  <option value="06:00">6:00 AM</option>
                  <option value="07:00">7:00 AM</option>
                  <option value="08:00">8:00 AM</option>
                  <option value="09:00">9:00 AM (recommended)</option>
                  <option value="10:00">10:00 AM</option>
                  <option value="18:00">6:00 PM</option>
                  <option value="21:00">9:00 PM</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Times shown in {settings.timezone}
                </p>
              </div>

              {/* Test buttons */}
              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={previewEmailDigest}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview Email
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={sendTestEmail}
                  disabled={sendingTest}
                >
                  {sendingTest ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Send Test
                </Button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Browser Push Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="bg-card border border-border rounded-lg p-6 mb-4"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Bell className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <h2 className="font-semibold">Browser Push Notifications</h2>
                <p className="text-sm text-muted-foreground">
                  Get alerts even when EagleEye is closed
                </p>
              </div>
            </div>
            {pushEnabled ? (
              <span className="flex items-center gap-1 text-green-500 text-sm">
                <Check className="h-4 w-4" />
                Enabled
              </span>
            ) : (
              <Button size="sm" onClick={enablePushNotifications}>
                Enable
              </Button>
            )}
          </div>
          
          <div className="bg-muted rounded-lg p-3">
            <p className="text-sm text-muted-foreground">
              🔔 <strong>No app needed!</strong> Browser notifications work on desktop Chrome, Firefox, Safari, and Edge. 
              You&apos;ll get instant alerts for blockers and urgent items.
            </p>
          </div>
        </motion.div>

        {/* Slack DM */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card border border-border rounded-lg p-6 mb-4"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <MessageSquare className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <h2 className="font-semibold">Slack DM</h2>
                <p className="text-sm text-muted-foreground">
                  Get briefs right in Slack where you work
                </p>
              </div>
            </div>
            <Switch
              checked={settings.slackDMEnabled}
              onCheckedChange={(checked) => 
                setSettings(s => ({ ...s, slackDMEnabled: checked }))
              }
            />
          </div>
          
          {settings.slackDMEnabled && (
            <div className="space-y-4 pt-4 border-t border-border">
              <div>
                <label className="text-sm font-medium mb-2 block">Frequency</label>
                <div className="flex gap-2">
                  {(['daily', 'weekly'] as const).map((freq) => (
                    <button
                      key={freq}
                      onClick={() => setSettings(s => ({ ...s, slackDMFrequency: freq }))}
                      className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                        settings.slackDMFrequency === freq
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      {freq.charAt(0).toUpperCase() + freq.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="bg-muted rounded-lg p-3">
                <p className="text-sm text-muted-foreground">
                  💬 EagleEye bot will send you a DM in your connected Slack workspace.
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Real-time Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-lg p-6 mb-8"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <Bell className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h2 className="font-semibold">Real-time Alerts</h2>
                <p className="text-sm text-muted-foreground">
                  Instant notification for urgent items only
                </p>
              </div>
            </div>
            <Switch
              checked={settings.realtimeAlertsEnabled}
              onCheckedChange={(checked) => 
                setSettings(s => ({ ...s, realtimeAlertsEnabled: checked }))
              }
            />
          </div>
          
          {settings.realtimeAlertsEnabled && (
            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground mb-3">
                You'll be notified immediately when:
              </p>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <span className="text-red-500">●</span>
                  A blocker is detected
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-orange-500">●</span>
                  Task becomes overdue
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-500">●</span>
                  Urgent @mention
                </li>
              </ul>
            </div>
          )}
        </motion.div>

        {/* Save button */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" asChild>
            <Link href="/dashboard">Cancel</Link>
          </Button>
          <Button onClick={saveSettings} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Save Preferences
              </>
            )}
          </Button>
        </div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-12 text-center border-t border-border pt-8"
        >
          <h3 className="font-semibold mb-4">How EagleEye Reaches You</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="p-4 bg-muted rounded-lg">
              <Mail className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <p className="font-medium">Email</p>
              <p className="text-xs text-muted-foreground">Check your inbox</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <MessageSquare className="h-6 w-6 mx-auto mb-2 text-purple-500" />
              <p className="font-medium">Slack DM</p>
              <p className="text-xs text-muted-foreground">In your workspace</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <Globe className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <p className="font-medium">Dashboard</p>
              <p className="text-xs text-muted-foreground">For deep dives</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            🎯 Most founders use <strong>Email (Daily)</strong> + <strong>Dashboard when needed</strong>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
