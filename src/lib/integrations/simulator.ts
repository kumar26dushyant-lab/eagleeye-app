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
      "Blocked on API integration - need credentials from DevOps",
      "Can't proceed with deployment until security review is done",
      "Stuck on the authentication flow - need help debugging",
    ],
  },
  {
    category: 'decision',
    confidence: 0.85,
    templates: [
      "Need approval on the new pricing page design before we can ship",
      "Decision needed: Should we go with Option A or B for the database?",
      "Please sign off on the Q1 roadmap by EOD",
    ],
  },
  {
    category: 'commitment',
    confidence: 0.75,
    templates: [
      "@founder I'll have the MVP ready by Friday",
      "Will push the fix to staging by noon",
      "I can take on the mobile redesign this sprint",
    ],
  },
  {
    category: 'deadline',
    confidence: 0.8,
    templates: [
      "Reminder: Client presentation is due tomorrow at 2pm",
      "The beta launch deadline is approaching - 3 days left",
      "Don't forget: Performance review docs due by Friday EOD",
    ],
  },
  {
    category: 'question',
    confidence: 0.7,
    templates: [
      "Quick question - what's the expected timeline for the payment integration?",
      "Does anyone know the login for the staging environment?",
      "What's the status of the mobile app release?",
    ],
  },
  {
    category: 'escalation',
    confidence: 0.85,
    templates: [
      "URGENT: Production is down - need immediate attention",
      "This is critical - customer data sync has been failing for 2 hours",
      "Escalating: The demo for tomorrow isn't working",
    ],
  },
  {
    category: 'update',
    confidence: 0.6,
    templates: [
      "FYI - pushed the updated wireframes to Figma",
      "Heads up: I'll be OOO next Monday",
      "Just wrapped up the competitor analysis doc",
    ],
  },
  {
    category: 'mention',
    confidence: 0.75,
    templates: [
      "@founder when you have a sec, can you review the PR?",
      "Hey @founder - quick sync needed on the investor deck",
      "@founder the team has some questions about the new OKRs",
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
