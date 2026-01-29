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
}

export const TRIAL_DURATION_DAYS = 14

// Subscription record type (not in generated Supabase types yet)
interface SubscriptionRecord {
  user_id: string
  status: string
  tier: string
  pending_tier?: string | null
  stripe_customer_id?: string | null
  stripe_subscription_id?: string | null
  trial_ends_at?: string | null
  cancel_at_period_end?: boolean
  current_period_end?: string | null
  cancelled_at?: string | null
  email?: string
  normalized_email?: string
  created_at: string
  updated_at: string
}

/**
 * Get user's trial/subscription status
 */
export async function getTrialStatus(userId: string): Promise<TrialStatus> {
  const supabase = await createClient()
  
  // Get subscription record (use any to bypass type checking since table may not be in generated types)
  const { data: subscription } = await (supabase as any)
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single() as { data: SubscriptionRecord | null }

  if (!subscription) {
    // New user - no trial started yet
    return {
      isActive: false,
      isPaid: false,
      daysLeft: TRIAL_DURATION_DAYS,
      trialEndsAt: null,
      tier: 'trial',
      hasPaymentMethod: false,
    }
  }

  // Check if paid subscription (not trialing)
  if (subscription.status === 'active' && subscription.stripe_subscription_id) {
    return {
      isActive: true,
      isPaid: true,
      daysLeft: -1, // N/A for paid
      trialEndsAt: null,
      tier: subscription.tier as any,
      pendingTier: subscription.pending_tier,
      hasPaymentMethod: true,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    }
  }

  // Check if subscription is trialing (Stripe trial)
  if (subscription.status === 'trialing' && subscription.stripe_subscription_id) {
    const now = new Date()
    const trialEndsAt = subscription.trial_ends_at ? new Date(subscription.trial_ends_at) : null
    
    if (trialEndsAt) {
      const daysLeft = Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysLeft <= 0) {
        return {
          isActive: false,
          isPaid: false,
          daysLeft: 0,
          trialEndsAt,
          tier: 'expired',
          pendingTier: subscription.pending_tier || subscription.tier,
          hasPaymentMethod: !!subscription.stripe_customer_id,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        }
      }

      return {
        isActive: true,
        isPaid: false,
        daysLeft,
        trialEndsAt,
        tier: (subscription.tier as any) || 'trial',
        pendingTier: subscription.pending_tier,
        hasPaymentMethod: !!subscription.stripe_customer_id,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      }
    }
  }

  // Check local trial status (pre-Stripe)
  const now = new Date()
  const trialEndsAt = subscription.trial_ends_at ? new Date(subscription.trial_ends_at) : null
  
  if (trialEndsAt) {
    const daysLeft = Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysLeft <= 0) {
      // Trial expired
      return {
        isActive: false,
        isPaid: false,
        daysLeft: 0,
        trialEndsAt,
        tier: 'expired',
        hasPaymentMethod: !!subscription.stripe_customer_id,
      }
    }

    // Trial active
    return {
      isActive: true,
      isPaid: false,
      daysLeft,
      trialEndsAt,
      tier: 'trial',
      hasPaymentMethod: !!subscription.stripe_customer_id,
    }
  }

  // Cancelled subscription
  if (subscription.status === 'cancelled') {
    return {
      isActive: false,
      isPaid: false,
      daysLeft: 0,
      trialEndsAt: null,
      tier: 'expired',
      hasPaymentMethod: !!subscription.stripe_customer_id,
    }
  }

  // No trial started
  return {
    isActive: false,
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
  
  const trialEndsAt = new Date()
  trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DURATION_DAYS)

  const { error } = await (supabase as any)
    .from('subscriptions')
    .upsert({
      user_id: userId,
      tier: 'trial',
      status: 'trialing',
      trial_ends_at: trialEndsAt.toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
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

