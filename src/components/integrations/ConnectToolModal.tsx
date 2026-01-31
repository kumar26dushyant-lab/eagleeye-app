'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink, Loader2, Check, Eye, EyeOff, AlertCircle, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface ConnectModalProps {
  tool: {
    id: string
    name: string
    icon: string
  }
  isOpen: boolean
  onClose: () => void
  onConnected: () => void
}

const TOOL_CONFIG: Record<string, {
  tokenName: string
  tokenPrefix: string
  steps: Array<{ title: string; description: string; link?: string }>
  testEndpoint: string
  placeholder: string
  useOAuth?: boolean  // Use OAuth flow instead of token input
  oauthEndpoint?: string
}> = {
  slack: {
    tokenName: 'Bot Token',
    tokenPrefix: 'xoxb-',
    placeholder: 'xoxb-1234567890-1234567890-abcdef...',
    testEndpoint: '/api/integrations/test/slack',
    steps: [
      {
        title: 'Open Slack App Settings',
        description: 'Go to your Slack App\'s OAuth & Permissions page',
        link: 'https://api.slack.com/apps',
      },
      {
        title: 'Find Bot Token',
        description: 'Under "OAuth Tokens for Your Workspace", copy the Bot User OAuth Token (starts with xoxb-)',
      },
      {
        title: 'Paste Below',
        description: 'Paste your Bot Token in the field below',
      },
    ],
  },
  asana: {
    tokenName: 'Personal Access Token',
    tokenPrefix: '1/',
    placeholder: '1/1234567890:abcdef...',
    testEndpoint: '/api/integrations/test/asana',
    steps: [
      {
        title: 'Open Asana Developer Console',
        description: 'Click the button below to open Asana settings',
        link: 'https://app.asana.com/0/developer-console',
      },
      {
        title: 'Create New Token',
        description: 'Click "Create new token" under Personal Access Tokens section',
      },
      {
        title: 'Name Your Token',
        description: 'Enter "EagleEye" as the name and click Create',
      },
      {
        title: 'Copy the Token',
        description: 'Copy the token shown (it starts with "1/" or "2/")',
      },
    ],
  },
  linear: {
    tokenName: 'API Key',
    tokenPrefix: 'lin_api_',
    placeholder: 'lin_api_abc123...',
    testEndpoint: '/api/integrations/test/linear',
    steps: [
      {
        title: 'Open Linear Settings',
        description: 'Go to Linear API settings',
        link: 'https://linear.app/settings/api',
      },
      {
        title: 'Create API Key',
        description: 'Click "Create key" and name it "EagleEye"',
      },
      {
        title: 'Copy the Key',
        description: 'Copy the API key (starts with "lin_api_")',
      },
    ],
  },
  clickup: {
    tokenName: 'API Token',
    tokenPrefix: 'pk_',
    placeholder: 'pk_12345678_ABC...',
    testEndpoint: '/api/integrations/test/clickup',
    steps: [
      {
        title: 'Open ClickUp Settings',
        description: 'Go to ClickUp Apps settings',
        link: 'https://app.clickup.com/settings/apps',
      },
      {
        title: 'Generate API Token',
        description: 'Click "Generate" under API Token section',
      },
      {
        title: 'Copy the Token',
        description: 'Copy the generated token',
      },
    ],
  },
  notion: {
    tokenName: 'Integration Token',
    tokenPrefix: 'secret_',
    placeholder: 'secret_abc123...',
    testEndpoint: '/api/integrations/test/notion',
    steps: [
      {
        title: 'Open Notion Integrations',
        description: 'Go to Notion integrations page',
        link: 'https://www.notion.so/my-integrations',
      },
      {
        title: 'Create Integration',
        description: 'Click "New integration" and name it "EagleEye"',
      },
      {
        title: 'Copy Token',
        description: 'Copy the Internal Integration Token',
      },
    ],
  },
  github: {
    tokenName: 'Personal Access Token',
    tokenPrefix: 'ghp_',
    placeholder: 'ghp_xxxxxxxxxxxx...',
    testEndpoint: '/api/integrations/test/github',
    steps: [
      {
        title: 'Open GitHub Settings',
        description: 'Go to GitHub token settings',
        link: 'https://github.com/settings/tokens?type=beta',
      },
      {
        title: 'Generate Token',
        description: 'Click "Generate new token" and select repo permissions',
      },
      {
        title: 'Copy Token',
        description: 'Copy the token (starts with "ghp_")',
      },
    ],
  },
  jira: {
    tokenName: 'API Token',
    tokenPrefix: '',
    placeholder: 'Your Jira API token',
    testEndpoint: '/api/integrations/test/jira',
    steps: [
      {
        title: 'Open Atlassian Account',
        description: 'Go to Atlassian API tokens page',
        link: 'https://id.atlassian.com/manage-profile/security/api-tokens',
      },
      {
        title: 'Create API Token',
        description: 'Click "Create API token" and name it "EagleEye"',
      },
      {
        title: 'Copy Token',
        description: 'Copy the generated token',
      },
    ],
  },
}

export function ConnectToolModal({ tool, isOpen, onClose, onConnected }: ConnectModalProps) {
  const [step, setStep] = useState(0)
  const [token, setToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const config = TOOL_CONFIG[tool.id]
  
  if (!config) {
    return null
  }

  const handleConnect = async () => {
    if (!token.trim()) {
      setError('Please enter your token')
      return
    }

    setIsConnecting(true)
    setError(null)

    try {
      // Test the token
      const testRes = await fetch(config.testEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim() }),
      })

      const testData = await testRes.json()

      if (!testRes.ok || !testData.success) {
        throw new Error(testData.error || 'Invalid token')
      }

      // Save the token
      const saveRes = await fetch('/api/integrations/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          provider: tool.id, 
          token: token.trim(),
          workspace: testData.workspace,
        }),
      })

      if (!saveRes.ok) {
        throw new Error('Failed to save connection')
      }

      toast.success(`${tool.name} connected!`, {
        description: testData.workspace ? `Workspace: ${testData.workspace}` : 'Ready to sync',
      })

      onConnected()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleClose = () => {
    setStep(0)
    setToken('')
    setError(null)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{tool.icon}</span>
                <div>
                  <h2 className="font-semibold">Connect {tool.name}</h2>
                  <p className="text-xs text-muted-foreground">Step {step + 1} of {config.steps.length + 1}</p>
                </div>
              </div>
              <button 
                onClick={handleClose}
                className="p-1 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-muted">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${((step + 1) / (config.steps.length + 1)) * 100}%` }}
              />
            </div>

            {/* Content */}
            <div className="p-6">
              {step < config.steps.length ? (
                // Step instructions
                <div>
                  <div className="flex items-start gap-3 mb-6">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                      {step + 1}
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">{config.steps[step].title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {config.steps[step].description}
                      </p>
                    </div>
                  </div>

                  {config.steps[step].link && (
                    <a
                      href={config.steps[step].link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full p-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors mb-4"
                    >
                      Open {tool.name}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}

                  <div className="flex gap-2">
                    {step > 0 && (
                      <Button variant="outline" onClick={() => setStep(s => s - 1)} className="flex-1">
                        Back
                      </Button>
                    )}
                    <Button onClick={() => setStep(s => s + 1)} className="flex-1">
                      {config.steps[step].link ? "I've done this" : 'Next'}
                    </Button>
                  </div>
                </div>
              ) : config.useOAuth ? (
                // OAuth flow
                <div>
                  <div className="flex items-start gap-3 mb-6">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                      <ExternalLink className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Connect with {tool.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Click the button below to securely connect your {tool.name} account. You&apos;ll be redirected to {tool.name} to authorize access.
                      </p>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-red-500 text-sm mb-4">
                      <AlertCircle className="h-4 w-4" />
                      {error}
                    </div>
                  )}

                  <Button 
                    onClick={() => {
                      if (config.oauthEndpoint) {
                        window.location.href = config.oauthEndpoint
                      }
                    }}
                    className="w-full"
                    size="lg"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Connect with {tool.name}
                  </Button>

                  {/* Trust & Privacy Notice */}
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mt-4">
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-green-500">Your Data Privacy Promise</p>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          <li className="flex items-center gap-2">
                            <Check className="h-3 w-3 text-green-500" /> Secure OAuth 2.0 authentication
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="h-3 w-3 text-green-500" /> Read-only access — we can&apos;t modify anything
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="h-3 w-3 text-green-500" /> <strong>Never used for AI training</strong>
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="h-3 w-3 text-green-500" /> Revoke access anytime from {tool.name} settings
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Token input step
                <div>
                  <div className="flex items-start gap-3 mb-6">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 font-semibold">
                      <Check className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Paste Your Token</h3>
                      <p className="text-sm text-muted-foreground">
                        Paste the {config.tokenName} you copied from {tool.name}
                      </p>
                    </div>
                  </div>

                  <div className="relative mb-4">
                    <input
                      type={showToken ? 'text' : 'password'}
                      value={token}
                      onChange={(e) => {
                        setToken(e.target.value)
                        setError(null)
                      }}
                      placeholder={config.placeholder}
                      className="w-full p-3 pr-10 bg-muted rounded-lg border border-border focus:border-primary focus:outline-none font-mono text-sm"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-red-500 text-sm mb-4">
                      <AlertCircle className="h-4 w-4" />
                      {error}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setStep(s => s - 1)} className="flex-1">
                      Back
                    </Button>
                    <Button 
                      onClick={handleConnect} 
                      disabled={isConnecting || !token.trim()}
                      className="flex-1"
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Connecting...
                        </>
                      ) : (
                        'Connect'
                      )}
                    </Button>
                  </div>

                  {/* Trust & Privacy Notice */}
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mt-4">
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-green-500">Your Data Privacy Promise</p>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          <li className="flex items-center gap-2">
                            <Check className="h-3 w-3 text-green-500" /> Token is AES-256 encrypted at rest
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="h-3 w-3 text-green-500" /> Read-only access — we can&apos;t modify anything
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="h-3 w-3 text-green-500" /> <strong>Never used for AI training</strong>
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="h-3 w-3 text-green-500" /> Delete your data anytime — instant removal
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
