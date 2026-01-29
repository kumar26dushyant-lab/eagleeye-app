import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cancelSubscription } from '@/lib/payments/stripe'

/**
 * POST /api/payments/cancel
 * Cancel subscription - either immediately or at period end
 * 
 * For trials: Cancels immediately, card won't be charged
 * For active subs: Cancels at period end by default
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

    const { immediate = false } = await request.json().catch(() => ({}))

    // Get user's subscription (cast to any to bypass type checking)
    const { data: subscription } = await (supabase as any)
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!subscription) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      )
    }

    // If in trial without Stripe subscription, just mark as cancelled
    if (subscription.status === 'trialing' && !subscription.stripe_subscription_id) {
      await (supabase as any)
        .from('subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)

      return NextResponse.json({
        success: true,
        message: 'Trial cancelled. You can sign up again anytime.',
      })
    }

    // If has Stripe subscription, cancel it
    if (subscription.stripe_subscription_id) {
      const stripeSubscription = await cancelSubscription(subscription.stripe_subscription_id) as any

      await (supabase as any)
        .from('subscriptions')
        .update({
          cancel_at_period_end: true,
          cancelled_at: new Date().toISOString(),
          current_period_end: stripeSubscription.current_period_end 
            ? new Date(stripeSubscription.current_period_end * 1000).toISOString()
            : subscription.trial_ends_at,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)

      // Determine when access ends
      const accessEndsAt = stripeSubscription.current_period_end
        ? new Date(stripeSubscription.current_period_end * 1000)
        : subscription.trial_ends_at 
          ? new Date(subscription.trial_ends_at) 
          : new Date()

      return NextResponse.json({
        success: true,
        message: subscription.status === 'trialing' 
          ? 'Trial cancelled. Your card will not be charged.'
          : `Subscription cancelled. You'll have access until ${accessEndsAt.toLocaleDateString()}.`,
        accessUntil: accessEndsAt.toISOString(),
      })
    }

    return NextResponse.json(
      { error: 'No active subscription to cancel' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Cancel error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}

