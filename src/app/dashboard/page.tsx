'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import useSWR from 'swr'
import { ModeSelector } from '@/components/dashboard/ModeSelector'
import { AudioPlayer } from '@/components/dashboard/AudioPlayer'
import { BriefCard } from '@/components/dashboard/BriefCard'
import { NeedsAttention } from '@/components/dashboard/NeedsAttention'
import { FYISection } from '@/components/dashboard/FYISection'
import { HandledSection } from '@/components/dashboard/HandledSection'
import { SignalsSection } from '@/components/dashboard/SignalsSection'
import { RefreshButton } from '@/components/dashboard/RefreshButton'
import { TrialBanner, useTrialStatus } from '@/components/trial-banner'
import { MODE_CONFIG, type IntentMode } from '@/lib/importance'
import type { WorkItem, UserSettings, CommunicationSignal } from '@/types'
import { toast } from 'sonner'
import { Settings, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

// Mode-aware data response type
interface ModeDataResponse {
  mode: IntentMode
  dataSource?: string
  connectedTools?: string[]
  coverage?: {
    level: 'high' | 'medium' | 'low'
    percentage: number
    message: string
  }
  brief: {
    brief_text: string
    needs_attention: WorkItem[]
    fyi_items: WorkItem[]
    handled_items: WorkItem[]
    coverage_percentage: number
    total_items_processed: number
    items_surfaced: number
  }
  signals: CommunicationSignal[]
  stats: {
    needsAttention: number
    fyi: number
    handled: number
    signals: number
    totalItems: number
    totalSignals: number
  }
  timeWindow?: {
    start: string
    end: string
    label: string
    daysCovered: number
    timezone: string
    timezoneDisplay: string
  }
  emptyState?: {
    message: string
    suggestion: string
  }
}

type TimePreset = 'today' | 'yesterday' | '3days' | 'week'

export default function DashboardPage() {
  const [mode, setMode] = useState<IntentMode>('work')
  const [timePreset, setTimePreset] = useState<TimePreset>('today')
  const [userTimezone, setUserTimezone] = useState<string>('UTC')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)
  const [modeData, setModeData] = useState<ModeDataResponse | null>(null)
  const [isModeLoading, setIsModeLoading] = useState(true)

  // Detect timezone on mount
  useEffect(() => {
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone
      setUserTimezone(detected || 'UTC')
    } catch {
      setUserTimezone('UTC')
    }
  }, [])

  // Fetch settings to get default mode
  const { data: settingsData } = useSWR<{ settings: UserSettings | null }>(
    '/api/settings',
    fetcher
  )

  // Fetch mode-specific data from REAL integrations
  const fetchModeData = useCallback(async (selectedMode: IntentMode, time: TimePreset = 'today', tz: string = userTimezone) => {
    setIsModeLoading(true)
    try {
      const res = await fetch(`/api/data?mode=${selectedMode}&time=${time}&tz=${encodeURIComponent(tz)}`)
      if (res.ok) {
        const data = await res.json()
        setModeData(data)
      }
    } catch (error) {
      console.error('Failed to fetch mode data:', error)
    } finally {
      setIsModeLoading(false)
    }
  }, [userTimezone])

  // Set mode from settings on initial load
  useEffect(() => {
    if (settingsData?.settings?.default_intent_mode) {
      const savedMode = settingsData.settings.default_intent_mode as IntentMode
      setMode(savedMode)
      fetchModeData(savedMode, timePreset)
    } else {
      fetchModeData(mode, timePreset)
    }
  }, [settingsData, fetchModeData])

  // Extract data from mode response
  const brief = modeData?.brief
  const signals = modeData?.signals || []
  const stats = modeData?.stats

  // Get items from brief
  const needsAttention = brief?.needs_attention || []
  const fyiItems = brief?.fyi_items || []
  const handledItems = brief?.handled_items || []

  const handleModeChange = async (newMode: IntentMode) => {
    setMode(newMode)
    
    // Immediately fetch new mode data
    await fetchModeData(newMode, timePreset)
    
    // Save preference (don't wait for it)
    fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intent_mode: newMode }),
    }).catch(() => {})
    
    // Show mode change feedback
    const modeConfig = MODE_CONFIG[newMode]
    toast.success(`${modeConfig.icon} Switched to ${modeConfig.label} mode`)
  }

  const handleTimeChange = async (newTime: TimePreset) => {
    setTimePreset(newTime)
    await fetchModeData(mode, newTime, userTimezone)
    
    const labels: Record<TimePreset, string> = {
      today: 'Today',
      yesterday: 'Yesterday',
      '3days': 'Last 3 days',
      week: 'Last 7 days',
    }
    toast.success(`📅 Showing ${labels[newTime]}`)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await fetchModeData(mode, timePreset, userTimezone)
      toast.success('Brief refreshed')
    } catch {
      toast.error('Failed to refresh brief')
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleGenerateAudio = async () => {
    setIsGeneratingAudio(true)
    try {
      const res = await fetch('/api/brief/audio', { method: 'POST' })
      if (!res.ok) throw new Error()
      toast.success('Audio brief generated')
    } catch {
      toast.error('Failed to generate audio')
    } finally {
      setIsGeneratingAudio(false)
    }
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  // Time preset options (simplified - full days only)
  const timeOptions: { id: TimePreset; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: '3days', label: '3 days' },
    { id: 'week', label: 'Week' },
  ]

  // Format timezone for display
  const formatTz = (tz: string) => {
    const shortNames: Record<string, string> = {
      'America/Los_Angeles': 'PT',
      'America/New_York': 'ET',
      'Europe/London': 'GMT',
      'Asia/Kolkata': 'IST',
      'Asia/Singapore': 'SGT',
      'UTC': 'UTC'
    }
    return shortNames[tz] || tz.split('/').pop() || tz
  }

  // Get trial status
  const trialStatus = useTrialStatus()

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Trial Banner - shows for trialing users */}
      {!trialStatus.loading && !trialStatus.isPaid && trialStatus.isActive && trialStatus.daysLeft <= 14 && (
        <TrialBanner daysLeft={trialStatus.daysLeft} />
      )}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <Link href="/" className="text-2xl font-semibold flex items-center gap-2 hover:opacity-80 transition-opacity w-fit">
            <span>🦅</span>
            EagleEye
          </Link>
          <p className="text-sm text-muted-foreground mt-1">
            {today}
            {modeData?.timeWindow?.timezone && (
              <span className="ml-2 text-xs bg-muted px-1.5 py-0.5 rounded">
                🌐 {modeData.timeWindow.timezoneDisplay || formatTz(userTimezone)}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <ModeSelector mode={mode} onModeChange={handleModeChange} />
          <Link href="/dashboard/integrations">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Time Window Selector */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 overflow-x-auto pb-1"
      >
        {timeOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => handleTimeChange(option.id)}
            className={`px-3 py-1.5 text-xs rounded-full transition-colors whitespace-nowrap ${
              timePreset === option.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80 text-muted-foreground'
            }`}
          >
            {option.label}
          </button>
        ))}
        {modeData?.timeWindow && (
          <span className="text-xs text-muted-foreground ml-2">
            {modeData.timeWindow.label}
          </span>
        )}
      </motion.div>

      {/* Connected Tools Bar with Coverage */}
      {modeData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-muted/50 rounded-lg p-3 space-y-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">{MODE_CONFIG[mode].icon} {MODE_CONFIG[mode].label}</span>
              <span className="text-muted-foreground">•</span>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {modeData.connectedTools?.includes('slack') && (
                  <span className="inline-flex items-center gap-1 bg-green-500/10 text-green-600 px-2 py-0.5 rounded text-xs">
                    💬 Slack
                  </span>
                )}
                {modeData.connectedTools?.includes('asana') && (
                  <span className="inline-flex items-center gap-1 bg-green-500/10 text-green-600 px-2 py-0.5 rounded text-xs">
                    📋 Asana
                  </span>
                )}
                {modeData.connectedTools?.includes('linear') && (
                  <span className="inline-flex items-center gap-1 bg-green-500/10 text-green-600 px-2 py-0.5 rounded text-xs">
                    🎯 Linear
                  </span>
                )}
                {(!modeData.connectedTools || modeData.connectedTools.length === 0) && (
                  <span className="text-amber-500">No tools connected</span>
                )}
              </div>
            </div>
            <Link href="/dashboard/integrations" className="text-xs text-primary hover:underline flex items-center gap-1">
              <Plus className="h-3 w-3" />
              Add tools
            </Link>
          </div>
          
          {/* Coverage indicator */}
          {modeData.coverage && (
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${
                    modeData.coverage.level === 'high' ? 'bg-green-500' :
                    modeData.coverage.level === 'medium' ? 'bg-yellow-500' : 'bg-gray-400'
                  }`}
                  style={{ width: `${modeData.coverage.percentage}%` }}
                />
              </div>
              <span className={`text-xs font-medium ${
                modeData.coverage.level === 'high' ? 'text-green-500' :
                modeData.coverage.level === 'medium' ? 'text-yellow-500' : 'text-muted-foreground'
              }`}>
                {modeData.coverage.level === 'high' ? 'High' : 
                 modeData.coverage.level === 'medium' ? 'Partial' : 'Limited'} Coverage
              </span>
            </div>
          )}
        </motion.div>
      )}

      {/* Audio Player */}
      <AudioPlayer
        audioUrl={undefined}
        onRegenerate={handleGenerateAudio}
        isGenerating={isGeneratingAudio}
      />

      {/* Summary Brief Card */}
      <BriefCard 
        stats={stats ? {
          needsAttention: stats.needsAttention,
          fyi: stats.fyi,
          handled: stats.handled,
          signals: stats.signals,
          totalItems: stats.totalItems,
          coveragePercentage: brief?.coverage_percentage || 0
        } : null} 
        mode={mode}
        isLoading={isModeLoading} 
      />

      {/* Smart empty state - context-aware messaging */}
      {modeData?.emptyState && stats?.totalSignals === 0 && !isModeLoading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-muted/50 border border-border rounded-lg p-6 text-center"
        >
          <p className="text-lg mb-2">{modeData.emptyState.message}</p>
          <p className="text-sm text-muted-foreground">{modeData.emptyState.suggestion}</p>
          {modeData.timeWindow?.daysCovered && modeData.timeWindow.daysCovered < 1 && (
            <button
              onClick={() => handleTimeChange('yesterday')}
              className="mt-4 text-sm text-primary hover:underline"
            >
              → View yesterday&apos;s updates instead
            </button>
          )}
        </motion.div>
      )}

      {/* Helpful hint when no signals but has Slack */}
      {modeData?.connectedTools?.includes('slack') && stats?.totalSignals === 0 && !modeData?.emptyState && !isModeLoading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-muted/50 border border-border rounded-lg p-4 text-sm"
        >
          <p className="text-muted-foreground">
            💡 <strong>Tip:</strong> To see Slack messages, invite the bot to channels with <code className="bg-muted px-1 rounded">/invite @EagleEye</code>
          </p>
        </motion.div>
      )}

      {/* Sections */}
      <div className="space-y-4">
        <NeedsAttention items={needsAttention as WorkItem[]} isLoading={isModeLoading} />
        <SignalsSection signals={signals as CommunicationSignal[]} isLoading={isModeLoading} />
        <FYISection items={fyiItems as WorkItem[]} isLoading={isModeLoading} />
        <HandledSection items={handledItems as WorkItem[]} isLoading={isModeLoading} />
      </div>

      {/* Stats Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="pt-4 border-t border-border space-y-4"
      >
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>📊 {stats?.totalSignals || 0} signals • {modeData?.timeWindow?.label || 'Today'}</span>
            {modeData?.dataSource && modeData.dataSource !== 'none' && (
              <span className="text-green-500">• Live from {modeData.dataSource}</span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span>Surfacing: {stats?.needsAttention || 0} critical, {stats?.fyi || 0} FYI</span>
          </div>
        </div>
        
        {/* Trust-building transparency */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>🔐 <strong>Read-only:</strong> EagleEye never modifies your data or sends messages.</p>
          <p>🚫 <strong>Not tracked:</strong> Private DMs, encrypted channels, tools not connected.</p>
        </div>

        <div className="flex items-center gap-3">
          <RefreshButton onClick={handleRefresh} isLoading={isRefreshing} />
        </div>
      </motion.div>
    </div>
  )
}
