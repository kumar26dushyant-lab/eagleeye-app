const ASANA_BASE_URL = 'https://app.asana.com/api/1.0'

export interface AsanaWorkspace {
  gid: string
  name: string
}

export interface AsanaProject {
  gid: string
  name: string
}

export interface AsanaTask {
  gid: string
  name: string
  assignee: {
    gid: string
    name: string
    email?: string
  } | null
  due_on: string | null
  completed: boolean
  modified_at: string
  permalink_url?: string
}

export function getAsanaAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: process.env.ASANA_CLIENT_ID!,
    redirect_uri: process.env.ASANA_REDIRECT_URI!,
    response_type: 'code',
  })
  return `https://app.asana.com/-/oauth_authorize?${params.toString()}`
}

export async function exchangeAsanaCode(code: string): Promise<{
  access_token: string
  refresh_token: string
}> {
  const response = await fetch('https://app.asana.com/-/oauth_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.ASANA_CLIENT_ID!,
      client_secret: process.env.ASANA_CLIENT_SECRET!,
      redirect_uri: process.env.ASANA_REDIRECT_URI!,
      code,
    }),
  })

  if (!response.ok) {
    throw new Error(`Asana token exchange failed: ${response.status}`)
  }

  return response.json()
}

export async function refreshAsanaToken(refreshToken: string): Promise<{
  access_token: string
  refresh_token: string
}> {
  const response = await fetch('https://app.asana.com/-/oauth_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: process.env.ASANA_CLIENT_ID!,
      client_secret: process.env.ASANA_CLIENT_SECRET!,
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    throw new Error(`Asana token refresh failed: ${response.status}`)
  }

  return response.json()
}

export async function getAsanaWorkspaces(accessToken: string): Promise<AsanaWorkspace[]> {
  const response = await fetch(`${ASANA_BASE_URL}/workspaces`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch workspaces: ${response.status}`)
  }

  const data = await response.json()
  return data.data
}

export async function getAsanaProjects(
  accessToken: string,
  workspaceGid: string
): Promise<AsanaProject[]> {
  const response = await fetch(`${ASANA_BASE_URL}/workspaces/${workspaceGid}/projects`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch projects: ${response.status}`)
  }

  const data = await response.json()
  return data.data
}

export async function getAsanaTasks(
  accessToken: string,
  projectGid: string
): Promise<AsanaTask[]> {
  const fields = 'name,assignee,assignee.name,assignee.email,due_on,completed,modified_at,permalink_url,notes,num_subtasks'
  const response = await fetch(
    `${ASANA_BASE_URL}/projects/${projectGid}/tasks?opt_fields=${fields}&completed_since=now`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch tasks: ${response.status}`)
  }

  const data = await response.json()
  return data.data
}

/**
 * Get task comments/stories - crucial for understanding context
 * Stories include comments, status changes, and other updates
 */
export async function getTaskComments(
  accessToken: string,
  taskGid: string
): Promise<Array<{ text: string; created_by: { name: string }; created_at: string }>> {
  const response = await fetch(
    `${ASANA_BASE_URL}/tasks/${taskGid}/stories?opt_fields=text,created_by.name,created_at,type`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    return []
  }

  const data = await response.json()
  // Filter to only comments (type: 'comment')
  return (data.data || []).filter((story: any) => story.type === 'comment')
}

/**
 * Get subtasks for a task
 */
export async function getSubtasks(
  accessToken: string,
  taskGid: string
): Promise<Array<{ gid: string; name: string; completed: boolean }>> {
  const response = await fetch(
    `${ASANA_BASE_URL}/tasks/${taskGid}/subtasks?opt_fields=name,completed`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    return []
  }

  const data = await response.json()
  return data.data || []
}

/**
 * Get full task details including description, comments, and subtasks
 */
export async function getTaskWithContext(
  accessToken: string,
  taskGid: string
): Promise<{
  task: AsanaTask & { notes?: string }
  comments: string[]
  subtasks: Array<{ name: string; completed: boolean }>
}> {
  const [taskRes, comments, subtasks] = await Promise.all([
    fetch(`${ASANA_BASE_URL}/tasks/${taskGid}?opt_fields=name,notes,assignee.name,due_on,completed,modified_at`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }).then(r => r.json()),
    getTaskComments(accessToken, taskGid),
    getSubtasks(accessToken, taskGid),
  ])

  return {
    task: taskRes.data,
    comments: comments.map(c => c.text),
    subtasks,
  }
}
