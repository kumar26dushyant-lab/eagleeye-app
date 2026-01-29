import { NextResponse } from 'next/server'

export async function GET() {
  const clientId = process.env.TEAMS_CLIENT_ID
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/teams/callback`

  if (!clientId) {
    return NextResponse.json({ error: 'Microsoft Teams not configured' }, { status: 500 })
  }

  // Microsoft OAuth 2.0 scopes for Teams
  const scopes = [
    'User.Read',
    'Team.ReadBasic.All',
    'Channel.ReadBasic.All',
    'ChannelMessage.Read.All',
    'Chat.Read',
    'offline_access',
  ].join(' ')

  const state = crypto.randomUUID()
  
  const authUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('scope', scopes)
  authUrl.searchParams.set('state', state)
  authUrl.searchParams.set('response_mode', 'query')

  return NextResponse.json({ url: authUrl.toString() })
}
