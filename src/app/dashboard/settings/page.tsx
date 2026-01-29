'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Save } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { ModeSelector } from '@/components/dashboard/ModeSelector'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { UserSettings, IntentMode } from '@/types'

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings')
      const data = await res.json()
      setSettings(data.settings)
    } catch {
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!settings) return
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (res.ok) {
        toast.success('Settings saved')
      } else {
        toast.error('Failed to save settings')
      }
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings((prev: UserSettings | null) => prev ? { ...prev, [key]: value } : null)
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between"
      >
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Customize how EagleEye works for you.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Changes
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        {/* Intent Mode */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base">Intent Mode</CardTitle>
            <CardDescription>
              Set your current mode to control how many items are surfaced.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ModeSelector
              mode={(settings?.default_intent_mode as IntentMode) || 'calm'}
              onModeChange={(mode) => updateSetting('default_intent_mode', mode)}
            />
            <div className="mt-4 text-sm text-muted-foreground">
              <p>🧘 <strong>Calm:</strong> Critical only</p>
              <p>🚶 <strong>On-the-Go:</strong> Quick summary</p>
              <p>💼 <strong>Work:</strong> Full context</p>
              <p>🎯 <strong>Focus:</strong> Blockers only</p>
            </div>
          </CardContent>
        </Card>

        {/* Brief Settings */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base">Daily Brief</CardTitle>
            <CardDescription>
              Configure your daily brief delivery.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Audio Brief</p>
                <p className="text-sm text-muted-foreground">Generate audio version of brief</p>
              </div>
              <Switch
                checked={settings?.audio_enabled ?? true}
                onCheckedChange={(checked) => updateSetting('audio_enabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Digest</p>
                <p className="text-sm text-muted-foreground">Receive daily email summary</p>
              </div>
              <Switch
                checked={settings?.email_digest ?? false}
                onCheckedChange={(checked) => updateSetting('email_digest', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-muted-foreground">Enable push notifications</p>
              </div>
              <Switch
                checked={settings?.push_enabled ?? false}
                onCheckedChange={(checked) => updateSetting('push_enabled', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Max Items */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base">Brief Limits</CardTitle>
            <CardDescription>
              Control how many items appear in your daily brief.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm">Max Items per Brief</span>
                <span className="text-sm font-medium">{settings?.max_items_per_brief || 10}</span>
              </div>
              <Slider
                value={[settings?.max_items_per_brief || 10]}
                onValueChange={([value]) => updateSetting('max_items_per_brief', value)}
                min={3}
                max={20}
                step={1}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
