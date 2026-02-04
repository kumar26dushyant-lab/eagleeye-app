import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Type for push_subscriptions table (not in generated types yet)
interface PushSubscriptionRow {
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
  user_agent?: string | null
  created_at?: string
  updated_at?: string
}

// POST - Save push subscription
export async function POST(request: NextRequest) {
  try {
    const subscription = await request.json()
    
    if (!subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: 'Invalid subscription format' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Store subscription in push_subscriptions table
    // Using type assertion since table may not be in generated types yet
    const { error } = await (supabase as any)
      .from('push_subscriptions')
      .upsert({
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        user_agent: request.headers.get('user-agent') || null,
        updated_at: new Date().toISOString(),
      } as PushSubscriptionRow, {
        onConflict: 'user_id,endpoint',
      })

    if (error) {
      console.error('[Push Subscription] Failed to save:', error)
      return NextResponse.json(
        { error: 'Failed to save subscription' },
        { status: 500 }
      )
    }

    console.log('[Push Subscription] Saved for user:', user.id)
    
    return NextResponse.json({
      success: true,
      message: 'Push subscription saved',
    })
  } catch (error) {
    console.error('[Push Subscription] Error:', error)
    return NextResponse.json(
      { error: 'Failed to save subscription' },
      { status: 500 }
    )
  }
}

// PUT - Update subscription (when browser renews it)
export async function PUT(request: NextRequest) {
  try {
    const { oldEndpoint, newSubscription } = await request.json()
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (oldEndpoint) {
      // Delete old subscription and insert new one
      await (supabase as any)
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id)
        .eq('endpoint', oldEndpoint)

      await (supabase as any)
        .from('push_subscriptions')
        .insert({
          user_id: user.id,
          endpoint: newSubscription.endpoint,
          p256dh: newSubscription.keys.p256dh,
          auth: newSubscription.keys.auth,
          user_agent: request.headers.get('user-agent') || null,
        } as PushSubscriptionRow)
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription updated',
    })
  } catch (error) {
    console.error('[Push Subscription] Failed to update:', error)
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    )
  }
}

// DELETE - Remove subscription
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Delete all subscriptions for this user
    const { error } = await (supabase as any)
      .from('push_subscriptions')
      .delete()
      .eq('user_id', user.id)

    if (error) {
      console.error('[Push Subscription] Failed to delete:', error)
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription removed',
    })
  } catch (error) {
    console.error('[Push Subscription] Error:', error)
    return NextResponse.json(
      { error: 'Failed to remove subscription' },
      { status: 500 }
    )
  }
}

// GET - Check if user has active subscription
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ hasSubscription: false })
    }

    const { data, error } = await (supabase as any)
      .from('push_subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)

    return NextResponse.json({
      hasSubscription: !error && data && data.length > 0,
    })
  } catch (error) {
    return NextResponse.json({ hasSubscription: false })
  }
}
