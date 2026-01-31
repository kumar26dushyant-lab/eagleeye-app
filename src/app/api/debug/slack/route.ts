// Diagnostic endpoint to check Slack integration status
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { WebClient } from '@slack/web-api'

export async function GET() {
  const diagnostics: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    checks: {},
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    diagnostics.user = user ? { id: user.id, email: user.email } : null

    if (!user) {
      diagnostics.checks = { auth: 'No user logged in' }
      return NextResponse.json(diagnostics)
    }

    // Check database for integration - select all columns to see what exists
    const { data: integration, error: dbError } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'slack')
      .single()

    if (dbError) {
      diagnostics.checks = { 
        database: `Error: ${dbError.message}`,
        hint: 'No Slack integration found in database'
      }
      return NextResponse.json(diagnostics)
    }

    // Show all columns to diagnose schema
    diagnostics.integration = integration
    diagnostics.integration_columns = integration ? Object.keys(integration) : []
    
    // Mask the token for security but show it exists
    if (integration?.access_token) {
      diagnostics.integration = {
        ...integration,
        access_token: `${String(integration.access_token).substring(0, 10)}...${String(integration.access_token).slice(-4)}`,
      }
    }

    // Test the token
    if (integration?.access_token) {
      try {
        const client = new WebClient(integration.access_token)
        
        // Test auth
        const authResult = await client.auth.test()
        diagnostics.auth_test = {
          ok: authResult.ok,
          team: authResult.team,
          user: authResult.user,
          bot_id: authResult.bot_id,
        }

        // Try to list channels (this is what fails with missing_scope)
        try {
          const channelsResult = await client.conversations.list({
            types: 'public_channel',
            limit: 5
          })
          
          const memberChannels = channelsResult.channels?.filter(c => c.is_member) || []
          
          diagnostics.channels_test = {
            ok: true,
            total_channels: channelsResult.channels?.length || 0,
            bot_is_member_of: memberChannels.length,
            sample_channels: channelsResult.channels?.slice(0, 3).map(c => ({ 
              name: c.name, 
              is_member: c.is_member 
            })),
          }

          // Test fetching messages from a channel the bot is in
          if (memberChannels.length > 0) {
            const testChannel = memberChannels[0]
            try {
              // Get messages from last 7 days
              const oldest = ((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000).toString()
              const historyResult = await client.conversations.history({
                channel: testChannel.id!,
                oldest,
                limit: 20
              })
              
              diagnostics.messages_test = {
                ok: true,
                channel: testChannel.name,
                message_count: historyResult.messages?.length || 0,
                sample_messages: historyResult.messages?.slice(0, 3).map(m => ({
                  text_preview: m.text?.substring(0, 50) + (m.text && m.text.length > 50 ? '...' : ''),
                  user: m.user,
                  ts: m.ts,
                  subtype: m.subtype || 'normal'
                }))
              }
            } catch (histErr: unknown) {
              const err = histErr as { code?: string; data?: { error?: string } }
              diagnostics.messages_test = {
                ok: false,
                channel: testChannel.name,
                error: err.data?.error || 'Failed to fetch history',
                hint: err.data?.error === 'missing_scope' 
                  ? 'Token needs channels:history scope'
                  : err.data?.error === 'not_in_channel'
                  ? 'Bot is not in this channel - needs to be invited'
                  : undefined
              }
            }
          } else {
            diagnostics.messages_test = {
              ok: false,
              error: 'Bot is not a member of any channels',
              hint: 'Invite the bot to channels or use /invite @EagleEye in Slack'
            }
          }
          
        } catch (channelErr: unknown) {
          const err = channelErr as { code?: string; data?: { error?: string } }
          diagnostics.channels_test = {
            ok: false,
            error: err.data?.error || 'Unknown error',
            code: err.code,
            hint: err.data?.error === 'missing_scope' 
              ? 'Token needs channels:read scope. Reinstall Slack app with correct scopes.'
              : undefined,
          }
        }

      } catch (tokenErr: unknown) {
        const err = tokenErr as { code?: string; data?: { error?: string } }
        diagnostics.auth_test = {
          ok: false,
          error: err.data?.error || 'Token test failed',
          code: err.code,
        }
      }
    }

    // Check env token as well
    diagnostics.env_token = process.env.SLACK_BOT_TOKEN 
      ? `Present (${process.env.SLACK_BOT_TOKEN.substring(0, 10)}...)` 
      : 'Not set'

  } catch (err) {
    diagnostics.error = err instanceof Error ? err.message : 'Unknown error'
  }

  return NextResponse.json(diagnostics, {
    headers: { 'Cache-Control': 'no-store' }
  })
}
