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
  // Payment failure fields
  paymentFailed?: boolean
  gracePeriodEndsAt?: string | null
}

const TIER_INFO: Record<string, { name: string; price: string; color: string; features: string[] }> = {
  expired: {
    name: 'No Active Plan',
    price: 'Start your free trial',
    color: 'text-muted-foreground',
    features: ['7-day free trial available', 'Card required, cancel anytime', 'Full access during trial'],
  },
  trial: {
    name: 'Free Trial',
    price: '7 days free',
    color: 'text-green-500',
    features: ['Full access to all features', 'Connect unlimited integrations', 'AI-powered insights'],
  },
  founder: {
    name: 'Solo',
    price: '$29/month',
    color: 'text-blue-500',
    features: ['Unlimited integrations', 'AI daily briefs', '90-day signal history', 'Email support'],
  },
  team: {
    name: 'Team',
    price: '$79/month',
    color: 'text-purple-500',
    features: ['Everything in Solo', 'Up to 10 team members', 'Team dashboard & analytics', '1-year history'],
  },
  enterprise: {
    name: 'Enterprise',
    price: 'Custom pricing',
    color: 'text-orange-500',
    features: ['Everything in Team', 'Unlimited team members', 'SSO/SAML authentication', 'SLA available'],
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
        
        // If server says to logout, sign out and redirect
        if (data.shouldLogout) {
          const supabase = (await import('@/lib/supabase/client')).createClient()
          await supabase.auth.signOut()
          window.location.href = '/?cancelled=true'
        } else {
          loadTrialStatus() // Refresh status
        }
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

      {/* Trial Countdown Banner */}
      {currentTier === 'trial' && trialStatus && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 rounded-xl border-2 ${
            trialStatus.daysLeft <= 2 
              ? 'bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/40' 
              : 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`relative flex items-center justify-center w-16 h-16 rounded-full ${
                trialStatus.daysLeft <= 2 
                  ? 'bg-red-500/20 text-red-400' 
                  : 'bg-blue-500/20 text-blue-400'
              }`}>
                <span className="text-2xl font-bold">{trialStatus.daysLeft}</span>
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray={`${(trialStatus.daysLeft / 7) * 100}, 100`}
                    strokeLinecap="round"
                    className="opacity-60"
                  />
                </svg>
              </div>
              <div>
                <span className={`font-semibold text-lg block ${
                  trialStatus.daysLeft <= 2 ? 'text-red-400' : 'text-foreground'
                }`}>
                  {trialStatus.daysLeft === 0 
                    ? 'Trial ends today!' 
                    : trialStatus.daysLeft === 1 
                      ? 'Trial ends tomorrow!' 
                      : `${trialStatus.daysLeft} days remaining`}
                </span>
                <span className="text-sm text-muted-foreground">
                  Your 7-day free trial • Auto-renews to Solo plan at $29/month
                </span>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-8 rounded-full transition-all ${
                    i < (7 - trialStatus.daysLeft)
                      ? 'bg-muted-foreground/30'
                      : trialStatus.daysLeft <= 2
                        ? 'bg-red-500'
                        : 'bg-blue-500'
                  }`}
                />
              ))}
            </div>
          </div>
          {trialStatus.trialEndsAt && (
            <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50">
              Trial started on {new Date(new Date(trialStatus.trialEndsAt).getTime() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString()} • 
              Ends on {new Date(trialStatus.trialEndsAt).toLocaleDateString()} • 
              Cancel anytime before to avoid charges
            </p>
          )}
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

      {/* Payment Failed Banner */}
      {trialStatus?.paymentFailed && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-xl border-2 bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/40"
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-400 text-lg">Payment Failed</h3>
              <p className="text-sm text-muted-foreground mt-1">
                We couldn't process your payment. Please update your payment method to restore access.
              </p>
              {trialStatus.gracePeriodEndsAt && (
                <div className="mt-3 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                  <p className="text-sm text-red-300">
                    <strong>Account will be deleted on:</strong>{' '}
                    {new Date(trialStatus.gracePeriodEndsAt).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              )}
              <div className="mt-4">
                <Button 
                  className="bg-red-500 hover:bg-red-600"
                  onClick={async () => {
                    // Create checkout session for reactivation (no trial)
                    try {
                      const res = await fetch('/api/payments/checkout', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                          tier: 'founder',
                          reactivation: true // Flag to skip trial
                        }),
                      })
                      const data = await res.json()
                      if (data.checkoutUrl) {
                        window.location.href = data.checkoutUrl
                      } else if (data.checkout_url) {
                        window.location.href = data.checkout_url
                      } else if (data.error) {
                        toast.error(data.error)
                      } else {
                        toast.error('Unable to create checkout session')
                      }
                    } catch (error) {
                      toast.error('Failed to start checkout')
                    }
                  }}
                >
                  Update Payment Method
                </Button>
              </div>
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
            {/* Show upgrade/downgrade options for paid users */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground">Change Your Plan</h3>
              <div className="grid gap-3">
                <Card className={`border ${trialStatus?.tier === 'founder' ? 'border-primary bg-primary/5' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">Solo Plan</h4>
                          {trialStatus?.tier === 'founder' && (
                            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">Current</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">$29/month • For founders, VPs & leaders</p>
                      </div>
                      {trialStatus?.tier === 'founder' ? (
                        <Check className="h-5 w-5 text-green-500" />
                      ) : (
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => handleChangePlan('founder')}
                          disabled={changePlanLoading === 'founder'}
                        >
                          {changePlanLoading === 'founder' ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <ArrowDown className="h-4 w-4 mr-1" />
                              Downgrade
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
                            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">Current</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">$79/month • Up to 10 members</p>
                      </div>
                      {trialStatus?.tier === 'team' ? (
                        <Check className="h-5 w-5 text-green-500" />
                      ) : (
                        <Button 
                          variant="default"
                          size="sm"
                          onClick={() => handleChangePlan('team')}
                          disabled={changePlanLoading === 'team'}
                        >
                          {changePlanLoading === 'team' ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <ArrowUp className="h-4 w-4 mr-1" />
                              Upgrade
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <p className="text-xs text-muted-foreground">
                Plan changes take effect immediately. Upgrades are prorated for the remaining billing period.
              </p>
            </div>

            {/* Cancel Subscription */}
            <div className="pt-4 border-t border-border">
              {showCancelConfirm ? (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <h4 className="font-medium text-red-400 mb-2">⚠️ Cancel your subscription?</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    This action will immediately:
                  </p>
                  <ul className="text-sm text-muted-foreground mb-4 space-y-1 ml-4">
                    <li>• Disconnect all your integrations</li>
                    <li>• Delete your signals and data</li>
                    <li>• Log you out of your account</li>
                  </ul>
                  <p className="text-sm text-red-400 mb-4">
                    This cannot be undone. You can sign up again anytime.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleCancel}
                      disabled={cancelLoading}
                    >
                      {cancelLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Yes, cancel and delete my data
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCancelConfirm(false)}
                    >
                      Keep subscription
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="text-sm text-muted-foreground hover:text-red-400 transition-colors"
                >
                  Cancel subscription
                </button>
              )}
            </div>
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
                        <h4 className="font-semibold">Solo Plan</h4>
                        {trialStatus?.tier === 'founder' && (
                          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">Current</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">$29/month • For founders, VPs & leaders</p>
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
                      <h4 className="font-semibold">Solo Plan</h4>
                      <p className="text-sm text-muted-foreground">$29/month • For founders, VPs & leaders</p>
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
              7-day free trial • Card required • No charge until day 8 • Cancel anytime
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
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
          </svg>
          Secured by Dodo Payments
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          We never store your card details. All payments processed securely by Dodo Payments.
        </p>
      </motion.div>
    </div>
  )
}
