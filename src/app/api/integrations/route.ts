// API endpoint to check user's connected integrations
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: integrations, error } = await supabase
    .from('integrations')
    .select('provider, workspace_name, is_active, created_at, last_sync_at')
    .eq('user_id', user.id)
    .eq('is_active', true)

  if (error) {
    console.error('Failed to fetch integrations:', error)
    return NextResponse.json({ integrations: [] })
  }

  return NextResponse.json({ 
    integrations: integrations || [],
    // Also check for env-configured integrations (for testing)
    envIntegrations: {
      slack: !!process.env.SLACK_BOT_TOKEN,
      asana: !!process.env.ASANA_ACCESS_TOKEN,
      linear: !!process.env.LINEAR_API_KEY,
    }
  })
}
