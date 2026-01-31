'use client'

import { motion } from 'framer-motion'
import { Calendar, AlertTriangle, MessageSquare, TrendingUp, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { IntentMode } from '@/lib/importance'

interface BriefStats {
  needsAttention: number
  fyi: number
  handled: number
  signals: number
  totalItems: number
  coveragePercentage: number
}

interface BriefCardProps {
  stats: BriefStats | null
  mode: IntentMode
  isLoading?: boolean
}

export function BriefCard({ stats, mode, isLoading }: BriefCardProps) {
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  })

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-5/6" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6 text-center text-muted-foreground">
          <p>No brief available yet. Connect your integrations to get started.</p>
        </CardContent>
      </Card>
    )
  }

  // Mode-specific messaging
  const getModeMessage = () => {
    switch (mode) {
      case 'calm':
        return stats.needsAttention === 0 
          ? "All clear! Nothing critical needs your attention right now."
          : `${stats.needsAttention} critical item${stats.needsAttention > 1 ? 's' : ''} need${stats.needsAttention === 1 ? 's' : ''} your attention.`
      case 'on_the_go':
        return `Quick overview: ${stats.needsAttention} action items, ${stats.signals} messages waiting.`
      case 'work':
        return `Ready for work. ${stats.needsAttention + stats.fyi} items to review, ${stats.signals} conversations to catch up on.`
      case 'focus':
        return `Deep dive mode. Full visibility across ${stats.totalItems} tracked items.`
      default:
        return ''
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card className="bg-gradient-to-br from-card to-muted/20 border-border overflow-hidden">
        <CardContent className="p-4 space-y-3">
          {/* Mode Badge & Message */}
          <div className="space-y-2">
            <Badge variant="outline" className="capitalize">
              {mode.replace('_', ' ')} mode
            </Badge>
            <p className="text-sm text-foreground">
              {getModeMessage()}
            </p>
          </div>

          {/* Coverage Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Team coverage</span>
              <span>{stats.coveragePercentage}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
                initial={{ width: 0 }}
                animate={{ width: `${stats.coveragePercentage}%` }}
                transition={{ delay: 0.3, duration: 0.8 }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
