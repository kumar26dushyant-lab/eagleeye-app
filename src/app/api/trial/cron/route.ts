import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  sendDay1Reminder,
  sendTrialExpiredEmail,
} from '@/lib/trial/emails'

/**
 * Trial reminder cron job
 * 
 * Call this endpoint daily to send trial reminders:
 * - Day 6 (1 day left): "Tomorrow your card will be charged" reminder
 * - Day 8+: "Expired" email (if payment failed)
 * 
 * Note: Auto-charging happens via Dodo webhook when trial ends.
 * This cron only sends reminder emails.
 * 
 * Set up in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/trial/cron",
 *     "schedule": "0 9 * * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  // Verify cron secret (prevent unauthorized calls)
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = await createClient()
    const now = new Date()
    const results = {
      day1Reminders: 0,  // Sent on day 6 (1 day left)
      expiredEmails: 0,
      errors: [] as string[],
    }

    // Get all trialing users from subscriptions table
    // Use 'any' to bypass type checking since subscriptions table may not be in generated types
    const { data: subscriptions, error } = await (supabase as any)
      .from('subscriptions')
      .select('*')
      .eq('status', 'trialing')
      .not('trial_ends_at', 'is', null)

    if (error) {
      console.error('Error fetching subscriptions:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ 
        message: 'No trialing users to process',
        results 
      })
    }

    for (const sub of subscriptions) {
      try {
        if (!sub.email || !sub.trial_ends_at) continue

        const trialEnd = new Date(sub.trial_ends_at)
        const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        // Get user profile for name
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', sub.user_id)
          .single()

        const reminderData = {
          email: sub.email,
          name: profile?.full_name || 'there',
          daysLeft,
          trialEndsAt: trialEnd,
        }

        // Day 6 (1 day left) - Send "Your card will be charged tomorrow" reminder
        if (daysLeft === 1 && !sub.day1_reminder_sent) {
          await sendDay1Reminder(reminderData)
          results.day1Reminders++
          
          await (supabase as any)
            .from('subscriptions')
            .update({ day1_reminder_sent: true })
            .eq('user_id', sub.user_id)
        }

        // Trial expired & payment failed - only send if status is still trialing after day 7
        // (Dodo auto-charges, so this only fires if payment failed)
        if (daysLeft <= -1 && sub.status === 'trialing' && !sub.expired_email_sent) {
          await sendTrialExpiredEmail({ 
            email: sub.email, 
            name: profile?.full_name || 'there' 
          })
          results.expiredEmails++
          
          await (supabase as any)
            .from('subscriptions')
            .update({ 
              expired_email_sent: true,
              status: 'payment_failed' 
            })
            .eq('user_id', sub.user_id)
        }
      } catch (emailError: any) {
        results.errors.push(`Failed for ${sub.email}: ${emailError.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Cron job completed',
      results,
    })
  } catch (error: any) {
    console.error('Cron error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal error' },
      { status: 500 }
    )
  }
}
