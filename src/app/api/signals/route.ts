import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get recent signals (last 24 hours)
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data: signals, error } = await supabase
    .from('communication_signals')
    .select('*')
    .eq('user_id', user.id)
    .gte('timestamp', yesterday)
    .order('timestamp', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Signals fetch error:', error)
    return NextResponse.json({ signals: [] })
  }

  return NextResponse.json({ signals: signals || [] })
}
