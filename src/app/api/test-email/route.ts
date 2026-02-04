// Test Email Endpoint - For testing email templates
// Usage: POST /api/test-email with { type: 'welcome' | 'payment' | 'support' | 'disconnect' | 'failed', email: 'test@example.com' }

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  sendWelcomeEmail,
  sendPaymentConfirmationEmail,
  sendSupportTicketConfirmation,
  sendIntegrationConnectedEmail,
  sendIntegrationDisconnectedEmail,
  sendIntegrationFailedEmail,
  sendTrialEndingEmail,
  sendSubscriptionCancelledEmail,
} from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    // Only allow authenticated users (admins) to test emails
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { type, email } = body
    
    // Use provided email or user's email
    const targetEmail = email || user.email
    
    if (!targetEmail) {
      return NextResponse.json({ error: 'Email address required' }, { status: 400 })
    }
    
    let result
    
    switch (type) {
      case 'welcome':
        result = await sendWelcomeEmail({
          to: targetEmail,
          userName: user.user_metadata?.full_name || 'Test User',
          confirmationLink: 'https://eagleeye.work/dashboard',
        })
        break
        
      case 'payment':
        result = await sendPaymentConfirmationEmail({
          to: targetEmail,
          userName: user.user_metadata?.full_name || 'Test User',
          planName: 'Founder (Solo)',
          amount: '$9',
          loginLink: 'https://eagleeye.work/login',
        })
        break
        
      case 'support':
        result = await sendSupportTicketConfirmation({
          to: targetEmail,
          ticketId: 'TKT-TEST01',
          subject: 'Test Support Ticket',
          userName: user.user_metadata?.full_name || 'Test User',
        })
        break
        
      case 'connected':
        result = await sendIntegrationConnectedEmail({
          to: targetEmail,
          integrationName: 'Slack',
          userName: user.user_metadata?.full_name || 'Test User',
        })
        break
        
      case 'disconnect':
        result = await sendIntegrationDisconnectedEmail({
          to: targetEmail,
          integrationName: 'Slack',
          userName: user.user_metadata?.full_name || 'Test User',
          reason: 'You manually disconnected this integration',
        })
        break
        
      case 'failed':
        result = await sendIntegrationFailedEmail({
          to: targetEmail,
          integrationName: 'Asana',
          userName: user.user_metadata?.full_name || 'Test User',
          errorDetails: 'API token expired - please reconnect',
        })
        break
        
      case 'trial':
        result = await sendTrialEndingEmail({
          to: targetEmail,
          userName: user.user_metadata?.full_name || 'Test User',
          daysRemaining: 2,
          upgradeLink: 'https://eagleeye.work/pricing',
        })
        break
        
      case 'cancelled':
        result = await sendSubscriptionCancelledEmail({
          to: targetEmail,
          userName: user.user_metadata?.full_name || 'Test User',
        })
        break
        
      default:
        return NextResponse.json({
          error: 'Invalid email type',
          validTypes: ['welcome', 'payment', 'support', 'connected', 'disconnect', 'failed', 'trial', 'cancelled'],
        }, { status: 400 })
    }
    
    return NextResponse.json({
      success: result.success,
      type,
      sentTo: targetEmail,
      messageId: result.messageId,
      error: result.error,
    })
    
  } catch (error: any) {
    console.error('[Test Email] Error:', error)
    return NextResponse.json({
      error: 'Failed to send test email',
      details: error?.message,
    }, { status: 500 })
  }
}

// GET endpoint to show available email types
export async function GET() {
  return NextResponse.json({
    usage: 'POST /api/test-email with JSON body',
    availableTypes: [
      { type: 'welcome', description: 'Welcome email after signup confirmation' },
      { type: 'payment', description: 'Payment confirmation email' },
      { type: 'support', description: 'Support ticket confirmation' },
      { type: 'connected', description: 'Integration connected notification' },
      { type: 'disconnect', description: 'Integration disconnected notification' },
      { type: 'failed', description: 'Integration sync failed notification' },
      { type: 'trial', description: 'Trial ending reminder' },
      { type: 'cancelled', description: 'Subscription cancelled confirmation' },
    ],
    example: {
      type: 'payment',
      email: 'optional@example.com', // If omitted, uses logged-in user's email
    },
  })
}
