// Slack OAuth - Step 2: Handle callback from Slack
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  // Check for errors from Slack
  if (error) {
    console.error('Slack OAuth error:', error)
    return NextResponse.redirect(
      new URL(`/dashboard/integrations?error=${encodeURIComponent(error)}`, request.url)
    )
  }

  // Verify state to prevent CSRF
  const storedState = request.cookies.get('slack_oauth_state')?.value
  if (!state || state !== storedState) {
    return NextResponse.redirect(
      new URL('/dashboard/integrations?error=invalid_state', request.url)
    )
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/dashboard/integrations?error=no_code', request.url)
    )
  }

  // Get current user
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.SLACK_CLIENT_ID!,
        client_secret: process.env.SLACK_CLIENT_SECRET!,
        code: code,
        redirect_uri: getRedirectUri(request),
      }),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenData.ok) {
      console.error('Slack token exchange failed:', tokenData.error)
      return NextResponse.redirect(
        new URL(`/dashboard/integrations?error=${encodeURIComponent(tokenData.error)}`, request.url)
      )
    }

    // Extract token and workspace info
    const accessToken = tokenData.access_token
    const teamId = tokenData.team?.id
    const teamName = tokenData.team?.name
    const authedUser = tokenData.authed_user

    // Store the integration in Supabase
    const { error: dbError } = await supabase
      .from('integrations')
      .upsert({
        user_id: user.id,
        provider: 'slack',
        access_token: accessToken, // In production, encrypt this!
        team_id: teamId,
        team_name: teamName,
        authed_user_id: authedUser?.id,
        scopes: tokenData.scope,
        connected_at: new Date().toISOString(),
        status: 'active'
      }, {
        onConflict: 'user_id,provider'
      })

    if (dbError) {
      console.error('Failed to store integration:', dbError)
      // Still redirect to success - token exchange worked
    }

    // Clear the state cookie
    const response = NextResponse.redirect(
      new URL('/dashboard/setup?connected=slack', request.url)
    )
    response.cookies.delete('slack_oauth_state')
    
    return response

  } catch (err) {
    console.error('Slack OAuth callback error:', err)
    return NextResponse.redirect(
      new URL('/dashboard/integrations?error=callback_failed', request.url)
    )
  }
}

function getRedirectUri(request: NextRequest): string {
  const host = request.headers.get('host') || 'localhost:3000'
  const protocol = host.includes('localhost') ? 'http' : 'https'
  return `${protocol}://${host}/api/integrations/slack/callback`
}
