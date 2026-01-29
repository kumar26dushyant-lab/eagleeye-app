// Notification settings API
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    // Return defaults for demo
    return NextResponse.json({
      settings: {
        emailEnabled: true,
        emailFrequency: 'daily',
        emailTime: '09:00',
        slackDMEnabled: false,
        slackDMFrequency: 'daily',
        slackDMTime: '09:00',
        realtimeAlertsEnabled: false,
        realtimeChannels: ['email'],
        timezone: 'UTC',
      }
    })
  }

  // Get from profiles or user_settings table
  // Note: notification_settings column needs to be added to profiles table
  // For now, return defaults
  const defaultSettings = {
    emailEnabled: true,
    emailFrequency: 'daily' as const,
    emailTime: '09:00',
    slackDMEnabled: false,
    slackDMFrequency: 'daily' as const,
    slackDMTime: '09:00',
    realtimeAlertsEnabled: false,
    realtimeChannels: ['email'] as const,
    timezone: 'UTC',
  }

  return NextResponse.json({ settings: defaultSettings })
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

  // Update profile
  const { error } = await supabase
    .from('profiles')
    .update({ 
      notification_settings: settings,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    console.error('Failed to save notification settings:', error)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }

  return NextResponse.json({ success: true, settings })
}
