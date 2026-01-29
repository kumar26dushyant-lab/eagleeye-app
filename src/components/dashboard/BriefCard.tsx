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
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Calendar className="h-5 w-5 text-primary" />
              {today}
            </CardTitle>
            <Badge variant="outline" className="capitalize">
              {mode.replace('_', ' ')} mode
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Message */}
          <p className="text-foreground font-medium">
            {getModeMessage()}
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Needs Attention */}
            <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/20">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-xs text-muted-foreground">Action Needed</span>
              </div>
              <p className="text-2xl font-bold text-red-500">{stats.needsAttention}</p>
            </div>

            {/* Messages */}
            <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="h-4 w-4 text-blue-500" />
                <span className="text-xs text-muted-foreground">Messages</span>
              </div>
              <p className="text-2xl font-bold text-blue-500">{stats.signals}</p>
            </div>

            {/* FYI / In Progress */}
            <div className="bg-amber-500/10 rounded-lg p-3 border border-amber-500/20">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-amber-500" />
                <span className="text-xs text-muted-foreground">In Progress</span>
              </div>
              <p className="text-2xl font-bold text-amber-500">{stats.fyi}</p>
            </div>

            {/* Team Coverage */}
            <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/20">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-xs text-muted-foreground">Team Handled</span>
              </div>
              <p className="text-2xl font-bold text-green-500">{stats.handled}</p>
            </div>
          </div>

          {/* Coverage Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Team coverage</span>
              <span>{stats.coveragePercentage}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
                initial={{ width: 0 }}
                animate={{ width: `${stats.coveragePercentage}%` }}
                transition={{ delay: 0.3, duration: 0.8 }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Your team is handling {stats.coveragePercentage}% of work without needing your input
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
