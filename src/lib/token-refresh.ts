/**
 * Token Refresh Utility
 * 
 * Handles automatic token refresh for OAuth providers with short-lived tokens.
 * Each provider has different refresh endpoints and token formats.
 * 
 * Providers that need refresh:
 * - Asana: 1-hour token expiry
 * - Jira (Atlassian): 1-hour token expiry  
 * - Microsoft Teams: 1-hour token expiry
 * 
 * Providers that DON'T need refresh:
 * - Slack: Long-lived tokens
 * - Linear: API key based
 * - ClickUp: Long-lived tokens
 * - WhatsApp: Long-lived Meta tokens
 */

import { createClient } from '@supabase/supabase-js'
import { encryptToken, decryptToken, isEncryptionEnabled } from './encryption'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Buffer time before expiry to trigger refresh (5 minutes)
const REFRESH_BUFFER_MS = 5 * 60 * 1000

export interface TokenRefreshResult {
  access_token: string
  refresh_token?: string
  expires_in?: number
  success: boolean
  error?: string
}

/**
 * Check if a token needs refresh based on expiry time
 */
export function tokenNeedsRefresh(expiresAt: string | null): boolean {
  if (!expiresAt) {
    // If no expiry recorded, assume it might need refresh
    // This handles legacy tokens without expiry tracking
    return false // Be conservative - don't refresh without expiry info
  }
  
  const expiryTime = new Date(expiresAt).getTime()
  const now = Date.now()
  
  // Refresh if within buffer time of expiry
  return now >= (expiryTime - REFRESH_BUFFER_MS)
}

/**
 * Refresh Asana OAuth token
 * Asana tokens expire in 1 hour
 */
export async function refreshAsanaToken(refreshToken: string): Promise<TokenRefreshResult> {
  const clientId = process.env.ASANA_CLIENT_ID
  const clientSecret = process.env.ASANA_CLIENT_SECRET
  
  if (!clientId || !clientSecret) {
    return { 
      access_token: '', 
      success: false, 
      error: 'Asana OAuth credentials not configured' 
    }
  }

  try {
    const response = await fetch('https://app.asana.com/-/oauth_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Token Refresh] Asana refresh failed:', errorText)
      return { 
        access_token: '', 
        success: false, 
        error: `Asana refresh failed: ${response.status}` 
      }
    }

    const data = await response.json()
    
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token, // Asana returns new refresh token
      expires_in: data.expires_in || 3600,
      success: true,
    }
  } catch (error) {
    console.error('[Token Refresh] Asana refresh error:', error)
    return { 
      access_token: '', 
      success: false, 
      error: `Asana refresh error: ${error}` 
    }
  }
}

/**
 * Refresh Jira (Atlassian) OAuth token
 * Jira tokens expire in 1 hour
 */
export async function refreshJiraToken(refreshToken: string): Promise<TokenRefreshResult> {
  const clientId = process.env.JIRA_CLIENT_ID
  const clientSecret = process.env.JIRA_CLIENT_SECRET
  
  if (!clientId || !clientSecret) {
    return { 
      access_token: '', 
      success: false, 
      error: 'Jira OAuth credentials not configured' 
    }
  }

  try {
    const response = await fetch('https://auth.atlassian.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Token Refresh] Jira refresh failed:', errorText)
      return { 
        access_token: '', 
        success: false, 
        error: `Jira refresh failed: ${response.status}` 
      }
    }

    const data = await response.json()
    
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token, // Jira returns new refresh token
      expires_in: data.expires_in || 3600,
      success: true,
    }
  } catch (error) {
    console.error('[Token Refresh] Jira refresh error:', error)
    return { 
      access_token: '', 
      success: false, 
      error: `Jira refresh error: ${error}` 
    }
  }
}

/**
 * Refresh Microsoft Teams (Graph API) OAuth token
 * Teams tokens expire in 1 hour
 */
export async function refreshTeamsToken(refreshToken: string): Promise<TokenRefreshResult> {
  const clientId = process.env.TEAMS_CLIENT_ID
  const clientSecret = process.env.TEAMS_CLIENT_SECRET
  
  if (!clientId || !clientSecret) {
    return { 
      access_token: '', 
      success: false, 
      error: 'Teams OAuth credentials not configured' 
    }
  }

  try {
    const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        scope: 'https://graph.microsoft.com/.default offline_access',
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Token Refresh] Teams refresh failed:', errorText)
      return { 
        access_token: '', 
        success: false, 
        error: `Teams refresh failed: ${response.status}` 
      }
    }

    const data = await response.json()
    
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token, // Microsoft returns new refresh token
      expires_in: data.expires_in || 3600,
      success: true,
    }
  } catch (error) {
    console.error('[Token Refresh] Teams refresh error:', error)
    return { 
      access_token: '', 
      success: false, 
      error: `Teams refresh error: ${error}` 
    }
  }
}

/**
 * Generic token refresh handler
 * Automatically picks the right refresh function based on provider
 */
export async function refreshTokenForProvider(
  provider: string, 
  refreshToken: string
): Promise<TokenRefreshResult> {
  switch (provider) {
    case 'asana':
      return refreshAsanaToken(refreshToken)
    case 'jira':
      return refreshJiraToken(refreshToken)
    case 'teams':
      return refreshTeamsToken(refreshToken)
    default:
      // Providers that don't need refresh
      return { 
        access_token: '', 
        success: false, 
        error: `Provider ${provider} does not support token refresh` 
      }
  }
}

/**
 * Get a valid access token for an integration
 * Automatically refreshes if needed and updates the database
 * 
 * This is the main function to use when you need a token for API calls.
 */
export async function getValidAccessToken(
  userId: string,
  provider: string
): Promise<{ token: string | null; error?: string }> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  // Get current integration record
  const { data: integration, error: fetchError } = await supabase
    .from('integrations')
    .select('access_token, refresh_token, token_expires_at, is_active')
    .eq('user_id', userId)
    .eq('provider', provider)
    .single()
  
  if (fetchError || !integration) {
    return { token: null, error: 'Integration not found' }
  }
  
  if (!integration.is_active) {
    return { token: null, error: 'Integration is not active' }
  }
  
  // Decrypt the stored token
  let accessToken = await decryptToken(integration.access_token)
  
  // Check if token needs refresh
  const needsRefresh = tokenNeedsRefresh(integration.token_expires_at)
  
  // Only attempt refresh for providers that support it
  const refreshableProviders = ['asana', 'jira', 'teams']
  
  if (needsRefresh && refreshableProviders.includes(provider) && integration.refresh_token) {
    console.log(`[Token Refresh] Refreshing ${provider} token for user ${userId}`)
    
    // Decrypt refresh token
    const refreshToken = await decryptToken(integration.refresh_token)
    
    // Attempt refresh
    const result = await refreshTokenForProvider(provider, refreshToken)
    
    if (result.success) {
      // Encrypt new tokens
      const encryptedAccessToken = await encryptToken(result.access_token)
      const encryptedRefreshToken = result.refresh_token 
        ? await encryptToken(result.refresh_token)
        : integration.refresh_token
      
      // Calculate new expiry time
      const expiresAt = result.expires_in
        ? new Date(Date.now() + result.expires_in * 1000).toISOString()
        : null
      
      // Update database
      const { error: updateError } = await supabase
        .from('integrations')
        .update({
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
          token_expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('provider', provider)
      
      if (updateError) {
        console.error(`[Token Refresh] Failed to update ${provider} token:`, updateError)
        // Return the refreshed token anyway - it's valid even if DB update failed
      } else {
        console.log(`[Token Refresh] Successfully refreshed ${provider} token for user ${userId}`)
      }
      
      // Return the new access token (decrypted)
      return { token: result.access_token }
    } else {
      console.error(`[Token Refresh] Failed to refresh ${provider} token:`, result.error)
      
      // If refresh fails, mark integration as needing reconnection
      await supabase
        .from('integrations')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('provider', provider)
      
      return { token: null, error: `Token refresh failed: ${result.error}. Please reconnect ${provider}.` }
    }
  }
  
  // Return the current token (no refresh needed)
  return { token: accessToken }
}

/**
 * Check if a provider requires token refresh capability
 */
export function providerNeedsRefresh(provider: string): boolean {
  return ['asana', 'jira', 'teams'].includes(provider)
}

/**
 * Check if a provider has long-lived tokens (no refresh needed)
 */
export function providerHasLongLivedTokens(provider: string): boolean {
  return ['slack', 'linear', 'clickup', 'whatsapp'].includes(provider)
}
