import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { testAsanaConnection } from '@/lib/integrations/asana'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const token = body.token as string | undefined
    
    const result = await testAsanaConnection(token)
    
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
