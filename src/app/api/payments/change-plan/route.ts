import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripe, PRICING_TIERS, PricingTier } from '@/lib/payments/stripe'

/**
 * POST /api/payments/change-plan
 * Change plan during trial or active subscription
 * 
 * During trial: Updates the pending plan, trial clock continues
 * Active subscription: Prorates the change
 * 
 * This ensures:
 * - Trial clock never resets
 * - User is charged for their final plan choice at trial end
 * - Upgrades and downgrades are allowed during trial
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { newTier } = await request.json()

    if (!newTier || !PRICING_TIERS[newTier as PricingTier]) {
      return NextResponse.json(
        { error: 'Invalid plan. Choose founder or team.' },
        { status: 400 }
      )
    }

    const tierConfig = PRICING_TIERS[newTier as PricingTier]
    if (!tierConfig.priceId) {
      return NextResponse.json(
        { error: 'This plan is not available for self-service' },
        { status: 400 }
      )
    }

    // Get user's subscription (cast to any to bypass type checking)
    const { data: subscription } = await (supabase as any)
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!subscription) {
      return NextResponse.json(
        { error: 'No subscription found. Please sign up first.' },
        { status: 404 }
      )
    }

    // If no Stripe subscription yet (just a trial record), redirect to checkout
    if (!subscription.stripe_subscription_id) {
      return NextResponse.json({
        success: false,
        needsCheckout: true,
        message: 'Please complete checkout to select a plan',
      })
    }

    // Check if during trial
    const isTrialing = subscription.status === 'trialing'
    const trialEndsAt = subscription.trial_ends_at ? new Date(subscription.trial_ends_at) : null

    // Get current Stripe subscription
    const stripeSubscription = await getStripe().subscriptions.retrieve(subscription.stripe_subscription_id)
    const currentPriceId = stripeSubscription.items.data[0]?.price.id

    // Same plan? No change needed
    if (currentPriceId === tierConfig.priceId) {
      return NextResponse.json({
        success: true,
        message: 'You are already on this plan',
        noChange: true,
      })
    }

    // Update the subscription to the new plan
    const updatedSubscription = await getStripe().subscriptions.update(
      subscription.stripe_subscription_id,
      {
        items: [{
          id: stripeSubscription.items.data[0].id,
          price: tierConfig.priceId,
        }],
        // If trialing, keep the trial and just change what they'll be charged for
        // Trial end date remains the same!
        proration_behavior: isTrialing ? 'none' : 'create_prorations',
        // Don't charge immediately during trial
        ...(isTrialing && { billing_cycle_anchor: 'unchanged' }),
      }
    )

    // Update local database
    await (supabase as any)
      .from('subscriptions')
      .update({
        tier: newTier,
        pending_tier: null, // Clear any pending tier
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    const isUpgrade = tierConfig.price! > (PRICING_TIERS[subscription.tier as PricingTier]?.price || 0)

    return NextResponse.json({
      success: true,
      message: isTrialing
        ? `Plan changed to ${tierConfig.name}. You'll be charged $${tierConfig.price}/mo when your trial ends${trialEndsAt ? ` on ${trialEndsAt.toLocaleDateString()}` : ''}.`
        : `Plan ${isUpgrade ? 'upgraded' : 'changed'} to ${tierConfig.name}. ${isUpgrade ? 'Prorated charges applied.' : 'Changes take effect immediately.'}`,
      newTier,
      isTrialing,
      trialEndsAt: trialEndsAt?.toISOString(),
    })
  } catch (error: any) {
    console.error('Change plan error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to change plan' },
      { status: 500 }
    )
  }
}

