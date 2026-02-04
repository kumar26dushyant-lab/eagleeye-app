'use client'

import { motion } from 'framer-motion'
import { AlertTriangle, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { WorkItem, CommunicationSignal } from '@/types'

// Union type to accept both old WorkItem and new CommunicationSignal
type NeedsAttentionItem = WorkItem | CommunicationSignal

interface NeedsAttentionProps {
  items: NeedsAttentionItem[]
  isLoading?: boolean
  title?: string  // NEW: Allow custom title
  description?: string // NEW: Allow custom description
}

// Type guard to check if item is CommunicationSignal
function isSignal(item: NeedsAttentionItem): item is CommunicationSignal {
  return 'signal_type' in item
}

// Get signal badge color based on type
function getSignalColor(type: string): string {
  switch (type) {
    case 'blocker':
    case 'escalation':
      return 'bg-red-500/10 text-red-500 border-red-500/20'
    case 'urgent':
      return 'bg-orange-500/10 text-orange-500 border-orange-500/20'
    case 'decision_needed':
      return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
    default:
      return 'bg-muted'
  }
}

// Format signal type for display
function formatSignalType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

// Format timestamp to relative time
function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'yesterday'
  return `${diffDays}d ago`
}

export function NeedsAttention({ items, isLoading, title = '🔴 Needs Attention', description }: NeedsAttentionProps) {
  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse p-4 bg-muted/50 rounded-lg space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (items.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            {title}
          </CardTitle>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Nothing needs your attention right now.</p>
            <p className="text-xs mt-1">Silence is success.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card border-border border-l-2 border-l-[var(--accent-red)]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            {title}
          </span>
          <Badge variant="secondary" className="bg-[var(--accent-red)]/10 text-[var(--accent-red)]">
            {items.length}
          </Badge>
        </CardTitle>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item, index) => {
          if (isSignal(item)) {
            // Render CommunicationSignal
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-[var(--accent-red)]/5 border border-[var(--accent-red)]/20 rounded-lg hover:border-[var(--accent-red)]/40 transition-colors group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-medium">{item.sender_name}</span>
                      <span className="text-xs text-muted-foreground">in {item.channel_name}</span>
                      <span className="text-xs text-muted-foreground">• {formatRelativeTime(item.timestamp)}</span>
                    </div>
                    <p className="text-sm text-foreground">{item.snippet}</p>
                    {item.message_url && (
                      <a
                        href={item.message_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline mt-2 inline-flex items-center gap-1"
                      >
                        🔗 Open in {item.source === 'slack' ? 'Slack' : item.source === 'asana' ? 'Asana' : item.source === 'whatsapp' ? 'WhatsApp' : 'Linear'}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {item.source === 'whatsapp' && !item.message_url && item.channel_id && (
                      <a
                        href={`https://wa.me/${item.channel_id.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline mt-2 inline-flex items-center gap-1"
                      >
                        💬 Reply in WhatsApp
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <Badge 
                      variant="outline" 
                      className={getSignalColor(item.signal_type || 'urgent')}
                    >
                      {formatSignalType(item.signal_type || 'urgent')}
                    </Badge>
                  </div>
                </div>
              </motion.div>
            )
          } else {
            // Render WorkItem (legacy)
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-[var(--accent-red)]/5 border border-[var(--accent-red)]/20 rounded-lg hover:border-[var(--accent-red)]/40 transition-colors group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-foreground truncate">
                        {item.title}
                      </h4>
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{item.assignee || 'Unassigned'}</span>
                      {item.due_date && (
                        <>
                          <span>•</span>
                          <span className={item.due_date && new Date(item.due_date) <= new Date() ? 'text-[var(--accent-red)]' : ''}>
                            {formatDueDate(item.due_date)}
                          </span>
                        </>
                      )}
                    </div>
                    {item.surface_reason && (
                      <p className="mt-2 text-sm text-[var(--accent-red)]">
                        → {item.surface_reason}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <Badge 
                      variant="secondary" 
                      className={
                        item.urgency === 'high' 
                          ? 'bg-[var(--accent-red)]/10 text-[var(--accent-red)]'
                          : item.urgency === 'medium'
                          ? 'bg-[var(--accent-amber)]/10 text-[var(--accent-amber)]'
                          : 'bg-muted'
                      }
                    >
                      {item.urgency || 'low'}
                    </Badge>
                  </div>
                </div>
              </motion.div>
            )
          }
        })}
      </CardContent>
    </Card>
  )
}

function formatDueDate(dateStr: string): string {
  const date = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const dateOnly = new Date(date)
  dateOnly.setHours(0, 0, 0, 0)

  if (dateOnly.getTime() < today.getTime()) {
    const daysAgo = Math.ceil((today.getTime() - dateOnly.getTime()) / (1000 * 60 * 60 * 24))
    return `Overdue by ${daysAgo} day${daysAgo > 1 ? 's' : ''}`
  }
  if (dateOnly.getTime() === today.getTime()) {
    return 'Due Today'
  }
  if (dateOnly.getTime() === tomorrow.getTime()) {
    return 'Due Tomorrow'
  }
  
  return `Due ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
}
