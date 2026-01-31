'use client'

import { motion } from 'framer-motion'
import { MessageSquare, AtSign, AlertCircle, HelpCircle, Bell, Mail, Search, Hash, ExternalLink, Slack, CheckSquare, Target, Calendar, Heart, PartyPopper, Trophy, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { CommunicationSignal } from '@/types'

interface SignalsSectionProps {
  signals: CommunicationSignal[]
  isLoading?: boolean
}

const SIGNAL_ICONS: Record<string, React.ReactNode> = {
  mention: <AtSign className="h-4 w-4" />,
  urgent: <AlertCircle className="h-4 w-4" />,
  question: <HelpCircle className="h-4 w-4" />,
  escalation: <AlertCircle className="h-4 w-4" />,
  fyi: <Bell className="h-4 w-4" />,
  blocker: <AlertCircle className="h-4 w-4" />,
  decision_needed: <HelpCircle className="h-4 w-4" />,
  // Positive signals
  kudos: <Heart className="h-4 w-4" />,
  celebration: <PartyPopper className="h-4 w-4" />,
  milestone: <Trophy className="h-4 w-4" />,
}

const SIGNAL_COLORS: Record<string, string> = {
  mention: 'text-blue-500',
  urgent: 'text-red-500',
  question: 'text-amber-500',
  escalation: 'text-red-500',
  fyi: 'text-muted-foreground',
  blocker: 'text-red-500',
  decision_needed: 'text-orange-500',
  // Positive signals - warm colors
  kudos: 'text-pink-500',
  celebration: 'text-green-500',
  milestone: 'text-yellow-500',
}

// Detection method icons and labels
const DETECTION_INFO: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  direct_mention: { 
    icon: <AtSign className="h-3 w-3" />, 
    label: '@mention', 
    color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' 
  },
  email_alias: { 
    icon: <Mail className="h-3 w-3" />, 
    label: 'Email alias', 
    color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20' 
  },
  keyword: { 
    icon: <Search className="h-3 w-3" />, 
    label: 'Keyword', 
    color: 'text-teal-500 bg-teal-500/10 border-teal-500/20' 
  },
  channel_monitor: { 
    icon: <Hash className="h-3 w-3" />, 
    label: 'Monitored', 
    color: 'text-gray-500 bg-gray-500/10 border-gray-500/20' 
  },
}

// Teams icon component
function TeamsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.35 8.5c.9 0 1.65.75 1.65 1.65v5.7c0 2.35-1.9 4.25-4.25 4.25h-3.6c-.15.55-.65.9-1.25.9H8.65c-.75 0-1.35-.6-1.35-1.35V9.5c0-.75.6-1.35 1.35-1.35h3.25c.6 0 1.1.35 1.25.9h6.2V8.5zm-7.5 1.15H8.5v9.5h3.35v-9.5zm1.65 9.5h3.35c1.5 0 2.75-1.2 2.75-2.75v-5.25H13.5v8z"/>
      <circle cx="14.5" cy="5.5" r="2.5"/>
      <circle cx="18.5" cy="6" r="2"/>
    </svg>
  )
}

// Asana icon component
function AsanaIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="6" r="4"/>
      <circle cx="5" cy="17" r="4"/>
      <circle cx="19" cy="17" r="4"/>
    </svg>
  )
}

// Get source-specific display info
function getSourceInfo(source: string): { icon: React.ReactNode; label: string; actionLabel: string } {
  switch (source) {
    case 'slack':
      return { icon: <Slack className="h-3 w-3" />, label: 'Slack', actionLabel: 'Reply in Slack' }
    case 'asana':
      return { icon: <AsanaIcon className="h-3 w-3" />, label: 'Asana', actionLabel: 'Open in Asana' }
    case 'linear':
      return { icon: <Target className="h-3 w-3" />, label: 'Linear', actionLabel: 'Open in Linear' }
    case 'teams':
      return { icon: <TeamsIcon className="h-3 w-3" />, label: 'Teams', actionLabel: 'Reply in Teams' }
    case 'jira':
      return { icon: <CheckSquare className="h-3 w-3" />, label: 'Jira', actionLabel: 'Open in Jira' }
    case 'github':
      return { icon: <Target className="h-3 w-3" />, label: 'GitHub', actionLabel: 'Open in GitHub' }
    default:
      return { icon: <ExternalLink className="h-3 w-3" />, label: source, actionLabel: `Open in ${source}` }
  }
}

// Get large source icon
function getSourceIcon(source: string): React.ReactNode {
  switch (source) {
    case 'slack': return <Slack className="h-4 w-4" />
    case 'asana': return <AsanaIcon className="h-4 w-4" />
    case 'linear': return <Target className="h-4 w-4" />
    case 'teams': return <TeamsIcon className="h-4 w-4" />
    case 'jira': return <CheckSquare className="h-4 w-4" />
    default: return <ExternalLink className="h-4 w-4" />
  }
}

function formatTimeAgo(timestamp: string): string {
  const now = new Date()
  const date = new Date(timestamp)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  
  if (diffMins < 60) {
    return `${diffMins}m ago`
  } else if (diffHours < 24) {
    return `${diffHours}h ago`
  } else {
    return date.toLocaleDateString()
  }
}

export function SignalsSection({ signals, isLoading }: SignalsSectionProps) {
  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4" />
            Messages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-12 bg-muted rounded" />
            <div className="h-12 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const unreadSignals = signals.filter(s => !s.is_read)

  if (signals.length === 0) {
    return null
  }

  return (
    <Card className="bg-card border-border border-l-2 border-l-blue-500">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-blue-500" />
            Messages
            <span className="text-xs font-normal text-muted-foreground">(Channels only)</span>
          </span>
          {unreadSignals.length > 0 && (
            <Badge variant="secondary" className="bg-blue-500/10 text-blue-500">
              {unreadSignals.length} unread
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {signals.map((signal, index) => (
          <motion.div
            key={signal.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`p-3 rounded-lg border transition-colors ${
              signal.is_read 
                ? 'bg-muted/30 border-border' 
                : 'bg-blue-500/5 border-blue-500/20 hover:border-blue-500/40'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 ${SIGNAL_COLORS[signal.signal_type || 'fyi']}`}>
                {SIGNAL_ICONS[signal.signal_type || 'fyi']}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-sm font-medium">{signal.sender_name}</span>
                  <span className="text-xs text-muted-foreground">
                    in {signal.channel_name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    • {formatTimeAgo(signal.timestamp)}
                  </span>
                  {/* Show detection method for cross-channel mentions */}
                  {signal.detected_via && signal.is_from_monitored_channel === false && (
                    <Badge 
                      variant="outline" 
                      className={`text-[10px] px-1.5 py-0 h-4 ${DETECTION_INFO[signal.detected_via]?.color || ''}`}
                    >
                      <span className="flex items-center gap-0.5">
                        {DETECTION_INFO[signal.detected_via]?.icon}
                        {DETECTION_INFO[signal.detected_via]?.label}
                      </span>
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {signal.snippet}
                </p>
                {/* Action link - opens in source app */}
                {signal.message_url && (
                  <a
                    href={signal.message_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 text-xs text-blue-500 hover:text-blue-400 transition-colors"
                  >
                    {getSourceInfo(signal.source).icon}
                    <span>{getSourceInfo(signal.source).actionLabel}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge 
                  variant="outline" 
                  className={`shrink-0 capitalize text-xs ${
                    signal.signal_type === 'urgent' ? 'border-red-500/50 text-red-500' :
                    signal.signal_type === 'escalation' ? 'border-red-500/50 text-red-500' :
                    signal.signal_type === 'blocker' ? 'border-red-500/50 text-red-500' :
                    signal.signal_type === 'mention' ? 'border-blue-500/50 text-blue-500' :
                    signal.signal_type === 'question' ? 'border-amber-500/50 text-amber-500' :
                    signal.signal_type === 'decision_needed' ? 'border-orange-500/50 text-orange-500' :
                    // Positive signals
                    signal.signal_type === 'kudos' ? 'border-pink-500/50 text-pink-500 bg-pink-500/10' :
                    signal.signal_type === 'celebration' ? 'border-green-500/50 text-green-500 bg-green-500/10' :
                    signal.signal_type === 'milestone' ? 'border-yellow-500/50 text-yellow-500 bg-yellow-500/10' :
                    ''
                  }`}
                >
                  {signal.signal_type === 'kudos' ? '🙏 Kudos' :
                   signal.signal_type === 'celebration' ? '🎉 Win' :
                   signal.signal_type === 'milestone' ? '🏆 Milestone' :
                   signal.signal_type}
                </Badge>
                {/* Source icon */}
                <div className="text-muted-foreground">
                  {getSourceIcon(signal.source)}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  )
}
