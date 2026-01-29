import { NextResponse } from 'next/server'

export async function GET() {
  const clientId = process.env.SLACK_CLIENT_ID
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/slack/callback`

  if (!clientId) {
    return NextResponse.json({ error: 'Slack not configured' }, { status: 500 })
  }

  const scopes = [
    'channels:read',
    'channels:history',
    'users:read',
    'users:read.email',
    'chat:write',
    'im:write',
  ].join(',')

  const authUrl = new URL('https://slack.com/oauth/v2/authorize')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('scope', scopes)

  return NextResponse.json({ url: authUrl.toString() })
}
