'use client'

import { motion } from 'framer-motion'
import { Info, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { WorkItem } from '@/types'

interface FYISectionProps {
  items: WorkItem[]
  isLoading?: boolean
}

export function FYISection({ items, isLoading }: FYISectionProps) {
  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <span>🧠</span>
            FYI
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-3/4" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (items.length === 0) {
    return null // Don't show empty FYI section
  }

  return (
    <Card className="bg-card border-border border-l-2 border-l-[var(--accent-amber)]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <span>🧠</span>
            FYI (Low Urgency)
          </span>
          <Badge variant="secondary" className="bg-[var(--accent-amber)]/10 text-[var(--accent-amber)]">
            {items.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center justify-between p-3 bg-[var(--accent-amber)]/5 border border-[var(--accent-amber)]/10 rounded-lg group hover:border-[var(--accent-amber)]/30 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Info className="h-4 w-4 text-[var(--accent-amber)] shrink-0" />
              <span className="text-sm text-foreground truncate">{item.title}</span>
            </div>
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              >
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
              </a>
            )}
          </motion.div>
        ))}
      </CardContent>
    </Card>
  )
}
