import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { 
  ALL_WORK_ITEMS, 
  ALL_SIGNALS, 
  getFilteredData, 
  generateBriefText, 
  getStats 
} from '@/lib/mock-data'
import type { IntentMode } from '@/lib/importance'

export async function POST() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Clear existing demo data
    await supabase.from('work_items').delete().eq('user_id', user.id).like('source_id', 'demo-%')
    await supabase.from('communication_signals').delete().eq('user_id', user.id).like('source_message_id', 'demo-%')
    await supabase.from('daily_briefs').delete().eq('user_id', user.id)

    // Insert all work items (35 items)
    const workItemsWithUser = ALL_WORK_ITEMS.map(item => ({
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
      user_id: user.id,
      synced_at: new Date().toISOString(),
      raw_data: { priority_score: item.priority_score, context: item.context },
    }))

    const { error: workError } = await supabase
      .from('work_items')
      .insert(workItemsWithUser as never)

    if (workError) {
      console.error('Work items error:', workError)
      return NextResponse.json({ error: 'Failed to seed work items', details: workError }, { status: 500 })
    }

    // Insert all communication signals (12 signals)
    const signalsWithUser = ALL_SIGNALS.map(signal => ({
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
      user_id: user.id,
      raw_metadata: { 
        priority_score: signal.priority_score, 
        full_context: signal.full_context,
        sender_role: signal.sender_role,
      },
    }))

    const { error: signalError } = await supabase
      .from('communication_signals')
      .insert(signalsWithUser as never)

    if (signalError) {
      console.error('Signals error:', signalError)
      return NextResponse.json({ error: 'Failed to seed signals', details: signalError }, { status: 500 })
    }

    // Create initial brief with work mode
    const mode: IntentMode = 'work'
    const filteredData = getFilteredData(mode)
    const briefText = generateBriefText(mode)
    const stats = getStats(mode)

    const brief = {
      user_id: user.id,
      brief_date: new Date().toISOString().split('T')[0],
      intent_mode: mode,
      needs_attention: filteredData.needsAttention,
      fyi_items: filteredData.fyiItems,
      handled_items: filteredData.handledItems,
      brief_text: briefText,
      coverage_percentage: stats.coveragePercentage,
      total_items_processed: stats.totalItems,
      items_surfaced: stats.needsAttentionCount + stats.fyiCount,
    }

    const { error: briefError } = await supabase
      .from('daily_briefs')
      .insert(brief as never)

    if (briefError) {
      console.error('Brief error:', briefError)
      return NextResponse.json({ error: 'Failed to seed brief', details: briefError }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Demo data seeded successfully!',
      stats: {
        workItems: ALL_WORK_ITEMS.length,
        signals: ALL_SIGNALS.length,
        brief: 1
      }
    })

  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Failed to seed demo data' }, { status: 500 })
  }
}
