import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Handle email confirmation links from Supabase
// URL format: /auth/confirm?token_hash=xxx&type=signup
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type') as 'signup' | 'recovery' | 'email' | null
  const next = requestUrl.searchParams.get('next') || '/dashboard'

  if (token_hash && type) {
    const supabase = await createClient()
    
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type,
    })

    if (!error) {
      // Successful verification - redirect to dashboard
      return NextResponse.redirect(new URL(next, requestUrl.origin))
    }
    
    console.error('Auth confirm error:', error)
  }

  // If verification fails, redirect to login with error
  return NextResponse.redirect(new URL('/login?error=confirmation_failed', requestUrl.origin))
}
