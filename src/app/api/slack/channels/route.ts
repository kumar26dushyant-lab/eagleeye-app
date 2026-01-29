import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Integration, SupervisedChannel } from '@/types'

export async function GET() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get Slack integration
  const { data } = await supabase
    .from('integrations')
    .select('*')
    .eq('user_id', user.id)
    .eq('provider', 'slack')
    .eq('is_active', true)
    .single()

  const integration = data as unknown as Integration | null

  if (!integration) {
    return NextResponse.json({ error: 'Slack not connected' }, { status: 400 })
  }

  try {
    // Get channels
    const response = await fetch('https://slack.com/api/conversations.list?types=public_channel,private_channel&exclude_archived=true', {
      headers: { Authorization: `Bearer ${integration.access_token}` },
    })

    const slackData = await response.json()

    if (!slackData.ok) {
      throw new Error(slackData.error || 'Failed to fetch channels')
    }

    const channels = slackData.channels?.map((channel: { id: string; name: string; is_member: boolean }) => ({
      id: channel.id,
      name: channel.name,
      is_member: channel.is_member,
    })) || []

    // Get supervised channels
    const { data: supervisedData } = await supabase
      .from('supervised_channels')
      .select('channel_id')
      .eq('user_id', user.id)
      .eq('is_active', true)

    const supervisedChannels = (supervisedData || []) as unknown as SupervisedChannel[]
    const supervisedIds = new Set(supervisedChannels.map(c => c.channel_id))

    return NextResponse.json({
      channels: channels.map((c: { id: string; name: string; is_member: boolean }) => ({
        ...c,
        is_supervised: supervisedIds.has(c.id),
      })),
    })
  } catch (error) {
    console.error('Slack channels error:', error)
    return NextResponse.json({ error: 'Failed to fetch channels' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { channelIds } = await request.json()

  if (!Array.isArray(channelIds)) {
    return NextResponse.json({ error: 'Invalid channel IDs' }, { status: 400 })
  }

  // Get channel details from Slack
  const { data } = await supabase
    .from('integrations')
    .select('access_token')
    .eq('user_id', user.id)
    .eq('provider', 'slack')
    .single()

  const integration = data as unknown as { access_token: string } | null

  if (!integration) {
    return NextResponse.json({ error: 'Slack not connected' }, { status: 400 })
  }

  // Deactivate all existing
  await supabase
    .from('supervised_channels')
    .update({ is_active: false } as never)
    .eq('user_id', user.id)

  // Get channel names and upsert
  const response = await fetch('https://slack.com/api/conversations.list?types=public_channel,private_channel', {
    headers: { Authorization: `Bearer ${integration.access_token}` },
  })
  const slackData = await response.json()
  const channelMap = new Map(slackData.channels?.map((c: { id: string; name: string }) => [c.id, c.name]) || [])

  for (const channelId of channelIds) {
    await supabase
      .from('supervised_channels')
      .upsert({
        user_id: user.id,
        channel_id: channelId,
        channel_name: channelMap.get(channelId) || channelId,
        is_active: true,
      } as never, { onConflict: 'user_id,channel_id' })
  }

  return NextResponse.json({ success: true })
}
