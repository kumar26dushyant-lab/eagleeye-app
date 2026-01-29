'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, CheckCircle, XCircle, ExternalLink, Key, Eye, EyeOff, Shield } from 'lucide-react'

interface IntegrationProvider {
  id: string
  name: string
  icon: string
  description: string
  supportsOAuth: boolean
  oauthEndpoint?: string
  tokenInstructions: string
  tokenHelpUrl: string
  tokenPlaceholder: string
  testEndpoint: string
  syncEndpoint: string
}

const PROVIDERS: Record<string, IntegrationProvider> = {
  slack: {
    id: 'slack',
    name: 'Slack',
    icon: '💬',
    description: 'Connect your Slack workspace to monitor channels for @mentions.',
    supportsOAuth: true,
    oauthEndpoint: '/api/integrations/slack/oauth',
    tokenInstructions: 'Create a Slack app at api.slack.com/apps, add bot scopes (channels:history, channels:read, users:read), and copy the Bot User OAuth Token (xoxb-...).',
    tokenHelpUrl: 'https://api.slack.com/apps',
    tokenPlaceholder: 'xoxb-...',
    testEndpoint: '/api/integrations/slack/test',
    syncEndpoint: '/api/integrations/slack/sync',
  },
  asana: {
    id: 'asana',
    name: 'Asana',
    icon: '📋',
    description: 'Connect Asana to sync your tasks and projects.',
    supportsOAuth: true,
    oauthEndpoint: '/api/integrations/asana/oauth',
    tokenInstructions: 'Go to My Settings → Apps → Developer Apps → Personal Access Tokens in Asana to create a token.',
    tokenHelpUrl: 'https://app.asana.com/0/developer-console',
    tokenPlaceholder: '1/1234567890:abc...',
    testEndpoint: '/api/integrations/asana/test',
    syncEndpoint: '/api/integrations/asana/sync',
  },
  linear: {
    id: 'linear',
    name: 'Linear',
    icon: '🎯',
    description: 'Connect Linear to sync your issues and projects.',
    supportsOAuth: true,
    oauthEndpoint: '/api/integrations/linear/oauth',
    tokenInstructions: 'Go to Settings → API → Personal API Keys in Linear to create a key.',
    tokenHelpUrl: 'https://linear.app/settings/api',
    tokenPlaceholder: 'lin_api_...',
    testEndpoint: '/api/integrations/linear/test',
    syncEndpoint: '/api/integrations/linear/sync',
  },
}

interface ConnectionResult {
  success: boolean
  user?: string
  email?: string
  workspaces?: string[]
  workspace?: string
  teams?: string[]
  channels?: number
  error?: string
}

interface ConnectIntegrationDialogProps {
  providerId: 'slack' | 'asana' | 'linear'
  isOpen: boolean
  onClose: () => void
  onConnected: (token: string, result: ConnectionResult) => void
}

export function ConnectIntegrationDialog({
  providerId,
  isOpen,
  onClose,
  onConnected,
}: ConnectIntegrationDialogProps) {
  const [token, setToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<ConnectionResult | null>(null)

  const provider = PROVIDERS[providerId]

  if (!isOpen || !provider) return null

  const handleTest = async () => {
    if (!token.trim()) return
    
    setTesting(true)
    setTestResult(null)
    
    try {
      const res = await fetch(provider.testEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const result = await res.json() as ConnectionResult
      setTestResult(result)
      
      if (result.success) {
        // Small delay before calling onConnected to show success
        setTimeout(() => {
          onConnected(token, result)
          setToken('')
          setTestResult(null)
        }, 1500)
      }
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      })
    } finally {
      setTesting(false)
    }
  }

  const handleClose = () => {
    setToken('')
    setTestResult(null)
    onClose()
  }

  // Quick connect using server-configured token (for testing)
  const handleQuickConnect = () => {
    onConnected('env', { 
      success: true, 
      user: 'eagleeye',
      workspace: 'EagleEye',
      channels: 0
    })
  }

  // OAuth connect - redirects user to provider
  const handleOAuthConnect = () => {
    if (provider.oauthEndpoint) {
      window.location.href = provider.oauthEndpoint
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div 
        className="bg-card border border-border rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{provider.icon}</span>
          <div>
            <h2 className="text-lg font-semibold">Connect {provider.name}</h2>
            <p className="text-sm text-muted-foreground">{provider.description}</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Primary: OAuth Connect (for customers) */}
          {provider.supportsOAuth && (
            <div className="rounded-lg p-4 bg-primary/5 border border-primary/20">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">Recommended: One-Click Connect</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Securely authorize EagleEye to access your {provider.name}. No tokens to copy.
                  </p>
                  <Button onClick={handleOAuthConnect} className="w-full">
                    <span className="mr-2">{provider.icon}</span>
                    Connect with {provider.name}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Secondary: Manual token entry (for developers/testing) */}
          <details className="group">
            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground flex items-center gap-2">
              <Key className="h-4 w-4" />
              Developer: Use API token instead
            </summary>
            <div className="mt-3 space-y-3 pl-6">
              {/* Instructions */}
              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                <p className="text-muted-foreground mb-2">{provider.tokenInstructions}</p>
                <a 
                  href={provider.tokenHelpUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Open {provider.name} Developer Console
            </a>
          </div>

          {/* Token Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Key className="h-4 w-4" />
              API Token
            </label>
            <div className="relative">
              <Input
                type={showToken ? 'text' : 'password'}
                value={token}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setToken(e.target.value)}
                placeholder={provider.tokenPlaceholder}
                className="pr-10 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Test Result */}
          {testResult && (
            <div className={`rounded-lg p-3 ${testResult.success ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
              <div className="flex items-start gap-2">
                {testResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                )}
                <div className="text-sm">
                  {testResult.success ? (
                    <div>
                      <p className="font-medium text-green-500">Connected successfully!</p>
                      {testResult.user && <p className="text-muted-foreground">User: {testResult.user}</p>}
                      {testResult.email && <p className="text-muted-foreground">Email: {testResult.email}</p>}
                      {testResult.workspaces && testResult.workspaces.length > 0 && (
                        <p className="text-muted-foreground">
                          Workspaces: {testResult.workspaces.join(', ')}
                        </p>
                      )}
                      {testResult.teams && testResult.teams.length > 0 && (
                        <p className="text-muted-foreground">
                          Teams: {testResult.teams.join(', ')}
                        </p>
                      )}
                      {testResult.channels !== undefined && (
                        <p className="text-muted-foreground">
                          Channels: {testResult.channels} accessible
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p className="font-medium text-red-500">Connection failed</p>
                      <p className="text-muted-foreground">{testResult.error}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleTest} 
              disabled={!token.trim() || testing}
              className="flex-1"
            >
              {testing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test & Connect'
              )}
            </Button>
          </div>
            </div>
          </details>

          {/* Cancel button */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={handleClose} className="w-full">
              Cancel
            </Button>
          </div>
        </div>

        {/* Privacy Note */}
        <p className="text-xs text-muted-foreground mt-4">
          <Shield className="h-3 w-3 inline mr-1" />
          Your data is encrypted and only used to read information. EagleEye never writes to your tools.
        </p>
      </div>
    </div>
  )
}
