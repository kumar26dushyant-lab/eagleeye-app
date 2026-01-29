import { NextResponse } from 'next/server'
import { generateVAPIDKeys } from '@/lib/notifications/web-push'

// GET - Generate new VAPID keys (run once)
export async function GET() {
  try {
    const keys = generateVAPIDKeys()
    
    return NextResponse.json({
      success: true,
      message: 'Add these to your .env.local file',
      keys: {
        NEXT_PUBLIC_VAPID_PUBLIC_KEY: keys.publicKey,
        VAPID_PRIVATE_KEY: keys.privateKey,
        VAPID_EMAIL: 'mailto:your-email@example.com',
      },
      instructions: [
        '1. Copy these keys to your .env.local file',
        '2. Restart the server',
        '3. Web push notifications will be enabled',
      ],
    })
  } catch (error) {
    console.error('Failed to generate VAPID keys:', error)
    return NextResponse.json(
      { error: 'Failed to generate keys' },
      { status: 500 }
    )
  }
}
