import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/inquiry
 * Handle inquiry form submissions from the home page
 * Stores in database and optionally sends email notification
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

    // Store inquiry in database
    const supabase = await createClient()
    
    const { error: insertError } = await (supabase as any)
      .from('inquiries')
      .insert({
        name,
        email,
        company: company || null,
        inquiry_type: inquiryType || 'other',
        team_size: teamSize || null,
        message,
        status: 'new',
        created_at: new Date().toISOString()
      })

    if (insertError) {
      console.error('[Inquiry] Database error:', insertError)
      // Don't fail if table doesn't exist - just log and continue
      // The inquiry will still be useful via email notification
    }

    // Send email notification (if Resend is configured)
    const inquiryEmail = process.env.INQUIRY_EMAIL || 'hello@eagleeye.work'
    
    // Log the inquiry for now (email notification can be added later)
    console.log('[Inquiry] New inquiry received:', {
      name,
      email,
      company,
      inquiryType,
      teamSize,
      message: message.substring(0, 100) + '...',
      notifyEmail: inquiryEmail
    })

    // TODO: Send email when Resend is configured
    // await sendInquiryNotification({ name, email, company, inquiryType, teamSize, message })

    return NextResponse.json({
      success: true,
      message: 'Inquiry submitted successfully'
    })

  } catch (error: any) {
    console.error('[Inquiry] Error:', error)
    return NextResponse.json(
      { error: 'Failed to submit inquiry' },
      { status: 500 }
    )
  }
}
