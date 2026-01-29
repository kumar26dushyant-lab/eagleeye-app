import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { detectSignals, shouldSurface } from '@/lib/signals'
import { calculateImportance } from '@/lib/importance'
import type { Integration } from '@/types'

export async function POST() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get Asana integration
  const { data } = await supabase
    .from('integrations')
    .select('*')
    .eq('user_id', user.id)
    .eq('provider', 'asana')
    .eq('is_active', true)
    .single()

  const integration = data as unknown as Integration | null

  if (!integration) {
    return NextResponse.json({ error: 'Asana not connected' }, { status: 400 })
  }

  try {
    // Get projects
    const projectsResponse = await fetch(
      `https://app.asana.com/api/1.0/workspaces/${integration.workspace_id}/projects?opt_fields=name,gid`,
      { headers: { Authorization: `Bearer ${integration.access_token}` } }
    )

    if (!projectsResponse.ok) {
      throw new Error('Failed to fetch projects')
    }

    const projectsData = await projectsResponse.json()
    const projects = projectsData.data || []

    const allTasks: {
      external_id: string
      external_url: string
      title: string
      owner_name: string | null
      owner_email: string | null
      due_date: string | null
      status: string | null
      project_name: string | null
      last_activity_at: string | null
    }[] = []

    // Fetch tasks from each project (limit to first 5 projects to avoid rate limits)
    for (const project of projects.slice(0, 5)) {
      const tasksResponse = await fetch(
        `https://app.asana.com/api/1.0/projects/${project.gid}/tasks?opt_fields=name,gid,assignee,assignee.name,assignee.email,due_on,completed,modified_at,permalink_url`,
        { headers: { Authorization: `Bearer ${integration.access_token}` } }
      )

      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json()
        for (const task of tasksData.data || []) {
          if (!task.completed) {
            allTasks.push({
              external_id: task.gid,
              external_url: task.permalink_url,
              title: task.name,
              owner_name: task.assignee?.name || null,
              owner_email: task.assignee?.email || null,
              due_date: task.due_on || null,
              status: task.completed ? 'completed' : 'open',
              project_name: project.name,
              last_activity_at: task.modified_at || null,
            })
          }
        }
      }
    }

    // Process and save tasks
    for (const task of allTasks) {
      const signals = detectSignals({
        title: task.title,
        owner_name: task.owner_name,
        due_date: task.due_date,
        status: task.status,
        last_activity_at: task.last_activity_at,
      })

      const surfaceResult = shouldSurface(signals)
      const importance = calculateImportance({
        due_date: task.due_date,
        last_activity_at: task.last_activity_at,
        has_dependency: signals.hasDependency,
        has_escalation: signals.hasEscalation,
      })

      await supabase
        .from('work_items')
        .upsert({
          user_id: user.id,
          provider: 'asana',
          external_id: task.external_id,
          external_url: task.external_url,
          title: task.title,
          owner_name: task.owner_name,
          owner_email: task.owner_email,
          due_date: task.due_date,
          status: task.status,
          project_name: task.project_name,
          last_activity_at: task.last_activity_at,
          has_commitment: signals.hasCommitment,
          has_time_pressure: signals.hasTimePressure,
          has_movement_gap: signals.hasMovementGap,
          has_dependency: signals.hasDependency,
          has_escalation: signals.hasEscalation,
          importance_score: importance,
          confidence_score: surfaceResult.confidence,
          should_surface: surfaceResult.surface,
          surface_reason: surfaceResult.reason,
          synced_at: new Date().toISOString(),
        } as never, { onConflict: 'user_id,external_id' })
    }

    // Update integration last sync
    await supabase
      .from('integrations')
      .update({ last_sync_at: new Date().toISOString() } as never)
      .eq('id', integration.id)

    return NextResponse.json({ synced: allTasks.length })
  } catch (error) {
    console.error('Asana sync error:', error)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}
