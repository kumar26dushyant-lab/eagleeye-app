import { NextRequest, NextResponse } from 'next/server'
import { constructWebhookEvent, getTierFromPriceId } from '@/lib/payments/stripe'
import { createClient } from '@supabase/supabase-js'

// Use service role for webhook handler (no user context)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    let event
    try {
      event = constructWebhookEvent(body, signature)
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any
        const userId = session.metadata?.userId
        const tier = session.metadata?.tier
        const customerId = session.customer
        const subscriptionId = session.subscription

        console.log('[Webhook] Checkout completed:', { userId, tier, customerId })

        // Update user's subscription in database
        if (userId && userId !== 'anonymous') {
          // Get subscription details to check trial status
          const subscriptionDetails = subscriptionId 
            ? await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
                headers: { 'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}` }
              }).then(r => r.json()).catch(() => null)
            : null

          const isTrialing = subscriptionDetails?.status === 'trialing'
          const trialEnd = subscriptionDetails?.trial_end 
            ? new Date(subscriptionDetails.trial_end * 1000).toISOString()
            : null

          await supabaseAdmin
            .from('subscriptions')
            .upsert({
              user_id: userId,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              tier,
              status: isTrialing ? 'trialing' : 'active',
              trial_ends_at: trialEnd,
              current_period_start: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'user_id',
            })
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any
        const customerId = subscription.customer
        const status = subscription.status
        const priceId = subscription.items?.data?.[0]?.price?.id
        const tier = priceId ? getTierFromPriceId(priceId) : null
        const trialEnd = subscription.trial_end 
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null

        console.log('[Webhook] Subscription updated:', { customerId, status, tier })

        // Find user by customer ID and update
        const { data: existingSub } = await supabaseAdmin
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (existingSub) {
          await supabaseAdmin
            .from('subscriptions')
            .update({
              tier: tier || undefined,
              status,
              trial_ends_at: trialEnd,
              cancel_at_period_end: subscription.cancel_at_period_end,
              current_period_end: subscription.current_period_end 
                ? new Date(subscription.current_period_end * 1000).toISOString()
                : null,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', existingSub.user_id)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any
        const customerId = subscription.customer

        console.log('[Webhook] Subscription cancelled:', { customerId })

        // Downgrade to free tier
        const { data: existingSub } = await supabaseAdmin
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (existingSub) {
          await supabaseAdmin
            .from('subscriptions')
            .update({
              tier: 'free',
              status: 'cancelled',
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', existingSub.user_id)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any
        const customerId = invoice.customer

        console.log('[Webhook] Payment failed:', { customerId })

        // Mark as past_due
        const { data: existingSub } = await supabaseAdmin
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (existingSub) {
          await supabaseAdmin
            .from('subscriptions')
            .update({
              status: 'past_due',
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', existingSub.user_id)
        }
        break
      }

      default:
        console.log('[Webhook] Unhandled event type:', event.type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

