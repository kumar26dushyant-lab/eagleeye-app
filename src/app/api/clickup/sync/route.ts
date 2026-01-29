import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getClickUpTasks, normalizeClickUpTask } from '@/lib/clickup'
import type { Integration } from '@/types'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get ClickUp integration
    const { data: integration } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'clickup')
      .single()

    const typedIntegration = integration as unknown as Integration | null

    if (!typedIntegration || !typedIntegration.workspace_id) {
      return NextResponse.json({ error: 'ClickUp not connected' }, { status: 400 })
    }

    // Fetch tasks from ClickUp
    const tasks = await getClickUpTasks(
      typedIntegration.access_token,
      typedIntegration.workspace_id
    )

    // Normalize tasks
    const normalizedTasks = tasks.map(normalizeClickUpTask)

    // Save to work_items table
    for (const task of normalizedTasks) {
      await supabase.from('work_items').upsert({
        user_id: user.id,
        source: 'clickup',
        source_id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        due_date: task.due_date,
        project: task.project,
        url: task.url,
        urgency: task.urgency,
        is_blocked: task.is_blocked,
        raw_data: task,
        synced_at: new Date().toISOString(),
      } as never, {
        onConflict: 'user_id,source,source_id',
      })
    }

    // Update last sync time
    await supabase
      .from('integrations')
      .update({ last_sync_at: new Date().toISOString() } as never)
      .eq('user_id', user.id)
      .eq('provider', 'clickup')

    return NextResponse.json({
      success: true,
      synced: normalizedTasks.length,
    })
  } catch (error) {
    console.error('ClickUp sync error:', error)
    return NextResponse.json(
      { error: 'Failed to sync ClickUp tasks' },
      { status: 500 }
    )
  }
}
