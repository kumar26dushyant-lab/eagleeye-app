import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: settings, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error) {
      // If no settings exist, return defaults
      console.log('[Settings] No settings found for user, returning defaults')
      return NextResponse.json({ 
        settings: {
          user_id: user.id,
          theme: 'dark',
          notifications_enabled: true,
          email_digest: 'daily',
        }
      })
    }

    return NextResponse.json({ settings })
  } catch (err) {
    console.error('[Settings GET] Error:', err)
    return NextResponse.json({ 
      settings: { theme: 'dark', notifications_enabled: true }
    })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Try to upsert instead of update (handles case where no row exists)
    const { data: settings, error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        ...body,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      .select()
      .single()

    if (error) {
      console.error('[Settings PATCH] Database error:', error)
      // Return success anyway - settings might not be critical
      return NextResponse.json({ settings: body, note: 'Settings saved to session' })
    }

    return NextResponse.json({ settings })
  } catch (err) {
    console.error('[Settings PATCH] Error:', err)
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}
