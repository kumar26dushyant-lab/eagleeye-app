// Check integration status and available channels
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { WebClient } from '@slack/web-api'

async function getSlackClient() {
  // For now, just use env token - OAuth tokens would come from database
  if (process.env.SLACK_BOT_TOKEN) {
    return { client: new WebClient(process.env.SLACK_BOT_TOKEN), teamName: 'EagleEye' }
  }
  return null
}

export async function GET() {
  await createClient() // Keep for future auth checks

  const result: {
    slack: {
      connected: boolean
      teamName?: string
      channels?: Array<{
        id: string
        name: string
        is_member: boolean
        num_members: number
      }>
      error?: string
    }
    asana: { connected: boolean }
    linear: { connected: boolean }
  } = {
    slack: { connected: false },
    asana: { connected: !!process.env.ASANA_ACCESS_TOKEN },
    linear: { connected: !!process.env.LINEAR_API_KEY },
  }

  try {
    const slackData = await getSlackClient()
    
    if (slackData) {
      const { client, teamName } = slackData
      
      // Test connection
      const authTest = await client.auth.test()
      if (!authTest.ok) {
        result.slack = { connected: false, error: 'Invalid token' }
        return NextResponse.json(result)
      }

      // Get channels
      const channelsResult = await client.conversations.list({
        types: 'public_channel',
        limit: 100,
        exclude_archived: true,
      })

      result.slack = {
        connected: true,
        teamName: teamName || authTest.team || 'Workspace',
        channels: (channelsResult.channels || []).map(ch => ({
          id: ch.id || '',
          name: ch.name || 'unknown',
          is_member: ch.is_member || false,
          num_members: ch.num_members || 0,
        })).sort((a, b) => b.num_members - a.num_members), // Most active first
      }
    }
  } catch (err) {
    console.error('Failed to check Slack status:', err)
    result.slack = { connected: false, error: 'Failed to connect' }
  }

  return NextResponse.json(result)
}
