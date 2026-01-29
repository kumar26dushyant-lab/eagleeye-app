import { NextRequest, NextResponse } from 'next/server'
import { createPortalSession } from '@/lib/payments/stripe'
import { createClient } from '@/lib/supabase/server'

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

    // Get user's Stripe customer ID from database (cast to any)
    const { data: subscription } = await (supabase as any)
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (!subscription?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const session = await createPortalSession({
      customerId: subscription.stripe_customer_id,
      returnUrl: `${baseUrl}/dashboard/billing`,
    })

    return NextResponse.json({
      success: true,
      portalUrl: session.url,
    })
  } catch (error: any) {
    console.error('Portal error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create portal session' },
      { status: 500 }
    )
  }
}

