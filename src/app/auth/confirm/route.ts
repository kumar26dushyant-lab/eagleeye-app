import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendWelcomeEmail } from '@/lib/email'

// Handle email confirmation links from Supabase
// URL format: /auth/confirm?token_hash=xxx&type=signup
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type') as 'signup' | 'recovery' | 'email' | null
  const next = requestUrl.searchParams.get('next') || '/dashboard'

  if (token_hash && type) {
    const supabase = await createClient()
    
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type,
    })

    if (!error && data.user) {
      // Send welcome email for new signups
      if (type === 'signup' && data.user.email) {
        try {
          await sendWelcomeEmail({
            to: data.user.email,
            userName: data.user.user_metadata?.full_name,
            confirmationLink: `${requestUrl.origin}/dashboard`,
          })
          console.log('[Auth Confirm] Welcome email sent to:', data.user.email)
        } catch (emailError) {
          console.error('[Auth Confirm] Failed to send welcome email:', emailError)
          // Don't block signup if email fails
        }
      }
      
      // For password recovery, redirect to reset-password page
      if (type === 'recovery') {
        return NextResponse.redirect(new URL('/reset-password', requestUrl.origin))
      }
      
      // Successful verification - redirect to dashboard
      return NextResponse.redirect(new URL(next, requestUrl.origin))
    }
    
    console.error('Auth confirm error:', error)
  }

  // If verification fails, redirect to login with error
  return NextResponse.redirect(new URL('/login?error=confirmation_failed', requestUrl.origin))
}
