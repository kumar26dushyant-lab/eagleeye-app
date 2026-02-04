// Support Reactivation API
// Allows support team to help users reactivate their accounts without a new trial
// Used when user contacts support saying they've fixed their payment method

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { nanoid } from 'nanoid'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Secret for support API access
const SUPPORT_API_SECRET = process.env.SUPPORT_API_SECRET

export async function POST(request: NextRequest) {
  // Verify support API secret
  const authHeader = request.headers.get('x-support-secret')
  
  if (!SUPPORT_API_SECRET || authHeader !== SUPPORT_API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { action, customerEmail, supportAgentEmail, reason } = body

    if (!customerEmail) {
      return NextResponse.json({ error: 'Customer email required' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const email = customerEmail.toLowerCase()

    switch (action) {
      case 'generate_reactivation_link':
        return await generateReactivationLink(supabase, email, supportAgentEmail, reason)
      
      case 'extend_grace_period':
        return await extendGracePeriod(supabase, email, body.days || 3, supportAgentEmail, reason)
      
      case 'check_status':
        return await checkAccountStatus(supabase, email)
      
      case 'restore_account':
        return await restoreAccount(supabase, email, supportAgentEmail, reason)
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('[Support API] Error:', error)
    return NextResponse.json({ 
      error: 'Operation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * Generate a reactivation link for the user
 * This bypasses the trial and takes them directly to payment
 */
async function generateReactivationLink(
  supabase: any, 
  email: string, 
  agentEmail?: string,
  reason?: string
) {
  const token = nanoid(32)
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // Link valid for 7 days

  const { error } = await supabase
    .from('reactivation_tokens')
    .insert({
      customer_email: email,
      token,
      created_by: agentEmail || 'support',
      reason: reason || 'Customer requested reactivation',
      expires_at: expiresAt.toISOString(),
    })

  if (error) {
    console.error('[Support API] Failed to create reactivation token:', error)
    return NextResponse.json({ error: 'Failed to create token' }, { status: 500 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://eagleeye.work'
  const reactivationLink = `${baseUrl}/reactivate?token=${token}`

  return NextResponse.json({
    success: true,
    reactivationLink,
    expiresAt: expiresAt.toISOString(),
    message: 'Send this link to the customer. It will take them directly to payment without a new trial.',
  })
}

/**
 * Extend the grace period for an account
 */
async function extendGracePeriod(
  supabase: any,
  email: string,
  days: number,
  agentEmail?: string,
  reason?: string
) {
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('id, status, grace_period_ends_at, account_deletion_scheduled_at')
    .eq('customer_email', email)
    .single()

  if (!subscription) {
    return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
  }

  const now = new Date()
  const newGracePeriodEnd = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
  const newDeletionDate = new Date(newGracePeriodEnd.getTime() + 24 * 60 * 60 * 1000)

  const { error } = await supabase
    .from('subscriptions')
    .update({
      grace_period_ends_at: newGracePeriodEnd.toISOString(),
      account_deletion_scheduled_at: newDeletionDate.toISOString(),
      grace_period_email_sent: false, // Reset so they get another warning
      updated_at: now.toISOString(),
    })
    .eq('customer_email', email)

  if (error) {
    return NextResponse.json({ error: 'Failed to extend grace period' }, { status: 500 })
  }

  // Log the action
  await supabase
    .from('payment_failure_logs')
    .insert({
      subscription_id: subscription.id,
      customer_email: email,
      failure_reason: `Grace period extended by ${days} days`,
      resolved_by: agentEmail || 'support',
      notes: reason,
      attempted_at: now.toISOString(),
    })

  return NextResponse.json({
    success: true,
    newGracePeriodEnd: newGracePeriodEnd.toISOString(),
    newDeletionDate: newDeletionDate.toISOString(),
    message: `Grace period extended by ${days} days. Account deletion now scheduled for ${newDeletionDate.toLocaleDateString()}.`,
  })
}

/**
 * Check account status for support
 */
async function checkAccountStatus(supabase: any, email: string) {
  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('customer_email', email)
    .single()

  if (error || !subscription) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 })
  }

  // Get payment failure history
  const { data: failureLogs } = await supabase
    .from('payment_failure_logs')
    .select('*')
    .eq('customer_email', email)
    .order('attempted_at', { ascending: false })
    .limit(10)

  return NextResponse.json({
    success: true,
    account: {
      email,
      status: subscription.status,
      tier: subscription.tier,
      createdAt: subscription.created_at,
      trialStartedAt: subscription.trial_started_at,
      trialEndsAt: subscription.trial_ends_at,
      paymentFailedAt: subscription.payment_failed_at,
      gracePeriodEndsAt: subscription.grace_period_ends_at,
      deletionScheduledAt: subscription.account_deletion_scheduled_at,
      paymentRetryCount: subscription.payment_retry_count,
      lastPaymentError: subscription.last_payment_error,
      hasDodoCustomer: !!subscription.dodo_customer_id,
      hasDodoSubscription: !!subscription.dodo_subscription_id,
    },
    paymentHistory: failureLogs || [],
  })
}

/**
 * Restore a deleted or payment_failed account (clears failure state)
 * User still needs to complete payment, but can login again
 */
async function restoreAccount(
  supabase: any,
  email: string,
  agentEmail?: string,
  reason?: string
) {
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('id, status')
    .eq('customer_email', email)
    .single()

  if (!subscription) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 })
  }

  // Reset to trialing status (they still need to pay)
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'trialing',
      // Clear payment failure fields
      payment_failed_at: null,
      grace_period_ends_at: null,
      account_deletion_scheduled_at: null,
      payment_retry_count: 0,
      last_payment_error: null,
      payment_failed_email_sent: false,
      grace_period_email_sent: false,
      // Set trial to already expired (no free days)
      trial_started_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
      trial_ends_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Yesterday
      updated_at: new Date().toISOString(),
    })
    .eq('customer_email', email)

  if (error) {
    return NextResponse.json({ error: 'Failed to restore account' }, { status: 500 })
  }

  // Mark any unresolved failures as resolved
  await supabase
    .from('payment_failure_logs')
    .update({
      resolved_at: new Date().toISOString(),
      resolved_by: agentEmail || 'support_restore',
      notes: reason || 'Account restored by support',
    })
    .eq('customer_email', email)
    .is('resolved_at', null)

  return NextResponse.json({
    success: true,
    message: 'Account restored. User can login but needs to complete payment. No new trial period given.',
  })
}
