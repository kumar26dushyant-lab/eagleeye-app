// Background Sync Cron Job
// Runs every day to sync all users' integrations and trigger notifications
// This ensures users get notified even without manual dashboard visits

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { processWorkItemNotifications, processSignalNotifications } from '@/lib/notifications/triggers'
import { getValidAccessToken } from '@/lib/token-refresh'

// Use service role for cron (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  // Verify cron request
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    console.log('[Sync Cron] Warning: Missing or invalid CRON_SECRET')
  }

  const startTime = Date.now()
  console.log('[Sync Cron] Starting background sync at', new Date().toISOString())

  try {
    // Get all users with active integrations
    const { data: integrations, error: intError } = await supabaseAdmin
      .from('integrations')
      .select('user_id, provider, access_token, workspace_id')
      .eq('is_active', true)

    if (intError) {
      console.error('[Sync Cron] Failed to fetch integrations:', intError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!integrations || integrations.length === 0) {
      console.log('[Sync Cron] No active integrations found')
      return NextResponse.json({ message: 'No integrations to sync', synced: 0 })
    }

    // Group integrations by user
    const userIntegrations = new Map<string, typeof integrations>()
    for (const integration of integrations) {
      const existing = userIntegrations.get(integration.user_id) || []
      existing.push(integration)
      userIntegrations.set(integration.user_id, existing)
    }

    const results = {
      usersProcessed: 0,
      integrationsSynced: 0,
      notificationsSent: { blockers: 0, overdue: 0, urgent: 0 },
      errors: 0,
    }

    // Process each user
    for (const [userId, userInts] of userIntegrations) {
      results.usersProcessed++

      // Get user's notification settings
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('notification_settings, email')
        .eq('id', userId)
        .single()

      const settings = profile?.notification_settings as {
        realtimeAlertsEnabled?: boolean
      } | null

      // Skip if realtime alerts are disabled
      if (!settings?.realtimeAlertsEnabled) {
        continue
      }

      // Sync each integration and collect items
      const allWorkItems: any[] = []
      const allSignals: any[] = []

      for (const integration of userInts) {
        results.integrationsSynced++

        try {
          // Call the appropriate sync endpoint based on provider
          const syncResult = await syncIntegration(integration, userId)
          
          if (syncResult.workItems) {
            allWorkItems.push(...syncResult.workItems)
          }
          if (syncResult.signals) {
            allSignals.push(...syncResult.signals)
          }
        } catch (error) {
          console.error(`[Sync Cron] Error syncing ${integration.provider} for user ${userId}:`, error)
          results.errors++
        }
      }

      // Process notifications for collected items
      if (allWorkItems.length > 0) {
        try {
          const notifResult = await processWorkItemNotifications(userId, allWorkItems)
          results.notificationsSent.blockers += notifResult.blockers
          results.notificationsSent.overdue += notifResult.overdue
        } catch (error) {
          console.error(`[Sync Cron] Error processing work item notifications:`, error)
        }
      }

      if (allSignals.length > 0) {
        try {
          const notifResult = await processSignalNotifications(userId, allSignals)
          results.notificationsSent.urgent += notifResult.notified
        } catch (error) {
          console.error(`[Sync Cron] Error processing signal notifications:`, error)
        }
      }
    }

    const duration = Date.now() - startTime
    console.log(`[Sync Cron] Completed in ${duration}ms:`, results)

    return NextResponse.json({
      success: true,
      duration_ms: duration,
      ...results,
    })
  } catch (error) {
    console.error('[Sync Cron] Fatal error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Sync a single integration and return items
 * Uses getValidAccessToken for automatic decryption and token refresh
 */
async function syncIntegration(
  integration: { provider: string; access_token: string; workspace_id: string | null; user_id: string },
  userId: string
): Promise<{ workItems?: any[]; signals?: any[] }> {
  const { provider, workspace_id } = integration

  try {
    // Get a valid (decrypted + refreshed if needed) access token
    const { token: access_token, error: tokenError } = await getValidAccessToken(userId, provider)
    
    if (tokenError || !access_token) {
      console.error(`[Sync Cron] Token error for ${provider}:`, tokenError)
      return {}
    }

    switch (provider) {
      case 'asana': {
        const { getWorkspaces, getMyTasks, taskToWorkItem } = await import('@/lib/integrations/asana')
        const workspaces = workspace_id 
          ? [{ gid: workspace_id, name: 'Workspace' }]
          : await getWorkspaces(access_token)
        
        const allTasks = []
        for (const ws of workspaces.slice(0, 3)) {
          try {
            const tasks = await getMyTasks(ws.gid, access_token)
            allTasks.push(...tasks.filter(t => !t.completed))
          } catch (e) {
            console.error(`[Sync Cron] Error fetching Asana tasks:`, e)
          }
        }
        
        const workItems = allTasks.map(t => taskToWorkItem(t, userId))
        return { 
          workItems: workItems.map(w => ({
            id: w.id || '',
            title: w.title,
            is_blocked: w.is_blocked,
            due_date: w.due_date || undefined,
            url: w.url || undefined,
          }))
        }
      }

      case 'linear': {
        const { getMyLinearIssues, linearIssueToWorkItem } = await import('@/lib/integrations/linear')
        const issues = await getMyLinearIssues(access_token)
        const workItems = issues.map(i => linearIssueToWorkItem(i, userId))
        return {
          workItems: workItems.map(w => ({
            id: w.id || '',
            title: w.title,
            is_blocked: w.is_blocked,
            due_date: w.due_date || undefined,
            url: w.url || undefined,
          }))
        }
      }

      case 'slack': {
        const { createSlackClient, getSlackChannels, getAuthenticatedUserId, findMentions, mentionToSignal } = 
          await import('@/lib/integrations/slack')
        
        const client = createSlackClient(access_token)
        const slackUserId = await getAuthenticatedUserId(client)
        
        if (!slackUserId) return {}
        
        const channels = await getSlackChannels(client)
        const channelsToScan = channels.filter(c => c.is_member).slice(0, 5)
        const mentions = await findMentions(client, slackUserId, channelsToScan, 24)
        const signals = mentions.map(m => mentionToSignal(m, userId))
        
        return {
          signals: signals.map(s => ({
            id: s.id || '',
            signal_type: s.signal_type || 'mention',
            sender_name: s.sender_name,
            snippet: s.snippet,
            channel_name: s.channel_name,
          }))
        }
      }

      default:
        return {}
    }
  } catch (error) {
    console.error(`[Sync Cron] Error in syncIntegration for ${provider}:`, error)
    return {}
  }
}
