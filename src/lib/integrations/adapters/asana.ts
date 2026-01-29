// Asana Integration Adapter
// Normalizes Asana data to UnifiedSignal format

import type { 
  IntegrationAdapter, 
  IntegrationHealth, 
  UnifiedSignal, 
  SignalCategory 
} from '../types'

// Asana API base URL
const ASANA_API = 'https://app.asana.com/api/1.0'

// Required scopes (READ-ONLY)
export const ASANA_REQUIRED_SCOPES = [
  'default', // Basic read access to user's tasks and projects
] as const

interface AsanaTask {
  gid: string
  name: string
  notes: string
  completed: boolean
  due_on: string | null
  due_at: string | null
  assignee: { gid: string; name: string; email?: string } | null
  projects: Array<{ gid: string; name: string }>
  tags: Array<{ gid: string; name: string }>
  permalink_url: string
  created_at: string
  modified_at: string
}

interface AsanaUser {
  gid: string
  name: string
  email: string
}

export class AsanaAdapter implements IntegrationAdapter {
  source = 'asana' as const
  private token: string
  private userCache: Map<string, AsanaUser> = new Map()

  constructor(token: string) {
    this.token = token
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${ASANA_API}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.errors?.[0]?.message || `Asana API error: ${response.status}`)
    }

    const data = await response.json()
    return data.data as T
  }

  async checkHealth(): Promise<IntegrationHealth> {
    try {
      // Get current user to verify token
      const user = await this.request<AsanaUser>('/users/me')
      
      // Get workspaces
      const workspaces = await this.request<Array<{ gid: string; name: string }>>('/workspaces')

      return {
        source: 'asana',
        connected: true,
        status: 'healthy',
        workspaceName: workspaces[0]?.name || 'Unknown',
        workspaceId: workspaces[0]?.gid,
        connectedAt: new Date().toISOString(),
        lastSyncAt: new Date().toISOString(),
        lastSyncSuccess: true,
        signalCount: 0, // Will be updated after first fetch
        scopes: ['default'],
        needsReauth: false,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return {
        source: 'asana',
        connected: false,
        status: 'error',
        lastSyncSuccess: false,
        lastSyncError: message,
        needsReauth: message.includes('401') || message.includes('unauthorized'),
      }
    }
  }

  async fetchSignals(since?: Date): Promise<UnifiedSignal[]> {
    const signals: UnifiedSignal[] = []

    try {
      // For task management, we want ALL incomplete tasks assigned to user
      // (not filtered by time - overdue tasks are critical!)
      const tasks = await this.fetchMyTasks()
      
      for (const task of tasks) {
        const signal = this.taskToSignal(task)
        if (signal) {
          // For overdue tasks, boost their confidence and mark as deadline
          if (task.due_on && new Date(task.due_on) < new Date()) {
            signal.confidence = Math.min(1, signal.confidence + 0.3)
            signal.category = 'deadline' // Overdue = deadline category
          }
          signals.push(signal)
        }
      }
    } catch (error) {
      console.error('[Asana] Failed to fetch signals:', error)
    }

    // Sort by modification date descending
    return signals.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  }

  private async fetchMyTasks(since?: Date): Promise<AsanaTask[]> {
    try {
      // Get current user
      const user = await this.request<AsanaUser>('/users/me')
      
      // Get user's workspaces
      const workspaces = await this.request<Array<{ gid: string }>>('/workspaces')
      if (!workspaces.length) return []

      const workspace = workspaces[0]
      
      // Fetch tasks assigned to user
      const params = new URLSearchParams({
        workspace: workspace.gid,
        assignee: user.gid,
        completed_since: since?.toISOString() || 'now',
        opt_fields: 'gid,name,notes,completed,due_on,due_at,assignee,assignee.name,assignee.email,projects,projects.gid,projects.name,tags,tags.name,permalink_url,created_at,modified_at',
      })

      return await this.request<AsanaTask[]>(`/tasks?${params}`)
    } catch (error) {
      console.error('[Asana] Failed to fetch my tasks:', error)
      return []
    }
  }

  private async fetchRecentTasks(since?: Date): Promise<AsanaTask[]> {
    try {
      // Get current user and workspaces
      const user = await this.request<AsanaUser>('/users/me')
      const workspaces = await this.request<Array<{ gid: string }>>('/workspaces')
      if (!workspaces.length) return []

      const workspace = workspaces[0]
      
      // Asana API requires assignee when querying by workspace
      // Fetch tasks where user is a collaborator (uses user_task_list)
      const modifiedSince = since || new Date(Date.now() - 24 * 60 * 60 * 1000)
      
      // Use search API for broader results
      const params = new URLSearchParams({
        workspace: workspace.gid,
        assignee: user.gid,
        'modified_at.after': modifiedSince.toISOString(),
        opt_fields: 'gid,name,notes,completed,due_on,due_at,assignee,assignee.name,assignee.email,projects,projects.gid,projects.name,tags,tags.name,permalink_url,created_at,modified_at',
      })

      return await this.request<AsanaTask[]>(`/tasks?${params}`)
    } catch (error) {
      console.error('[Asana] Failed to fetch recent tasks:', error)
      return []
    }
  }

  /**
   * Convert Asana task to UnifiedSignal
   */
  private taskToSignal(task: AsanaTask): UnifiedSignal | null {
    // Skip completed tasks (unless they were completed today - potential commitment)
    if (task.completed) {
      return null
    }

    const { category, confidence } = this.classifyTask(task)
    
    return {
      id: `asana-${task.gid}`,
      source: 'asana',
      sourceId: task.gid,
      
      category,
      confidence,
      
      title: task.name,
      snippet: task.notes?.slice(0, 300) || task.name,
      fullContext: task.notes,
      
      owner: task.assignee?.name,
      ownerEmail: task.assignee?.email,
      
      timestamp: task.modified_at,
      deadline: task.due_on || task.due_at || undefined,
      
      // Use the simple URL format that works for all Asana tiers (including free)
      // Format: https://app.asana.com/0/PROJECT_GID/TASK_GID
      url: task.projects[0]?.gid 
        ? `https://app.asana.com/0/${task.projects[0].gid}/${task.gid}`
        : `https://app.asana.com/0/0/${task.gid}`, // Fallback for tasks without project
      channel: task.projects[0]?.name || 'No Project',
      
      metadata: {
        projects: task.projects.map(p => p.name),
        tags: task.tags.map(t => t.name),
        completed: task.completed,
      },
    }
  }

  /**
   * Classify task into signal category
   */
  private classifyTask(task: AsanaTask): { category: SignalCategory; confidence: number } {
    const name = task.name.toLowerCase()
    const notes = (task.notes || '').toLowerCase()
    const tags = task.tags.map(t => t.name.toLowerCase())

    // Check for blockers
    if (name.includes('blocked') || name.includes('stuck') || 
        tags.includes('blocked') || tags.includes('blocker')) {
      return { category: 'blocker', confidence: 0.9 }
    }

    // Check for deadlines
    if (task.due_on || task.due_at) {
      const dueDate = new Date(task.due_on || task.due_at!)
      const now = new Date()
      const daysUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      
      if (daysUntilDue < 0) {
        return { category: 'deadline', confidence: 0.95 } // Overdue!
      }
      if (daysUntilDue <= 1) {
        return { category: 'deadline', confidence: 0.85 } // Due today/tomorrow
      }
      if (daysUntilDue <= 3) {
        return { category: 'deadline', confidence: 0.7 }
      }
    }

    // Check for decisions/approvals
    if (name.includes('review') || name.includes('approve') || 
        name.includes('decision') || name.includes('sign off')) {
      return { category: 'decision', confidence: 0.8 }
    }

    // Check for questions
    if (name.includes('?') || notes.includes('?')) {
      return { category: 'question', confidence: 0.7 }
    }

    // Check for urgent tags
    if (tags.includes('urgent') || tags.includes('high priority') || 
        name.includes('urgent') || name.includes('asap')) {
      return { category: 'escalation', confidence: 0.8 }
    }

    // Default to update
    return { category: 'update', confidence: 0.5 }
  }

  // OAuth helpers
  static getAuthUrl(clientId: string, redirectUri: string, state: string): string {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      state,
    })
    return `https://app.asana.com/-/oauth_authorize?${params}`
  }

  static async handleCallback(
    code: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string
  ): Promise<{ accessToken: string; refreshToken?: string }> {
    const response = await fetch('https://app.asana.com/-/oauth_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code,
      }),
    })

    const data = await response.json()
    if (data.error) {
      throw new Error(data.error_description || data.error)
    }

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    }
  }
}
