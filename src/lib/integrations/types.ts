// Unified Integration Layer (UIL) - Core Types
// All integrations normalize to this shape

export type IntegrationSource = 'slack' | 'asana' | 'linear' | 'clickup' | 'jira' | 'notion' | 'github' | 'teams'

export type SignalCategory = 
  | 'commitment'      // Someone committed to do something
  | 'deadline'        // A deadline is approaching/missed
  | 'mention'         // Direct @mention
  | 'question'        // Someone asked a question
  | 'blocker'         // Something is blocked/stuck
  | 'decision'        // Approval/decision needed
  | 'escalation'      // Issue escalated
  | 'update'          // Status update / FYI

export type ConfidenceLevel = 'high' | 'medium' | 'low'

/**
 * UNIFIED SIGNAL INTERFACE
 * Every integration MUST output this exact shape.
 * The core EagleEye logic never sees raw API responses.
 */
export interface UnifiedSignal {
  // Identity
  id: string                           // Unique ID (source-prefixed)
  source: IntegrationSource            // Which tool this came from
  sourceId: string                     // Original ID in source system
  
  // Classification
  category: SignalCategory             // Normalized signal type
  confidence: number                   // 0-1 how confident we are in classification
  
  // Core content
  title: string                        // Short summary (max 100 chars)
  snippet: string                      // Relevant text excerpt (max 300 chars)
  fullContext?: string                 // Full text if available
  
  // People
  owner?: string                       // Who is responsible
  ownerEmail?: string                  // Email for cross-tool matching
  sender?: string                      // Who sent/created this
  senderEmail?: string                 // Sender's email
  
  // Timing
  timestamp: string                    // ISO timestamp when created
  deadline?: string                    // ISO timestamp if deadline exists
  
  // Navigation
  url: string                          // Direct link to open in source tool
  channel?: string                     // Channel/project/board name
  
  // Metadata
  metadata: Record<string, unknown>    // Source-specific data (for debugging)
}

/**
 * INTEGRATION HEALTH STATUS
 * Track each integration's connection status
 */
export interface IntegrationHealth {
  source: IntegrationSource
  connected: boolean
  status: 'healthy' | 'degraded' | 'error' | 'not_configured'
  
  // Connection details
  workspaceName?: string
  workspaceId?: string
  connectedAt?: string
  
  // Sync status
  lastSyncAt?: string
  lastSyncSuccess?: boolean
  lastSyncError?: string
  signalCount?: number
  
  // Permissions
  scopes?: string[]
  missingScopes?: string[]
  
  // Token health
  tokenExpiresAt?: string
  needsReauth?: boolean
}

/**
 * COVERAGE ASSESSMENT
 * Tell founders how much visibility they have
 */
export interface CoverageAssessment {
  overall: ConfidenceLevel              // High/Medium/Low coverage
  percentage: number                    // 0-100 estimated coverage
  
  // Breakdown
  communicationCoverage: number         // % of comms tools connected
  taskCoverage: number                  // % of task tools connected
  
  // Specific feedback
  connectedTools: IntegrationSource[]
  missingTools: IntegrationSource[]     // Recommended to connect
  
  // User-friendly message
  message: string
}

/**
 * INTEGRATION ADAPTER INTERFACE
 * Every integration must implement this
 */
export interface IntegrationAdapter {
  source: IntegrationSource
  
  // Health check
  checkHealth(): Promise<IntegrationHealth>
  
  // Fetch signals (normalized)
  fetchSignals(since?: Date): Promise<UnifiedSignal[]>
  
  // OAuth flow (if applicable)
  getAuthUrl?(redirectUri: string): string
  handleCallback?(code: string): Promise<{ accessToken: string; refreshToken?: string }>
  refreshToken?(refreshToken: string): Promise<string>
}

/**
 * CONNECTION PROGRESS
 * For sequential OAuth flow UI
 */
export interface ConnectionProgress {
  currentTool: IntegrationSource | null
  completedTools: IntegrationSource[]
  failedTools: { source: IntegrationSource; error: string }[]
  status: 'idle' | 'connecting' | 'complete' | 'error'
}
