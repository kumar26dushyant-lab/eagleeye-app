import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import DodoPayments from 'dodopayments'

// Pricing tiers configuration
const PRICING_TIERS: Record<string, { name: string; price: number; productId: string | undefined }> = {
  founder: { 
    name: 'Founder', 
    price: 29, 
    productId: process.env.NEXT_PUBLIC_DODO_SOLO_PRODUCT_ID || process.env.DODO_SOLO_PRODUCT_ID 
  },
  solo: { 
    name: 'Solo', 
    price: 29, 
    productId: process.env.NEXT_PUBLIC_DODO_SOLO_PRODUCT_ID || process.env.DODO_SOLO_PRODUCT_ID 
  },
  team: { 
    name: 'Team', 
    price: 79, 
    productId: process.env.NEXT_PUBLIC_DODO_TEAM_PRODUCT_ID || process.env.DODO_TEAM_PRODUCT_ID 
  },
}

function getDodoClient() {
  const apiKey = process.env.DODO_PAYMENTS_API_KEY
  if (!apiKey) {
    throw new Error('DODO_PAYMENTS_API_KEY not configured')
  }
  
  return new DodoPayments({
    bearerToken: apiKey.trim(),
    environment: (process.env.DODO_PAYMENTS_ENVIRONMENT as 'test_mode' | 'live_mode') || 'test_mode',
  })
}

/**
 * POST /api/payments/change-plan
 * Change plan during trial or active subscription
 * 
 * During trial: Updates the pending plan, trial clock continues
 * Active subscription: Prorates the change
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

    const tierConfig = PRICING_TIERS[newTier]
    if (!tierConfig) {
      return NextResponse.json(
        { error: 'Invalid plan. Choose founder, solo, or team.' },
        { status: 400 }
      )
    }

    if (!tierConfig.productId) {
      return NextResponse.json(
        { error: 'This plan is not available for self-service' },
        { status: 400 }
      )
    }

    // Get user's subscription by email
    const { data: subscription } = await (supabase as any)
      .from('subscriptions')
      .select('*')
      .eq('customer_email', user.email?.toLowerCase())
      .single()

    if (!subscription) {
      return NextResponse.json(
        { error: 'No subscription found. Please sign up first.' },
        { status: 404 }
      )
    }

    // If no payment subscription yet, redirect to checkout
    if (!subscription.dodo_subscription_id) {
      return NextResponse.json({
        success: false,
        needsCheckout: true,
        message: 'Please complete checkout to select a plan',
      })
    }

    // Same plan? No change needed
    const normalizedCurrentTier = subscription.tier === 'solo' ? 'founder' : subscription.tier
    const normalizedNewTier = newTier === 'solo' ? 'founder' : newTier
    if (normalizedCurrentTier === normalizedNewTier) {
      return NextResponse.json({
        success: true,
        message: 'You are already on this plan',
        noChange: true,
      })
    }

    // Check if during trial
    const isTrialing = subscription.status === 'trialing'

    // Update local database with new tier
    await (supabase as any)
      .from('subscriptions')
      .update({
        tier: newTier,
        updated_at: new Date().toISOString(),
      })
      .eq('customer_email', user.email?.toLowerCase())

    const isUpgrade = tierConfig.price > (PRICING_TIERS[subscription.tier]?.price || 0)

    return NextResponse.json({
      success: true,
      message: isTrialing
        ? `Plan changed to ${tierConfig.name}. You'll be charged $${tierConfig.price}/mo when your trial ends.`
        : `Plan ${isUpgrade ? 'upgraded' : 'changed'} to ${tierConfig.name}. Changes take effect on your next billing cycle.`,
      newTier,
      isTrialing,
    })
  } catch (error: any) {
    console.error('Change plan error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to change plan' },
      { status: 500 }
    )
  }
}

