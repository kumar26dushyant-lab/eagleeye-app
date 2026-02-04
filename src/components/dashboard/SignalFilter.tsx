'use client'

import { motion } from 'framer-motion'
import { Filter, AlertTriangle, Sparkles, Info, Eye } from 'lucide-react'

export type FilterType = 'all' | 'urgent' | 'kudos' | 'fyi'

interface SignalFilterProps {
  activeFilter: FilterType
  onFilterChange: (filter: FilterType) => void
  counts: {
    all: number
    urgent: number
    kudos: number
    fyi: number
  }
}

const filters: { id: FilterType; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'all', label: 'All', icon: <Eye className="h-3 w-3" />, color: 'bg-primary/10 text-primary border-primary/20' },
  { id: 'urgent', label: 'Needs Attention', icon: <AlertTriangle className="h-3 w-3" />, color: 'bg-red-500/10 text-red-500 border-red-500/20' },
  { id: 'kudos', label: 'Kudos', icon: <Sparkles className="h-3 w-3" />, color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  { id: 'fyi', label: 'FYI', icon: <Info className="h-3 w-3" />, color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
]

export function SignalFilter({ activeFilter, onFilterChange, counts }: SignalFilterProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Filter className="h-4 w-4 text-muted-foreground" />
      <div className="flex items-center gap-1.5 bg-muted/30 rounded-full p-1 border border-border/50">
        {filters.map((filter) => {
          const count = counts[filter.id]
          const isActive = activeFilter === filter.id
          
          return (
            <motion.button
              key={filter.id}
              onClick={() => onFilterChange(filter.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full transition-all ${
                isActive
                  ? `${filter.color} border shadow-sm`
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {filter.icon}
              <span className="hidden sm:inline">{filter.label}</span>
              {count > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 text-[10px] rounded-full ${
                  isActive ? 'bg-background/50' : 'bg-muted'
                }`}>
                  {count}
                </span>
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
