import { NextResponse } from 'next/server'

export async function GET() {
  const clientId = process.env.CLICKUP_CLIENT_ID
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/clickup/callback`

  if (!clientId) {
    return NextResponse.json({ error: 'ClickUp not configured' }, { status: 500 })
  }

  const authUrl = new URL('https://app.clickup.com/api')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)

  return NextResponse.json({ url: authUrl.toString() })
}
