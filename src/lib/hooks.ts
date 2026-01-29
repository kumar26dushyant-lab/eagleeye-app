// Custom React hooks for data fetching and state management
// Uses SWR for caching and revalidation

'use client'

import useSWR, { SWRConfiguration, mutate } from 'swr'
import { useCallback, useState } from 'react'
import { ROUTES, UI, INTENT_MODES, IntentModeKey } from './constants'
import type { DailyBrief, Integration, UserSettings, WorkItem, CommunicationSignal } from '@/types/database'

// ============================================
// FETCHER
// ============================================

async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url)
  
  if (!res.ok) {
    const error = new Error('An error occurred while fetching data')
    const data = await res.json().catch(() => ({}))
    ;(error as Error & { info: unknown; status: number }).info = data
    ;(error as Error & { info: unknown; status: number }).status = res.status
    throw error
  }
  
  return res.json()
}

// ============================================
// INTEGRATIONS HOOK
// ============================================

interface IntegrationsData {
  integrations: Integration[]
}

export function useIntegrations(config?: SWRConfiguration) {
  const { data, error, isLoading, mutate: revalidate } = useSWR<IntegrationsData>(
    ROUTES.api.integrations,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: UI.dashboardRefresh,
      ...config,
    }
  )
  
  const isConnected = useCallback((provider: string) => {
    return data?.integrations?.some(i => i.provider === provider) ?? false
  }, [data])
  
  const getIntegration = useCallback((provider: string) => {
    return data?.integrations?.find(i => i.provider === provider)
  }, [data])
  
  return {
    integrations: data?.integrations ?? [],
    isLoading,
    error,
    isConnected,
    getIntegration,
    revalidate,
  }
}

// ============================================
// BRIEF HOOK
// ============================================

interface BriefData {
  brief: DailyBrief | null
  items: {
    workItems: WorkItem[]
    signals: CommunicationSignal[]
  }
}

export function useBrief(date?: string, config?: SWRConfiguration) {
  const dateParam = date || new Date().toISOString().split('T')[0]
  const url = `${ROUTES.api.brief}?date=${dateParam}`
  
  const { data, error, isLoading, mutate: revalidate } = useSWR<BriefData>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: UI.dashboardRefresh,
      ...config,
    }
  )
  
  return {
    brief: data?.brief ?? null,
    workItems: data?.items?.workItems ?? [],
    signals: data?.items?.signals ?? [],
    isLoading,
    error,
    revalidate,
  }
}

// ============================================
// SETTINGS HOOK
// ============================================

interface SettingsData {
  settings: UserSettings | null
}

export function useSettings(config?: SWRConfiguration) {
  const { data, error, isLoading, mutate: revalidate } = useSWR<SettingsData>(
    ROUTES.api.settings,
    fetcher,
    {
      revalidateOnFocus: false,
      ...config,
    }
  )
  
  const updateSettings = useCallback(async (updates: Partial<UserSettings>) => {
    const res = await fetch(ROUTES.api.settings, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    
    if (!res.ok) {
      throw new Error('Failed to update settings')
    }
    
    await revalidate()
    return res.json()
  }, [revalidate])
  
  return {
    settings: data?.settings ?? null,
    isLoading,
    error,
    updateSettings,
    revalidate,
  }
}

// ============================================
// GENERATE BRIEF HOOK
// ============================================

interface GenerateBriefParams {
  intentMode: IntentModeKey
  includeAudio?: boolean
}

interface GenerateBriefResult {
  brief: DailyBrief
  audioUrl?: string
}

export function useGenerateBrief() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  const generate = useCallback(async (params: GenerateBriefParams): Promise<GenerateBriefResult | null> => {
    setIsGenerating(true)
    setError(null)
    
    try {
      const res = await fetch(ROUTES.api.brief, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to generate brief')
      }
      
      const result = await res.json()
      
      // Revalidate brief cache
      await mutate((key: string) => typeof key === 'string' && key.startsWith(ROUTES.api.brief))
      
      return result
    } catch (err) {
      const e = err instanceof Error ? err : new Error('Unknown error')
      setError(e)
      return null
    } finally {
      setIsGenerating(false)
    }
  }, [])
  
  return {
    generate,
    isGenerating,
    error,
  }
}

// ============================================
// SYNC HOOK
// ============================================

interface SyncResult {
  success: boolean
  itemsSynced: number
  errors?: string[]
}

export function useSync() {
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null)
  
  const sync = useCallback(async (provider?: string): Promise<SyncResult | null> => {
    setIsSyncing(true)
    setError(null)
    
    try {
      const url = provider 
        ? `${ROUTES.api.sync}?provider=${provider}`
        : ROUTES.api.sync
      
      const res = await fetch(url, { method: 'POST' })
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to sync')
      }
      
      const result = await res.json()
      setLastSyncResult(result)
      
      // Revalidate related caches
      await Promise.all([
        mutate(ROUTES.api.integrations),
        mutate((key: string) => typeof key === 'string' && key.startsWith(ROUTES.api.brief)),
      ])
      
      return result
    } catch (err) {
      const e = err instanceof Error ? err : new Error('Unknown error')
      setError(e)
      return null
    } finally {
      setIsSyncing(false)
    }
  }, [])
  
  return {
    sync,
    isSyncing,
    error,
    lastSyncResult,
  }
}

// ============================================
// AUDIO PLAYER HOOK
// ============================================

export function useAudioPlayer(audioUrl?: string | null) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null)
  
  const initAudio = useCallback(() => {
    if (!audioUrl) return null
    
    const audioEl = new Audio(audioUrl)
    
    audioEl.addEventListener('loadedmetadata', () => {
      setDuration(audioEl.duration)
    })
    
    audioEl.addEventListener('timeupdate', () => {
      setCurrentTime(audioEl.currentTime)
    })
    
    audioEl.addEventListener('ended', () => {
      setIsPlaying(false)
      setCurrentTime(0)
    })
    
    setAudio(audioEl)
    return audioEl
  }, [audioUrl])
  
  const play = useCallback(() => {
    const audioEl = audio || initAudio()
    if (audioEl) {
      audioEl.play()
      setIsPlaying(true)
    }
  }, [audio, initAudio])
  
  const pause = useCallback(() => {
    if (audio) {
      audio.pause()
      setIsPlaying(false)
    }
  }, [audio])
  
  const toggle = useCallback(() => {
    if (isPlaying) {
      pause()
    } else {
      play()
    }
  }, [isPlaying, play, pause])
  
  const seek = useCallback((time: number) => {
    if (audio) {
      audio.currentTime = time
      setCurrentTime(time)
    }
  }, [audio])
  
  const reset = useCallback(() => {
    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }
    setIsPlaying(false)
    setCurrentTime(0)
  }, [audio])
  
  return {
    isPlaying,
    currentTime,
    duration,
    progress: duration > 0 ? (currentTime / duration) * 100 : 0,
    play,
    pause,
    toggle,
    seek,
    reset,
  }
}

// ============================================
// INTENT MODE HOOK
// ============================================

export function useIntentMode(defaultMode: IntentModeKey = 'work') {
  const [mode, setMode] = useState<IntentModeKey>(defaultMode)
  const { settings, updateSettings } = useSettings()
  
  // Sync with user settings when loaded
  const effectiveMode = settings?.default_intent_mode ?? mode
  
  const setIntentMode = useCallback(async (newMode: IntentModeKey, persist = false) => {
    setMode(newMode)
    
    if (persist && settings) {
      await updateSettings({ default_intent_mode: newMode })
    }
  }, [settings, updateSettings])
  
  const modeConfig = INTENT_MODES[effectiveMode]
  
  return {
    mode: effectiveMode,
    setMode: setIntentMode,
    config: modeConfig,
    allModes: INTENT_MODES,
  }
}

// ============================================
// CHANNELS HOOK (Slack/Teams)
// ============================================

interface Channel {
  id: string
  name: string
  type: string
  is_supervised: boolean
}

interface ChannelsData {
  channels: Channel[]
}

export function useChannels(provider: 'slack' | 'teams', config?: SWRConfiguration) {
  const url = provider === 'slack' 
    ? ROUTES.api.slack.channels 
    : ROUTES.api.teams.channels
  
  const { data, error, isLoading, mutate: revalidate } = useSWR<ChannelsData>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      ...config,
    }
  )
  
  const saveChannels = useCallback(async (channelIds: string[]) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelIds }),
    })
    
    if (!res.ok) {
      throw new Error('Failed to save channels')
    }
    
    await revalidate()
    return res.json()
  }, [url, revalidate])
  
  return {
    channels: data?.channels ?? [],
    supervisedIds: data?.channels?.filter(c => c.is_supervised).map(c => c.id) ?? [],
    isLoading,
    error,
    saveChannels,
    revalidate,
  }
}
