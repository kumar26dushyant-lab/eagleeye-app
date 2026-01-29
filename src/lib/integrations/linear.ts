// Linear API Integration (GraphQL)
// Docs: https://developers.linear.app/docs

export interface LinearIssue {
  id: string
  identifier: string // e.g., "ENG-123"
  title: string
  description: string | null
  state: {
    id: string
    name: string
    type: string // 'backlog' | 'unstarted' | 'started' | 'completed' | 'canceled'
  }
  priority: number // 0 = No priority, 1 = Urgent, 2 = High, 3 = Normal, 4 = Low
  priorityLabel: string
  dueDate: string | null
  assignee: {
    id: string
    name: string
    email: string
  } | null
  project: {
    id: string
    name: string
  } | null
  team: {
    id: string
    name: string
    key: string
  }
  labels: Array<{
    id: string
    name: string
    color: string
  }>
  url: string
  createdAt: string
  updatedAt: string
}

export interface LinearTeam {
  id: string
  name: string
  key: string
}

export interface LinearUser {
  id: string
  name: string
  email: string
}

const LINEAR_API_URL = 'https://api.linear.app/graphql'

// Make GraphQL request to Linear
async function linearRequest<T>(
  query: string,
  variables: Record<string, unknown> = {},
  token?: string
): Promise<T> {
  const apiKey = token || process.env.LINEAR_API_KEY
  if (!apiKey) {
    throw new Error('LINEAR_API_KEY is not configured')
  }

  const response = await fetch(LINEAR_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  })

  if (!response.ok) {
    throw new Error(`Linear API error: ${response.status}`)
  }

  const result = await response.json()
  
  if (result.errors) {
    throw new Error(result.errors[0]?.message || 'Linear API error')
  }

  return result.data as T
}

// Get current user
export async function getCurrentLinearUser(token?: string): Promise<LinearUser> {
  const query = `
    query Me {
      viewer {
        id
        name
        email
      }
    }
  `
  const data = await linearRequest<{ viewer: LinearUser }>(query, {}, token)
  return data.viewer
}

// Get all teams
export async function getLinearTeams(token?: string): Promise<LinearTeam[]> {
  const query = `
    query Teams {
      teams {
        nodes {
          id
          name
          key
        }
      }
    }
  `
  const data = await linearRequest<{ teams: { nodes: LinearTeam[] } }>(query, {}, token)
  return data.teams.nodes
}

// Get issues assigned to current user
export async function getMyLinearIssues(token?: string): Promise<LinearIssue[]> {
  const query = `
    query MyIssues {
      viewer {
        assignedIssues(
          filter: {
            state: { type: { nin: ["completed", "canceled"] } }
          }
          orderBy: updatedAt
          first: 50
        ) {
          nodes {
            id
            identifier
            title
            description
            state {
              id
              name
              type
            }
            priority
            priorityLabel
            dueDate
            assignee {
              id
              name
              email
            }
            project {
              id
              name
            }
            team {
              id
              name
              key
            }
            labels {
              nodes {
                id
                name
                color
              }
            }
            url
            createdAt
            updatedAt
          }
        }
      }
    }
  `
  
  const data = await linearRequest<{
    viewer: {
      assignedIssues: {
        nodes: Array<Omit<LinearIssue, 'labels'> & { labels: { nodes: LinearIssue['labels'] } }>
      }
    }
  }>(query, {}, token)

  // Flatten labels
  return data.viewer.assignedIssues.nodes.map(issue => ({
    ...issue,
    labels: issue.labels.nodes,
  }))
}

// Get issues by team
export async function getTeamIssues(teamId: string, token?: string): Promise<LinearIssue[]> {
  const query = `
    query TeamIssues($teamId: String!) {
      team(id: $teamId) {
        issues(
          filter: {
            state: { type: { nin: ["completed", "canceled"] } }
          }
          orderBy: updatedAt
          first: 50
        ) {
          nodes {
            id
            identifier
            title
            description
            state {
              id
              name
              type
            }
            priority
            priorityLabel
            dueDate
            assignee {
              id
              name
              email
            }
            project {
              id
              name
            }
            team {
              id
              name
              key
            }
            labels {
              nodes {
                id
                name
                color
              }
            }
            url
            createdAt
            updatedAt
          }
        }
      }
    }
  `
  
  const data = await linearRequest<{
    team: {
      issues: {
        nodes: Array<Omit<LinearIssue, 'labels'> & { labels: { nodes: LinearIssue['labels'] } }>
      }
    }
  }>(query, { teamId }, token)

  return data.team.issues.nodes.map(issue => ({
    ...issue,
    labels: issue.labels.nodes,
  }))
}

// Calculate urgency from Linear issue
function calculateLinearUrgency(issue: LinearIssue): { urgency: 'high' | 'medium' | 'low'; score: number } {
  let score = 50

  // Priority is the main factor (1=Urgent, 2=High, 3=Normal, 4=Low, 0=None)
  switch (issue.priority) {
    case 1: // Urgent
      score += 40
      break
    case 2: // High
      score += 25
      break
    case 3: // Normal
      score += 10
      break
    case 4: // Low
      score -= 10
      break
  }

  // Due date factor
  if (issue.dueDate) {
    const now = new Date()
    const dueDate = new Date(issue.dueDate)
    const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilDue < 0) {
      score += 30 // Overdue
    } else if (daysUntilDue === 0) {
      score += 25 // Due today
    } else if (daysUntilDue <= 2) {
      score += 15
    } else if (daysUntilDue <= 7) {
      score += 5
    }
  }

  // State factor
  if (issue.state.type === 'started') {
    score += 10 // In progress items are more relevant
  }

  // Check labels for urgency indicators
  for (const label of issue.labels) {
    const labelName = label.name.toLowerCase()
    if (labelName.includes('urgent') || labelName.includes('critical') || labelName.includes('blocker')) {
      score += 15
    }
  }

  score = Math.min(Math.max(score, 0), 100)

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

// Convert Linear issue to WorkItem format
export function linearIssueToWorkItem(issue: LinearIssue, userId: string) {
  const { urgency, score } = calculateLinearUrgency(issue)
  
  const isBlocked = issue.labels.some(l => 
    l.name.toLowerCase().includes('blocked') || l.name.toLowerCase().includes('blocker')
  )

  const isSurfaced = urgency === 'high' || urgency === 'medium'
  
  let surfaceReason: string | null = null
  if (isSurfaced) {
    if (issue.dueDate) {
      const now = new Date()
      const dueDate = new Date(issue.dueDate)
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysUntilDue < 0) {
        surfaceReason = `OVERDUE by ${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) > 1 ? 's' : ''}`
      } else if (daysUntilDue === 0) {
        surfaceReason = 'Due TODAY'
      } else if (daysUntilDue <= 2) {
        surfaceReason = `Due in ${daysUntilDue} days`
      }
    }
    
    if (!surfaceReason && issue.priority <= 2) {
      surfaceReason = `${issue.priorityLabel} priority`
    }
  }

  // Map Linear state to our status
  let status: string
  switch (issue.state.type) {
    case 'started':
      status = 'in_progress'
      break
    case 'completed':
      status = 'completed'
      break
    case 'canceled':
      status = 'canceled'
      break
    default:
      status = 'open'
  }

  return {
    id: `linear-${issue.id}`,
    user_id: userId,
    source: 'jira' as const, // Using 'jira' as Linear is similar (issue tracker)
    source_id: issue.identifier,
    title: `${issue.identifier}: ${issue.title}`,
    description: issue.description,
    status,
    due_date: issue.dueDate,
    assignee: issue.assignee?.name || null,
    project: issue.project?.name || issue.team.name,
    url: issue.url,
    urgency,
    is_blocked: isBlocked,
    is_surfaced: isSurfaced,
    surface_reason: surfaceReason,
    raw_data: {
      priority_score: score,
      priority: issue.priority,
      priorityLabel: issue.priorityLabel,
      state: issue.state.name,
      team: issue.team.name,
      labels: issue.labels.map(l => l.name),
    },
    synced_at: new Date().toISOString(),
    created_at: issue.createdAt,
  }
}

// Test Linear connection
export async function testLinearConnection(token?: string): Promise<{
  success: boolean
  user?: string
  email?: string
  teams?: string[]
  error?: string
}> {
  try {
    const user = await getCurrentLinearUser(token)
    const teams = await getLinearTeams(token)
    
    return {
      success: true,
      user: user.name,
      email: user.email,
      teams: teams.map(t => t.name),
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
