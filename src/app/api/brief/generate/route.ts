import { createApiHandler, createGetHandler } from '@/lib/api-middleware'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/errors'
import type { WorkItem } from '@/types'

// ============================================
// GET: Fetch or generate today's brief
// ============================================
export const GET = createGetHandler(
  {
    requireAuth: true,
    rateLimit: 'api',
  },
  async ({ userId }) => {
    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0]

    // Try to get existing brief
    const { data: brief } = await supabase
      .from('daily_briefs')
      .select('*')
      .eq('user_id', userId)
      .eq('brief_date', today)
      .single()

    if (brief) {
      return { brief }
    }

    // Get work items that should be surfaced
    const { data: workItems } = await supabase
      .from('work_items')
      .select('*')
      .eq('user_id', userId)
      .order('urgency', { ascending: false })

    const items = (workItems || []) as unknown as WorkItem[]
    const surfacedItems = items.filter(item => item.is_surfaced)
    const handledItems = items.filter(item => !item.is_surfaced && item.status === 'completed')

    // Separate by urgency
    const needsAttention = surfacedItems.filter(item => item.urgency === 'high')
    const fyiItems = surfacedItems.filter(item => item.urgency === 'medium')

    // Calculate coverage
    const totalItems = items.length
    const coverage = totalItems > 0 ? Math.round((surfacedItems.length / totalItems) * 100) : 0

    // Generate summary text
    let summaryText = ''
    if (needsAttention.length === 0) {
      summaryText = 'Good news! Nothing needs your immediate attention today. All tracked items are progressing normally.'
    } else if (needsAttention.length === 1) {
      summaryText = `One item needs your attention today. ${needsAttention[0].title} - ${needsAttention[0].surface_reason || 'requires review'}.`
    } else {
      summaryText = `${needsAttention.length} items need your attention today. The most urgent is "${needsAttention[0].title}" which ${needsAttention[0].surface_reason || 'requires review'}.`
    }

    if (handledItems.length > 0) {
      summaryText += ` ${handledItems.length} item${handledItems.length > 1 ? 's were' : ' was'} handled without you.`
    }

    // Create new brief
    const newBrief = {
      user_id: userId,
      brief_date: today,
      intent_mode: 'calm' as const,
      needs_attention: needsAttention,
      fyi_items: fyiItems,
      handled_items: handledItems.slice(0, 10),
      total_items_processed: totalItems,
      items_surfaced: surfacedItems.length,
      coverage_percentage: Math.min(coverage + 50, 100),
      brief_text: summaryText,
    }

    const { data: createdBrief, error } = await supabase
      .from('daily_briefs')
      .upsert(newBrief as never, { onConflict: 'user_id,brief_date,intent_mode' })
      .select()
      .single()

    if (error) {
      logger.error('Error creating brief', { error, userId })
      return { brief: newBrief }
    }

    return { brief: createdBrief }
  }
)
