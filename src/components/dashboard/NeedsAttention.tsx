'use client'

import { motion } from 'framer-motion'
import { AlertTriangle, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { WorkItem } from '@/types'

interface NeedsAttentionProps {
  items: WorkItem[]
  isLoading?: boolean
}

export function NeedsAttention({ items, isLoading }: NeedsAttentionProps) {
  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="text-[var(--accent-red)]">🚨</span>
            Needs Attention
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
            <span>🚨</span>
            Needs Attention
          </CardTitle>
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
            <span>🚨</span>
            Needs Attention
          </span>
          <Badge variant="secondary" className="bg-[var(--accent-red)]/10 text-[var(--accent-red)]">
            {items.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item, index) => (
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
        ))}
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
