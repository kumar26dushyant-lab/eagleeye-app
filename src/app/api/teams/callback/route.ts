import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { encryptToken } from '@/lib/encryption'
import type { Integration } from '@/types'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=${error}`
    )
  }

  if (!code) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=no_code`
    )
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch(
      'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.TEAMS_CLIENT_ID!,
          client_secret: process.env.TEAMS_CLIENT_SECRET!,
          code,
          redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/teams/callback`,
          grant_type: 'authorization_code',
        }),
      }
    )

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('Teams token error:', errorData)
      throw new Error('Failed to exchange code for token')
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token
    const refreshToken = tokenData.refresh_token

    // Encrypt tokens before storing
    const encryptedAccessToken = await encryptToken(accessToken)
    const encryptedRefreshToken = refreshToken 
      ? await encryptToken(refreshToken) 
      : null
    
    // Calculate token expiry (Teams tokens expire in 1 hour)
    const tokenExpiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : new Date(Date.now() + 3600 * 1000).toISOString() // Default 1 hour

    // Get user info to get tenant/organization
    const userResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    let tenantName = null
    if (userResponse.ok) {
      const userData = await userResponse.json()
      // Try to get organization
      const orgResponse = await fetch('https://graph.microsoft.com/v1.0/organization', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      if (orgResponse.ok) {
        const orgData = await orgResponse.json()
        tenantName = orgData.value?.[0]?.displayName || userData.mail?.split('@')[1] || 'Teams'
      }
    }

    // Save integration
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login`
      )
    }

    // Upsert integration
    const { error: dbError } = await supabase
      .from('integrations')
      .upsert({
        user_id: user.id,
        provider: 'teams',
        access_token: encryptedAccessToken,
        refresh_token: encryptedRefreshToken,
        token_expires_at: tokenExpiresAt,
        workspace_id: null, // Will be set when user selects teams/channels
        workspace_name: tenantName,
        is_active: true,
      } as never, {
        onConflict: 'user_id,provider',
      })

    if (dbError) {
      console.error('Error saving Teams integration:', dbError)
      throw dbError
    }

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?success=teams`
    )
  } catch (error) {
    console.error('Teams OAuth error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=teams_auth_failed`
    )
  }
}
