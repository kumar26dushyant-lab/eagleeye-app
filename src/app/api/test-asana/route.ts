// Simple Asana test endpoint
// GET /api/test-asana

import { NextResponse } from 'next/server'

const ASANA_API = 'https://app.asana.com/api/1.0'

export async function GET() {
  const token = process.env.ASANA_ACCESS_TOKEN
  
  if (!token) {
    return NextResponse.json({ 
      success: false, 
      error: 'ASANA_ACCESS_TOKEN not configured' 
    }, { status: 500 })
  }

  try {
    // Test 1: Get user
    const userRes = await fetch(`${ASANA_API}/users/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    
    if (!userRes.ok) {
      throw new Error(`Auth failed: ${userRes.status}`)
    }
    
    const userData = await userRes.json()
    const user = userData.data

    // Test 2: Get workspaces
    const wsRes = await fetch(`${ASANA_API}/workspaces`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const wsData = await wsRes.json()
    const workspaces = wsData.data

    // Test 3: Get tasks
    const params = new URLSearchParams({
      workspace: workspaces[0]?.gid || '',
      assignee: user.gid,
      completed_since: 'now',
      opt_fields: 'gid,name,due_on,completed,projects.name',
    })

    const tasksRes = await fetch(`${ASANA_API}/tasks?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const tasksData = await tasksRes.json()
    const tasks = tasksData.data

    return NextResponse.json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        gid: user.gid
      },
      workspace: {
        name: workspaces[0]?.name,
        gid: workspaces[0]?.gid
      },
      tasks: tasks.slice(0, 5).map((t: { gid: string; name: string; due_on: string; completed: boolean; projects: Array<{ name: string }> }) => ({
        name: t.name,
        due: t.due_on,
        completed: t.completed,
        project: t.projects?.[0]?.name
      })),
      totalTasks: tasks.length
    })

  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
