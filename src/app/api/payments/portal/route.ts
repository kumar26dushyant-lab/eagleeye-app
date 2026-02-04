import { NextRequest, NextResponse } from 'next/server'
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

    // Get user's Dodo customer ID from database
    const { data: subscription } = await (supabase as any)
      .from('subscriptions')
      .select('dodo_customer_id, stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    // Dodo Payments uses a customer portal URL
    // For now, redirect to our billing page where they can manage subscriptions
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://eagleeye.work'
    
    // Note: Dodo doesn't have a built-in customer portal like Stripe
    // Users manage subscriptions through Dodo dashboard or via email links
    // We can redirect to their support/billing page
    return NextResponse.json({
      success: true,
      portalUrl: `${baseUrl}/dashboard/billing`,
      message: 'To manage your subscription, please contact support or use the cancellation option below.',
    })
  } catch (error: any) {
    console.error('Portal error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to access billing portal' },
      { status: 500 }
    )
  }
}

