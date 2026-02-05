import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getJiraIssues, getJiraWatchedIssues, normalizeJiraIssue, getJiraCloudId } from '@/lib/jira'
import { getValidAccessToken } from '@/lib/token-refresh'
import type { Integration } from '@/types'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get Jira integration
    const { data: integration } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'jira')
      .single()

    const typedIntegration = integration as unknown as Integration | null

    if (!typedIntegration || !typedIntegration.workspace_id) {
      return NextResponse.json({ error: 'Jira not connected' }, { status: 400 })
    }

    // Get valid access token (handles decryption + auto-refresh)
    const { token: accessToken, error: tokenError } = await getValidAccessToken(user.id, 'jira')
    
    if (tokenError || !accessToken) {
      console.error('[Jira Sync] Token error:', tokenError)
      return NextResponse.json({ error: tokenError || 'Token unavailable' }, { status: 401 })
    }

    // Get cloud URL for building issue links
    const clouds = await getJiraCloudId(accessToken)
    const cloudInfo = clouds.find(c => c.id === typedIntegration.workspace_id)
    const cloudUrl = cloudInfo?.url || ''

    // Fetch assigned issues
    const assignedIssues = await getJiraIssues(
      accessToken,
      typedIntegration.workspace_id
    )

    // Fetch watched issues
    const watchedIssues = await getJiraWatchedIssues(
      accessToken,
      typedIntegration.workspace_id
    )

    // Combine and dedupe
    const allIssuesMap = new Map()
    for (const issue of [...assignedIssues, ...watchedIssues]) {
      allIssuesMap.set(issue.id, issue)
    }
    const allIssues = Array.from(allIssuesMap.values())

    // Normalize issues
    const normalizedIssues = allIssues.map(issue => 
      normalizeJiraIssue(issue, cloudUrl)
    )

    // Save to work_items table
    for (const issue of normalizedIssues) {
      await supabase.from('work_items').upsert({
        user_id: user.id,
        source: 'jira',
        source_id: issue.id,
        title: `[${issue.key}] ${issue.title}`,
        description: issue.description,
        status: issue.status,
        due_date: issue.due_date,
        project: issue.project,
        url: issue.url,
        urgency: issue.urgency,
        is_blocked: issue.is_blocked,
        raw_data: issue,
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
      .eq('provider', 'jira')

    return NextResponse.json({
      success: true,
      synced: normalizedIssues.length,
    })
  } catch (error) {
    console.error('Jira sync error:', error)
    return NextResponse.json(
      { error: 'Failed to sync Jira issues' },
      { status: 500 }
    )
  }
}
