'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, ChevronDown, ChevronUp, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { WorkItem } from '@/types'

interface HandledSectionProps {
  items: WorkItem[]
  isLoading?: boolean
}

export function HandledSection({ items, isLoading }: HandledSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            Team Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse h-4 bg-muted rounded w-1/2" />
        </CardContent>
      </Card>
    )
  }

  if (items.length === 0) {
    return null // Don't show empty handled section
  }

  // Count completed vs in-progress
  const completedItems = items.filter(i => i.status === 'completed')
  const inProgressItems = items.filter(i => i.status !== 'completed')

  return (
    <Card className="bg-card border-border border-l-2 border-l-[var(--accent-green)]">
      <CardHeader className="pb-3">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between"
        >
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-[var(--accent-green)]" />
            Team Progress
            <Badge variant="secondary" className="bg-[var(--accent-green)]/10 text-[var(--accent-green)]">
              {items.length}
            </Badge>
          </CardTitle>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </CardHeader>
      <CardContent>
        {!isExpanded ? (
          <p className="text-sm text-muted-foreground">
            Tasks your team completed or is handling without needing your input. 
            {completedItems.length > 0 && ` ${completedItems.length} done`}
            {inProgressItems.length > 0 && `, ${inProgressItems.length} in progress`}.
          </p>
        ) : (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              {items.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30"
                >
                  <CheckCircle2 className="h-4 w-4 text-[var(--accent-green)] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-foreground truncate block">{item.title}</span>
                    <span className="text-xs text-muted-foreground">{item.assignee}</span>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {item.status === 'completed' ? 'Done' : 'In Progress'}
                  </Badge>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </CardContent>
    </Card>
  )
}
