// Admin endpoint to send missed trial reminder emails
// One-time use to fix the email gap for existing subscribers
// DELETE this file after use

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  sendWelcomeEmail,
  sendDay3Reminder,
  sendDay1Reminder,
  sendPaymentSuccessEmail,
} from '@/lib/trial/emails'

/**
 * POST /api/trial/send-missed
 * Body: { email: string, type: 'welcome' | 'day3' | 'day1' | 'payment_success', name?: string, tier?: string, amount?: number }
 * 
 * Auth: Requires logged-in admin user
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    // Admin check - only your email can use this
    const ADMIN_EMAILS = ['kumar26.dushyant@gmail.com']
    if (!user || !ADMIN_EMAILS.includes(user.email?.toLowerCase() || '')) {
      return NextResponse.json({ error: 'Unauthorized - admin only' }, { status: 401 })
    }

    const body = await request.json()
    const { email, type, name = 'there', tier = 'founder', amount = 29 } = body

    if (!email || !type) {
      return NextResponse.json({ error: 'Missing email or type' }, { status: 400 })
    }

    // Calculate trial end date (assuming trial just ended today)
    const trialEndsAt = new Date() // Today = day 7

    let success = false
    let result = ''

    switch (type) {
      case 'welcome':
        success = await sendWelcomeEmail({
          email,
          name,
          daysLeft: 7,
          trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        })
        result = 'Trial welcome email'
        break

      case 'day3':
        success = await sendDay3Reminder({
          email,
          name,
          daysLeft: 3,
          trialEndsAt,
        })
        result = 'Day 3 reminder'
        break

      case 'day1':
        success = await sendDay1Reminder({
          email,
          name,
          daysLeft: 1,
          trialEndsAt,
        })
        result = 'Day 1 (tomorrow) reminder'
        break

      case 'payment_success':
        success = await sendPaymentSuccessEmail({
          email,
          name,
          tier: tier === 'team' ? 'Team' : 'Founder (Solo)',
          amount,
        })
        result = 'Payment success email'
        break

      default:
        return NextResponse.json({ error: 'Invalid type. Use: welcome, day3, day1, payment_success' }, { status: 400 })
    }

    if (success) {
      console.log(`[Admin] Sent ${type} email to ${email}`)
      return NextResponse.json({ success: true, message: `${result} sent to ${email}` })
    } else {
      return NextResponse.json({ error: `Failed to send ${result}` }, { status: 500 })
    }

  } catch (error: any) {
    console.error('[Admin] Send missed email error:', error)
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}

/**
 * GET /api/trial/send-missed?email=xxx
 * Lists what reminder emails were sent/missed for a subscriber
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    const ADMIN_EMAILS = ['kumar26.dushyant@gmail.com']
    if (!user || !ADMIN_EMAILS.includes(user.email?.toLowerCase() || '')) {
      return NextResponse.json({ error: 'Unauthorized - admin only' }, { status: 401 })
    }

    const url = new URL(request.url)
    const email = url.searchParams.get('email')

    if (email) {
      // Get specific subscriber status
      const { data: sub } = await (supabase as any)
        .from('subscriptions')
        .select('*')
        .eq('customer_email', email.toLowerCase())
        .single()

      if (!sub) {
        return NextResponse.json({ error: 'Subscriber not found' }, { status: 404 })
      }

      return NextResponse.json({
        email: sub.customer_email,
        status: sub.status,
        tier: sub.tier,
        trial_started_at: sub.trial_started_at,
        trial_ends_at: sub.trial_ends_at,
        emails_sent: {
          welcome: sub.welcome_email_sent || false,
          day3_reminder: sub.day3_reminder_sent || false,
          day1_reminder: sub.day1_reminder_sent || false,
          expired: sub.expired_email_sent || false,
        },
      })
    }

    // List all trialing/recently converted subscribers
    const { data: subs } = await (supabase as any)
      .from('subscriptions')
      .select('customer_email, status, tier, trial_started_at, trial_ends_at, welcome_email_sent, day3_reminder_sent, day1_reminder_sent')
      .order('created_at', { ascending: false })
      .limit(20)

    return NextResponse.json({
      subscribers: subs || [],
      count: subs?.length || 0,
    })

  } catch (error: any) {
    console.error('[Admin] Get subscriber status error:', error)
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}
