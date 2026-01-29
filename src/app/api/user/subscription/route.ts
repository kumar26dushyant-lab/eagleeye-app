import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      // Return free tier for unauthenticated users
      return NextResponse.json({
        subscription: {
          tier: 'free',
          status: 'active',
        },
      })
    }

    // Get subscription from database (cast to any)
    const { data: subscription } = await (supabase as any)
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!subscription) {
      return NextResponse.json({
        subscription: {
          tier: 'free',
          status: 'active',
        },
      })
    }

    return NextResponse.json({
      subscription: {
        tier: subscription.tier,
        status: subscription.status,
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    })
  } catch (error) {
    console.error('Failed to get subscription:', error)
    return NextResponse.json({
      subscription: {
        tier: 'free',
        status: 'active',
      },
    })
  }
}

