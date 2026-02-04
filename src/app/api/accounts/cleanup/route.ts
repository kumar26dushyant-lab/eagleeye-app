// Account Cleanup Cron Job
// Runs daily to clean up accounts that exceeded the grace period after payment failure
// Schedule: Daily at 10 AM UTC (after trial/digest crons)

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendAccountDeletionWarningEmail, sendAccountDeletedEmail } from '@/lib/trial/emails'

// Grace period warning email sent 1 day before deletion
const WARNING_EMAIL_HOURS_BEFORE = 24

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: Request) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.log('[Account Cleanup] Unauthorized cron request')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Missing Supabase config' }, { status: 500 })
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const now = new Date()
  
  const results = {
    warningEmailsSent: 0,
    accountsDeleted: 0,
    errors: [] as string[],
  }
  
  try {
    // ============================================
    // 1. SEND WARNING EMAILS (1 day before deletion)
    // ============================================
    const warningThreshold = new Date(now.getTime() + WARNING_EMAIL_HOURS_BEFORE * 60 * 60 * 1000)
    
    const { data: accountsNeedingWarning } = await supabase
      .from('subscriptions')
      .select('id, customer_email, account_deletion_scheduled_at, grace_period_email_sent')
      .eq('status', 'payment_failed')
      .eq('grace_period_email_sent', false)
      .lte('account_deletion_scheduled_at', warningThreshold.toISOString())
      .not('account_deletion_scheduled_at', 'is', null)
    
    for (const account of accountsNeedingWarning || []) {
      try {
        const deletionDate = new Date(account.account_deletion_scheduled_at)
        const userName = account.customer_email.split('@')[0]
        
        await sendAccountDeletionWarningEmail({
          email: account.customer_email,
          name: userName,
          deletionDate,
        })
        
        await supabase
          .from('subscriptions')
          .update({ grace_period_email_sent: true })
          .eq('id', account.id)
        
        results.warningEmailsSent++
        console.log('[Account Cleanup] Warning email sent to:', account.customer_email)
      } catch (error) {
        results.errors.push(`Warning email failed for ${account.customer_email}: ${error}`)
      }
    }
    
    // ============================================
    // 2. DELETE ACCOUNTS PAST GRACE PERIOD
    // ============================================
    const { data: accountsToDelete } = await supabase
      .from('subscriptions')
      .select('id, customer_email, account_deletion_scheduled_at')
      .eq('status', 'payment_failed')
      .lte('account_deletion_scheduled_at', now.toISOString())
      .not('account_deletion_scheduled_at', 'is', null)
    
    for (const account of accountsToDelete || []) {
      try {
        const customerEmail = account.customer_email
        
        // Get the user profile to delete (case-insensitive email match)
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .ilike('email', customerEmail)
          .single()
        
        if (profile) {
          // Delete from auth.users (cascades to profiles, subscriptions, etc.)
          const { error: deleteError } = await supabase.auth.admin.deleteUser(profile.id)
          
          if (deleteError) {
            // If auth deletion fails, at least mark the subscription as deleted
            await supabase
              .from('subscriptions')
              .update({ status: 'deleted', updated_at: now.toISOString() })
              .eq('id', account.id)
            
            console.error('[Account Cleanup] Auth delete failed, marked as deleted:', deleteError)
          } else {
            results.accountsDeleted++
            console.log('[Account Cleanup] Account deleted:', customerEmail)
          }
        } else {
          // No profile found, just mark subscription as deleted
          await supabase
            .from('subscriptions')
            .update({ status: 'deleted', updated_at: now.toISOString() })
            .eq('id', account.id)
        }
        
        // Send deletion confirmation email
        try {
          await sendAccountDeletedEmail({
            email: customerEmail,
            name: customerEmail.split('@')[0],
          })
        } catch (emailError) {
          console.error('[Account Cleanup] Failed to send deletion email:', emailError)
        }
        
      } catch (error) {
        results.errors.push(`Deletion failed for ${account.customer_email}: ${error}`)
      }
    }
    
    console.log('[Account Cleanup] Completed:', results)
    
    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      ...results,
    })
    
  } catch (error) {
    console.error('[Account Cleanup] Cron error:', error)
    return NextResponse.json({ 
      error: 'Cleanup failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
