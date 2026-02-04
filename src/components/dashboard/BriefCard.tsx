'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'

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
  isLoading?: boolean
}

export function BriefCard({ stats, isLoading }: BriefCardProps) {
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

  // Status-based messaging
  const getStatusMessage = () => {
    if (stats.needsAttention === 0 && stats.signals === 0) {
      return "🎯 All clear! Nothing needs your attention right now."
    }
    if (stats.needsAttention === 0) {
      return `✨ No fires! ${stats.signals} messages across your workspace.`
    }
    if (stats.needsAttention === 1) {
      return `👀 1 item needs your attention, ${stats.fyi} FYI items to review.`
    }
    return `🔥 ${stats.needsAttention} items need attention, ${stats.fyi} FYI items.`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card className="bg-gradient-to-br from-card to-muted/20 border-border overflow-hidden">
        <CardContent className="p-4 space-y-3">
          {/* Status Message */}
          <p className="text-sm text-foreground">
            {getStatusMessage()}
          </p>

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
