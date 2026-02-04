import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTrialStatus } from '@/lib/trial/manager'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({
        isActive: false,
        isPaid: false,
        daysLeft: 0,
        tier: null,
        error: 'Not authenticated',
      })
    }

    const status = await getTrialStatus(user.id)

    return NextResponse.json({
      isActive: status.isActive,
      isPaid: status.isPaid,
      daysLeft: status.daysLeft,
      tier: status.tier,
      pendingTier: status.pendingTier,
      trialEndsAt: status.trialEndsAt?.toISOString(),
      hasPaymentMethod: status.hasPaymentMethod,
      cancelAtPeriodEnd: status.cancelAtPeriodEnd,
      // Payment failure fields
      paymentFailed: status.paymentFailed,
      gracePeriodEndsAt: status.gracePeriodEndsAt?.toISOString(),
    })
  } catch (error) {
    console.error('Error fetching trial status:', error)
    return NextResponse.json({
      isActive: true, // Default to active on error
      isPaid: false,
      daysLeft: 14,
      tier: null,
    })
  }
}
