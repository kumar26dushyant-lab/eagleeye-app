/**
 * WhatsApp Business Webhook Handler
 * 
 * Receives incoming messages from WhatsApp Business Cloud API
 * Processes them through our signal detection and stores relevant signals
 * 
 * Webhook URL to configure in Meta: https://eagleeye.work/api/whatsapp/webhook
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import whatsappAdapter, { WhatsAppWebhookPayload } from '@/lib/integrations/adapters/whatsapp'

const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'eagleeye_whatsapp_verify'

// Use service role for webhook (server-to-server, no cookies)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * GET - Webhook Verification (Meta requires this)
 * Meta sends a GET request to verify the webhook URL
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  // Verify the webhook
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[WhatsApp Webhook] Verification successful')
    return new NextResponse(challenge, { status: 200 })
  }

  console.log('[WhatsApp Webhook] Verification failed - invalid token')
  return NextResponse.json({ error: 'Verification failed' }, { status: 403 })
}

/**
 * POST - Receive incoming messages
 * Meta sends POST requests when messages arrive
 */
export async function POST(request: NextRequest) {
  try {
    const payload: WhatsAppWebhookPayload = await request.json()

    // Verify this is a WhatsApp webhook
    if (payload.object !== 'whatsapp_business_account') {
      return NextResponse.json({ error: 'Invalid webhook type' }, { status: 400 })
    }

    console.log('[WhatsApp Webhook] Received payload:', JSON.stringify(payload, null, 2))

    // Process the messages through our adapter
    const signals = await whatsappAdapter.processWebhook(payload)

    if (signals.length === 0) {
      // No actionable signals - just acknowledge
      return NextResponse.json({ status: 'ok', signals_detected: 0 })
    }

    console.log(`[WhatsApp Webhook] Detected ${signals.length} signals`)

    // Store signals in database - use service role client for webhook
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    for (const signal of signals) {
      // Find user by WhatsApp phone number ID (from webhook metadata)
      const phoneNumberId = payload.entry[0]?.changes[0]?.value?.metadata?.phone_number_id

      if (!phoneNumberId) continue

      // Find the user who has this WhatsApp connected
      // workspace_id stores the phone_number_id
      console.log('[WhatsApp Webhook] Looking for integration with workspace_id:', phoneNumberId)
      
      // First, let's see all whatsapp integrations for debugging
      const { data: allWA, error: listError } = await supabase
        .from('integrations')
        .select('*')
        .eq('provider', 'whatsapp')
      
      console.log('[WhatsApp Webhook] All WhatsApp integrations:', JSON.stringify(allWA), 'Error:', listError)
      
      const { data: integration, error: intError } = await supabase
        .from('integrations')
        .select('user_id')
        .eq('provider', 'whatsapp')
        .eq('workspace_id', phoneNumberId)
        .single()
      
      console.log('[WhatsApp Webhook] Integration lookup result:', integration, 'Error:', intError)

      if (!integration) {
        console.log('[WhatsApp Webhook] No user found for phone number ID:', phoneNumberId)
        continue
      }

      // Store the signal in communication_signals table
      // Using actual column names from the schema
      const metadata = signal.metadata as Record<string, any>
      const { error: insertError } = await supabase.from('communication_signals').insert({
        user_id: integration.user_id,
        source: 'whatsapp' as any,
        source_message_id: signal.source_id,
        channel_id: metadata.phone_number || 'dm', // WhatsApp DMs use phone as "channel"
        channel_name: metadata.contact_name || 'WhatsApp DM',
        sender_name: signal.author,
        signal_type: mapSignalType(metadata.signal_type as string),
        snippet: signal.description?.substring(0, 200),
        timestamp: signal.created_at,
        is_read: false,
        is_actioned: false,
        raw_metadata: metadata,
      } as any)

      if (insertError) {
        console.error('[WhatsApp Webhook] Insert error:', insertError)
      } else {
        console.log(`[WhatsApp Webhook] Stored signal: ${signal.title}`)
      }
    }

    return NextResponse.json({ 
      status: 'ok', 
      signals_detected: signals.length,
      signals_stored: signals.length,
    })

  } catch (error: any) {
    console.error('[WhatsApp Webhook] Error:', error)
    // Always return 200 to prevent Meta from retrying
    return NextResponse.json({ status: 'error', message: error.message }, { status: 200 })
  }
}

// Map WhatsApp signal types to database-allowed types
function mapSignalType(waType: string): string {
  const mapping: Record<string, string> = {
    'complaint': 'urgent',
    'order': 'mention',
    'appreciation': 'fyi',
    'urgent_request': 'urgent',
    'dm': 'mention',
    'none': 'mention',
  }
  return mapping[waType] || 'mention'
}
