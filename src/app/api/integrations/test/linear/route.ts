// Test Linear connection with provided API key
import { NextRequest, NextResponse } from 'next/server'

const LINEAR_API = 'https://api.linear.app/graphql'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()
    
    if (!token) {
      return NextResponse.json({ success: false, error: 'API key is required' }, { status: 400 })
    }

    // Validate token format
    if (!token.startsWith('lin_api_')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid API key format. Linear API keys start with "lin_api_"' 
      }, { status: 400 })
    }

    // Test the token by fetching viewer info
    const res = await fetch(LINEAR_API, {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query {
            viewer {
              id
              name
              email
            }
            organization {
              id
              name
            }
          }
        `
      }),
    })

    if (!res.ok) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid API key - please check and try again' 
      }, { status: 401 })
    }

    const data = await res.json()

    if (data.errors) {
      return NextResponse.json({ 
        success: false, 
        error: data.errors[0]?.message || 'Invalid API key' 
      }, { status: 401 })
    }

    const viewer = data.data?.viewer
    const org = data.data?.organization

    return NextResponse.json({
      success: true,
      user: {
        name: viewer?.name,
        email: viewer?.email,
      },
      workspace: org?.name || 'Linear Workspace',
      workspaceId: org?.id,
    })
  } catch (error) {
    console.error('[Linear Test] Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to connect - please try again' 
    }, { status: 500 })
  }
}
