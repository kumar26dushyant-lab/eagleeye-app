import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { 
  getFilteredData, 
  generateBriefText, 
  getStats,
  ALL_WORK_ITEMS,
  ALL_SIGNALS,
} from '@/lib/mock-data'
import type { IntentMode } from '@/lib/importance'

// GET: Get filtered data for a specific mode (for real-time mode switching)
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const mode = (searchParams.get('mode') || 'work') as IntentMode
  
  // Validate mode
  if (!['calm', 'on_the_go', 'work', 'focus'].includes(mode)) {
    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 })
  }

  try {
    // Get mode-filtered data
    const filteredData = getFilteredData(mode)
    const briefText = generateBriefText(mode)
    const stats = getStats(mode)

    // Format work items with required fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formatWorkItem = (item: any, index: number) => ({
      id: item.source_id || `item-${index}`,
      user_id: user.id,
      source: item.source,
      source_id: item.source_id,
      title: item.title,
      description: item.description,
      status: item.status,
      due_date: item.due_date,
      assignee: item.assignee,
      project: item.project,
      url: item.url,
      urgency: item.urgency,
      is_blocked: item.is_blocked,
      is_surfaced: item.is_surfaced,
      surface_reason: item.surface_reason,
      raw_data: { context: item.context, priority_score: item.priority_score },
      synced_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    })

    // Format signals with required fields (including detection info)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formatSignal = (signal: any, index: number) => ({
      id: signal.source_message_id || `signal-${index}`,
      user_id: user.id,
      source: signal.source,
      source_message_id: signal.source_message_id,
      channel_id: signal.channel_id,
      channel_name: signal.channel_name,
      sender_name: signal.sender_name,
      signal_type: signal.signal_type,
      snippet: signal.snippet,
      timestamp: signal.timestamp,
      is_read: signal.is_read,
      is_actioned: signal.is_actioned,
      // Detection features - for cross-channel @mention detection
      is_from_monitored_channel: signal.is_from_monitored_channel,
      detected_via: signal.detected_via,
      related_work_item_id: signal.related_work_item_id,
      message_url: signal.message_url, // Direct link to open in Slack/Teams
      raw_metadata: { 
        full_context: signal.full_context, 
        sender_role: signal.sender_role,
        priority_score: signal.priority_score,
      },
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({
      mode,
      brief: {
        brief_text: briefText,
        needs_attention: filteredData.needsAttention.map(formatWorkItem),
        fyi_items: filteredData.fyiItems.map(formatWorkItem),
        handled_items: filteredData.handledItems.map(formatWorkItem),
        coverage_percentage: stats.coveragePercentage,
        total_items_processed: stats.totalItems,
        items_surfaced: stats.needsAttentionCount + stats.fyiCount,
      },
      signals: filteredData.signals.map(formatSignal),
      stats: {
        needsAttention: stats.needsAttentionCount,
        fyi: stats.fyiCount,
        handled: stats.handledCount,
        signals: stats.signalsCount,
        totalItems: ALL_WORK_ITEMS.length,
        totalSignals: ALL_SIGNALS.length,
      },
    })
  } catch (error) {
    console.error('Mode data error:', error)
    return NextResponse.json({ error: 'Failed to get mode data' }, { status: 500 })
  }
}
