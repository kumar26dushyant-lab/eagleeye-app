// Trial Management System
// Handles trial tracking, expiry, enforcement, and abuse prevention

import { createClient } from '@/lib/supabase/server'

export interface TrialStatus {
  isActive: boolean
  isPaid: boolean
  daysLeft: number
  trialEndsAt: Date | null
  tier: 'trial' | 'founder' | 'team' | 'enterprise' | 'expired'
  pendingTier?: string | null
  hasPaymentMethod: boolean
  cancelAtPeriodEnd?: boolean
  // Payment failure fields
  paymentFailed?: boolean
  gracePeriodEndsAt?: Date | null
}

export const TRIAL_DURATION_DAYS = 7

// Subscription record type based on actual table schema
interface SubscriptionRecord {
  id: string
  customer_email: string
  dodo_customer_id?: string | null
  dodo_subscription_id?: string | null
  dodo_payment_id?: string | null
  product_id?: string | null
  tier: string
  status: string
  created_at: string
  updated_at: string
  trial_started_at?: string | null
  trial_ends_at?: string | null
  // Payment failure fields
  payment_failed_at?: string | null
  grace_period_ends_at?: string | null
  account_deletion_scheduled_at?: string | null
}

/**
 * Calculate days left from trial start date
 */
function calculateDaysLeft(trialStartedAt: string | null, trialEndsAt: string | null): { daysLeft: number; endsAt: Date | null } {
  const now = new Date()
  
  // If we have explicit trial end date, use it
  if (trialEndsAt) {
    const endsAt = new Date(trialEndsAt)
    const msLeft = endsAt.getTime() - now.getTime()
    const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24))
    return { daysLeft: Math.max(0, daysLeft), endsAt }
  }
  
  // Calculate from start date
  if (trialStartedAt) {
    const startDate = new Date(trialStartedAt)
    const endsAt = new Date(startDate.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000)
    const msLeft = endsAt.getTime() - now.getTime()
    const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24))
    return { daysLeft: Math.max(0, daysLeft), endsAt }
  }
  
  // No dates available, return full trial
  return { daysLeft: TRIAL_DURATION_DAYS, endsAt: null }
}

/**
 * Get user's trial/subscription status
 */
export async function getTrialStatus(userId: string): Promise<TrialStatus> {
  const supabase = await createClient()
  
  // First get the user's email from auth
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user?.email) {
    return {
      isActive: false,
      isPaid: false,
      daysLeft: TRIAL_DURATION_DAYS,
      trialEndsAt: null,
      tier: 'trial',
      hasPaymentMethod: false,
    }
  }
  
  // Get subscription record by email
  const { data: subscription } = await (supabase as any)
    .from('subscriptions')
    .select('*')
    .eq('customer_email', user.email.toLowerCase())
    .single() as { data: SubscriptionRecord | null }

  if (!subscription) {
    // New user - no subscription yet, give them trial access
    return {
      isActive: true,  // Allow access initially
      isPaid: false,
      daysLeft: TRIAL_DURATION_DAYS,
      trialEndsAt: null,
      tier: 'trial',
      hasPaymentMethod: false,
    }
  }

  // Check subscription status
  const hasActiveSubscription = !!subscription.dodo_subscription_id || !!subscription.dodo_customer_id
  
  // Calculate trial days based on stored dates
  const { daysLeft, endsAt } = calculateDaysLeft(
    subscription.trial_started_at || subscription.created_at,
    subscription.trial_ends_at || null
  )
  
  if (subscription.status === 'active') {
    return {
      isActive: true,
      isPaid: true,
      daysLeft: -1, // N/A for paid
      trialEndsAt: null,
      tier: subscription.tier as any,
      hasPaymentMethod: true,
    }
  }

  // Trialing status (includes paid trials with payment method registered)
  if (subscription.status === 'trialing') {
    // Check if they have a payment method registered (Dodo subscription)
    const hasPaymentRegistered = !!subscription.dodo_subscription_id || !!subscription.dodo_customer_id
    
    return {
      isActive: daysLeft > 0, // Only active if days remain
      isPaid: false, // Not charged yet
      daysLeft,
      trialEndsAt: endsAt,
      tier: 'trial' as const, // Always show as trial during trial period
      hasPaymentMethod: hasPaymentRegistered,
      // For display purposes - shows they're in trial but will auto-convert
      pendingTier: hasPaymentRegistered ? (subscription.tier as 'founder' | 'team') : null,
    }
  }

  // Cancelled or expired
  if (subscription.status === 'cancelled' || subscription.status === 'expired') {
    return {
      isActive: false,
      isPaid: false,
      daysLeft: 0,
      trialEndsAt: null,
      tier: 'expired',
      hasPaymentMethod: hasActiveSubscription,
    }
  }

  // Payment failed - NO ACCESS (they need to update payment method)
  if (subscription.status === 'payment_failed') {
    return {
      isActive: false,
      isPaid: false,
      daysLeft: 0,
      trialEndsAt: null,
      tier: 'expired',
      hasPaymentMethod: hasActiveSubscription,
      paymentFailed: true,
      gracePeriodEndsAt: subscription.grace_period_ends_at ? new Date(subscription.grace_period_ends_at) : null,
    }
  }

  // Default - allow access
  return {
    isActive: true,
    isPaid: false,
    daysLeft: TRIAL_DURATION_DAYS,
    trialEndsAt: null,
    tier: 'trial',
    hasPaymentMethod: false,
  }
}

/**
 * Start a trial for a user
 */
export async function startTrial(userId: string): Promise<{ success: boolean; trialEndsAt: Date }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) {
    return { success: false, trialEndsAt: new Date() }
  }
  
  const now = new Date()
  const trialEndsAt = new Date(now.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000)

  const { error } = await (supabase as any)
    .from('subscriptions')
    .upsert({
      customer_email: user.email.toLowerCase(),
      tier: 'trial',
      status: 'trialing',
      trial_started_at: now.toISOString(),
      trial_ends_at: trialEndsAt.toISOString(),
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    }, {
      onConflict: 'customer_email',
    })

  if (error) {
    console.error('Failed to start trial:', error)
    return { success: false, trialEndsAt }
  }

  return { success: true, trialEndsAt }
}

/**
 * Check if user can access premium features
 */
export async function canAccessPremium(userId: string): Promise<boolean> {
  const status = await getTrialStatus(userId)
  return status.isActive || status.isPaid
}

/**
 * Get days until trial reminder should be sent
 * Returns: 'none' | 'day3' | 'day1' | 'expired'
 */
export function getReminderType(daysLeft: number): 'none' | 'day3' | 'day1' | 'expired' {
  if (daysLeft <= 0) return 'expired'
  if (daysLeft <= 1) return 'day1'
  if (daysLeft <= 3) return 'day3'
  return 'none'
}

// ===========================================
// TRIAL ABUSE PREVENTION
// ===========================================

export interface TrialAbuseCheck {
  allowed: boolean
  reason?: string
  previousTrials?: number
}

/**
 * Check if a user/email/card is eligible for a trial
 * Prevents abuse by tracking:
 * - Email domain patterns
 * - Card fingerprints (from Stripe)
 * - Previous trial usage
 */
export async function checkTrialEligibility(
  email: string,
  stripeCustomerId?: string,
  cardFingerprint?: string
): Promise<TrialAbuseCheck> {
  const supabase = await createClient()
  
  // 1. Check if email already has/had a subscription
  const { data: existingByEmail } = await (supabase as any)
    .from('subscriptions')
    .select('user_id, status, trial_ends_at, created_at')
    .eq('email', email.toLowerCase())
    .single()

  if (existingByEmail) {
    // Email already used - no new trial
    return {
      allowed: false,
      reason: 'This email has already been used for a trial.',
      previousTrials: 1,
    }
  }

  // 2. Check for email alias abuse (e.g., user+1@gmail.com, user+2@gmail.com)
  const normalizedEmail = normalizeEmail(email)
  const { data: aliasMatches, count } = await (supabase as any)
    .from('subscriptions')
    .select('user_id', { count: 'exact' })
    .ilike('normalized_email', normalizedEmail)
  
  if (count && count > 0) {
    return {
      allowed: false,
      reason: 'A trial has already been used with this email address.',
      previousTrials: count,
    }
  }

  // 3. Check card fingerprint (if available from Stripe)
  if (cardFingerprint) {
    const { data: cardMatches, count: cardCount } = await (supabase as any)
      .from('trial_fingerprints')
      .select('id', { count: 'exact' })
      .eq('card_fingerprint', cardFingerprint)

    if (cardCount && cardCount > 0) {
      return {
        allowed: false,
        reason: 'This payment method has already been used for a trial.',
        previousTrials: cardCount,
      }
    }
  }

  // 4. Check for disposable email domains
  const domain = email.split('@')[1]?.toLowerCase()
  const disposableDomains = [
    'tempmail.com', 'throwaway.com', 'guerrillamail.com', 'mailinator.com',
    '10minutemail.com', 'fakeinbox.com', 'temp-mail.org', 'disposablemail.com',
    'yopmail.com', 'sharklasers.com', 'trashmail.com', 'getairmail.com',
  ]
  
  if (domain && disposableDomains.includes(domain)) {
    return {
      allowed: false,
      reason: 'Please use a business or permanent email address.',
    }
  }

  return { allowed: true }
}

/**
 * Normalize email to detect aliases
 * - Removes +alias from Gmail addresses
 * - Removes dots from Gmail (dots don't matter)
 * - Lowercases everything
 */
function normalizeEmail(email: string): string {
  const [local, domain] = email.toLowerCase().split('@')
  if (!local || !domain) return email.toLowerCase()

  let normalizedLocal = local

  // Gmail-specific normalization
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    // Remove everything after +
    normalizedLocal = normalizedLocal.split('+')[0]
    // Remove dots
    normalizedLocal = normalizedLocal.replace(/\./g, '')
  } else {
    // For other providers, just remove +alias
    normalizedLocal = normalizedLocal.split('+')[0]
  }

  return `${normalizedLocal}@${domain}`
}

/**
 * Record trial usage for abuse prevention
 */
export async function recordTrialUsage(
  userId: string,
  email: string,
  stripeCustomerId?: string,
  cardFingerprint?: string
): Promise<void> {
  const supabase = await createClient()
  
  const normalizedEmail = normalizeEmail(email)

  // Update subscription with normalized email
  await (supabase as any)
    .from('subscriptions')
    .update({
      email: email.toLowerCase(),
      normalized_email: normalizedEmail,
    })
    .eq('user_id', userId)

  // Record card fingerprint if available
  if (cardFingerprint) {
    await (supabase as any)
      .from('trial_fingerprints')
      .insert({
        user_id: userId,
        card_fingerprint: cardFingerprint,
        stripe_customer_id: stripeCustomerId,
        created_at: new Date().toISOString(),
      })
  }
}

