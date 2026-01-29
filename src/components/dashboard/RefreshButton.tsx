'use client'

import { RefreshCw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface RefreshButtonProps {
  onClick: () => void
  isLoading?: boolean
  className?: string
}

export function RefreshButton({ onClick, isLoading, className }: RefreshButtonProps) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      disabled={isLoading}
      className={cn('gap-2', className)}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Refreshing...
        </>
      ) : (
        <>
          <RefreshCw className="h-4 w-4" />
          Refresh Snapshot Now
        </>
      )}
    </Button>
  )
}
