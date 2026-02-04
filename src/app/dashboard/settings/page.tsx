'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Save, Volume2, Mail, Bell, Clock, Sliders, Shield, Trash2, Download, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { UserSettings } from '@/types'

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

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

  // Export user data
  const handleExportData = async () => {
    setExporting(true)
    try {
      const res = await fetch('/api/user/data', {
        method: 'GET',
      })
      if (res.ok) {
        const data = await res.json()
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `eagleeye-data-export-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast.success('Data exported successfully')
      } else {
        toast.error('Failed to export data')
      }
    } catch {
      toast.error('Failed to export data')
    } finally {
      setExporting(false)
    }
  }

  // Delete account
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm')
      return
    }
    setDeleting(true)
    try {
      const res = await fetch('/api/user/data', {
        method: 'DELETE',
      })
      if (res.ok) {
        toast.success('Account deleted. Redirecting...')
        const supabase = createClient()
        await supabase.auth.signOut()
        window.location.href = '/'
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to delete account')
      }
    } catch {
      toast.error('Failed to delete account')
    } finally {
      setDeleting(false)
    }
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
        {/* Daily Brief Settings */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Daily Brief</CardTitle>
            </div>
            <CardDescription>
              Configure your daily brief delivery preferences.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Audio Brief - Coming Soon */}
            <div className="flex items-center justify-between opacity-50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium flex items-center gap-2">
                    Audio Brief
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 font-medium">
                      COMING SOON
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground">Listen to your brief on the go</p>
                </div>
              </div>
              <Switch
                checked={false}
                disabled={true}
              />
            </div>

            {/* Email Digest */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Email Digest</p>
                  <p className="text-sm text-muted-foreground">Receive daily email summary</p>
                </div>
              </div>
              <Switch
                checked={settings?.email_digest ?? false}
                onCheckedChange={(checked) => updateSetting('email_digest', checked)}
              />
            </div>

            {/* Push Notifications */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-muted-foreground">Get notified about urgent items</p>
                </div>
              </div>
              <Switch
                checked={settings?.push_enabled ?? false}
                onCheckedChange={(checked) => updateSetting('push_enabled', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Brief Customization */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sliders className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Brief Customization</CardTitle>
            </div>
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
              <p className="text-xs text-muted-foreground mt-2">
                Adjust how many items you want to see in each category
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Timezone */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base">Timezone</CardTitle>
            <CardDescription>
              Your timezone is automatically detected. All times are shown in your local time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">
              {Intl.DateTimeFormat().resolvedOptions().timeZone}
            </p>
          </CardContent>
        </Card>

        {/* Privacy & Data Section */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-500" />
              <CardTitle className="text-base">Privacy & Data</CardTitle>
            </div>
            <CardDescription>
              Control your data and privacy settings. Your data belongs to you.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Data Retention Info */}
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                🗑️ Automatic Data Retention
              </h4>
              <p className="text-sm text-muted-foreground">
                Processed signals are automatically deleted after <span className="font-semibold text-foreground">30 days</span>. 
                Raw message data is never stored - we only keep the extracted signals.
              </p>
            </div>

            {/* Export Data */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Download className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Export Your Data</p>
                  <p className="text-sm text-muted-foreground">Download all your data as JSON</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleExportData}
                disabled={exporting}
              >
                {exporting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Export
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="bg-card border-red-500/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <CardTitle className="text-base text-red-500">Danger Zone</CardTitle>
            </div>
            <CardDescription>
              Irreversible actions. Please be certain.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!showDeleteConfirm ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Delete Account</p>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all data
                  </p>
                </div>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-4 rounded-lg bg-red-500/10 border border-red-500/30"
              >
                <div className="flex items-start gap-3 mb-4">
                  <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-red-500">Are you absolutely sure?</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      This will permanently delete:
                    </p>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                      <li>Your account and profile</li>
                      <li>All integrations and connections</li>
                      <li>All signals and briefs</li>
                      <li>Your subscription (no refunds)</li>
                    </ul>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="text-sm text-muted-foreground block mb-2">
                    Type <span className="font-mono font-semibold text-red-500">DELETE</span> to confirm:
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:border-red-500 focus:outline-none text-sm"
                    placeholder="Type DELETE"
                  />
                </div>
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setShowDeleteConfirm(false)
                      setDeleteConfirmText('')
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={handleDeleteAccount}
                    disabled={deleting || deleteConfirmText !== 'DELETE'}
                  >
                    {deleting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Delete Forever
                  </Button>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
