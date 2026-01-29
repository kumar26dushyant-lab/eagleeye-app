'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { IntentMode } from '@/types'
import { MODE_CONFIG } from '@/lib/importance'

interface ModeSelectorProps {
  mode: IntentMode
  onModeChange: (mode: IntentMode) => void
}

const modes: IntentMode[] = ['calm', 'on_the_go', 'work', 'focus']

export function ModeSelector({ mode, onModeChange }: ModeSelectorProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
      {modes.map((m) => {
        const config = MODE_CONFIG[m]
        const isActive = mode === m
        return (
          <button
            key={m}
            onClick={() => onModeChange(m)}
            className={cn(
              'relative px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {isActive && (
              <motion.div
                layoutId="activeMode"
                className="absolute inset-0 bg-background rounded-md shadow-sm"
                initial={false}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <span>{config.icon}</span>
              <span className="hidden sm:inline">{config.label}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
