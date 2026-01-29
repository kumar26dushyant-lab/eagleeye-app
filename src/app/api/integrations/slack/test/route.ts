import { NextResponse } from 'next/server'
import { testSlackConnection } from '@/lib/integrations/slack'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const token = body.token as string | undefined
    
    // Use provided token or fall back to environment variable
    const result = await testSlackConnection(token || undefined)
    
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
