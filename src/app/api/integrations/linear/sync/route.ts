import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { processWorkItemNotifications } from '@/lib/notifications/triggers'
import { 
  getMyLinearIssues,
  getLinearTeams,
  getTeamIssues,
  linearIssueToWorkItem
} from '@/lib/integrations/linear'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { token, teamId, includeTeamIssues = false } = body as { 
      token?: string
      teamId?: string
      includeTeamIssues?: boolean
    }

    // Get issues assigned to user
    let issues = await getMyLinearIssues(token)
    
    // Optionally also get team issues
    if (includeTeamIssues) {
      const teams = await getLinearTeams(token)
      
      // If specific team requested, only get that team's issues
      const teamsToFetch = teamId 
        ? teams.filter(t => t.id === teamId)
        : teams.slice(0, 3) // Limit to 3 teams
      
      for (const team of teamsToFetch) {
        try {
          const teamIssues = await getTeamIssues(team.id, token)
          // Add team issues not already in the list
          const existingIds = new Set(issues.map(i => i.id))
          const newIssues = teamIssues.filter(i => !existingIds.has(i.id))
          issues = [...issues, ...newIssues]
        } catch (error) {
          console.error(`Error fetching issues from team ${team.id}:`, error)
        }
      }
    }

    // Convert to work items
    const workItems = issues.map(i => linearIssueToWorkItem(i, user.id))

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
      console.error('[Linear Sync] Notification error:', notifError)
    }

    return NextResponse.json({
      success: true,
      issuesFound: issues.length,
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
    console.error('Linear sync error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
