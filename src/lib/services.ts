// Service Layer - Abstracts database and external API operations
// Provides clean interfaces for business logic

import { createClient } from '@/lib/supabase/server'
import type { Integration, IntegrationProvider } from '@/types'

// ============================================
// INTEGRATION SERVICE
// ============================================

export class IntegrationService {
  static async getForUser(userId: string): Promise<Integration[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
    
    if (error) throw new ServiceError('Failed to fetch integrations', error)
    return (data as unknown as Integration[]) || []
  }

  static async getByProvider(
    userId: string, 
    provider: IntegrationProvider
  ): Promise<Integration | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', provider as never)
      .eq('is_active', true)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      throw new ServiceError('Failed to fetch integration', error)
    }
    return data as unknown as Integration | null
  }

  static async upsert(
    userId: string,
    provider: IntegrationProvider,
    data: {
      accessToken: string
      refreshToken?: string
      workspaceId?: string
      workspaceName?: string
    }
  ): Promise<Integration> {
    const supabase = await createClient()
    const { data: result, error } = await supabase
      .from('integrations')
      .upsert({
        user_id: userId,
        provider,
        access_token: data.accessToken,
        refresh_token: data.refreshToken || null,
        workspace_id: data.workspaceId || null,
        workspace_name: data.workspaceName || null,
        is_active: true,
        last_sync_at: new Date().toISOString(),
      } as never, { 
        onConflict: 'user_id,provider' 
      })
      .select()
      .single()
    
    if (error) throw new ServiceError('Failed to save integration', error)
    return result as unknown as Integration
  }

  static async updateSyncTime(
    userId: string,
    provider: IntegrationProvider,
    error?: string
  ): Promise<void> {
    const supabase = await createClient()
    await supabase
      .from('integrations')
      .update({
        last_sync_at: new Date().toISOString(),
        sync_error: error || null,
      } as never)
      .eq('user_id', userId)
      .eq('provider', provider as never)
  }

  static async disconnect(
    userId: string,
    provider: IntegrationProvider
  ): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase
      .from('integrations')
      .update({ is_active: false } as never)
      .eq('user_id', userId)
      .eq('provider', provider as never)
    
    if (error) throw new ServiceError('Failed to disconnect integration', error)
  }
}

// ============================================
// WORK ITEMS SERVICE
// ============================================

export interface WorkItemInput {
  source: 'asana' | 'clickup' | 'jira'
  sourceId: string
  title: string
  description?: string
  status?: string
  dueDate?: string
  assignee?: string
  project?: string
  url?: string
  urgency: 'high' | 'medium' | 'low'
  isBlocked: boolean
  rawData?: Record<string, unknown>
}

export class WorkItemsService {
  static async upsertMany(userId: string, items: WorkItemInput[]): Promise<number> {
    const supabase = await createClient()
    let synced = 0

    for (const item of items) {
      const { error } = await supabase.from('work_items').upsert({
        user_id: userId,
        source: item.source,
        source_id: item.sourceId,
        title: item.title,
        description: item.description || null,
        status: item.status || null,
        due_date: item.dueDate || null,
        assignee: item.assignee || null,
        project: item.project || null,
        url: item.url || null,
        urgency: item.urgency,
        is_blocked: item.isBlocked,
        raw_data: item.rawData || null,
        synced_at: new Date().toISOString(),
      } as never, {
        onConflict: 'user_id,source,source_id',
      })

      if (!error) synced++
    }

    return synced
  }

  static async getForBrief(
    userId: string,
    options: {
      urgencyThreshold?: 'high' | 'medium' | 'low'
      limit?: number
    } = {}
  ) {
    const supabase = await createClient()
    
    let query = supabase
      .from('work_items')
      .select('*')
      .eq('user_id', userId)
      .order('urgency', { ascending: false })
      .order('due_date', { ascending: true, nullsFirst: false })
    
    if (options.urgencyThreshold === 'high') {
      query = query.eq('urgency', 'high')
    } else if (options.urgencyThreshold === 'medium') {
      query = query.in('urgency', ['high', 'medium'])
    }
    
    if (options.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query
    if (error) throw new ServiceError('Failed to fetch work items', error)
    return data || []
  }

  static async getNeedsAttention(userId: string, limit = 5) {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('work_items')
      .select('*')
      .eq('user_id', userId)
      .or('urgency.eq.high,is_blocked.eq.true')
      .order('due_date', { ascending: true, nullsFirst: false })
      .limit(limit)
    
    if (error) throw new ServiceError('Failed to fetch attention items', error)
    return data || []
  }
}

// ============================================
// BRIEF SERVICE
// ============================================

export class BriefService {
  static async getLatest(userId: string, intentMode: 'calm' | 'on_the_go' | 'work' | 'focus') {
    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('daily_briefs')
      .select('*')
      .eq('user_id', userId)
      .eq('brief_date', today)
      .eq('intent_mode', intentMode)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      throw new ServiceError('Failed to fetch brief', error)
    }
    return data
  }

  static async create(
    userId: string,
    data: {
      intentMode: string
      needsAttention: unknown[]
      fyiItems: unknown[]
      handledItems: unknown[]
      briefText?: string
      audioUrl?: string
      audioDuration?: number
      coveragePercentage: number
      totalItemsProcessed: number
      itemsSurfaced: number
    }
  ) {
    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0]
    
    const { data: result, error } = await supabase
      .from('daily_briefs')
      .upsert({
        user_id: userId,
        brief_date: today,
        intent_mode: data.intentMode,
        needs_attention: data.needsAttention,
        fyi_items: data.fyiItems,
        handled_items: data.handledItems,
        brief_text: data.briefText || null,
        audio_url: data.audioUrl || null,
        audio_duration_seconds: data.audioDuration || null,
        coverage_percentage: data.coveragePercentage,
        total_items_processed: data.totalItemsProcessed,
        items_surfaced: data.itemsSurfaced,
        generated_at: new Date().toISOString(),
      } as never, {
        onConflict: 'user_id,brief_date,intent_mode',
      })
      .select()
      .single()
    
    if (error) throw new ServiceError('Failed to create brief', error)
    return result
  }
}

// ============================================
// SETTINGS SERVICE
// ============================================

export class SettingsService {
  static async get(userId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      throw new ServiceError('Failed to fetch settings', error)
    }
    return data
  }

  static async update(userId: string, settings: Record<string, unknown>) {
    const supabase = await createClient()
    
    // Convert camelCase to snake_case for DB
    const dbSettings: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(settings)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
      dbSettings[snakeKey] = value
    }
    
    const { data, error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        ...dbSettings,
        updated_at: new Date().toISOString(),
      } as never, {
        onConflict: 'user_id',
      })
      .select()
      .single()
    
    if (error) throw new ServiceError('Failed to update settings', error)
    return data
  }
}

// ============================================
// SYNC LOG SERVICE
// ============================================

export class SyncLogService {
  static async start(userId: string, provider: string): Promise<string> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('sync_log')
      .insert({
        user_id: userId,
        provider,
        status: 'started',
        started_at: new Date().toISOString(),
      } as never)
      .select('id')
      .single()
    
    if (error) throw new ServiceError('Failed to start sync log', error)
    return (data as { id: string }).id
  }

  static async complete(
    logId: string,
    itemsSynced: number
  ): Promise<void> {
    const supabase = await createClient()
    const startedAt = new Date() // Approximation
    
    await supabase
      .from('sync_log')
      .update({
        status: 'completed',
        items_synced: itemsSynced,
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - startedAt.getTime(),
      } as never)
      .eq('id', logId)
  }

  static async fail(logId: string, errorMessage: string): Promise<void> {
    const supabase = await createClient()
    
    await supabase
      .from('sync_log')
      .update({
        status: 'failed',
        error_message: errorMessage,
        completed_at: new Date().toISOString(),
      } as never)
      .eq('id', logId)
  }
}

// ============================================
// CUSTOM ERROR CLASS
// ============================================

export class ServiceError extends Error {
  public originalError: unknown

  constructor(message: string, originalError?: unknown) {
    super(message)
    this.name = 'ServiceError'
    this.originalError = originalError
  }
}
