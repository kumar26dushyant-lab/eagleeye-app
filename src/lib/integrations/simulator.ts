// Integration Simulator - For testing without real APIs
// Creates realistic fake data that behaves like real integrations

import type { UnifiedSignal, IntegrationHealth, SignalCategory, IntegrationSource } from './types'

const SAMPLE_USERS = [
  { name: 'Sarah Chen', email: 'sarah@acme.co' },
  { name: 'Mike Johnson', email: 'mike@acme.co' },
  { name: 'Emma Wilson', email: 'emma@acme.co' },
  { name: 'Alex Kumar', email: 'alex@acme.co' },
  { name: 'Jordan Lee', email: 'jordan@acme.co' },
]

const SAMPLE_CHANNELS = ['#product', '#engineering', '#design', '#general', '#project-alpha']

const SIGNAL_TEMPLATES: { category: SignalCategory; templates: string[]; confidence: number }[] = [
  {
    category: 'blocker',
    confidence: 0.9,
    templates: [
      "Blocked on API integration - need credentials from DevOps to continue",
      "Can't proceed with deployment until security review is completed",
      "Stuck on the authentication flow - the OAuth callback is failing in production",
      "Database migration is blocked - waiting on DBA approval",
    ],
  },
  {
    category: 'decision',
    confidence: 0.85,
    templates: [
      "Need approval on the new pricing page design before we can ship tomorrow",
      "Decision needed: Should we go with AWS or GCP for the new microservice?",
      "Please sign off on the Q1 roadmap by EOD - the board meeting is Friday",
      "@founder need your input on the vendor contract - they need an answer today",
    ],
  },
  {
    category: 'commitment',
    confidence: 0.75,
    templates: [
      "@founder I'll have the MVP ready by Friday end of day",
      "Will push the fix to staging by noon and send you the test link",
      "I can take on the mobile redesign this sprint - will have mockups by Wednesday",
      "Committed to delivering the API documentation by end of week",
    ],
  },
  {
    category: 'deadline',
    confidence: 0.8,
    templates: [
      "Reminder: Client presentation is due tomorrow at 2pm - slides need review",
      "The beta launch deadline is approaching - 3 days left to fix critical bugs",
      "Don't forget: Performance review docs due by Friday EOD",
      "Sprint ends Monday - we have 4 tickets still in progress",
    ],
  },
  {
    category: 'question',
    confidence: 0.7,
    templates: [
      "@founder what's the expected timeline for the payment integration? Client is asking",
      "Can you clarify the requirements for the export feature? I'm seeing conflicting specs",
      "Any update on the infrastructure budget approval? Need to plan the migration",
      "Who should I talk to about the new compliance requirements?",
    ],
  },
  {
    category: 'escalation',
    confidence: 0.85,
    templates: [
      "URGENT: Production API is returning 500 errors - 40% of requests failing",
      "Critical: Customer data sync has been failing for 2 hours - enterprise client affected",
      "Escalating: The demo environment for tomorrow's investor meeting isn't working",
      "P0: Auth service is down - users can't log in. Need all hands on deck",
    ],
  },
  {
    category: 'update',
    confidence: 0.7,
    templates: [
      "FYI - pushed the updated wireframes to Figma, ready for your review when you have time",
      "Heads up: I'll be OOO next Monday - Sarah will cover my on-call",
      "Update: Just wrapped up the competitor analysis doc - linked in the strategy channel",
      "FYI the staging environment was updated with the new API version",
    ],
  },
  {
    category: 'mention',
    confidence: 0.75,
    templates: [
      "@founder when you have a moment, the PR for the dashboard refactor needs your approval",
      "Hey @founder - quick sync needed on the investor deck before I send it out",
      "@founder the engineering team has questions about the new OKRs for Q2",
      "@founder could you review the security audit findings? A few items need your decision",
    ],
  },
]

/**
 * Generate a random date within the last N hours
 */
function randomRecentDate(hoursBack: number = 24): Date {
  const now = Date.now()
  const offset = Math.random() * hoursBack * 60 * 60 * 1000
  return new Date(now - offset)
}

/**
 * Pick a random item from an array
 */
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * Generate simulated signals for testing
 */
export function generateSimulatedSignals(
  source: IntegrationSource = 'slack',
  count: number = 15
): UnifiedSignal[] {
  const signals: UnifiedSignal[] = []

  for (let i = 0; i < count; i++) {
    const template = pick(SIGNAL_TEMPLATES)
    const text = pick(template.templates)
    const sender = pick(SAMPLE_USERS)
    const channel = pick(SAMPLE_CHANNELS)
    const timestamp = randomRecentDate(48)
    const id = `sim-${source}-${timestamp.getTime()}-${i}`

    signals.push({
      id,
      source,
      sourceId: id,
      
      category: template.category,
      confidence: template.confidence + (Math.random() * 0.1 - 0.05), // ±5% variance
      
      title: text.slice(0, 80),
      snippet: text,
      fullContext: text,
      
      sender: sender.name,
      senderEmail: sender.email,
      
      timestamp: timestamp.toISOString(),
      deadline: template.category === 'deadline' 
        ? new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() 
        : undefined,
      
      url: `https://${source}.example.com/message/${id}`,
      channel,
      
      metadata: {
        simulated: true,
        template: template.category,
      },
    })
  }

  // Sort by timestamp descending
  return signals.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )
}

/**
 * Generate simulated health status for testing
 */
export function generateSimulatedHealth(
  source: IntegrationSource,
  options?: { 
    status?: IntegrationHealth['status']
    error?: string 
  }
): IntegrationHealth {
  const healthy = options?.status !== 'error'
  
  return {
    source,
    connected: healthy,
    status: options?.status || 'healthy',
    
    workspaceName: 'Simulated Workspace',
    workspaceId: 'SIM001',
    connectedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    
    lastSyncAt: healthy ? new Date().toISOString() : undefined,
    lastSyncSuccess: healthy,
    lastSyncError: options?.error,
    signalCount: healthy ? Math.floor(Math.random() * 50) + 10 : 0,
    
    scopes: ['channels:read', 'channels:history', 'users:read'],
    
    needsReauth: false,
  }
}

/**
 * Check if simulation mode is enabled
 */
export function isSimulationMode(): boolean {
  return process.env.INTEGRATION_MODE === 'simulated' || 
         process.env.NODE_ENV === 'test'
}
