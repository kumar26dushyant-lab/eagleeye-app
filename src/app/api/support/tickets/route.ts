import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

// Lazy initialize Resend
let resend: Resend | null = null
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY)
  }
  return resend
}

// Generate short, memorable ticket ID like "TKT-A1B2C3"
function generateShortTicketId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Avoid confusing chars like 0/O, 1/I
  let id = ''
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `TKT-${id}`
}

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

    // Try to create ticket in database with short ID
    const shortTicketId = generateShortTicketId()
    let ticketId = shortTicketId
    const { data: ticket, error } = await (supabase as any)
      .from('support_tickets')
      .insert({
        user_id: user.id,
        subject,
        message,
        category: category || 'general',
        status: 'open',
        priority: 'normal',
        short_id: shortTicketId
      })
      .select()
      .single()

    if (!error && ticket) {
      ticketId = ticket.short_id || shortTicketId
    }

    // Send email notification to support
    const supportEmail = process.env.SUPPORT_EMAIL || 'kumar26.dushyant@gmail.com'
    const resendClient = getResend()
    
    console.log('[Support] Attempting to send email notification...')
    console.log('[Support] Resend configured:', !!resendClient)
    console.log('[Support] Target email:', supportEmail)
    
    if (resendClient) {
      try {
        // Use Resend's verified domain (onboarding@resend.dev) until eagleeye.work is verified in Resend
        const result = await resendClient.emails.send({
          from: 'EagleEye Support <support@eagleeye.work>',
          to: supportEmail,
          replyTo: user.email || undefined,
          subject: `[SUPPORT] Ticket #${ticketId} - ${subject}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #6366f1;">🎫 New Support Ticket</h2>
              
              <div style="background: #f4f4f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <p style="margin: 0 0 8px 0;"><strong>Ticket ID:</strong> ${ticketId}</p>
                <p style="margin: 0 0 8px 0;"><strong>From:</strong> ${user.email}</p>
                <p style="margin: 0 0 8px 0;"><strong>Category:</strong> ${category || 'general'}</p>
                <p style="margin: 0;"><strong>Subject:</strong> ${subject}</p>
              </div>
              
              <div style="background: #fff; border: 1px solid #e4e4e7; padding: 16px; border-radius: 8px;">
                <h3 style="margin-top: 0;">Message:</h3>
                <p style="white-space: pre-wrap;">${message}</p>
              </div>
              
              <p style="color: #71717a; font-size: 12px; margin-top: 24px;">
                Reply directly to this email to respond to the customer.
              </p>
            </div>
          `,
        })
        console.log('[Support] Email sent successfully:', result)
        
        // Send confirmation email to user
        console.log('[Support] Sending confirmation to user email:', user.email)
        if (user.email) {
          try {
            const confirmResult = await resendClient.emails.send({
              from: 'EagleEye Support <support@eagleeye.work>',
              to: user.email,
              subject: `We received your ticket ${ticketId}`,
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #fafafa; padding: 32px; border-radius: 12px;">
                  <div style="text-align: center; margin-bottom: 24px;">
                    <h1 style="color: #22d3ee; margin: 0;">🦅 EagleEye</h1>
                  </div>
                  
                  <h2 style="color: #fafafa; margin-bottom: 16px;">We received your support request!</h2>
                  
                  <div style="background: #18181b; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22d3ee;">
                    <p style="margin: 0 0 8px 0; color: #a1a1aa;">Ticket ID</p>
                    <p style="margin: 0; font-size: 24px; font-weight: bold; color: #22d3ee;">${ticketId}</p>
                  </div>
                  
                  <div style="background: #18181b; padding: 16px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0 0 8px 0; color: #a1a1aa;">Subject</p>
                    <p style="margin: 0; color: #fafafa;">${subject}</p>
                  </div>
                  
                  <p style="color: #a1a1aa; line-height: 1.6;">
                    Thank you for reaching out. Our support team will review your request and get back to you within <strong style="color: #fafafa;">24-48 hours</strong>.
                  </p>
                  
                  <p style="color: #a1a1aa; line-height: 1.6;">
                    You can reply directly to this email if you have any additional information to add.
                  </p>
                  
                  <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #27272a; text-align: center;">
                    <p style="color: #71717a; font-size: 12px; margin: 0;">
                      EagleEye • Your AI-powered daily brief
                    </p>
                  </div>
                </div>
              `,
            })
            console.log('[Support] Confirmation email result:', JSON.stringify(confirmResult, null, 2))
            console.log('[Support] Confirmation email sent to user:', user.email)
          } catch (confirmError: any) {
            console.error('[Support] Failed to send confirmation to user:', user.email)
            console.error('[Support] Confirmation error:', confirmError?.message || confirmError)
            console.error('[Support] Full error:', JSON.stringify(confirmError, null, 2))
          }
        }
      } catch (emailError: any) {
        console.error('[Support] Failed to send email:', emailError?.message || emailError)
        console.error('[Support] Email error details:', JSON.stringify(emailError, null, 2))
        // Continue - ticket is still logged
      }
    } else {
      console.log('[Support] RESEND_API_KEY not configured. Ticket logged:', {
        ticketId,
        userId: user.id,
        userEmail: user.email,
        subject
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Support ticket submitted! We\'ll get back to you within 24 hours.',
      ticketId
    })

  } catch (error: any) {
    console.error('[Support] Error:', error)
    return NextResponse.json(
      { error: 'Failed to create support ticket' },
      { status: 500 }
    )
  }
}
