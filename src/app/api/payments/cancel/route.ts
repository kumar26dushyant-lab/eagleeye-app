import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import DodoPayments from 'dodopayments'

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
 * Clean up user data after cancellation
 */
async function cleanupUserData(supabase: any, userId: string, userEmail: string) {
  console.log('[Cancel] Cleaning up data for user:', userId)
  
  // Delete integrations
  await supabase
    .from('integrations')
    .delete()
    .eq('user_id', userId)
  
  // Delete communication signals
  await supabase
    .from('communication_signals')
    .delete()
    .eq('user_id', userId)
  
  // Delete subscription record
  await supabase
    .from('subscriptions')
    .delete()
    .eq('customer_email', userEmail.toLowerCase())
  
  console.log('[Cancel] User data cleaned up')
}

/**
 * POST /api/payments/cancel
 * Cancel subscription - disconnects integrations, deletes data, and logs out
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

    // Get user's subscription by email
    const { data: subscription } = await (supabase as any)
      .from('subscriptions')
      .select('*')
      .eq('customer_email', user.email?.toLowerCase())
      .single()

    if (!subscription) {
      return NextResponse.json(
        { error: 'No subscription found for this account' },
        { status: 404 }
      )
    }

    // If has Dodo subscription, cancel it via API
    if (subscription.dodo_subscription_id) {
      try {
        const client = getDodoClient()
        await client.subscriptions.update(subscription.dodo_subscription_id, {
          status: 'cancelled',
        })
      } catch (err) {
        console.error('Dodo cancel error:', err)
        // Continue even if API fails
      }
    }

    // Clean up all user data
    await cleanupUserData(supabase, user.id, user.email || '')

    return NextResponse.json({
      success: true,
      shouldLogout: true,  // Signal to frontend to logout
      message: 'Subscription cancelled. Your data has been removed. Redirecting...',
    })
  } catch (error: any) {
    console.error('Cancel error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}

