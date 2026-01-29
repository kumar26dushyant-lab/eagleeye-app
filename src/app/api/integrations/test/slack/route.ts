import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { token } = await request.json()

    if (!token || !token.startsWith('xoxb-')) {
      return NextResponse.json(
        { success: false, error: 'Invalid token format. Slack Bot tokens start with "xoxb-"' },
        { status: 400 }
      )
    }

    // Test the token by calling Slack's auth.test endpoint
    const response = await fetch('https://slack.com/api/auth.test', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (!data.ok) {
      return NextResponse.json(
        { success: false, error: `Slack API error: ${data.error}` },
        { status: 400 }
      )
    }

    // Token is valid - return workspace info
    return NextResponse.json({
      success: true,
      workspace: data.team,
      botName: data.user,
      message: `Connected to ${data.team} workspace as ${data.user}`,
    })
  } catch (error) {
    console.error('Slack test error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to test Slack connection' },
      { status: 500 }
    )
  }
}
