// Jira Integration Library
// Handles OAuth flow and data sync for Jira issues

interface JiraIssue {
  id: string
  key: string
  self: string
  fields: {
    summary: string
    description: string | null
    status: {
      name: string
      statusCategory: {
        key: string
        name: string
      }
    }
    priority: {
      id: string
      name: string
    } | null
    assignee: {
      accountId: string
      displayName: string
      emailAddress: string
    } | null
    reporter: {
      accountId: string
      displayName: string
      emailAddress: string
    }
    project: {
      id: string
      key: string
      name: string
    }
    created: string
    updated: string
    duedate: string | null
    labels: string[]
    issuetype: {
      name: string
      subtask: boolean
    }
  }
}

interface JiraCloud {
  id: string
  name: string
  url: string
  scopes: string[]
  avatarUrl: string
}

export async function getJiraCloudId(accessToken: string): Promise<JiraCloud[]> {
  const response = await fetch('https://api.atlassian.com/oauth/token/accessible-resources', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch Jira cloud resources')
  }

  return response.json()
}

export async function getJiraIssues(
  accessToken: string,
  cloudId: string
): Promise<JiraIssue[]> {
  // JQL query for issues assigned to current user or watching, not done
  const jql = encodeURIComponent(
    'assignee = currentUser() AND statusCategory != Done ORDER BY updated DESC'
  )
  
  const response = await fetch(
    `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/search?jql=${jql}&maxResults=100&fields=summary,description,status,priority,assignee,reporter,project,created,updated,duedate,labels,issuetype`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    }
  )

  if (!response.ok) {
    throw new Error('Failed to fetch Jira issues')
  }

  const data = await response.json()
  return data.issues
}

export async function getJiraWatchedIssues(
  accessToken: string,
  cloudId: string
): Promise<JiraIssue[]> {
  const jql = encodeURIComponent(
    'watcher = currentUser() AND statusCategory != Done ORDER BY updated DESC'
  )
  
  const response = await fetch(
    `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/search?jql=${jql}&maxResults=50&fields=summary,description,status,priority,assignee,reporter,project,created,updated,duedate,labels,issuetype`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    }
  )

  if (!response.ok) {
    return [] // Watching might not be available
  }

  const data = await response.json()
  return data.issues
}

export function normalizeJiraIssue(issue: JiraIssue, cloudUrl: string) {
  const now = new Date()
  const dueDate = issue.fields.duedate ? new Date(issue.fields.duedate) : null
  
  let urgency: 'high' | 'medium' | 'low' = 'low'
  
  // Check if overdue or due soon
  if (dueDate) {
    const daysUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    if (daysUntilDue < 0) {
      urgency = 'high' // Overdue
    } else if (daysUntilDue <= 2) {
      urgency = 'high'
    } else if (daysUntilDue <= 7) {
      urgency = 'medium'
    }
  }

  // Check priority
  if (issue.fields.priority) {
    const priorityName = issue.fields.priority.name.toLowerCase()
    if (priorityName === 'highest' || priorityName === 'high' || priorityName === 'blocker' || priorityName === 'critical') {
      urgency = 'high'
    } else if ((priorityName === 'medium' || priorityName === 'normal') && urgency === 'low') {
      urgency = 'medium'
    }
  }

  // Check status for blocked items
  const statusLower = issue.fields.status.name.toLowerCase()
  const isBlocked = statusLower.includes('block') || 
                    statusLower.includes('impediment') ||
                    issue.fields.labels.some(l => l.toLowerCase().includes('blocked'))

  return {
    id: issue.id,
    key: issue.key,
    source: 'jira' as const,
    title: issue.fields.summary,
    description: issue.fields.description,
    status: issue.fields.status.name,
    statusCategory: issue.fields.status.statusCategory.key,
    due_date: issue.fields.duedate,
    assignee: issue.fields.assignee?.displayName || null,
    project: issue.fields.project.name,
    projectKey: issue.fields.project.key,
    url: `${cloudUrl}/browse/${issue.key}`,
    urgency,
    is_blocked: isBlocked,
    priority: issue.fields.priority?.name || null,
    issueType: issue.fields.issuetype.name,
    labels: issue.fields.labels,
    created_at: issue.fields.created,
    updated_at: issue.fields.updated,
  }
}
