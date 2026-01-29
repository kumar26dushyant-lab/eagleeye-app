// Slack OAuth - Step 1: Redirect user to Slack authorization
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const clientId = process.env.SLACK_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'Slack not configured' }, { status: 500 })
  }

  // Generate state token to prevent CSRF
  const state = crypto.randomUUID()
  
  // Store state in cookie for verification on callback
  const response = NextResponse.redirect(
    `https://slack.com/oauth/v2/authorize?` +
    `client_id=${clientId}&` +
    `scope=channels:history,channels:read,channels:join,users:read,users:read.email,team:read&` +
    `redirect_uri=${encodeURIComponent(getRedirectUri(request))}&` +
    `state=${state}`
  )
  
  response.cookies.set('slack_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600 // 10 minutes
  })
  
  return response
}

function getRedirectUri(request: NextRequest): string {
  const host = request.headers.get('host') || 'localhost:3000'
  const protocol = host.includes('localhost') ? 'http' : 'https'
  return `${protocol}://${host}/api/integrations/slack/callback`
}
