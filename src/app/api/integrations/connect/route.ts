// Connect integration - saves token for user
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// For MVP: Store tokens in a simple way
// In production: Use proper encryption and database storage

export async function POST(request: NextRequest) {
  try {
    const { provider, token, workspace } = await request.json()
    
    if (!provider || !token) {
      return NextResponse.json({ error: 'Provider and token are required' }, { status: 400 })
    }

    const validProviders = ['slack', 'asana', 'linear', 'clickup', 'jira', 'notion', 'github', 'teams']
    if (!validProviders.includes(provider)) {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // For MVP without auth: Store in environment-like runtime storage
    // This is NOT persisted across server restarts - for demo purposes only
    if (!user) {
      // Store in process.env for runtime access
      const envKey = getEnvKeyForProvider(provider)
      if (envKey) {
        process.env[envKey] = token
      }
      
      return NextResponse.json({
        success: true,
        message: `${provider} connected successfully`,
        note: 'Token stored for this session. Add to .env.local for persistence.',
        provider,
        workspace,
      })
    }

    // For authenticated users: Store in database
    const { error } = await supabase
      .from('integrations')
      .upsert({
        user_id: user.id,
        provider,
        access_token: token, // In production: encrypt this!
        workspace_name: workspace,
        connected_at: new Date().toISOString(),
        is_active: true,
      }, {
        onConflict: 'user_id,provider',
      })

    if (error) {
      console.error('[Connect] Database error:', error)
      // Fallback to runtime storage
      const envKey = getEnvKeyForProvider(provider)
      if (envKey) {
        process.env[envKey] = token
      }
    }

    return NextResponse.json({
      success: true,
      message: `${provider} connected successfully`,
      provider,
      workspace,
    })
  } catch (error) {
    console.error('[Connect] Error:', error)
    return NextResponse.json({ error: 'Failed to save connection' }, { status: 500 })
  }
}

function getEnvKeyForProvider(provider: string): string | null {
  const envKeys: Record<string, string> = {
    slack: 'SLACK_BOT_TOKEN',
    asana: 'ASANA_ACCESS_TOKEN',
    linear: 'LINEAR_API_KEY',
    clickup: 'CLICKUP_ACCESS_TOKEN',
    jira: 'JIRA_ACCESS_TOKEN',
    notion: 'NOTION_ACCESS_TOKEN',
    github: 'GITHUB_ACCESS_TOKEN',
    teams: 'TEAMS_ACCESS_TOKEN',
  }
  return envKeys[provider] || null
}
