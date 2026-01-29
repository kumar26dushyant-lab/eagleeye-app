import { NextResponse } from 'next/server'

export async function GET() {
  const clientId = process.env.JIRA_CLIENT_ID
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/jira/callback`

  if (!clientId) {
    return NextResponse.json({ error: 'Jira not configured' }, { status: 500 })
  }

  // Jira OAuth 2.0 (3LO)
  const scopes = [
    'read:jira-user',
    'read:jira-work',
    'offline_access',
  ].join(' ')

  const state = crypto.randomUUID()
  
  const authUrl = new URL('https://auth.atlassian.com/authorize')
  authUrl.searchParams.set('audience', 'api.atlassian.com')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('scope', scopes)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('state', state)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('prompt', 'consent')

  return NextResponse.json({ url: authUrl.toString() })
}
