import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import DodoPayments from 'dodopayments'

// Product IDs mapped to tiers
const TIER_PRODUCTS: Record<string, { productId: string | undefined; trialDays: number }> = {
  founder: { 
    productId: process.env.NEXT_PUBLIC_DODO_SOLO_PRODUCT_ID || process.env.DODO_SOLO_PRODUCT_ID,
    trialDays: 7 
  },
  solo: { 
    productId: process.env.NEXT_PUBLIC_DODO_SOLO_PRODUCT_ID || process.env.DODO_SOLO_PRODUCT_ID,
    trialDays: 7 
  },
  team: { 
    productId: process.env.NEXT_PUBLIC_DODO_TEAM_PRODUCT_ID || process.env.DODO_TEAM_PRODUCT_ID,
    trialDays: 7 
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

export async function POST(request: NextRequest) {
  try {
    const { tier, email, reactivation } = await request.json()

    // Enterprise needs contact - no checkout
    if (tier === 'enterprise') {
      return NextResponse.json({
        success: false,
        contactSales: true,
        message: 'Please contact us for enterprise pricing',
        calendlyUrl: 'https://calendly.com/eagleeye/enterprise',
      })
    }

    const tierConfig = TIER_PRODUCTS[tier]
    if (!tierConfig) {
      return NextResponse.json(
        { error: 'Invalid pricing tier. Choose founder, solo, or team.' },
        { status: 400 }
      )
    }

    // Check Dodo configuration
    if (!process.env.DODO_PAYMENTS_API_KEY) {
      return NextResponse.json({
        error: 'Payment system not configured',
        setup: {
          step1: 'Create a Dodo Payments account',
          step2: 'Get your API key from the Dashboard',
          step3: 'Add DODO_PAYMENTS_API_KEY to environment variables',
        },
      }, { status: 500 })
    }

    const productId = tierConfig.productId?.trim()
    if (!productId) {
      return NextResponse.json({
        error: 'Product not configured for this tier',
        hint: `Add DODO_${tier.toUpperCase()}_PRODUCT_ID to environment variables`,
      }, { status: 500 })
    }

    // Get user email
    let customerEmail = email
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user?.email) {
      customerEmail = user.email
    }

    // Create checkout session with Dodo
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://eagleeye.work'
    // For reactivation, redirect to dashboard. For new signup, go to success page
    const returnUrl = reactivation 
      ? `${baseUrl}/dashboard?reactivated=true`
      : `${baseUrl}/checkout/success?tier=${tier}`
    
    const client = getDodoClient()
    const session = await client.checkoutSessions.create({
      product_cart: [{ product_id: productId, quantity: 1 }],
      customer: customerEmail ? { email: customerEmail, name: customerEmail.split('@')[0] } : undefined,
      return_url: returnUrl,
      // Note: Dodo handles trial at product level, not session level
      // For reactivation, product should be configured without trial in Dodo dashboard
    })

    return NextResponse.json({
      success: true,
      checkoutUrl: session.checkout_url,
      sessionId: (session as any).checkout_session_id || session.checkout_url,
    })
  } catch (error: any) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
