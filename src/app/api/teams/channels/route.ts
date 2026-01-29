import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTeamsJoinedTeams, getTeamsChannels } from '@/lib/teams'
import type { Integration } from '@/types'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get Teams integration
    const { data: integration } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'teams')
      .single()

    const typedIntegration = integration as unknown as Integration | null

    if (!typedIntegration) {
      return NextResponse.json({ error: 'Teams not connected' }, { status: 400 })
    }

    // Fetch teams
    const teams = await getTeamsJoinedTeams(typedIntegration.access_token)

    // Fetch channels for each team
    const teamsWithChannels = await Promise.all(
      teams.map(async (team) => {
        const channels = await getTeamsChannels(typedIntegration.access_token, team.id)
        return {
          id: team.id,
          name: team.displayName,
          description: team.description,
          channels: channels.map(ch => ({
            id: ch.id,
            name: ch.displayName,
            description: ch.description,
            teamId: team.id,
            teamName: team.displayName,
          })),
        }
      })
    )

    // Get supervised channels
    const { data: supervisedChannels } = await supabase
      .from('supervised_channels')
      .select('*')
      .eq('user_id', user.id)
      .eq('source', 'teams')

    const supervisedIds = new Set(
      (supervisedChannels || []).map((sc: { channel_id: string }) => sc.channel_id)
    )

    return NextResponse.json({
      teams: teamsWithChannels,
      supervisedChannelIds: Array.from(supervisedIds),
    })
  } catch (error) {
    console.error('Error fetching Teams channels:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Teams channels' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { channelIds } = body as { channelIds: Array<{ channelId: string; teamId: string; channelName: string; teamName: string }> }

    // Clear existing supervised channels for Teams
    await supabase
      .from('supervised_channels')
      .delete()
      .eq('user_id', user.id)
      .eq('source', 'teams')

    // Insert new supervised channels
    if (channelIds.length > 0) {
      const channelsToInsert = channelIds.map(ch => ({
        user_id: user.id,
        source: 'teams',
        channel_id: ch.channelId,
        channel_name: ch.channelName,
        workspace_id: ch.teamId,
        workspace_name: ch.teamName,
      }))

      await supabase.from('supervised_channels').insert(channelsToInsert as never)
    }

    return NextResponse.json({ success: true, count: channelIds.length })
  } catch (error) {
    console.error('Error saving Teams channels:', error)
    return NextResponse.json(
      { error: 'Failed to save Teams channels' },
      { status: 500 }
    )
  }
}
