// ClickUp Integration Library
// Handles OAuth flow and data sync for ClickUp tasks

interface ClickUpTask {
  id: string
  name: string
  description: string | null
  status: {
    status: string
    type: string
  }
  date_created: string
  date_updated: string
  due_date: string | null
  priority: {
    id: string
    priority: string
    color: string
  } | null
  assignees: Array<{
    id: number
    username: string
    email: string
  }>
  list: {
    id: string
    name: string
  }
  folder: {
    id: string
    name: string
  }
  space: {
    id: string
  }
  url: string
}

interface ClickUpWorkspace {
  id: string
  name: string
  color: string
  members: Array<{
    user: {
      id: number
      username: string
      email: string
    }
  }>
}

export async function getClickUpWorkspaces(accessToken: string): Promise<ClickUpWorkspace[]> {
  const response = await fetch('https://api.clickup.com/api/v2/team', {
    headers: {
      Authorization: accessToken,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch ClickUp workspaces')
  }

  const data = await response.json()
  return data.teams
}

export async function getClickUpTasks(
  accessToken: string,
  teamId: string
): Promise<ClickUpTask[]> {
  // Get spaces first
  const spacesResponse = await fetch(
    `https://api.clickup.com/api/v2/team/${teamId}/space?archived=false`,
    {
      headers: {
        Authorization: accessToken,
      },
    }
  )

  if (!spacesResponse.ok) {
    throw new Error('Failed to fetch ClickUp spaces')
  }

  const spacesData = await spacesResponse.json()
  const allTasks: ClickUpTask[] = []

  // For each space, get folders and lists
  for (const space of spacesData.spaces) {
    // Get folderless lists
    const listsResponse = await fetch(
      `https://api.clickup.com/api/v2/space/${space.id}/list?archived=false`,
      {
        headers: {
          Authorization: accessToken,
        },
      }
    )

    if (listsResponse.ok) {
      const listsData = await listsResponse.json()
      
      for (const list of listsData.lists) {
        const tasksResponse = await fetch(
          `https://api.clickup.com/api/v2/list/${list.id}/task?archived=false&include_closed=false&subtasks=true`,
          {
            headers: {
              Authorization: accessToken,
            },
          }
        )

        if (tasksResponse.ok) {
          const tasksData = await tasksResponse.json()
          allTasks.push(...tasksData.tasks)
        }
      }
    }

    // Get folders
    const foldersResponse = await fetch(
      `https://api.clickup.com/api/v2/space/${space.id}/folder?archived=false`,
      {
        headers: {
          Authorization: accessToken,
        },
      }
    )

    if (foldersResponse.ok) {
      const foldersData = await foldersResponse.json()
      
      for (const folder of foldersData.folders) {
        for (const list of folder.lists) {
          const tasksResponse = await fetch(
            `https://api.clickup.com/api/v2/list/${list.id}/task?archived=false&include_closed=false&subtasks=true`,
            {
              headers: {
                Authorization: accessToken,
              },
            }
          )

          if (tasksResponse.ok) {
            const tasksData = await tasksResponse.json()
            allTasks.push(...tasksData.tasks)
          }
        }
      }
    }
  }

  return allTasks
}

export function normalizeClickUpTask(task: ClickUpTask) {
  const now = Date.now()
  const dueDate = task.due_date ? parseInt(task.due_date) : null
  
  let urgency: 'high' | 'medium' | 'low' = 'low'
  
  // Check if overdue or due soon
  if (dueDate) {
    const daysUntilDue = (dueDate - now) / (1000 * 60 * 60 * 24)
    if (daysUntilDue < 0) {
      urgency = 'high' // Overdue
    } else if (daysUntilDue <= 2) {
      urgency = 'high'
    } else if (daysUntilDue <= 7) {
      urgency = 'medium'
    }
  }

  // Check priority
  if (task.priority) {
    if (task.priority.priority === 'urgent' || task.priority.priority === 'high') {
      urgency = 'high'
    } else if (task.priority.priority === 'normal' && urgency === 'low') {
      urgency = 'medium'
    }
  }

  // Check status for blocked items
  const statusLower = task.status.status.toLowerCase()
  const isBlocked = statusLower.includes('block') || statusLower.includes('wait')

  return {
    id: task.id,
    source: 'clickup' as const,
    title: task.name,
    description: task.description,
    status: task.status.status,
    due_date: dueDate ? new Date(dueDate).toISOString() : null,
    assignees: task.assignees.map(a => a.username),
    project: task.list.name,
    url: task.url,
    urgency,
    is_blocked: isBlocked,
    priority: task.priority?.priority || null,
    created_at: task.date_created,
    updated_at: task.date_updated,
  }
}
