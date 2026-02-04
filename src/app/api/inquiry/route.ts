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

// Generate short, memorable inquiry ID like "INQ-A1B2C3"
function generateShortInquiryId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let id = ''
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `INQ-${id}`
}

/**
 * POST /api/inquiry
 * Handle inquiry form submissions from the home page
 * Stores in database and sends email notification
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, company, inquiryType, teamSize, message } = body

    // Validation
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      )
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      )
    }

    // Store inquiry in database with short ID
    const supabase = await createClient()
    const shortInquiryId = generateShortInquiryId()
    let inquiryId = shortInquiryId
    
    const { data: inquiry, error: insertError } = await (supabase as any)
      .from('inquiries')
      .insert({
        name,
        email,
        company: company || null,
        inquiry_type: inquiryType || 'other',
        team_size: teamSize || null,
        message,
        status: 'new',
        short_id: shortInquiryId,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (!insertError && inquiry) {
      inquiryId = inquiry.short_id || shortInquiryId
    }

    // Send email notification
    const notifyEmail = process.env.SUPPORT_EMAIL || 'kumar26.dushyant@gmail.com'
    const resendClient = getResend()
    
    console.log('[Inquiry] Attempting to send email notification...')
    console.log('[Inquiry] Resend configured:', !!resendClient)
    console.log('[Inquiry] Target email:', notifyEmail)
    
    if (resendClient) {
      try {
        // Send from verified eagleeye.work domain
        const result = await resendClient.emails.send({
          from: 'EagleEye Inquiries <inquiries@eagleeye.work>',
          to: notifyEmail,
          replyTo: email,
          subject: `[INQUIRY] ${inquiryType || 'General'} - ${name} from ${company || 'Unknown'}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #10b981;">📬 New Inquiry Received</h2>
              
              <div style="background: #f4f4f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <p style="margin: 0 0 8px 0;"><strong>Inquiry ID:</strong> ${inquiryId}</p>
                <p style="margin: 0 0 8px 0;"><strong>Name:</strong> ${name}</p>
                <p style="margin: 0 0 8px 0;"><strong>Email:</strong> ${email}</p>
                <p style="margin: 0 0 8px 0;"><strong>Company:</strong> ${company || 'Not provided'}</p>
                <p style="margin: 0 0 8px 0;"><strong>Type:</strong> ${inquiryType || 'General'}</p>
                <p style="margin: 0;"><strong>Team Size:</strong> ${teamSize || 'Not provided'}</p>
              </div>
              
              <div style="background: #fff; border: 1px solid #e4e4e7; padding: 16px; border-radius: 8px;">
                <h3 style="margin-top: 0;">Message:</h3>
                <p style="white-space: pre-wrap;">${message}</p>
              </div>
              
              <p style="color: #71717a; font-size: 12px; margin-top: 24px;">
                Reply directly to this email to respond to ${name}.
              </p>
            </div>
          `,
        })
        console.log('[Inquiry] Email sent successfully:', result)
        
        // Send confirmation email to the inquirer
        try {
          await resendClient.emails.send({
            from: 'EagleEye <hello@eagleeye.work>',
            to: email,
            subject: `We received your inquiry ${inquiryId}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #fafafa; padding: 32px; border-radius: 12px;">
                <div style="text-align: center; margin-bottom: 24px;">
                  <h1 style="color: #22d3ee; margin: 0;">🦅 EagleEye</h1>
                </div>
                
                <h2 style="color: #fafafa; margin-bottom: 16px;">Thanks for reaching out, ${name}!</h2>
                
                <div style="background: #18181b; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                  <p style="margin: 0 0 8px 0; color: #a1a1aa;">Reference ID</p>
                  <p style="margin: 0; font-size: 24px; font-weight: bold; color: #10b981;">${inquiryId}</p>
                </div>
                
                <p style="color: #a1a1aa; line-height: 1.6;">
                  We've received your ${inquiryType || 'general'} inquiry and our team will review it shortly.
                </p>
                
                <p style="color: #a1a1aa; line-height: 1.6;">
                  <strong style="color: #fafafa;">What happens next?</strong><br>
                  A member of our team will get back to you within <strong style="color: #fafafa;">24-48 hours</strong> at this email address.
                </p>
                
                <div style="background: #18181b; padding: 16px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0 0 8px 0; color: #a1a1aa;">Your message:</p>
                  <p style="margin: 0; color: #fafafa; white-space: pre-wrap;">${message.substring(0, 200)}${message.length > 200 ? '...' : ''}</p>
                </div>
                
                <p style="color: #a1a1aa; line-height: 1.6;">
                  Have more questions? Simply reply to this email.
                </p>
                
                <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #27272a; text-align: center;">
                  <p style="color: #71717a; font-size: 12px; margin: 0;">
                    EagleEye • Your AI-powered daily brief<br>
                    <a href="https://eagleeye.work" style="color: #22d3ee; text-decoration: none;">eagleeye.work</a>
                  </p>
                </div>
              </div>
            `,
          })
          console.log('[Inquiry] Confirmation email sent to:', email)
        } catch (confirmError) {
          console.error('[Inquiry] Failed to send confirmation:', confirmError)
        }
      } catch (emailError: any) {
        console.error('[Inquiry] Failed to send email:', emailError?.message || emailError)
        console.error('[Inquiry] Email error details:', JSON.stringify(emailError, null, 2))
      }
    } else {
      console.log('[Inquiry] RESEND_API_KEY not configured. Inquiry logged:', {
        inquiryId,
        name,
        email,
        inquiryType
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Inquiry submitted successfully! We\'ll get back to you within 24 hours.'
    })

  } catch (error: any) {
    console.error('[Inquiry] Error:', error)
    return NextResponse.json(
      { error: 'Failed to submit inquiry' },
      { status: 500 }
    )
  }
}
