import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    // Store subscription (in production: save to database)
    // For MVP: Store in a simple way
    if (user) {
      await (supabase as any)
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          created_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        })
    }

    // For demo: store in memory/runtime (not persisted)
    // In production, this would go to database
    
    return NextResponse.json({
      success: true,
      message: 'Push subscription saved',
    })
  } catch (error) {
    console.error('Failed to save subscription:', error)
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

    if (user && oldEndpoint) {
      // Update the subscription in database
      await (supabase as any)
        .from('push_subscriptions')
        .update({
          endpoint: newSubscription.endpoint,
          p256dh: newSubscription.keys.p256dh,
          auth: newSubscription.keys.auth,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('endpoint', oldEndpoint)
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription updated',
    })
  } catch (error) {
    console.error('Failed to update subscription:', error)
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

    if (user) {
      await (supabase as any)
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id)
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription removed',
    })
  } catch (error) {
    console.error('Failed to remove subscription:', error)
    return NextResponse.json(
      { error: 'Failed to remove subscription' },
      { status: 500 }
    )
  }
}
