import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=no_code`
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/login`
    )
  }

  try {
    // Exchange code for token
    const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.SLACK_CLIENT_ID!,
        client_secret: process.env.SLACK_CLIENT_SECRET!,
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/slack/callback`,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenData.ok) {
      throw new Error(tokenData.error || 'Token exchange failed')
    }

    // Save integration
    await supabase
      .from('integrations')
      .upsert({
        user_id: user.id,
        provider: 'slack',
        access_token: tokenData.access_token,
        workspace_id: tokenData.team?.id,
        workspace_name: tokenData.team?.name,
        is_active: true,
        last_sync_at: new Date().toISOString(),
      } as never, { onConflict: 'user_id,provider' })

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?success=slack`
    )
  } catch (error) {
    console.error('Slack OAuth error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=oauth_failed`
    )
  }
}
