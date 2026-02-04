import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { processWorkItemNotifications } from '@/lib/notifications/triggers'
import { 
  getWorkspaces,
  getMyTasks,
  taskToWorkItem
} from '@/lib/integrations/asana'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { token, workspaceId, includeCompleted = false } = body as { 
      token?: string
      workspaceId?: string
      includeCompleted?: boolean
    }

    // Get workspaces to sync
    let workspaces
    if (workspaceId) {
      workspaces = [{ gid: workspaceId, name: 'Selected Workspace' }]
    } else {
      workspaces = await getWorkspaces(token)
    }

    // Fetch all tasks across workspaces
    const allTasks = []
    
    for (const workspace of workspaces) {
      try {
        const tasks = await getMyTasks(workspace.gid, token)
        
        // Filter out completed tasks if requested
        const filteredTasks = includeCompleted 
          ? tasks 
          : tasks.filter(t => !t.completed)
        
        allTasks.push(...filteredTasks.map(t => ({ ...t, workspaceName: workspace.name })))
      } catch (error) {
        console.error(`Error fetching tasks from workspace ${workspace.gid}:`, error)
        // Continue with other workspaces
      }
    }

    // Convert to work items
    const workItems = allTasks.map(t => taskToWorkItem(t, user.id))

    // Calculate stats
    const surfacedCount = workItems.filter(i => i.is_surfaced).length
    const highUrgency = workItems.filter(i => i.urgency === 'high').length
    const blockedCount = workItems.filter(i => i.is_blocked).length

    // Trigger realtime notifications for blockers and overdue tasks
    let notificationsTriggered = { blockers: 0, overdue: 0 }
    try {
      notificationsTriggered = await processWorkItemNotifications(
        user.id,
        workItems.map(w => ({
          id: w.id || '',
          title: w.title,
          is_blocked: w.is_blocked,
          due_date: w.due_date || undefined,
          url: w.url || undefined,
        }))
      )
    } catch (notifError) {
      console.error('[Asana Sync] Notification error:', notifError)
    }

    return NextResponse.json({
      success: true,
      workspacesSynced: workspaces.length,
      tasksFound: allTasks.length,
      workItemsCreated: workItems.length,
      notificationsTriggered,
      stats: {
        surfaced: surfacedCount,
        highUrgency,
        blocked: blockedCount,
      },
      workItems,
    })
  } catch (error) {
    console.error('Asana sync error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
