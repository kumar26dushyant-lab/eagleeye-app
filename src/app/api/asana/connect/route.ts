import { NextResponse } from 'next/server'

export async function GET() {
  const clientId = process.env.ASANA_CLIENT_ID
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/asana/callback`

  if (!clientId) {
    return NextResponse.json({ error: 'Asana not configured' }, { status: 500 })
  }

  const authUrl = new URL('https://app.asana.com/-/oauth_authorize')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('response_type', 'code')

  return NextResponse.json({ url: authUrl.toString() })
}
