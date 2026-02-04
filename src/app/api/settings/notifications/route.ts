// Notification settings API
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Default notification settings - optimized for best experience
// Email digest and push notifications enabled by default
const DEFAULT_SETTINGS = {
  emailEnabled: true,           // ✅ Daily digest enabled by default
  emailFrequency: 'daily' as const,
  emailTime: '09:00',
  slackDMEnabled: false,
  slackDMFrequency: 'daily' as const,
  slackDMTime: '09:00',
  pushEnabled: true,            // ✅ Push notifications enabled by default
  realtimeAlertsEnabled: true,  // ✅ Realtime alerts enabled by default
  realtimeChannels: ['email', 'push'] as const,
  timezone: 'UTC',
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    // Return defaults for demo/unauthenticated
    return NextResponse.json({ settings: DEFAULT_SETTINGS })
  }

  try {
    // Get notification_settings from profiles table
    // Using type assertion since column may not be in generated types yet
    const { data: profile, error } = await (supabase as any)
      .from('profiles')
      .select('notification_settings')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('[Notification Settings] Error fetching:', error)
      return NextResponse.json({ settings: DEFAULT_SETTINGS })
    }

    // Merge with defaults to ensure all fields exist
    const settings = {
      ...DEFAULT_SETTINGS,
      ...(profile?.notification_settings || {}),
    }

    return NextResponse.json({ settings })
  } catch (err) {
    console.error('[Notification Settings] Exception:', err)
    return NextResponse.json({ settings: DEFAULT_SETTINGS })
  }
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { settings } = await request.json()
  
  // Validate settings
  if (!settings || typeof settings !== 'object') {
    return NextResponse.json({ error: 'Invalid settings' }, { status: 400 })
  }

  // Merge with defaults to ensure valid structure
  const mergedSettings = {
    ...DEFAULT_SETTINGS,
    ...settings,
  }

  try {
    // Update notification_settings in profiles table
    // Using type assertion since column may not be in generated types yet
    const { error } = await (supabase as any)
      .from('profiles')
      .update({ 
        notification_settings: mergedSettings,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (error) {
      console.error('[Notification Settings] Failed to save:', error)
      return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
    }

    console.log('[Notification Settings] Saved for user:', user.id)
    return NextResponse.json({ success: true, settings: mergedSettings })
  } catch (err) {
    console.error('[Notification Settings] Exception:', err)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}
