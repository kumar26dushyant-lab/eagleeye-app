import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { 
  createSlackClient,
  getSlackChannels, 
  getAuthenticatedUserId,
  findMentions, 
  mentionToSignal,
} from '@/lib/integrations/slack'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { token, channelIds, hoursBack = 24 } = body as { 
      token?: string
      channelIds?: string[]
      hoursBack?: number
    }
    
    // Create Slack client
    const client = createSlackClient(token)
    
    // Get the authenticated user's ID
    const slackUserId = await getAuthenticatedUserId(client)
    
    if (!slackUserId) {
      return NextResponse.json(
        { error: 'Could not determine Slack user ID' },
        { status: 400 }
      )
    }

    // Get channels to sync
    let channels = await getSlackChannels(client)
    
    if (channelIds && channelIds.length > 0) {
      // Filter to specified channels
      channels = channels.filter(c => channelIds.includes(c.id))
    }

    // Find all mentions across channels (limit to 10 to avoid rate limits)
    const channelsToScan = channels.filter(c => c.is_member).slice(0, 10)
    const mentions = await findMentions(client, slackUserId, channelsToScan, hoursBack)

    // Convert to signals
    const signals = mentions.map(m => mentionToSignal(m, user.id))
    
    // For now, return the signals without DB storage
    // (DB schema may not match exactly)
    return NextResponse.json({
      success: true,
      channelsSynced: channelsToScan.length,
      mentionsFound: mentions.length,
      signalsCreated: signals.length,
      signals,
    })
  } catch (error) {
    console.error('Slack sync error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
