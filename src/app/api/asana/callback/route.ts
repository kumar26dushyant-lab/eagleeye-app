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
    const tokenResponse = await fetch('https://app.asana.com/-/oauth_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.ASANA_CLIENT_ID!,
        client_secret: process.env.ASANA_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/asana/callback`,
        code,
      }),
    })

    if (!tokenResponse.ok) {
      throw new Error('Token exchange failed')
    }

    const tokenData = await tokenResponse.json()

    // Get workspace info
    const workspacesResponse = await fetch('https://app.asana.com/api/1.0/workspaces', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })

    const workspacesData = await workspacesResponse.json()
    const workspace = workspacesData.data?.[0]

    // Save integration
    await supabase
      .from('integrations')
      .upsert({
        user_id: user.id,
        provider: 'asana',
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        workspace_id: workspace?.gid,
        workspace_name: workspace?.name,
        is_active: true,
        last_sync_at: new Date().toISOString(),
      } as never, { onConflict: 'user_id,provider' })

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?success=asana`
    )
  } catch (error) {
    console.error('Asana OAuth error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=oauth_failed`
    )
  }
}
