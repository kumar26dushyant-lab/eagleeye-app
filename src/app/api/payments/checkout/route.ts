import { NextRequest, NextResponse } from 'next/server'
import { createCheckoutSession, PRICING_TIERS } from '@/lib/payments/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { tier, email } = await request.json()

    // Enterprise needs contact - no checkout
    if (tier === 'enterprise') {
      return NextResponse.json({
        success: false,
        contactSales: true,
        message: 'Please contact us for enterprise pricing',
        calendlyUrl: 'https://calendly.com/eagleeye/enterprise',
      })
    }

    if (!tier || !PRICING_TIERS[tier as keyof typeof PRICING_TIERS]) {
      return NextResponse.json(
        { error: 'Invalid pricing tier. Choose founder or team.' },
        { status: 400 }
      )
    }

    const tierConfig = PRICING_TIERS[tier as keyof typeof PRICING_TIERS]

    // Check Stripe configuration
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({
        error: 'Payment system not configured',
        setup: {
          step1: 'Create a Stripe account at https://stripe.com',
          step2: 'Get your API keys from the Dashboard',
          step3: 'Add STRIPE_SECRET_KEY to .env.local',
          step4: 'Create products and add price IDs',
        },
      }, { status: 500 })
    }

    if (!tierConfig.priceId) {
      return NextResponse.json({
        error: 'Price not configured for this tier',
        hint: `Add STRIPE_${tier.toUpperCase()}_PRICE_ID to .env.local`,
      }, { status: 500 })
    }

    // Get user email
    let customerEmail = email
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user?.email) {
      customerEmail = user.email
    }

    // Create checkout session with 14-day trial
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    const session = await createCheckoutSession({
      priceId: tierConfig.priceId,
      customerEmail,
      successUrl: `${baseUrl}/dashboard/integrations?welcome=true&tier=${tier}`,
      cancelUrl: `${baseUrl}/pricing?cancelled=true`,
      trialDays: tierConfig.trialDays || 14,
      metadata: {
        tier,
        userId: user?.id || 'anonymous',
      },
    })

    return NextResponse.json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id,
    })
  } catch (error: any) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
