// Check integration status and available channels
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { WebClient } from '@slack/web-api'

async function getSlackToken(supabase: Awaited<ReturnType<typeof createClient>>) {
  // First check database for user's token
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    const { data: integration } = await supabase
      .from('integrations')
      .select('access_token, workspace_name')
      .eq('user_id', user.id)
      .eq('provider', 'slack')
      .eq('is_active', true)
      .single()
    
    if (integration?.access_token) {
      return { token: integration.access_token, teamName: integration.workspace_name }
    }
  }
  
  // Fallback to env token
  if (process.env.SLACK_BOT_TOKEN) {
    return { token: process.env.SLACK_BOT_TOKEN, teamName: 'EagleEye' }
  }
  
  return null
}

async function getAsanaToken(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    const { data: integration } = await supabase
      .from('integrations')
      .select('access_token')
      .eq('user_id', user.id)
      .eq('provider', 'asana')
      .eq('is_active', true)
      .single()
    
    if (integration?.access_token) {
      return integration.access_token
    }
  }
  
  return process.env.ASANA_ACCESS_TOKEN || null
}

async function getLinearToken(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    const { data: integration } = await supabase
      .from('integrations')
      .select('access_token')
      .eq('user_id', user.id)
      .eq('provider', 'linear' as 'slack') // Cast to bypass type check - schema may vary
      .eq('is_active', true)
      .single()
    
    if (integration?.access_token) {
      return integration.access_token
    }
  }
  
  return process.env.LINEAR_API_KEY || null
}

async function getWhatsAppStatus(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    const { data: integration } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'whatsapp' as any)
      .single()
    
    if (integration) {
      return {
        connected: true,
        phoneNumber: integration.workspace_id || undefined,
        accountName: integration.workspace_name || undefined,
      }
    }
  }
  
  return { connected: false }
}

export async function GET() {
  const supabase = await createClient()

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
      status?: string
      lastSync?: string
      scopes?: string[]
      error?: string
    }
    asana: { connected: boolean }
    linear: { connected: boolean }
    whatsapp: { 
      connected: boolean
      phoneNumber?: string
      accountName?: string
      connectedAt?: string
    }
  } = {
    slack: { connected: false },
    asana: { connected: false },
    linear: { connected: false },
    whatsapp: { connected: false },
  }

  // Check Asana
  const asanaToken = await getAsanaToken(supabase)
  result.asana = { connected: !!asanaToken }

  // Check Linear
  const linearToken = await getLinearToken(supabase)
  result.linear = { connected: !!linearToken }

  // Check WhatsApp
  result.whatsapp = await getWhatsAppStatus(supabase)

  // Check Slack
  try {
    const slackData = await getSlackToken(supabase)
    
    if (slackData) {
      const client = new WebClient(slackData.token)
      
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
        teamName: slackData.teamName || (authTest.team as string) || 'Workspace',
        status: 'healthy',
        channels: (channelsResult.channels || []).map(ch => ({
          id: ch.id || '',
          name: ch.name || 'unknown',
          is_member: ch.is_member || false,
          num_members: ch.num_members || 0,
        })).sort((a, b) => b.num_members - a.num_members),
      }
    }
  } catch (err) {
    console.error('Failed to check Slack status:', err)
    result.slack = { connected: false, error: 'Failed to connect' }
  }

  return NextResponse.json(result)
}
