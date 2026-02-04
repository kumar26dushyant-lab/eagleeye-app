// Email Digest Cron Job
// Runs hourly to send digests to users at their preferred time
// Vercel Cron: "0 * * * *" (every hour)

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmailDigest } from '@/lib/notifications/email-digest'

// Use service role for cron (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface NotificationSettings {
  emailEnabled: boolean
  emailFrequency: 'daily' | 'weekly' | 'realtime'
  emailTime: string
  timezone: string
}

interface UserForDigest {
  user_id: string
  email: string
  full_name: string | null
  notification_settings: NotificationSettings
}

export async function GET(request: Request) {
  // Verify this is a legitimate cron request (Vercel adds this header)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    // In production, require CRON_SECRET. Allow in dev for testing.
    console.log('[Digest Cron] Warning: Missing or invalid CRON_SECRET')
  }

  const startTime = Date.now()
  console.log('[Digest Cron] Starting digest run at', new Date().toISOString())

  try {
    // Get all users with email digest enabled
    const { data: users, error: usersError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, notification_settings')
      .not('notification_settings', 'is', null)

    if (usersError) {
      console.error('[Digest Cron] Failed to fetch users:', usersError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!users || users.length === 0) {
      console.log('[Digest Cron] No users found')
      return NextResponse.json({ message: 'No users to process', sent: 0 })
    }

    const results = {
      processed: 0,
      sent: 0,
      skipped: 0,
      errors: 0,
    }

    // Process each user
    for (const user of users) {
      results.processed++
      
      const settings = user.notification_settings as NotificationSettings
      
      // Skip if email not enabled
      if (!settings?.emailEnabled) {
        results.skipped++
        continue
      }

      // Check if it's the right time for this user
      const shouldSend = isRightTimeForUser(settings)
      if (!shouldSend) {
        results.skipped++
        continue
      }

      // Check weekly frequency
      if (settings.emailFrequency === 'weekly') {
        const today = new Date()
        // Only send on Mondays for weekly digests
        if (today.getDay() !== 1) {
          results.skipped++
          continue
        }
      }

      try {
        // Get user's signals/tasks for the digest
        const summary = await getUserSignalSummary(user.id)
        
        // Send the digest
        const result = await sendEmailDigest(
          {
            userId: user.id,
            email: user.email,
            frequency: settings.emailFrequency,
            timezone: settings.timezone || 'UTC',
            preferredTime: settings.emailTime || '09:00',
          },
          summary
        )

        if (result.success) {
          results.sent++
          
          // Log the notification
          await logNotification(user.id, 'email_digest', 'sent', user.email, result.messageId)
        } else {
          results.errors++
          await logNotification(user.id, 'email_digest', 'failed', user.email, undefined, result.error)
        }
      } catch (err) {
        console.error(`[Digest Cron] Error processing user ${user.id}:`, err)
        results.errors++
        await logNotification(user.id, 'email_digest', 'failed', user.email, undefined, 
          err instanceof Error ? err.message : 'Unknown error')
      }
    }

    const duration = Date.now() - startTime
    console.log(`[Digest Cron] Completed in ${duration}ms:`, results)

    return NextResponse.json({
      success: true,
      duration_ms: duration,
      ...results,
    })
  } catch (error) {
    console.error('[Digest Cron] Fatal error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Check if current time matches user's preferred delivery time
 */
function isRightTimeForUser(settings: NotificationSettings): boolean {
  const timezone = settings.timezone || 'UTC'
  const preferredTime = settings.emailTime || '09:00'
  
  try {
    // Get current time in user's timezone
    const now = new Date()
    const userTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }))
    const currentHour = userTime.getHours()
    
    // Parse preferred time (format: "09:00" or "09:00 AM")
    const preferredHour = parsePreferredHour(preferredTime)
    
    // Match if within the same hour
    return currentHour === preferredHour
  } catch (err) {
    console.error('[Digest Cron] Error parsing timezone:', err)
    // Fall back to checking against 9 AM UTC
    return new Date().getUTCHours() === 9
  }
}

/**
 * Parse preferred time string to hour number
 */
function parsePreferredHour(time: string): number {
  // Handle formats like "09:00", "9 AM", "6 PM", etc.
  const lowered = time.toLowerCase().trim()
  
  if (lowered.includes('pm')) {
    const hour = parseInt(lowered)
    return hour === 12 ? 12 : hour + 12
  }
  
  if (lowered.includes('am')) {
    const hour = parseInt(lowered)
    return hour === 12 ? 0 : hour
  }
  
  // Format: "09:00"
  return parseInt(time.split(':')[0])
}

/**
 * Get signal summary for a user's digest
 */
async function getUserSignalSummary(userId: string) {
  // Get work items needing attention
  const { data: workItems } = await supabaseAdmin
    .from('work_items')
    .select('*')
    .eq('user_id', userId)
    .or('is_blocked.eq.true,urgency.eq.high,is_surfaced.eq.true')
    .order('due_date', { ascending: true, nullsFirst: false })
    .limit(20)

  // Get recent communication signals
  const { data: signals } = await supabaseAdmin
    .from('communication_signals')
    .select('*')
    .eq('user_id', userId)
    .eq('is_read', false)
    .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order('timestamp', { ascending: false })
    .limit(20)

  // Calculate summary
  const blockers = workItems?.filter(w => w.is_blocked).length || 0
  const overdueTasks = workItems?.filter(w => {
    if (!w.due_date) return false
    return new Date(w.due_date) < new Date()
  }).length || 0
  const decisions = signals?.filter(s => s.signal_type === 'question' || s.signal_type === 'escalation').length || 0
  const mentions = signals?.filter(s => s.signal_type === 'mention').length || 0

  // Top items for the digest
  const topItems = (workItems || [])
    .filter(w => w.is_blocked || w.urgency === 'high' || w.is_surfaced)
    .slice(0, 5)
    .map(w => ({
      source: w.source,
      title: w.title,
      urgency: (w.urgency || 'medium') as 'high' | 'medium' | 'low',
      url: w.url || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    }))

  return {
    blockers,
    decisions,
    mentions,
    overdueTasks,
    topItems,
  }
}

/**
 * Log notification to database
 */
async function logNotification(
  userId: string,
  type: string,
  status: 'sent' | 'failed' | 'skipped',
  recipient?: string,
  messageId?: string,
  errorMessage?: string
) {
  try {
    await supabaseAdmin
      .from('notification_log')
      .insert({
        user_id: userId,
        notification_type: type,
        status,
        recipient,
        metadata: messageId ? { messageId } : undefined,
        error_message: errorMessage,
      })
  } catch (err) {
    console.error('[Digest Cron] Failed to log notification:', err)
  }
}
