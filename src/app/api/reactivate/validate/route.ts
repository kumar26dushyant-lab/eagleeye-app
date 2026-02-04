// Validate reactivation token
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ valid: false, reason: 'missing' })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: tokenRecord, error } = await supabase
      .from('reactivation_tokens')
      .select('*')
      .eq('token', token)
      .single()

    if (error || !tokenRecord) {
      return NextResponse.json({ valid: false, reason: 'invalid' })
    }

    // Check if already used
    if (tokenRecord.used_at) {
      return NextResponse.json({ valid: false, reason: 'used' })
    }

    // Check if expired
    if (new Date(tokenRecord.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, reason: 'expired' })
    }

    return NextResponse.json({
      valid: true,
      email: tokenRecord.customer_email,
    })

  } catch (error) {
    console.error('[Reactivate Validate] Error:', error)
    return NextResponse.json({ valid: false, reason: 'error' })
  }
}
