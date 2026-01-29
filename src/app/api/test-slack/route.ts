import { NextResponse } from 'next/server'
import { testSlackConnection } from '@/lib/integrations/slack'

// Simple test endpoint (no auth required) - for development only
export async function GET() {
  // Check if token is configured
  if (!process.env.SLACK_BOT_TOKEN) {
    return NextResponse.json({ 
      success: false, 
      error: 'SLACK_BOT_TOKEN not configured in environment',
      configured: false
    })
  }

  try {
    const result = await testSlackConnection()
    return NextResponse.json({ ...result, configured: true })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      configured: true
    })
  }
}
