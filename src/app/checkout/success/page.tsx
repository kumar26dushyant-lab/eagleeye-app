'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { CheckCircle, ArrowRight, Loader2, Mail, Bell, Plug, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

function SuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const paymentId = searchParams.get('payment_id')
  const status = searchParams.get('status')
  const error = searchParams.get('error')
  const tier = searchParams.get('tier') || 'solo'

  // Redirect to failed page if payment failed
  useEffect(() => {
    if (status === 'failed' || status === 'cancelled' || error) {
      router.replace(`/checkout/failed?tier=${tier}${error ? `&error=${encodeURIComponent(error)}` : ''}`)
    }
  }, [status, error, tier, router])

  const steps = [
    { 
      icon: Mail, 
      title: 'Check Your Email', 
      desc: 'We sent a confirmation link to activate your account',
      action: 'Click the link in your inbox',
      status: 'current'
    },
    { 
      icon: Plug, 
      title: 'Connect Your Tools', 
      desc: 'Slack, WhatsApp, Asana - takes 2 minutes',
      action: 'One-time setup',
      status: 'upcoming'
    },
    { 
      icon: Bell, 
      title: 'Receive Daily Briefs', 
      desc: 'Important signals come to you automatically',
      action: 'No app to check',
      status: 'upcoming'
    },
  ]

  // Show success for both explicit success status or no status (default)
  const isSuccess = status === 'succeeded' || status === null

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg w-full"
      >
        {isSuccess ? (
          <>
            {/* Success Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle className="h-10 w-10 text-green-500" />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-bold mb-2"
              >
                Payment Successful! 🎉
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-muted-foreground"
              >
                Your 7-day free trial has started. Just one more step to get started.
              </motion.p>
            </div>

            {/* Steps Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-card border border-border rounded-2xl p-6 mb-6"
            >
              <h3 className="font-semibold mb-6 text-center">Next Steps</h3>
              
              <div className="space-y-4">
                {steps.map((step, i) => (
                  <div 
                    key={i} 
                    className={`flex items-start gap-4 p-4 rounded-xl transition-colors ${
                      step.status === 'current' 
                        ? 'bg-primary/10 border border-primary/30' 
                        : 'bg-muted/30'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      step.status === 'current' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      <step.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className={`font-medium ${step.status === 'current' ? 'text-primary' : ''}`}>
                          {step.title}
                        </p>
                        {step.status === 'current' && (
                          <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary font-medium">
                            Now
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Email Reminder Box - CRITICAL NOTICE */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6"
            >
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-400">⚠️ IMPORTANT: Confirm your email first!</p>
                  <p className="text-muted-foreground mt-1">
                    <strong>You must click the confirmation link in your email before you can log in.</strong> Check your spam/junk folder if you don't see it within 2 minutes.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex flex-col gap-3"
            >
              <a href="https://mail.google.com" target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="w-full gap-2">
                  Open Gmail to Confirm Email
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
              <p className="text-xs text-center text-muted-foreground">
                Not using Gmail? Check your email inbox for a message from EagleEye
              </p>
              <Link href="/login">
                <Button size="lg" variant="ghost" className="w-full gap-2 text-muted-foreground">
                  Already confirmed? Login
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </motion.div>

            {paymentId && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="text-xs text-muted-foreground text-center mt-6"
              >
                Payment ID: {paymentId}
              </motion.p>
            )}
          </>
        ) : (
          <div className="text-center">
            <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="h-10 w-10 text-amber-500 animate-spin" />
            </div>

            <h1 className="text-3xl font-bold mb-2">Processing Payment</h1>

            <p className="text-muted-foreground mb-6">
              Your payment is being processed. This usually takes a few seconds.
            </p>

            <Link href="/login">
              <Button size="lg" variant="outline" className="gap-2">
                Go to Login
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <SuccessContent />
    </Suspense>
  )
}
