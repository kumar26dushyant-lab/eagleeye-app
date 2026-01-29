import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getClickUpWorkspaces } from '@/lib/clickup'
import type { Integration } from '@/types'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=no_code`
    )
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://api.clickup.com/api/v2/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.CLICKUP_CLIENT_ID,
        client_secret: process.env.CLICKUP_CLIENT_SECRET,
        code,
      }),
    })

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token')
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Get workspaces (teams in ClickUp API)
    const workspaces = await getClickUpWorkspaces(accessToken)
    const primaryWorkspace = workspaces[0]

    // Save integration
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login`
      )
    }

    // Upsert integration
    const { error } = await supabase
      .from('integrations')
      .upsert({
        user_id: user.id,
        provider: 'clickup',
        access_token: accessToken,
        workspace_id: primaryWorkspace?.id || null,
        workspace_name: primaryWorkspace?.name || null,
        is_active: true,
      } as never, {
        onConflict: 'user_id,provider',
      })

    if (error) {
      console.error('Error saving ClickUp integration:', error)
      throw error
    }

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?success=clickup`
    )
  } catch (error) {
    console.error('ClickUp OAuth error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=clickup_auth_failed`
    )
  }
}
