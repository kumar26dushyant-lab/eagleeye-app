// Fetch Slack channels for the user
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { WebClient } from '@slack/web-api'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get Slack client
  let slackToken: string | undefined

  // First check user's OAuth token
  const { data: integration } = await supabase
    .from('integrations')
    .select('access_token')
    .eq('user_id', user.id)
    .eq('provider', 'slack')
    .eq('is_active', true)
    .single()

  if (integration?.access_token) {
    slackToken = integration.access_token
  } else if (process.env.SLACK_BOT_TOKEN) {
    slackToken = process.env.SLACK_BOT_TOKEN
  }

  if (!slackToken) {
    return NextResponse.json({ error: 'Slack not connected' }, { status: 400 })
  }

  try {
    const client = new WebClient(slackToken)
    
    const result = await client.conversations.list({
      types: 'public_channel,private_channel',
      limit: 100,
      exclude_archived: true,
    })

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // Return channels with relevant info
    const channels = (result.channels || []).map(ch => ({
      id: ch.id,
      name: ch.name,
      is_member: ch.is_member,
      is_private: ch.is_private,
      num_members: ch.num_members,
      purpose: ch.purpose?.value,
      topic: ch.topic?.value,
    }))

    return NextResponse.json({ channels })
  } catch (error) {
    console.error('Failed to fetch Slack channels:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch channels',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
