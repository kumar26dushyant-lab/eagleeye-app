// Integration Manager - Unified Integration Layer
// Central hub for all integrations

import type { 
  IntegrationSource, 
  IntegrationHealth, 
  UnifiedSignal, 
  CoverageAssessment,
  ConnectionProgress,
  IntegrationAdapter
} from './types'
import { SlackAdapter } from './adapters/slack'
import { AsanaAdapter } from './adapters/asana'

// Recommended tools by category
const COMMUNICATION_TOOLS: IntegrationSource[] = ['slack', 'teams']
const TASK_TOOLS: IntegrationSource[] = ['asana', 'linear', 'clickup', 'jira', 'notion']

export class IntegrationManager {
  private adapters: Map<IntegrationSource, IntegrationAdapter> = new Map()
  private healthCache: Map<IntegrationSource, IntegrationHealth> = new Map()
  private signalCache: Map<IntegrationSource, UnifiedSignal[]> = new Map()
  
  /**
   * Initialize integration from environment variables
   * This is the "one-click" setup for founders using env tokens
   */
  static fromEnv(): IntegrationManager {
    const manager = new IntegrationManager()
    
    // Auto-detect Slack
    if (process.env.SLACK_BOT_TOKEN) {
      manager.addSlack(process.env.SLACK_BOT_TOKEN)
    }
    
    // Auto-detect Asana
    if (process.env.ASANA_ACCESS_TOKEN) {
      manager.addAsana(process.env.ASANA_ACCESS_TOKEN)
    }
    
    // TODO: Add Linear when implemented
    // if (process.env.LINEAR_API_KEY) { ... }
    
    return manager
  }

  addSlack(token: string): void {
    this.adapters.set('slack', new SlackAdapter(token))
  }

  addAsana(token: string): void {
    this.adapters.set('asana', new AsanaAdapter(token))
  }

  /**
   * Get a specific adapter by source
   */
  getAdapter(source: IntegrationSource): IntegrationAdapter | undefined {
    return this.adapters.get(source)
  }

  /**
   * Get health status of all integrations
   */
  async getHealth(): Promise<Map<IntegrationSource, IntegrationHealth>> {
    const checks = Array.from(this.adapters.entries()).map(async ([source, adapter]) => {
      try {
        const health = await adapter.checkHealth()
        this.healthCache.set(source, health)
        return [source, health] as const
      } catch (error) {
        const health: IntegrationHealth = {
          source,
          connected: false,
          status: 'error',
          lastSyncError: error instanceof Error ? error.message : 'Unknown error',
        }
        this.healthCache.set(source, health)
        return [source, health] as const
      }
    })

    const results = await Promise.all(checks)
    return new Map(results)
  }

  /**
   * Fetch all signals from all connected integrations
   * Returns NORMALIZED UnifiedSignals
   */
  async fetchAllSignals(since?: Date): Promise<UnifiedSignal[]> {
    const allSignals: UnifiedSignal[] = []
    
    for (const [source, adapter] of this.adapters) {
      try {
        const signals = await adapter.fetchSignals(since)
        this.signalCache.set(source, signals)
        allSignals.push(...signals)
      } catch (error) {
        console.error(`[IntegrationManager] Failed to fetch ${source}:`, error)
      }
    }

    // Sort by timestamp descending
    return allSignals.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  }

  /**
   * Assess coverage - tells founders how much visibility they have
   */
  assessCoverage(): CoverageAssessment {
    const connectedTools = Array.from(this.adapters.keys())
    const connectedComms = connectedTools.filter(t => COMMUNICATION_TOOLS.includes(t))
    const connectedTasks = connectedTools.filter(t => TASK_TOOLS.includes(t))
    
    const commCoverage = (connectedComms.length / COMMUNICATION_TOOLS.length) * 100
    const taskCoverage = (connectedTasks.length / TASK_TOOLS.length) * 100
    const overallPercentage = Math.round((commCoverage * 0.4 + taskCoverage * 0.6))

    // Determine missing tools (most impactful first)
    const missingTools: IntegrationSource[] = []
    if (!connectedTools.includes('slack')) missingTools.push('slack')
    if (!connectedTools.includes('asana')) missingTools.push('asana')
    if (!connectedTools.includes('linear')) missingTools.push('linear')
    if (!connectedTools.includes('teams')) missingTools.push('teams')

    // Build user-friendly message
    let message: string
    let overall: CoverageAssessment['overall']

    if (overallPercentage >= 70) {
      overall = 'high'
      message = "Great coverage! EagleEye can see most of your team's work."
    } else if (overallPercentage >= 40) {
      overall = 'medium'
      message = connectedComms.length > 0 
        ? "Good start! Connect a task manager for better deadline tracking."
        : "Connect Slack or Teams to catch team discussions."
    } else if (connectedTools.length > 0) {
      overall = 'low'
      message = "Limited coverage. Connect more tools to improve signal detection."
    } else {
      overall = 'low'
      message = "No tools connected yet. Connect your workspace to get started."
    }

    return {
      overall,
      percentage: overallPercentage,
      communicationCoverage: Math.round(commCoverage),
      taskCoverage: Math.round(taskCoverage),
      connectedTools,
      missingTools: missingTools.slice(0, 3), // Top 3 recommendations
      message,
    }
  }

  /**
   * Get list of connected sources
   */
  getConnectedSources(): IntegrationSource[] {
    return Array.from(this.adapters.keys())
  }

  /**
   * Check if any integration is connected
   */
  hasAnyIntegration(): boolean {
    return this.adapters.size > 0
  }
}

// Export singleton for server-side use
let _manager: IntegrationManager | null = null

export function getIntegrationManager(): IntegrationManager {
  if (!_manager) {
    _manager = IntegrationManager.fromEnv()
  }
  return _manager
}

// Re-export types
export type { UnifiedSignal, IntegrationHealth, CoverageAssessment, ConnectionProgress }
