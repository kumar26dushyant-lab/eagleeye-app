import { NextRequest, NextResponse } from 'next/server'

// Product IDs mapped to tiers
const TIER_PRODUCTS: Record<string, string | undefined> = {
  founder: process.env.NEXT_PUBLIC_DODO_SOLO_PRODUCT_ID || process.env.DODO_SOLO_PRODUCT_ID,
  solo: process.env.NEXT_PUBLIC_DODO_SOLO_PRODUCT_ID || process.env.DODO_SOLO_PRODUCT_ID,
  team: process.env.NEXT_PUBLIC_DODO_TEAM_PRODUCT_ID || process.env.DODO_TEAM_PRODUCT_ID,
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tier, email, reactivation } = body

    console.log('Checkout request:', { tier, email: email ? 'provided' : 'missing', reactivation })

    // Enterprise needs contact - no checkout
    if (tier === 'enterprise') {
      return NextResponse.json({
        success: false,
        contactSales: true,
        message: 'Please contact us for enterprise pricing',
      })
    }

    const productId = TIER_PRODUCTS[tier]?.trim()
    if (!productId) {
      return NextResponse.json(
        { error: `Product not configured for tier: ${tier}` },
        { status: 400 }
      )
    }

    const apiKey = process.env.DODO_PAYMENTS_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Payment system not configured' },
        { status: 500 }
      )
    }

    // Validate email
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://eagleeye.work'
    const returnUrl = reactivation 
      ? `${baseUrl}/dashboard?reactivated=true`
      : `${baseUrl}/checkout/success?tier=${tier}`

    const customerName = email.split('@')[0]

    // Use direct fetch to Dodo API instead of SDK
    // Correct URLs: test.dodopayments.com (test) or live.dodopayments.com (live)
    // Default to test_mode since products are created there
    const isLiveMode = process.env.DODO_PAYMENTS_ENVIRONMENT === 'live_mode'
    const apiBaseUrl = isLiveMode 
      ? 'https://live.dodopayments.com'
      : 'https://test.dodopayments.com'

    console.log('Creating checkout via direct API:', { apiBaseUrl, productId, email: customerName, env: process.env.DODO_PAYMENTS_ENVIRONMENT })

    const response = await fetch(`${apiBaseUrl}/checkouts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_cart: [{ product_id: productId, quantity: 1 }],
        customer: { email: email, name: customerName },
        return_url: returnUrl,
      }),
    })

    const responseText = await response.text()
    console.log('Dodo API response:', response.status, responseText)

    if (!response.ok) {
      console.error('Dodo API error:', response.status, responseText)
      return NextResponse.json(
        { error: `Payment provider error: ${response.status}` },
        { status: 500 }
      )
    }

    const session = JSON.parse(responseText)
    const checkoutUrl = session.checkout_url || session.url

    if (!checkoutUrl) {
      console.error('No checkout URL in response:', session)
      return NextResponse.json(
        { error: 'No checkout URL returned' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      checkoutUrl: checkoutUrl,
      sessionId: session.session_id || session.id || 'session',
    })
  } catch (error: any) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
