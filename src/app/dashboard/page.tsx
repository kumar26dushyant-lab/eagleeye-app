'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { AudioPlayer } from '@/components/dashboard/AudioPlayer'
import { NeedsAttention } from '@/components/dashboard/NeedsAttention'
import { SignalsSection } from '@/components/dashboard/SignalsSection'
import { RefreshButton } from '@/components/dashboard/RefreshButton'
import { BriefCard } from '@/components/dashboard/BriefCard'
import { HandledSection } from '@/components/dashboard/HandledSection'
import { SignalFilter, type FilterType } from '@/components/dashboard/SignalFilter'
import { TrialBanner, useTrialStatus } from '@/components/trial-banner'
import { OnboardingModal, useOnboarding } from '@/components/onboarding/OnboardingModal'
import { Logo } from '@/components/brand/Logo'
import type { WorkItem, CommunicationSignal } from '@/types'
import { toast } from 'sonner'
import { Settings, Plus, Sparkles, Clock, Activity, Shield, Zap, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

// Data response type (simplified - no modes)
interface DataResponse {
  dataSource?: string
  connectedTools?: string[]
  workspaceType?: 'smb' | 'enterprise' | 'tech' | 'hybrid' // NEW: auto-detected
  brief: {
    brief_text: string
    needs_attention: CommunicationSignal[]
    kudos_wins?: CommunicationSignal[]
    fyi_items: CommunicationSignal[]
    handled_items: WorkItem[]
    coverage_percentage: number
    total_items_processed: number
    items_surfaced: number
  }
  signals: CommunicationSignal[]
  categories?: {
    needs_attention: CommunicationSignal[]
    kudos_wins: CommunicationSignal[]
    fyi: CommunicationSignal[]
  }
  stats: {
    needsAttention: number
    kudosWins?: number
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
  debug?: {
    deduplication?: {
      before: number
      after: number
      removed: number
    }
  }
}

type TimePreset = 'today' | 'yesterday' | '3days' | 'week'

// Contextual labels based on workspace type
function getSectionLabels(workspaceType: DataResponse['workspaceType']) {
  switch (workspaceType) {
    case 'smb':
      return {
        needsAttention: '🚨 Customer Issues',
        needsAttentionDesc: 'Complaints, urgent requests, support needs',
        kudos: '🌟 Happy Customers',
        kudosDesc: 'Positive feedback and appreciation',
        fyi: '📦 Orders & Inquiries',
        fyiDesc: 'New orders, quotes, general questions',
      }
    case 'tech':
      return {
        needsAttention: '🔥 Blockers & Urgents',
        needsAttentionDesc: 'PRs, blockers, escalations needing you',
        kudos: '🎉 Team Wins',
        kudosDesc: 'Shipped features, kudos, celebrations',
        fyi: '📋 For Your Info',
        fyiDesc: 'Updates, FYIs, context to stay in the loop',
      }
    case 'enterprise':
      return {
        needsAttention: '⚡ Needs Your Response',
        needsAttentionDesc: '@mentions, escalations, direct asks',
        kudos: '✨ Kudos & Wins',
        kudosDesc: 'Recognition, celebrations, good news',
        fyi: '📬 FYI',
        fyiDesc: 'Updates you should know about',
      }
    default: // hybrid
      return {
        needsAttention: '🔴 Needs Attention',
        needsAttentionDesc: 'Urgent items requiring your action',
        kudos: '🏆 Kudos & Wins',
        kudosDesc: 'Celebrations, appreciation, good vibes',
        fyi: '📩 For Your Info',
        fyiDesc: 'Updates and context',
      }
  }
}

// Get greeting based on time of day
function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

// Get status message based on signals
function getStatusMessage(stats: DataResponse['stats'] | undefined): string {
  if (!stats) return 'Loading your workspace...'
  
  if (stats.needsAttention === 0 && stats.signals === 0) {
    return "All clear! Inbox zero achieved 🎯"
  }
  if (stats.needsAttention === 0 && stats.kudosWins && stats.kudosWins > 0) {
    return `No fires! ${stats.kudosWins} kudos to celebrate ✨`
  }
  if (stats.needsAttention === 0) {
    return "No urgent items. Focus on what matters 💪"
  }
  if (stats.needsAttention === 1) {
    return "1 item needs your attention"
  }
  if (stats.needsAttention <= 3) {
    return `${stats.needsAttention} items need attention`
  }
  return `${stats.needsAttention} urgent items - let's tackle them`
}

export default function DashboardPage() {
  const [timePreset, setTimePreset] = useState<TimePreset>('today')
  const [userTimezone, setUserTimezone] = useState<string>('UTC')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)
  const [data, setData] = useState<DataResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')

  // Onboarding state
  const { showOnboarding, setShowOnboarding, userName } = useOnboarding()

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  // Detect timezone on mount
  useEffect(() => {
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone
      setUserTimezone(detected || 'UTC')
    } catch {
      setUserTimezone('UTC')
    }
  }, [])

  // Fetch data from integrations (no modes)
  const fetchData = useCallback(async (time: TimePreset = 'today', tz: string = userTimezone) => {
    setIsLoading(true)
    try {
      const cacheBuster = Date.now()
      const res = await fetch(`/api/data?time=${time}&tz=${encodeURIComponent(tz)}&_t=${cacheBuster}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      })
      if (res.ok) {
        const responseData = await res.json()
        setData(responseData)
        return responseData
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [userTimezone])

  // Initial data fetch
  useEffect(() => {
    fetchData(timePreset)
  }, [fetchData, timePreset])

  // Extract data from response
  const brief = data?.brief
  const signals = data?.signals || []
  const stats = data?.stats
  const categories = data?.categories
  const workspaceType = data?.workspaceType || 'hybrid'

  // Get contextual labels based on workspace type
  const sectionLabels = getSectionLabels(workspaceType)

  // Get items from categories
  const needsAttention = categories?.needs_attention || brief?.needs_attention || []
  const kudosWins = categories?.kudos_wins || brief?.kudos_wins || []
  const fyiSignals = categories?.fyi || brief?.fyi_items || []
  const handledItems = brief?.handled_items || []

  // Filter counts for the filter component
  const filterCounts = useMemo(() => ({
    all: needsAttention.length + kudosWins.length + fyiSignals.length,
    urgent: needsAttention.length,
    kudos: kudosWins.length,
    fyi: fyiSignals.length,
  }), [needsAttention.length, kudosWins.length, fyiSignals.length])

  // Determine what to show based on active filter
  const showNeedsAttention = activeFilter === 'all' || activeFilter === 'urgent'
  const showKudos = activeFilter === 'all' || activeFilter === 'kudos'
  const showFyi = activeFilter === 'all' || activeFilter === 'fyi'

  const handleTimeChange = async (newTime: TimePreset) => {
    setTimePreset(newTime)
    await fetchData(newTime, userTimezone)
    
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
      const responseData = await fetchData(timePreset, userTimezone)
      const signalCount = responseData?.signals?.length || 0
      const totalProcessed = responseData?.brief?.total_items_processed || 0
      const removed = responseData?.debug?.deduplication?.removed || 0
      toast.success(`✅ Synced ${totalProcessed} messages, ${signalCount} signals (${removed} duplicates removed)`)
    } catch {
      toast.error('Failed to refresh')
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

  const today = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const timeOptions: { id: TimePreset; label: string; icon: React.ReactNode }[] = [
    { id: 'today', label: 'Today', icon: <Zap className="h-3 w-3" /> },
    { id: 'yesterday', label: 'Yesterday', icon: <Clock className="h-3 w-3" /> },
    { id: '3days', label: '3 days', icon: <TrendingUp className="h-3 w-3" /> },
    { id: 'week', label: 'Week', icon: <Activity className="h-3 w-3" /> },
  ]

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

  const trialStatus = useTrialStatus()

  // Calculate a "health score" for visual feedback
  const healthScore = stats ? Math.max(0, 100 - (stats.needsAttention * 20)) : 100
  const healthColor = healthScore >= 80 ? 'emerald' : healthScore >= 50 ? 'amber' : 'red'

  return (
    <div className="min-h-screen relative">
      {/* Onboarding Modal */}
      <OnboardingModal 
        isOpen={showOnboarding} 
        onComplete={() => setShowOnboarding(false)}
        userName={userName}
      />

      {/* Animated Background Gradient */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/20 via-background to-indigo-950/10" />
        {/* Subtle animated orbs */}
        <motion.div
          className="absolute top-20 right-20 w-96 h-96 rounded-full blur-3xl opacity-20 bg-indigo-500"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 left-20 w-64 h-64 rounded-full bg-primary/10 blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.15, 0.1, 0.15],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Trial Banner */}
        {!trialStatus.loading && !trialStatus.isPaid && trialStatus.isActive && trialStatus.daysLeft <= 14 && (
          <TrialBanner daysLeft={trialStatus.daysLeft} />
        )}

        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8"
        >
          {/* Left: Logo + Greeting */}
          <div className="flex items-center gap-6">
            <Logo size="sm" animated={true} />
            <div className="hidden md:block h-8 w-px bg-border" />
            <div className="hidden md:block">
              <p className="text-sm text-muted-foreground">{today}</p>
              <h1 className="text-xl font-semibold flex items-center gap-2">
                {getGreeting()}
                <motion.span
                  animate={{ rotate: [0, 14, 0] }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  👋
                </motion.span>
              </h1>
            </div>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Time Selector - Pill Style */}
            <div className="flex items-center bg-muted/50 backdrop-blur-sm rounded-full p-1 border border-border/50">
              {timeOptions.map((option) => (
                <motion.button
                  key={option.id}
                  onClick={() => handleTimeChange(option.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full transition-all ${
                    timePreset === option.id
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {option.icon}
                  <span className="hidden sm:inline">{option.label}</span>
                </motion.button>
              ))}
            </div>
            
            <RefreshButton onClick={handleRefresh} isLoading={isRefreshing} />

            <Link href="/dashboard/integrations">
              <Button variant="ghost" size="icon" className="rounded-full">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </motion.header>

        {/* Status Banner - Glassmorphism */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 p-4 rounded-2xl bg-card/50 backdrop-blur-md border border-border/50 shadow-xl"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Status */}
            <div className="flex items-center gap-4">
              <motion.div
                className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-indigo-500/20"
                whileHover={{ scale: 1.05 }}
              >
                <span className="text-2xl">{stats?.needsAttention === 0 ? '✅' : stats?.needsAttention && stats.needsAttention > 3 ? '🔥' : '👀'}</span>
              </motion.div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold">EagleEye</h2>
                  <span className="px-2 py-0.5 text-[10px] rounded-full bg-green-500/10 text-green-500 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    SYNCED
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{getStatusMessage(stats)}</p>
              </div>
            </div>

            {/* Connected Tools */}
            <div className="flex items-center gap-3 flex-wrap">
              {data?.connectedTools?.includes('slack') && (
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#4A154B]/10 border border-[#4A154B]/20"
                >
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-medium">Slack</span>
                </motion.div>
              )}
              {data?.connectedTools?.includes('asana') && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F06A6A]/10 border border-[#F06A6A]/20"
                >
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-medium">Asana</span>
                </motion.div>
              )}
              {data?.connectedTools?.includes('linear') && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#5E6AD2]/10 border border-[#5E6AD2]/20"
                >
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-medium">Linear</span>
                </motion.div>
              )}
              {data?.connectedTools?.includes('whatsapp') && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366]/10 border border-[#25D366]/20"
                >
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-medium">WhatsApp</span>
                </motion.div>
              )}
              {(!data?.connectedTools || data.connectedTools.length === 0) && (
                <Link href="/dashboard/integrations" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-colors">
                  <Plus className="h-3 w-3 text-amber-500" />
                  <span className="text-xs font-medium text-amber-500">Connect tools</span>
                </Link>
              )}
            </div>
          </div>
        </motion.div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Sidebar */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-4">
            <div className="lg:sticky lg:top-4 space-y-4">
              
              {/* Health Score Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="p-5 rounded-2xl bg-card/50 backdrop-blur-md border border-border/50 shadow-lg"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Workspace Health
                  </h3>
                  <span className={`text-2xl font-bold ${
                    healthScore >= 80 ? 'text-emerald-500' :
                    healthScore >= 50 ? 'text-amber-500' : 'text-red-500'
                  }`}>
                    {healthScore}%
                  </span>
                </div>
                
                {/* Health Bar */}
                <div className="h-3 bg-muted rounded-full overflow-hidden mb-4">
                  <motion.div
                    className={`h-full rounded-full bg-gradient-to-r ${
                      healthScore >= 80 ? 'from-emerald-500 to-green-400' :
                      healthScore >= 50 ? 'from-amber-500 to-yellow-400' :
                      'from-red-500 to-orange-400'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${healthScore}%` }}
                    transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
                  />
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 gap-2">
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="p-3 rounded-xl bg-red-500/10 border border-red-500/20"
                  >
                    <div className="text-2xl font-bold text-red-500">{stats?.needsAttention || 0}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Critical</div>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
                  >
                    <div className="text-2xl font-bold text-emerald-500">{stats?.kudosWins || 0}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Kudos</div>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20"
                  >
                    <div className="text-2xl font-bold text-amber-500">{stats?.fyi || 0}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">FYI</div>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20"
                  >
                    <div className="text-2xl font-bold text-blue-500">{stats?.signals || 0}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</div>
                  </motion.div>
                </div>
              </motion.div>

              {/* Audio Player */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <AudioPlayer
                  audioUrl={undefined}
                  onRegenerate={handleGenerateAudio}
                  isGenerating={isGeneratingAudio}
                />
              </motion.div>

              {/* Brief Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
              >
                <BriefCard 
                  stats={stats ? {
                    needsAttention: stats.needsAttention,
                    fyi: stats.fyi,
                    handled: stats.handled,
                    signals: stats.signals,
                    totalItems: stats.totalItems,
                    coveragePercentage: brief?.coverage_percentage || 0
                  } : null} 
                  isLoading={isLoading} 
                />
              </motion.div>

              {/* Trust Badge */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-2"
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Shield className="h-3 w-3 text-green-500" />
                  <span><strong>Read-only</strong> • Never modifies your data</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Shield className="h-3 w-3 text-green-500" />
                  <span><strong>Private</strong> • DMs are never tracked</span>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-6">
            
            {/* Empty State */}
            <AnimatePresence mode="wait">
              {data?.emptyState && stats?.totalSignals === 0 && !isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="p-8 rounded-2xl bg-card/50 backdrop-blur-md border border-border/50 text-center"
                >
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-6xl mb-4"
                  >
                    ✨
                  </motion.div>
                  <h3 className="text-xl font-semibold mb-2">{data.emptyState.message}</h3>
                  <p className="text-muted-foreground mb-4">{data.emptyState.suggestion}</p>
                  {data.timeWindow?.daysCovered && data.timeWindow.daysCovered < 1 && (
                    <Button variant="outline" onClick={() => handleTimeChange('yesterday')}>
                      View yesterday&apos;s updates
                    </Button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Slack Tip */}
            {data?.connectedTools?.includes('slack') && stats?.totalSignals === 0 && !data?.emptyState && !isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-[#4A154B]/10 border border-[#4A154B]/20 text-sm flex items-center gap-3"
              >
                <span className="text-2xl">💡</span>
                <div>
                  <strong>Tip:</strong> Invite the bot to channels with{' '}
                  <code className="px-1.5 py-0.5 rounded bg-muted text-xs">/invite @EagleEye</code>
                </div>
              </motion.div>
            )}

            {/* Content Cards */}
            <div className="grid grid-cols-1 gap-6">
              {/* Filter Bar */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="flex items-center justify-between"
              >
                <SignalFilter 
                  activeFilter={activeFilter} 
                  onFilterChange={setActiveFilter}
                  counts={filterCounts}
                />
              </motion.div>

              {/* Needs Attention */}
              {showNeedsAttention && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <NeedsAttention 
                    items={needsAttention as CommunicationSignal[]} 
                    isLoading={isLoading}
                    title={sectionLabels.needsAttention}
                    description={sectionLabels.needsAttentionDesc}
                  />
                </motion.div>
              )}

              {/* Kudos & Wins Section */}
              {showKudos && kudosWins.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <h3 className="font-semibold text-emerald-500">{sectionLabels.kudos}</h3>
                      <span className="ml-auto text-xs text-muted-foreground">{kudosWins.length} items</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{sectionLabels.kudosDesc}</p>
                    <SignalsSection signals={kudosWins as CommunicationSignal[]} isLoading={isLoading} showHeader={false} />
                  </div>
                </motion.div>
              )}

              {/* FYI Section */}
              {showFyi && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <SignalsSection signals={fyiSignals as CommunicationSignal[]} isLoading={isLoading} title={sectionLabels.fyi} description={sectionLabels.fyiDesc} />
                </motion.div>
              )}

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <HandledSection items={handledItems as WorkItem[]} isLoading={isLoading} />
                </motion.div>
              </div>
            </div>

            {/* Footer Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border/50"
            >
              <div className="flex items-center gap-4">
                <span>📊 {stats?.totalSignals || 0} signals processed</span>
                {data?.dataSource && data.dataSource !== 'none' && (
                  <span className="flex items-center gap-1 text-green-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Live from {data.dataSource}
                  </span>
                )}
              </div>
              <span>{data?.timeWindow?.timezoneDisplay || formatTz(userTimezone)}</span>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
