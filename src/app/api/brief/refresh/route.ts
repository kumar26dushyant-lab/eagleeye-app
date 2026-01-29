import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date().toISOString().split('T')[0]

  // Delete existing brief to force regeneration
  await supabase
    .from('daily_briefs')
    .delete()
    .eq('user_id', user.id)
    .eq('brief_date', today)

  // Re-sync work items (trigger Asana sync)
  try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/asana/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
  } catch {
    // Continue even if sync fails
  }

  return NextResponse.json({ success: true })
}
