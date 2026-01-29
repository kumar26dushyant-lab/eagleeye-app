'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { CreditCard, Check, Loader2, ExternalLink, AlertCircle, Sparkles, Clock, ArrowRight, X, AlertTriangle, ArrowDown, ArrowUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

interface TrialStatus {
  isActive: boolean
  isPaid: boolean
  daysLeft: number
  tier: string | null
  pendingTier?: string | null
  trialEndsAt?: string
  cancelAtPeriodEnd?: boolean
  hasPaymentMethod?: boolean
}

const TIER_INFO: Record<string, { name: string; price: string; color: string; features: string[] }> = {
  expired: {
    name: 'Trial Expired',
    price: 'No active plan',
    color: 'text-red-500',
    features: ['Subscribe to continue using EagleEye'],
  },
  trial: {
    name: '14-Day Trial',
    price: 'Free until trial ends',
    color: 'text-green-500',
    features: ['Full access to all features', 'Card on file, charged after Day 14'],
  },
  founder: {
    name: 'Founder',
    price: '$29/mo',
    color: 'text-blue-500',
    features: ['Unlimited integrations', 'AI insights', 'All notifications'],
  },
  team: {
    name: 'Team',
    price: '$79/mo',
    color: 'text-purple-500',
    features: ['Everything in Founder', '10 team members', 'Team dashboard'],
  },
  enterprise: {
    name: 'Enterprise',
    price: 'Custom',
    color: 'text-orange-500',
    features: ['Everything in Team', 'Unlimited members', 'SSO/SAML'],
  },
}

export default function BillingPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <BillingContent />
    </Suspense>
  )
}

function LoadingFallback() {
  return (
    <div className="p-6 flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

function BillingContent() {
  const searchParams = useSearchParams()
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)
  const [upgradeLoading, setUpgradeLoading] = useState<string | null>(null)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [changePlanLoading, setChangePlanLoading] = useState<string | null>(null)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  useEffect(() => {
    loadTrialStatus()
  }, [])

  const loadTrialStatus = async () => {
    try {
      const res = await fetch('/api/trial/status')
      if (res.ok) {
        const data = await res.json()
        setTrialStatus(data)
      } else {
        setTrialStatus({ isActive: false, isPaid: false, daysLeft: 0, tier: null })
      }
    } catch (error) {
      console.error('Failed to load trial status:', error)
      setTrialStatus({ isActive: false, isPaid: false, daysLeft: 0, tier: null })
    } finally {
      setLoading(false)
    }
  }

  const openCustomerPortal = async () => {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/payments/portal', { method: 'POST' })
      const data = await res.json()

      if (data.portalUrl) {
        window.location.href = data.portalUrl
      } else {
        toast.error(data.error || 'Failed to open billing portal')
      }
    } catch (error) {
      toast.error('Failed to open billing portal')
    } finally {
      setPortalLoading(false)
    }
  }

  const handleUpgrade = async (tier: string) => {
    setUpgradeLoading(tier)
    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      })
      const data = await res.json()

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        toast.error(data.error || 'Failed to start checkout')
      }
    } catch (error) {
      toast.error('Failed to start checkout')
    } finally {
      setUpgradeLoading(null)
    }
  }

  const handleChangePlan = async (newTier: string) => {
    setChangePlanLoading(newTier)
    try {
      const res = await fetch('/api/payments/change-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newTier }),
      })
      const data = await res.json()

      if (data.success) {
        if (data.noChange) {
          toast.info('You are already on this plan')
        } else {
          toast.success(data.message)
          loadTrialStatus() // Refresh status
        }
      } else if (data.needsCheckout) {
        // Redirect to checkout
        handleUpgrade(newTier)
      } else {
        toast.error(data.error || 'Failed to change plan')
      }
    } catch (error) {
      toast.error('Failed to change plan')
    } finally {
      setChangePlanLoading(null)
    }
  }

  const handleCancel = async () => {
    setCancelLoading(true)
    try {
      const res = await fetch('/api/payments/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()

      if (data.success) {
        toast.success(data.message)
        setShowCancelConfirm(false)
        loadTrialStatus() // Refresh status
      } else {
        toast.error(data.error || 'Failed to cancel subscription')
      }
    } catch (error) {
      toast.error('Failed to cancel subscription')
    } finally {
      setCancelLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Determine current tier display
  let currentTier = 'expired'
  if (trialStatus?.isPaid && trialStatus.tier) {
    currentTier = trialStatus.tier
  } else if (trialStatus?.isActive && trialStatus.daysLeft > 0) {
    currentTier = 'trial'
  }

  const tierInfo = TIER_INFO[currentTier] || TIER_INFO.expired

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-semibold">Billing & Subscription</h1>
        <p className="text-muted-foreground mt-1">
          Manage your EagleEye subscription and payment method.
        </p>
      </motion.div>

      {/* Trial Banner */}
      {currentTier === 'trial' && trialStatus && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg border flex items-center justify-between ${
            trialStatus.daysLeft <= 3 
              ? 'bg-red-500/10 border-red-500/30 text-red-400' 
              : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
          }`}
        >
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5" />
            <div>
              <span className="font-medium block">
                {trialStatus.daysLeft === 1 
                  ? 'Your trial ends tomorrow!' 
                  : `${trialStatus.daysLeft} days left in your free trial`}
              </span>
              <span className="text-xs opacity-80">
                Your card will be charged when the trial ends. You can change plans or cancel anytime.
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Cancelled Banner */}
      {trialStatus?.cancelAtPeriodEnd && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg border bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5" />
            <div>
              <span className="font-medium block">Subscription Cancelled</span>
              <span className="text-xs opacity-80">
                Your access will end on {trialStatus.trialEndsAt 
                  ? new Date(trialStatus.trialEndsAt).toLocaleDateString() 
                  : 'the billing period end'}. 
                You can reactivate anytime before then.
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Current Plan Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-base">Current Plan</CardTitle>
                <div className={`text-2xl font-bold mt-2 ${tierInfo.color}`}>
                  {tierInfo.name}
                </div>
                <CardDescription className="mt-1">{tierInfo.price}</CardDescription>
              </div>
              {trialStatus?.isPaid && (
                <span className="inline-flex items-center gap-1 text-green-500 text-sm">
                  <Check className="h-4 w-4" />
                  Active
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <h3 className="text-sm font-medium mb-2">Plan includes:</h3>
            <ul className="space-y-1">
              {tierInfo.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-3 w-3 text-green-500" />
                  {feature}
                </li>
              ))}
            </ul>

            {trialStatus?.trialEndsAt && currentTier === 'trial' && (
              <p className="text-sm text-muted-foreground mt-4 pt-4 border-t border-border">
                Trial ends on:{' '}
                <span className="text-foreground font-medium">
                  {new Date(trialStatus.trialEndsAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        {trialStatus?.isPaid ? (
          <>
            <Button
              className="w-full"
              variant="outline"
              onClick={openCustomerPortal}
              disabled={portalLoading}
            >
              {portalLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CreditCard className="h-4 w-4 mr-2" />
              )}
              Manage Subscription
              <ExternalLink className="h-3 w-3 ml-2" />
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Update payment method, view invoices, or cancel subscription
            </p>
          </>
        ) : currentTier === 'trial' || (currentTier !== 'expired' && trialStatus?.hasPaymentMethod) ? (
          // During trial - allow plan changes
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground">Change Your Plan</h3>
            <p className="text-xs text-muted-foreground">
              Switch plans anytime during your trial. Your trial clock won&apos;t reset &mdash; you&apos;ll be charged for your final choice on day 14.
            </p>
            <div className="grid gap-3">
              <Card className={`border ${trialStatus?.tier === 'founder' ? 'border-primary bg-primary/5' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">Founder Plan</h4>
                        {trialStatus?.tier === 'founder' && (
                          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">Current</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">$29/month • Best for solo founders</p>
                    </div>
                    {trialStatus?.tier === 'founder' ? (
                      <Check className="h-5 w-5 text-primary" />
                    ) : (
                      <Button 
                        variant={trialStatus?.tier === 'team' ? 'outline' : 'default'}
                        size="sm"
                        onClick={() => trialStatus?.hasPaymentMethod ? handleChangePlan('founder') : handleUpgrade('founder')}
                        disabled={changePlanLoading === 'founder' || upgradeLoading === 'founder'}
                      >
                        {changePlanLoading === 'founder' || upgradeLoading === 'founder' ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : trialStatus?.tier === 'team' ? (
                          <>
                            <ArrowDown className="h-4 w-4 mr-1" />
                            Downgrade
                          </>
                        ) : (
                          <>
                            Select
                            <ArrowRight className="h-4 w-4 ml-1" />
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className={`border ${trialStatus?.tier === 'team' ? 'border-primary bg-primary/5' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">Team Plan</h4>
                        {trialStatus?.tier === 'team' && (
                          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">Current</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">$79/month • Up to 10 members</p>
                    </div>
                    {trialStatus?.tier === 'team' ? (
                      <Check className="h-5 w-5 text-primary" />
                    ) : (
                      <Button 
                        variant={trialStatus?.tier === 'founder' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => trialStatus?.hasPaymentMethod ? handleChangePlan('team') : handleUpgrade('team')}
                        disabled={changePlanLoading === 'team' || upgradeLoading === 'team'}
                      >
                        {changePlanLoading === 'team' || upgradeLoading === 'team' ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : trialStatus?.tier === 'founder' ? (
                          <>
                            <ArrowUp className="h-4 w-4 mr-1" />
                            Upgrade
                          </>
                        ) : (
                          <>
                            Select
                            <ArrowRight className="h-4 w-4 ml-1" />
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Cancel Trial Section */}
            {trialStatus?.hasPaymentMethod && !trialStatus.cancelAtPeriodEnd && (
              <div className="pt-4 border-t border-border">
                {showCancelConfirm ? (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                    <h4 className="font-medium text-red-400 mb-2">Cancel your trial?</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Your card will not be charged. You&apos;ll lose access to EagleEye immediately.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCancelConfirm(false)}
                      >
                        Keep my trial
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleCancel}
                        disabled={cancelLoading}
                      >
                        {cancelLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <X className="h-4 w-4 mr-2" />
                        )}
                        Yes, cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="text-sm text-muted-foreground hover:text-red-400 transition-colors"
                  >
                    Cancel trial and remove payment method
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          // Expired or no payment method - show upgrade options
          <div className="space-y-4">
            <div className="grid gap-3">
              <Card className="border-primary">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">Founder Plan</h4>
                      <p className="text-sm text-muted-foreground">$29/month • Best for solo founders</p>
                    </div>
                    <Button 
                      onClick={() => handleUpgrade('founder')}
                      disabled={upgradeLoading === 'founder'}
                    >
                      {upgradeLoading === 'founder' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          Start Trial
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">Team Plan</h4>
                      <p className="text-sm text-muted-foreground">$79/month • Up to 10 members</p>
                    </div>
                    <Button 
                      variant="outline"
                      onClick={() => handleUpgrade('team')}
                      disabled={upgradeLoading === 'team'}
                    >
                      {upgradeLoading === 'team' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          Start Trial
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              14-day free trial • No charge until trial ends • Cancel anytime
            </p>
          </div>
        )}
      </motion.div>

      {/* Payment Security */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-center pt-4"
      >
        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <svg className="h-5 w-5" viewBox="0 0 32 32" fill="currentColor">
            <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.86 1.545-2.354 1.545-1.827 0-4.878-.89-6.964-2.094l-.89 5.555c1.774.95 5.02 1.974 8.392 1.974 2.587 0 4.739-.66 6.29-1.878 1.72-1.334 2.597-3.321 2.597-5.865 0-4.112-2.514-5.885-6.773-7.107z"/>
          </svg>
          Secured by Stripe
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          We never store your card details. All payments processed securely by Stripe.
        </p>
      </motion.div>
    </div>
  )
}
