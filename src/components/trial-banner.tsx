'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Clock, ArrowRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TrialBannerProps {
  daysLeft: number
  onDismiss?: () => void
}

export function TrialBanner({ daysLeft, onDismiss }: TrialBannerProps) {
  const [visible, setVisible] = useState(true)

  if (!visible) return null

  const urgency = daysLeft <= 3 ? 'urgent' : daysLeft <= 7 ? 'warning' : 'info'
  
  const colors = {
    urgent: 'bg-red-500/10 border-red-500/30 text-red-400',
    warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
  }

  const messages = {
    urgent: daysLeft === 1 
      ? 'Your trial ends tomorrow!' 
      : `Only ${daysLeft} days left in your trial`,
    warning: `${daysLeft} days remaining in your free trial`,
    info: `${daysLeft} days left in your trial`,
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`px-4 py-3 border rounded-lg mb-4 flex items-center justify-between ${colors[urgency]}`}
    >
      <div className="flex items-center gap-3">
        <Clock className="h-5 w-5" />
        <span className="font-medium">{messages[urgency]}</span>
        {urgency === 'info' && (
          <span className="text-sm opacity-75">
            — Full access to all features
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        {urgency !== 'info' && (
          <Link href="/settings/billing">
            <Button size="sm" variant={urgency === 'urgent' ? 'default' : 'outline'}>
              Upgrade Now
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        )}
        {onDismiss && (
          <button 
            onClick={() => {
              setVisible(false)
              onDismiss()
            }}
            className="p-1 hover:bg-white/10 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </motion.div>
  )
}

/**
 * Full-screen trial expired overlay
 */
export function TrialExpiredOverlay() {
  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-4 text-center"
      >
        <div className="text-6xl mb-6">⏰</div>
        <h1 className="text-2xl font-bold mb-2">Your trial has ended</h1>
        <p className="text-muted-foreground mb-6">
          We hope you enjoyed EagleEye! Upgrade to continue getting AI-powered
          insights about what matters most in your business.
        </p>
        
        <div className="space-y-3">
          <Link href="/settings/billing" className="block">
            <Button className="w-full py-6 text-lg">
              Continue with a paid plan
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
          
          <Link href="/pricing" className="block">
            <Button variant="outline" className="w-full">
              View pricing options
            </Button>
          </Link>
        </div>

        <p className="text-sm text-muted-foreground mt-6">
          Questions? <a href="mailto:support@eagleeye.work" className="text-primary hover:underline">Contact support</a>
        </p>
      </motion.div>
    </div>
  )
}

/**
 * Hook to get trial status from API
 */
export function useTrialStatus() {
  const [status, setStatus] = useState<{
    isActive: boolean
    isPaid: boolean
    daysLeft: number
    tier: string | null
    loading: boolean
  }>({
    isActive: true,
    isPaid: false,
    daysLeft: 14,
    tier: null,
    loading: true,
  })

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch('/api/trial/status')
        if (res.ok) {
          const data = await res.json()
          setStatus({ ...data, loading: false })
        }
      } catch (error) {
        console.error('Failed to fetch trial status:', error)
        setStatus(prev => ({ ...prev, loading: false }))
      }
    }

    fetchStatus()
  }, [])

  return status
}
