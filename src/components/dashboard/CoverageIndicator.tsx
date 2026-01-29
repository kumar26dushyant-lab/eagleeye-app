'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface CoverageIndicatorProps {
  percent: number
  className?: string
}

export function CoverageIndicator({ percent, className }: CoverageIndicatorProps) {
  const level = percent >= 85 ? 'High' : percent >= 60 ? 'Partial' : 'Low'
  const color = percent >= 85 ? 'text-[var(--accent-green)]' : percent >= 60 ? 'text-[var(--accent-amber)]' : 'text-[var(--accent-red)]'
  const bgColor = percent >= 85 ? 'bg-[var(--accent-green)]' : percent >= 60 ? 'bg-[var(--accent-amber)]' : 'bg-[var(--accent-red)]'

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex items-center gap-1.5">
        <span className="text-sm text-muted-foreground">Coverage:</span>
        <span className={cn('text-sm font-medium', color)}>
          {percent}% ({level})
        </span>
      </div>
      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full', bgColor)}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}
