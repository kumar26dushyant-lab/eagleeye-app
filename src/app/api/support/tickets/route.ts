import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/support/tickets
 * Get all support tickets for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { data: tickets, error } = await (supabase as any)
      .from('support_tickets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Support] Error fetching tickets:', error)
      return NextResponse.json({ tickets: [] })
    }

    return NextResponse.json({ tickets })

  } catch (error: any) {
    console.error('[Support] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/support/tickets
 * Create a new support ticket
 * Only available for authenticated users (subscribed users have dashboard access)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated. Please log in to submit a support ticket.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { subject, message, category } = body

    // Validation
    if (!subject || !message) {
      return NextResponse.json(
        { error: 'Subject and message are required' },
        { status: 400 }
      )
    }

    if (subject.length > 200) {
      return NextResponse.json(
        { error: 'Subject must be less than 200 characters' },
        { status: 400 }
      )
    }

    if (message.length > 5000) {
      return NextResponse.json(
        { error: 'Message must be less than 5000 characters' },
        { status: 400 }
      )
    }

    // Create ticket in database
    const { data: ticket, error } = await (supabase as any)
      .from('support_tickets')
      .insert({
        user_id: user.id,
        subject,
        message,
        category: category || 'general',
        status: 'open',
        priority: 'normal'
      })
      .select()
      .single()

    if (error) {
      console.error('[Support] Error creating ticket:', error)
      // If table doesn't exist, still acknowledge the ticket
      if (error.code === '42P01') {
        console.log('[Support] Table not found, logging ticket:', { subject, userEmail: user.email })
        return NextResponse.json({
          success: true,
          message: 'Support request received. We\'ll get back to you within 24 hours.',
          ticketId: 'pending-' + Date.now()
        })
      }
      throw error
    }

    // Log for notification purposes
    const supportEmail = process.env.SUPPORT_EMAIL || 'support@eagleeye.work'
    console.log('[Support] New ticket created:', {
      ticketId: ticket?.id,
      userId: user.id,
      userEmail: user.email,
      subject,
      notifyEmail: supportEmail
    })

    // TODO: Send email notification when Resend is configured
    // await sendSupportTicketNotification({ ticket, user })

    return NextResponse.json({
      success: true,
      message: 'Support ticket created. We\'ll get back to you within 24 hours.',
      ticketId: ticket?.id
    })

  } catch (error: any) {
    console.error('[Support] Error:', error)
    return NextResponse.json(
      { error: 'Failed to create support ticket' },
      { status: 500 }
    )
  }
}
