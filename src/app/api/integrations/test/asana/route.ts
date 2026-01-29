// Test Asana connection with provided token
import { NextRequest, NextResponse } from 'next/server'

const ASANA_API = 'https://app.asana.com/api/1.0'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()
    
    if (!token) {
      return NextResponse.json({ success: false, error: 'Token is required' }, { status: 400 })
    }

    // Test the token by fetching user info
    const userRes = await fetch(`${ASANA_API}/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!userRes.ok) {
      const error = await userRes.json().catch(() => ({}))
      return NextResponse.json({ 
        success: false, 
        error: error.errors?.[0]?.message || 'Invalid token - please check and try again' 
      }, { status: 401 })
    }

    const userData = await userRes.json()
    const user = userData.data

    // Get workspaces
    const wsRes = await fetch(`${ASANA_API}/workspaces`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    const wsData = await wsRes.json()
    const workspaces = wsData.data || []

    return NextResponse.json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
      },
      workspace: workspaces[0]?.name || 'My workspace',
      workspaceId: workspaces[0]?.gid,
      workspaceCount: workspaces.length,
    })
  } catch (error) {
    console.error('[Asana Test] Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to connect - please try again' 
    }, { status: 500 })
  }
}
