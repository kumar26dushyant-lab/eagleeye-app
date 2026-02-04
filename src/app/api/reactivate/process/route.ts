// Process reactivation - mark token as used and redirect to payment
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import DodoPayments from 'dodopayments'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Initialize Dodo client
function getDodoClient() {
  const apiKey = process.env.DODO_PAYMENTS_API_KEY
  if (!apiKey) {
    return null
  }
  
  return new DodoPayments({
    bearerToken: apiKey.trim(),
    environment: (process.env.DODO_PAYMENTS_ENVIRONMENT as 'test_mode' | 'live_mode') || 'test_mode',
  })
}

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get and validate token
    const { data: tokenRecord, error } = await supabase
      .from('reactivation_tokens')
      .select('*')
      .eq('token', token)
      .single()

    if (error || !tokenRecord) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
    }

    if (tokenRecord.used_at) {
      return NextResponse.json({ error: 'Token already used' }, { status: 400 })
    }

    if (new Date(tokenRecord.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Token expired' }, { status: 400 })
    }

    const customerEmail = tokenRecord.customer_email

    // Mark token as used
    await supabase
      .from('reactivation_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('token', token)

    // Restore the account to allow login (but expired trial - no free days)
    await supabase
      .from('subscriptions')
      .update({
        status: 'trialing',
        // Clear payment failure fields
        payment_failed_at: null,
        grace_period_ends_at: null,
        account_deletion_scheduled_at: null,
        payment_retry_count: 0,
        last_payment_error: null,
        payment_failed_email_sent: false,
        grace_period_email_sent: false,
        // Set trial to already expired (no free days)
        trial_started_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        trial_ends_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('customer_email', customerEmail)

    // Mark payment failure logs as resolved
    await supabase
      .from('payment_failure_logs')
      .update({
        resolved_at: new Date().toISOString(),
        resolved_by: 'reactivation_link',
      })
      .eq('customer_email', customerEmail)
      .is('resolved_at', null)

    // Create checkout session via Dodo SDK
    // The user will complete payment and get activated via webhook
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://eagleeye.work'
    const returnUrl = process.env.DODO_PAYMENTS_RETURN_URL || `${baseUrl}/dashboard?reactivated=true`
    
    const dodoClient = getDodoClient()
    if (dodoClient) {
      try {
        const productId = process.env.DODO_SOLO_PRODUCT_ID
        
        if (productId) {
          const session = await dodoClient.checkoutSessions.create({
            product_cart: [{ product_id: productId, quantity: 1 }],
            customer: { 
              email: customerEmail, 
              name: customerEmail.split('@')[0] 
            },
            return_url: returnUrl,
          })

          if (session.checkout_url) {
            return NextResponse.json({ checkoutUrl: session.checkout_url })
          }
        }
      } catch (checkoutError) {
        console.error('[Reactivate Process] Dodo checkout error:', checkoutError)
      }
    }

    // Fallback - redirect to billing page with reactivate flag
    return NextResponse.json({ 
      checkoutUrl: `${baseUrl}/dashboard/billing?reactivate=true&email=${encodeURIComponent(customerEmail)}` 
    })

  } catch (error) {
    console.error('[Reactivate Process] Error:', error)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}
