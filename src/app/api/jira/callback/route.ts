import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getJiraCloudId } from '@/lib/jira'
import { encryptToken } from '@/lib/encryption'
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
    const tokenResponse = await fetch('https://auth.atlassian.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: process.env.JIRA_CLIENT_ID,
        client_secret: process.env.JIRA_CLIENT_SECRET,
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/jira/callback`,
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('Jira token error:', errorData)
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
    
    // Calculate token expiry (Jira tokens expire in 1 hour)
    const tokenExpiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : new Date(Date.now() + 3600 * 1000).toISOString() // Default 1 hour

    // Get cloud resources (Jira sites)
    const cloudResources = await getJiraCloudId(accessToken)
    const primaryCloud = cloudResources[0]

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
        provider: 'jira',
        access_token: encryptedAccessToken,
        refresh_token: encryptedRefreshToken,
        token_expires_at: tokenExpiresAt,
        workspace_id: primaryCloud?.id || null,
        workspace_name: primaryCloud?.name || null,
        is_active: true,
      } as never, {
        onConflict: 'user_id,provider',
      })

    if (error) {
      console.error('Error saving Jira integration:', error)
      throw error
    }

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?success=jira`
    )
  } catch (error) {
    console.error('Jira OAuth error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=jira_auth_failed`
    )
  }
}
