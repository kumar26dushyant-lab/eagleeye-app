'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Check, Loader2, RefreshCw, Shield, AlertCircle, ChevronRight, Zap, X, Trash2, Plus, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { ConnectToolModal } from '@/components/integrations/ConnectToolModal'

interface ToolConfig {
  id: string
  name: string
  icon: string
  description: string
  connected: boolean
  workspace?: string
  channels?: number
  status?: 'healthy' | 'degraded' | 'error'
  lastSync?: string
  scopes?: string[]
}

interface CoverageInfo {
  overall: 'high' | 'medium' | 'low'
  percentage: number
  message: string
}

function IntegrationsContent() {
  const searchParams = useSearchParams()
  const isWelcome = searchParams.get('welcome') === 'true'
  const tier = searchParams.get('tier')
  
  const [showWelcome, setShowWelcome] = useState(isWelcome)
  const [tools, setTools] = useState<ToolConfig[]>([
    { id: 'slack', name: 'Slack', icon: '💬', description: 'Channels, @mentions, discussions', connected: false },
    { id: 'asana', name: 'Asana', icon: '📋', description: 'Tasks, projects, deadlines', connected: false },
    { id: 'linear', name: 'Linear', icon: '🎯', description: 'Issues, sprints, blockers', connected: false },
    { id: 'clickup', name: 'ClickUp', icon: '✅', description: 'Tasks, workspaces', connected: false },
    { id: 'notion', name: 'Notion', icon: '📝', description: 'Databases, docs', connected: false },
    { id: 'github', name: 'GitHub', icon: '🐙', description: 'PRs, issues, reviews', connected: false },
    { id: 'jira', name: 'Jira', icon: '🔷', description: 'Tickets, sprints', connected: false },
    { id: 'teams', name: 'MS Teams', icon: '👥', description: 'Channels, chats', connected: false },
  ])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)
  const [connectingTool, setConnectingTool] = useState<ToolConfig | null>(null)
  const [coverage, setCoverage] = useState<CoverageInfo>({ 
    overall: 'low', 
    percentage: 0, 
    message: 'Connect your tools to get started' 
  })

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/integrations/status')
      const data = await res.json()
      
      setTools(prev => prev.map(tool => {
        if (tool.id === 'slack' && data.slack) {
          return {
            ...tool,
            connected: data.slack.connected,
            workspace: data.slack.teamName,
            channels: data.slack.channels?.filter((c: { is_member: boolean }) => c.is_member).length || 0,
            status: data.slack.status || (data.slack.connected ? 'healthy' : undefined),
            lastSync: data.slack.lastSync,
            scopes: data.slack.scopes,
          }
        }
        if (tool.id === 'asana') {
          return { ...tool, connected: data.asana?.connected || false }
        }
        if (tool.id === 'linear') {
          return { ...tool, connected: data.linear?.connected || false }
        }
        return tool
      }))
      
      // Calculate coverage
      const connectedCount = [
        data.slack?.connected,
        data.asana?.connected,
        data.linear?.connected,
      ].filter(Boolean).length
      
      const percentage = Math.round((connectedCount / 3) * 100)
      
      setCoverage({
        overall: percentage >= 66 ? 'high' : percentage >= 33 ? 'medium' : 'low',
        percentage,
        message: connectedCount === 0 
          ? 'Connect your workspace to get started'
          : connectedCount === 1 
          ? 'Good start! Add a task manager for better coverage'
          : connectedCount === 2
          ? 'Great coverage! Add one more tool for full visibility'
          : 'Excellent! Full workspace visibility achieved'
      })
    } catch (err) {
      console.error('Failed to fetch status:', err)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchStatus()
    toast.success('Refreshed integration status')
  }

  const handleDisconnect = async (toolId: string, toolName: string) => {
    if (!confirm(`Are you sure you want to disconnect ${toolName}? You'll need to re-add the token to reconnect.`)) {
      return
    }
    
    setDisconnecting(toolId)
    try {
      const res = await fetch('/api/integrations/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: toolId, action: 'disconnect' }),
      })
      
      const data = await res.json()
      
      if (data.success) {
        toast.success(`${toolName} disconnected`, {
          description: data.note || 'Integration removed successfully',
        })
        // Refresh status to reflect changes
        fetchStatus()
      } else {
        toast.error(`Failed to disconnect ${toolName}`, {
          description: data.error || 'Unknown error',
        })
      }
    } catch (error) {
      toast.error(`Failed to disconnect ${toolName}`)
    } finally {
      setDisconnecting(null)
    }
  }

  const connectedTools = tools.filter(t => t.connected)
  const unconnectedTools = tools.filter(t => !t.connected)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Checking your workspace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Welcome Banner for new users */}
        {showWelcome && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-green-500/10 border border-green-500/30 rounded-xl p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="text-4xl">🎉</div>
                <div>
                  <h2 className="text-lg font-semibold text-green-400">Welcome to EagleEye!</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your {tier ? tier.charAt(0).toUpperCase() + tier.slice(1) : ''} trial is now active. 
                    Connect your tools below to start getting AI-powered insights.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    ✓ 14-day free trial • ✓ Full access to all features • ✓ Cancel anytime
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowWelcome(false)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Connect Your Workspace</h1>
              <p className="text-sm text-muted-foreground">
                One place to see signals from all your tools
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Trust Banner - CRITICAL for adoption */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg shrink-0">
              <Shield className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-green-400">🔒 Your Data Privacy Promise</p>
              <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                <li className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-green-500" />
                  <span><strong>Read-only access</strong> — We never write, edit, or send messages</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-green-500" />
                  <span><strong>No AI training</strong> — Your data is NEVER used to train AI models</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-green-500" />
                  <span><strong>Zero storage</strong> — Messages processed in memory, then discarded</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-green-500" />
                  <span><strong>Public channels only</strong> — No private DMs or confidential data</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Coverage Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Workspace Coverage</span>
            <span className={`text-sm font-medium ${
              coverage.overall === 'high' ? 'text-green-500' :
              coverage.overall === 'medium' ? 'text-yellow-500' : 'text-muted-foreground'
            }`}>
              {coverage.overall === 'high' ? 'High' : coverage.overall === 'medium' ? 'Partial' : 'Limited'}
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${coverage.percentage}%` }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className={`h-full rounded-full ${
                coverage.overall === 'high' ? 'bg-green-500' :
                coverage.overall === 'medium' ? 'bg-yellow-500' : 'bg-muted-foreground'
              }`}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">{coverage.message}</p>
        </motion.div>

        {/* Connected Tools */}
        {connectedTools.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-8"
          >
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Connected ({connectedTools.length})
            </h2>
            <div className="space-y-2">
              {connectedTools.map((tool) => (
                <div
                  key={tool.id}
                  className="flex items-center justify-between bg-green-500/5 border border-green-500/20 rounded-lg p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{tool.icon}</span>
                    <div>
                      <h3 className="font-medium flex items-center gap-2">
                        {tool.name}
                        <span className="inline-flex items-center gap-1 bg-green-500/10 text-green-600 px-2 py-0.5 rounded text-xs">
                          <Check className="h-3 w-3" />
                          {tool.status === 'degraded' ? 'Limited' : 'Connected'}
                        </span>
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {tool.workspace}
                        {tool.channels !== undefined && ` • ${tool.channels} channels`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {tool.status === 'degraded' && (
                      <div className="flex items-center gap-2 text-yellow-600 mr-2">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-xs">Limited scopes</span>
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                      onClick={() => handleDisconnect(tool.id, tool.name)}
                      disabled={disconnecting === tool.id}
                    >
                      {disconnecting === tool.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <X className="h-4 w-4 mr-1" />
                          Disconnect
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Available Tools */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Available Tools ({unconnectedTools.length})
            </h2>
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            {unconnectedTools.map((tool) => (
              <button
                key={tool.id}
                className="flex items-center gap-3 border border-border rounded-lg p-4 hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer group text-left w-full"
                onClick={() => setConnectingTool(tool)}
              >
                <span className="text-2xl opacity-50 group-hover:opacity-100 transition-opacity">{tool.icon}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-muted-foreground group-hover:text-foreground transition-colors">{tool.name}</h3>
                  <p className="text-xs text-muted-foreground truncate">{tool.description}</p>
                </div>
                <div className="flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  <Plus className="h-4 w-4" />
                  <span className="text-xs font-medium">Connect</span>
                </div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Connect Modal */}
        {connectingTool && (
          <ConnectToolModal
            tool={connectingTool}
            isOpen={!!connectingTool}
            onClose={() => setConnectingTool(null)}
            onConnected={() => {
              fetchStatus()
              setConnectingTool(null)
            }}
          />
        )}

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-center"
        >
          <p className="text-xs text-muted-foreground">
            🔐 Your tokens are encrypted and stored securely. EagleEye only reads data.
          </p>
        </motion.div>
      </div>
    </div>
  )
}

// Loading fallback
function LoadingFallback() {
  return (
    <div className="p-6 flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

// Main page with Suspense
export default function IntegrationsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <IntegrationsContent />
    </Suspense>
  )
}
