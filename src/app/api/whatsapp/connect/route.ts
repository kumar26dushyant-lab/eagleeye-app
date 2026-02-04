/**
 * WhatsApp Business Connection API
 * 
 * Handles connecting WhatsApp Business to EagleEye
 * Unlike OAuth-based integrations, WhatsApp uses API credentials
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import whatsappAdapter from '@/lib/integrations/adapters/whatsapp'

/**
 * POST - Connect WhatsApp Business account
 * User provides their Meta Business API credentials
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { accessToken, phoneNumberId, businessAccountId } = await request.json()

    if (!accessToken || !phoneNumberId) {
      return NextResponse.json({ 
        error: 'Missing required credentials',
        required: ['accessToken', 'phoneNumberId'],
        help: 'Get these from your Meta Business Suite: https://business.facebook.com/wa/manage/phone-numbers/',
      }, { status: 400 })
    }

    // Test the connection
    const status = await whatsappAdapter.connect({
      accessToken,
      phoneNumberId,
      businessAccountId,
    })

    if (!status.connected) {
      return NextResponse.json({ 
        error: status.error || 'Failed to connect to WhatsApp',
        setup_url: status.setup_url,
      }, { status: 400 })
    }

    // Store the integration
    // First, try to delete any existing WhatsApp integration for this user
    await supabase
      .from('integrations')
      .delete()
      .eq('user_id', user.id)
      .eq('provider', 'whatsapp' as any)

    // Insert fresh - using columns that definitely exist based on Slack integration pattern
    const { data: insertData, error: insertError } = await supabase
      .from('integrations')
      .insert({
        user_id: user.id,
        provider: 'whatsapp' as any,
        access_token: accessToken,
        workspace_id: phoneNumberId,  // Store phone_number_id here
        workspace_name: status.account_name || status.phone_number || 'WhatsApp Business',
        is_active: true,
      } as any)
      .select()

    if (insertError) {
      console.error('[WhatsApp Connect] DB error:', insertError)
      console.error('[WhatsApp Connect] Error details:', JSON.stringify(insertError))
      return NextResponse.json({ 
        error: 'Failed to save integration: ' + insertError.message,
        details: insertError.code,
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      connected: true,
      account_name: status.account_name,
      phone_number: status.phone_number,
      webhook_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/whatsapp/webhook`,
      next_steps: [
        'Configure the webhook URL in your Meta Business Suite',
        'Subscribe to messages webhook events',
        'Send a test message to verify connection',
      ],
    })

  } catch (error: any) {
    console.error('[WhatsApp Connect] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * DELETE - Disconnect WhatsApp Business
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Remove integration
    const { error } = await supabase
      .from('integrations')
      .delete()
      .eq('user_id', user.id)
      .eq('provider', 'whatsapp' as any)

    if (error) {
      return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 })
    }

    // Also remove any stored signals from WhatsApp
    await supabase
      .from('communication_signals')
      .delete()
      .eq('user_id', user.id)
      .eq('source', 'whatsapp' as any)

    return NextResponse.json({ success: true, disconnected: true })

  } catch (error: any) {
    console.error('[WhatsApp Disconnect] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * GET - Check WhatsApp connection status
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: integration } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'whatsapp' as any)
      .single()

    if (!integration) {
      return NextResponse.json({ connected: false })
    }

    return NextResponse.json({
      connected: true,
      account_name: integration.workspace_name,
      phone_number: integration.workspace_id,
      phone_number_id: integration.workspace_id,
      webhook_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/whatsapp/webhook`,
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
