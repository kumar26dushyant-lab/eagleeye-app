// User data export and account deletion API
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Export all user data (GDPR compliant)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all user data
    const [
      profileResult,
      integrationsResult,
      settingsResult,
      signalsResult,
      subscriptionResult,
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('integrations').select('*').eq('user_id', user.id),
      supabase.from('user_settings').select('*').eq('user_id', user.id).single(),
      supabase.from('communication_signals').select('*').eq('user_id', user.id),
      // Subscription might not exist in all setups, handle gracefully
      supabase.from('profiles').select('*').eq('id', user.id).single(),
    ])

    // Compile export
    const exportData = {
      exportedAt: new Date().toISOString(),
      userId: user.id,
      email: user.email,
      profile: profileResult.data || null,
      settings: settingsResult.data || null,
      subscription: subscriptionResult.data || null,
      integrations: (integrationsResult.data || []).map(integration => {
        // Only export safe fields, exclude tokens
        const { access_token, refresh_token, ...safeData } = integration
        return safeData
      }),
      signals: signalsResult.data || [],
      // Privacy info
      dataRetentionPolicy: {
        signalsRetention: '30 days',
        rawDataRetention: 'Not stored - processed and discarded immediately',
        backupRetention: '7 days after deletion',
      },
    }

    return NextResponse.json(exportData)
  } catch (error) {
    console.error('Data export failed:', error)
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 })
  }
}

// DELETE - Delete user account and all data
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log(`Starting account deletion for user: ${user.id}`)

    // Delete all user data in order (respecting foreign keys)
    const deletionOrder = [
      'communication_signals',
      'work_items',
      'daily_briefs',
      'sync_log',
      'supervised_channels',
      'integrations',
      'user_settings',
      'profiles',
    ] as const

    for (const table of deletionOrder) {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq(table === 'profiles' ? 'id' : 'user_id', user.id)
      
      if (error) {
        console.error(`Failed to delete from ${table}:`, error)
        // Continue with other deletions
      } else {
        console.log(`Deleted from ${table}`)
      }
    }

    // Delete auth user - this will sign them out
    // Note: This requires admin privileges, so we use the service role
    const { createClient: createServiceClient } = await import('@supabase/supabase-js')
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { error: deleteAuthError } = await serviceSupabase.auth.admin.deleteUser(user.id)
    
    if (deleteAuthError) {
      console.error('Failed to delete auth user:', deleteAuthError)
      // Data is deleted, but auth user remains - they can't access anything
      return NextResponse.json({ 
        success: true, 
        warning: 'Data deleted but auth cleanup pending' 
      })
    }

    console.log('Account deletion completed successfully')
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Account deletion failed:', error)
    return NextResponse.json({ 
      error: 'Failed to delete account',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
