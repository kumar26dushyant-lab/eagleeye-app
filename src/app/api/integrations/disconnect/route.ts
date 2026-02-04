// API endpoint to disconnect integrations
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendIntegrationDisconnectedEmail } from '@/lib/email'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Allow both authenticated users and env-token disconnects for development
  const body = await request.json()
  const { provider, action } = body
  
  if (!provider) {
    return NextResponse.json({ error: 'Provider is required' }, { status: 400 })
  }

  const validProviders = ['slack', 'asana', 'linear', 'clickup', 'jira', 'notion', 'github', 'teams', 'whatsapp']
  if (!validProviders.includes(provider)) {
    return NextResponse.json({ error: 'Invalid provider' }, { status: 400 })
  }

  try {
    if (action === 'connect') {
      // For now, just return instructions - OAuth flow would be implemented for production
      return NextResponse.json({
        success: true,
        message: `To connect ${provider}, add the token to .env.local`,
        instructions: getConnectionInstructions(provider),
      })
    }
    
    // Disconnect action
    if (action === 'disconnect') {
      // If user is authenticated, remove from database
      if (user) {
        // Delete the integration record instead of updating status
        await supabase
          .from('integrations')
          .delete()
          .eq('user_id', user.id)
          .eq('provider', provider)
        
        // Send disconnection notification email
        if (user.email) {
          const providerDisplayName = getProviderDisplayName(provider)
          await sendIntegrationDisconnectedEmail({
            to: user.email,
            integrationName: providerDisplayName,
            userName: user.user_metadata?.full_name,
            reason: 'You disconnected this integration',
          })
          console.log('[Integration] Disconnection email sent to:', user.email)
        }
      }
      
      // For env-based tokens, we need to clear them
      // In development, we'll update .env.local
      const envKey = getEnvKeyForProvider(provider)
      if (envKey && process.env[envKey]) {
        // Clear from process.env (runtime only)
        // Note: This won't persist across restarts - user needs to remove from .env.local
        delete process.env[envKey]
        
        return NextResponse.json({
          success: true,
          message: `${provider} disconnected successfully`,
          note: 'Remove the token from .env.local and restart the server to fully disconnect',
          envKey,
        })
      }

      return NextResponse.json({
        success: true,
        message: `${provider} disconnected successfully`,
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Failed to manage integration:', error)
    return NextResponse.json(
      { error: 'Failed to manage integration' },
      { status: 500 }
    )
  }
}

function getEnvKeyForProvider(provider: string): string | null {
  const envKeys: Record<string, string> = {
    slack: 'SLACK_BOT_TOKEN',
    asana: 'ASANA_ACCESS_TOKEN',
    linear: 'LINEAR_API_KEY',
    clickup: 'CLICKUP_ACCESS_TOKEN',
    jira: 'JIRA_ACCESS_TOKEN',
    notion: 'NOTION_ACCESS_TOKEN',
    github: 'GITHUB_ACCESS_TOKEN',
    teams: 'TEAMS_ACCESS_TOKEN',
  }
  return envKeys[provider] || null
}

function getConnectionInstructions(provider: string): { envKey: string; docUrl: string; steps: string[] } {
  const instructions: Record<string, { envKey: string; docUrl: string; steps: string[] }> = {
    slack: {
      envKey: 'SLACK_BOT_TOKEN',
      docUrl: 'https://api.slack.com/apps',
      steps: [
        'Go to api.slack.com/apps and create a new app',
        'Add OAuth scopes: channels:history, channels:read, users:read',
        'Install to workspace and copy Bot User OAuth Token',
        'Add SLACK_BOT_TOKEN=xoxb-... to .env.local',
      ],
    },
    asana: {
      envKey: 'ASANA_ACCESS_TOKEN',
      docUrl: 'https://app.asana.com/0/developer-console',
      steps: [
        'Go to app.asana.com/0/developer-console',
        'Create a Personal Access Token',
        'Add ASANA_ACCESS_TOKEN=1/... to .env.local',
      ],
    },
    linear: {
      envKey: 'LINEAR_API_KEY',
      docUrl: 'https://linear.app/settings/api',
      steps: [
        'Go to linear.app/settings/api',
        'Create a new API key',
        'Add LINEAR_API_KEY=lin_api_... to .env.local',
      ],
    },
    clickup: {
      envKey: 'CLICKUP_ACCESS_TOKEN',
      docUrl: 'https://app.clickup.com/settings/apps',
      steps: [
        'Go to app.clickup.com/settings/apps',
        'Create a new app and get API key',
        'Add CLICKUP_ACCESS_TOKEN=pk_... to .env.local',
      ],
    },
    jira: {
      envKey: 'JIRA_ACCESS_TOKEN',
      docUrl: 'https://id.atlassian.com/manage-profile/security/api-tokens',
      steps: [
        'Go to Atlassian account settings',
        'Create an API token',
        'Add JIRA_ACCESS_TOKEN=... to .env.local',
      ],
    },
    notion: {
      envKey: 'NOTION_ACCESS_TOKEN',
      docUrl: 'https://www.notion.so/my-integrations',
      steps: [
        'Go to notion.so/my-integrations',
        'Create a new integration',
        'Add NOTION_ACCESS_TOKEN=secret_... to .env.local',
      ],
    },
    github: {
      envKey: 'GITHUB_ACCESS_TOKEN',
      docUrl: 'https://github.com/settings/tokens',
      steps: [
        'Go to github.com/settings/tokens',
        'Generate a new token with repo scope',
        'Add GITHUB_ACCESS_TOKEN=ghp_... to .env.local',
      ],
    },
    teams: {
      envKey: 'TEAMS_ACCESS_TOKEN',
      docUrl: 'https://portal.azure.com',
      steps: [
        'Register an app in Azure AD',
        'Configure API permissions for Microsoft Graph',
        'Add TEAMS_ACCESS_TOKEN=... to .env.local',
      ],
    },
  }
  return instructions[provider] || { envKey: '', docUrl: '', steps: ['Contact support for setup instructions'] }
}

function getProviderDisplayName(provider: string): string {
  const names: Record<string, string> = {
    slack: 'Slack',
    asana: 'Asana',
    linear: 'Linear',
    clickup: 'ClickUp',
    jira: 'Jira',
    notion: 'Notion',
    github: 'GitHub',
    teams: 'Microsoft Teams',
    whatsapp: 'WhatsApp Business',
  }
  return names[provider] || provider
}
