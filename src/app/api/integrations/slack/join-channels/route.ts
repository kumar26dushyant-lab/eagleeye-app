// Join Slack channels - auto-join the bot to selected channels
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { WebClient } from '@slack/web-api'

async function getSlackClient(userId: string | null, supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never) {
  if (userId) {
    const { data: integration } = await supabase
      .from('integrations')
      .select('access_token')
      .eq('user_id', userId)
      .eq('provider', 'slack')
      .eq('is_active', true)
      .single()

    if (integration?.access_token) {
      return new WebClient(integration.access_token)
    }
  }

  if (process.env.SLACK_BOT_TOKEN) {
    return new WebClient(process.env.SLACK_BOT_TOKEN)
  }

  return null
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { channelIds } = await request.json()

  if (!channelIds || !Array.isArray(channelIds) || channelIds.length === 0) {
    return NextResponse.json({ success: false, error: 'No channels selected' }, { status: 400 })
  }

  const client = await getSlackClient(user?.id || null, supabase)
  if (!client) {
    return NextResponse.json({ success: false, error: 'Slack not connected' }, { status: 400 })
  }

  const results: { channelId: string; success: boolean; error?: string }[] = []

  for (const channelId of channelIds) {
    try {
      // Join the channel (bot joins itself)
      await client.conversations.join({ channel: channelId })
      results.push({ channelId, success: true })
    } catch (err: unknown) {
      const error = err as { data?: { error?: string } }
      // "already_in_channel" is fine
      if (error.data?.error === 'already_in_channel') {
        results.push({ channelId, success: true })
      } else {
        console.error(`Failed to join channel ${channelId}:`, err)
        results.push({ channelId, success: false, error: error.data?.error || 'Unknown error' })
      }
    }
  }

  const successCount = results.filter(r => r.success).length
  const failedCount = results.filter(r => !r.success).length

  // Store selected channels in user preferences (if logged in)
  if (user) {
    await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        monitored_channels: channelIds,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
  }

  return NextResponse.json({
    success: failedCount === 0,
    message: `Joined ${successCount} channel${successCount !== 1 ? 's' : ''}${failedCount > 0 ? `, ${failedCount} failed` : ''}`,
    results,
  })
}
