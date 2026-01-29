// Asana API Integration
// Docs: https://developers.asana.com/docs

export interface AsanaTask {
  gid: string
  name: string
  notes: string
  completed: boolean
  due_on: string | null
  due_at: string | null
  assignee: {
    gid: string
    name: string
    email?: string
  } | null
  projects: Array<{
    gid: string
    name: string
  }>
  tags: Array<{
    gid: string
    name: string
  }>
  custom_fields?: Array<{
    gid: string
    name: string
    display_value: string | null
  }>
  permalink_url: string
  created_at: string
  modified_at: string
}

export interface AsanaProject {
  gid: string
  name: string
  notes?: string
  color?: string
  archived: boolean
  workspace: {
    gid: string
    name: string
  }
}

export interface AsanaWorkspace {
  gid: string
  name: string
}

export interface AsanaUser {
  gid: string
  name: string
  email: string
}

const ASANA_BASE_URL = 'https://app.asana.com/api/1.0'

// Create headers for Asana API
function getAsanaHeaders(token?: string): HeadersInit {
  const accessToken = token || process.env.ASANA_ACCESS_TOKEN
  if (!accessToken) {
    throw new Error('ASANA_ACCESS_TOKEN is not configured')
  }
  return {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  }
}

// Generic Asana API request
async function asanaRequest<T>(
  endpoint: string,
  token?: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${ASANA_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...getAsanaHeaders(token),
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.errors?.[0]?.message || `Asana API error: ${response.status}`)
  }

  const data = await response.json()
  return data.data as T
}

// Get current user
export async function getCurrentUser(token?: string): Promise<AsanaUser> {
  return asanaRequest<AsanaUser>('/users/me', token)
}

// Get all workspaces
export async function getWorkspaces(token?: string): Promise<AsanaWorkspace[]> {
  return asanaRequest<AsanaWorkspace[]>('/workspaces', token)
}

// Get all projects in a workspace
export async function getProjects(workspaceGid: string, token?: string): Promise<AsanaProject[]> {
  return asanaRequest<AsanaProject[]>(
    `/workspaces/${workspaceGid}/projects?opt_fields=name,notes,color,archived,workspace.name`,
    token
  )
}

// Get tasks assigned to a user
export async function getMyTasks(
  workspaceGid: string,
  token?: string,
  options: {
    completedSince?: string
    modifiedSince?: string
  } = {}
): Promise<AsanaTask[]> {
  const params = new URLSearchParams({
    opt_fields: 'name,notes,completed,due_on,due_at,assignee.name,assignee.email,projects.name,tags.name,custom_fields.name,custom_fields.display_value,permalink_url,created_at,modified_at',
  })

  if (options.completedSince) {
    params.set('completed_since', options.completedSince)
  }

  const user = await getCurrentUser(token)
  
  return asanaRequest<AsanaTask[]>(
    `/workspaces/${workspaceGid}/tasks?assignee=${user.gid}&${params.toString()}`,
    token
  )
}

// Get tasks from a project
export async function getProjectTasks(projectGid: string, token?: string): Promise<AsanaTask[]> {
  return asanaRequest<AsanaTask[]>(
    `/projects/${projectGid}/tasks?opt_fields=name,notes,completed,due_on,due_at,assignee.name,assignee.email,projects.name,tags.name,permalink_url,created_at,modified_at`,
    token
  )
}

// Get a specific task
export async function getTask(taskGid: string, token?: string): Promise<AsanaTask> {
  return asanaRequest<AsanaTask>(
    `/tasks/${taskGid}?opt_fields=name,notes,completed,due_on,due_at,assignee.name,assignee.email,projects.name,tags.name,custom_fields.name,custom_fields.display_value,permalink_url,created_at,modified_at`,
    token
  )
}

// Search tasks
export async function searchTasks(
  workspaceGid: string,
  query: string,
  token?: string
): Promise<AsanaTask[]> {
  return asanaRequest<AsanaTask[]>(
    `/workspaces/${workspaceGid}/tasks/search?text=${encodeURIComponent(query)}&opt_fields=name,notes,completed,due_on,assignee.name,projects.name,permalink_url`,
    token
  )
}

// Determine task urgency based on due date and other factors
function calculateTaskUrgency(task: AsanaTask): { urgency: 'high' | 'medium' | 'low'; score: number } {
  let score = 50 // Base score
  
  const now = new Date()
  const dueDate = task.due_on ? new Date(task.due_on) : task.due_at ? new Date(task.due_at) : null

  if (dueDate) {
    const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilDue < 0) {
      // Overdue!
      score += 40
    } else if (daysUntilDue === 0) {
      // Due today
      score += 35
    } else if (daysUntilDue === 1) {
      // Due tomorrow
      score += 25
    } else if (daysUntilDue <= 3) {
      // Due within 3 days
      score += 15
    } else if (daysUntilDue <= 7) {
      // Due within a week
      score += 5
    }
  }

  // Check for urgency keywords in name or notes
  const text = `${task.name} ${task.notes}`.toLowerCase()
  if (text.includes('urgent') || text.includes('asap') || text.includes('critical')) {
    score += 20
  }
  if (text.includes('blocker') || text.includes('blocked')) {
    score += 15
  }

  // Check tags for priority
  for (const tag of task.tags || []) {
    const tagName = tag.name.toLowerCase()
    if (tagName.includes('high') || tagName.includes('urgent') || tagName.includes('p0') || tagName.includes('p1')) {
      score += 15
    } else if (tagName.includes('medium') || tagName.includes('p2')) {
      score += 5
    }
  }

  // Cap at 100
  score = Math.min(score, 100)

  // Determine urgency level
  let urgency: 'high' | 'medium' | 'low'
  if (score >= 75) {
    urgency = 'high'
  } else if (score >= 45) {
    urgency = 'medium'
  } else {
    urgency = 'low'
  }

  return { urgency, score }
}

// Convert Asana task to our WorkItem format
export function taskToWorkItem(task: AsanaTask, userId: string) {
  const { urgency, score } = calculateTaskUrgency(task)

  // Determine if task should be surfaced
  const isSurfaced = !task.completed && (urgency === 'high' || urgency === 'medium')
  
  // Generate surface reason
  let surfaceReason: string | null = null
  if (isSurfaced) {
    const dueDate = task.due_on ? new Date(task.due_on) : null
    if (dueDate) {
      const now = new Date()
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysUntilDue < 0) {
        surfaceReason = `OVERDUE by ${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) > 1 ? 's' : ''}`
      } else if (daysUntilDue === 0) {
        surfaceReason = 'Due TODAY'
      } else if (daysUntilDue === 1) {
        surfaceReason = 'Due TOMORROW'
      } else {
        surfaceReason = `Due in ${daysUntilDue} days`
      }
    } else if (urgency === 'high') {
      surfaceReason = 'High priority task'
    }
  }

  return {
    id: `asana-${task.gid}`,
    user_id: userId,
    source: 'asana' as const,
    source_id: task.gid,
    title: task.name,
    description: task.notes || null,
    status: task.completed ? 'completed' : 'open',
    due_date: task.due_on || task.due_at || null,
    assignee: task.assignee?.name || null,
    project: task.projects?.[0]?.name || null,
    url: task.permalink_url,
    urgency,
    is_blocked: task.name.toLowerCase().includes('blocked') || task.notes?.toLowerCase().includes('blocked') || false,
    is_surfaced: isSurfaced,
    surface_reason: surfaceReason,
    raw_data: {
      priority_score: score,
      tags: task.tags?.map(t => t.name),
      custom_fields: task.custom_fields,
      projects: task.projects?.map(p => p.name),
    },
    synced_at: new Date().toISOString(),
    created_at: task.created_at,
  }
}

// Test Asana connection
export async function testAsanaConnection(token?: string): Promise<{
  success: boolean
  user?: string
  email?: string
  workspaces?: string[]
  error?: string
}> {
  try {
    const user = await getCurrentUser(token)
    const workspaces = await getWorkspaces(token)
    
    return {
      success: true,
      user: user.name,
      email: user.email,
      workspaces: workspaces.map(w => w.name),
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Get all tasks for the current user across all workspaces
export async function getAllMyTasks(token?: string): Promise<AsanaTask[]> {
  const workspaces = await getWorkspaces(token)
  const allTasks: AsanaTask[] = []

  for (const workspace of workspaces) {
    try {
      const tasks = await getMyTasks(workspace.gid, token, {
        completedSince: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Last 7 days
      })
      allTasks.push(...tasks)
    } catch (error) {
      console.warn(`Could not fetch tasks from workspace ${workspace.name}:`, error)
    }
  }

  return allTasks
}
