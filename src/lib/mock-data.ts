import type { IntentMode } from './importance'

// Mock data generator with realistic PM/leadership scenario
// 35 work items across Asana, ClickUp, Jira
// 12 communication signals from Slack and Teams

interface MockWorkItem {
  source: 'asana' | 'clickup' | 'jira'
  source_id: string
  title: string
  description: string
  status: string
  due_date: string | null
  assignee: string
  project: string
  url: string
  urgency: 'high' | 'medium' | 'low'
  priority_score: number // 0-100, higher = more important
  is_blocked: boolean
  is_surfaced: boolean
  surface_reason: string | null
  context?: string // Additional context for detailed modes
  related_signal_ids?: string[] // Cross-reference to Slack/Teams messages about this item
}

interface MockSignal {
  source: 'slack' | 'teams'
  source_message_id: string
  channel_id: string
  channel_name: string
  sender_name: string
  sender_role?: string
  signal_type: 'mention' | 'urgent' | 'question' | 'escalation' | 'fyi'
  snippet: string
  full_context?: string // Extended info for detailed modes
  timestamp: string
  is_read: boolean
  is_actioned: boolean
  priority_score: number // 0-100
  is_from_monitored_channel: boolean // Whether channel is in monitored list
  detected_via: 'channel_monitor' | 'direct_mention' | 'email_alias' | 'keyword' // How we found this
  related_work_item_id?: string // For cross-referencing/deduplication
  message_url: string // Direct link to open in Slack/Teams
  is_dm: false // We NEVER monitor DMs - only channels/groups
}

// Helper to create dates relative to now
const hoursAgo = (h: number) => new Date(Date.now() - h * 60 * 60 * 1000).toISOString()
const daysAgo = (d: number) => new Date(Date.now() - d * 24 * 60 * 60 * 1000).toISOString()
const daysFromNow = (d: number) => new Date(Date.now() + d * 24 * 60 * 60 * 1000).toISOString()

// =============================================================================
// WORK ITEMS: 35 items across different urgency levels
// =============================================================================

export const ALL_WORK_ITEMS: MockWorkItem[] = [
  // =========================================
  // CRITICAL URGENCY (Score 85-100) - 5 items
  // =========================================
  {
    source: 'asana',
    source_id: 'demo-asana-001',
    title: 'Q1 Product Roadmap - CEO needs final version TODAY',
    description: 'Board presentation tomorrow, CEO escalated twice',
    status: 'in_progress',
    due_date: daysAgo(1), // OVERDUE
    assignee: 'You',
    project: 'Strategic Planning',
    url: 'https://app.asana.com/0/strategic/roadmap',
    urgency: 'high',
    priority_score: 98,
    is_blocked: false,
    is_surfaced: true,
    surface_reason: 'OVERDUE - CEO escalation, board meeting tomorrow',
    context: 'The CEO mentioned this in the leadership channel 2 hours ago. Sarah from strategy has the latest market data. Finance approved the budget numbers yesterday.',
    related_signal_ids: ['demo-slack-001'], // CEO's urgent Slack message about this
  },
  {
    source: 'jira',
    source_id: 'demo-jira-001',
    title: 'PROD-892: Payment gateway timeout - 12% revenue impact',
    description: 'Critical bug affecting checkout flow, needs hotfix approval',
    status: 'awaiting_approval',
    due_date: daysFromNow(0), // TODAY
    assignee: 'Sarah Chen',
    project: 'Platform Core',
    url: 'https://jira.company.com/browse/PROD-892',
    urgency: 'high',
    priority_score: 95,
    is_blocked: true,
    is_surfaced: true,
    surface_reason: 'BLOCKER - Your approval needed to deploy hotfix',
    context: 'Root cause identified: connection pool exhaustion under load. Sarah has the fix ready, tested in staging. DevOps is standing by for deployment.',
    related_signal_ids: ['demo-slack-002', 'demo-slack-cross-002'], // Sarah's message + QA regression alert
  },
  {
    source: 'clickup',
    source_id: 'demo-clickup-001',
    title: 'Acme Corp Enterprise Deal - Technical Review URGENT',
    description: '$250K ARR deal, client CEO called this morning',
    status: 'waiting_on_you',
    due_date: daysFromNow(1),
    assignee: 'Mike Johnson',
    project: 'Enterprise Sales',
    url: 'https://app.clickup.com/t/acme-enterprise',
    urgency: 'high',
    priority_score: 92,
    is_blocked: false,
    is_surfaced: true,
    surface_reason: 'Client escalation - CEO-to-CEO call scheduled for tomorrow',
    context: 'Acme needs SSO integration confirmation, SOC2 compliance docs, and data residency guarantees. Legal approved the contract terms. Mike has the technical checklist ready for your review.',
    related_signal_ids: ['demo-teams-001', 'demo-teams-cross-001'], // Mike's escalation + Legal question
  },
  {
    source: 'asana',
    source_id: 'demo-asana-002',
    title: 'Security Vulnerability - CVE-2024-1234 Patch Required',
    description: 'Critical severity, affects authentication module',
    status: 'in_progress',
    due_date: daysFromNow(0), // TODAY
    assignee: 'David Kim',
    project: 'Security',
    url: 'https://app.asana.com/0/security/cve-patch',
    urgency: 'high',
    priority_score: 90,
    is_blocked: false,
    is_surfaced: true,
    surface_reason: 'Security critical - compliance deadline today',
    context: 'Patch is ready and tested. Needs your sign-off for production deployment. InfoSec team recommends deploying during low-traffic window (2-4 AM).',
  },
  {
    source: 'jira',
    source_id: 'demo-jira-002',
    title: 'INFRA-500: Database failover failed during DR test',
    description: 'Disaster recovery not working, SLA violation risk',
    status: 'investigating',
    due_date: daysFromNow(1),
    assignee: 'Alex Rivera',
    project: 'Infrastructure',
    url: 'https://jira.company.com/browse/INFRA-500',
    urgency: 'high',
    priority_score: 88,
    is_blocked: false,
    is_surfaced: true,
    surface_reason: 'SLA at risk - DR capability compromised',
    context: 'Root cause: misconfigured replication lag threshold. Alex has a fix but needs infrastructure budget approval for additional replica nodes.',
    related_signal_ids: ['demo-slack-004'], // David Kim's message about DR failover
  },

  // =========================================
  // HIGH URGENCY (Score 65-84) - 8 items
  // =========================================
  {
    source: 'asana',
    source_id: 'demo-asana-003',
    title: 'Q1 OKR Progress Review - Leadership Meeting',
    description: 'Quarterly review with executive team',
    status: 'in_progress',
    due_date: daysFromNow(2),
    assignee: 'You',
    project: 'Planning',
    url: 'https://app.asana.com/0/planning/okr-review',
    urgency: 'high',
    priority_score: 82,
    is_blocked: false,
    is_surfaced: true,
    surface_reason: 'Leadership meeting in 2 days',
    context: 'Engineering OKRs at 78%, Product at 85%, Sales at 92%. Need to prepare talking points for the engineering gap.',
  },
  {
    source: 'clickup',
    source_id: 'demo-clickup-002',
    title: 'Partner API Integration - TechCorp deadline',
    description: 'Strategic partner integration, contractual deadline',
    status: 'in_progress',
    due_date: daysFromNow(3),
    assignee: 'Emma Wilson',
    project: 'Partnerships',
    url: 'https://app.clickup.com/t/techcorp-api',
    urgency: 'high',
    priority_score: 78,
    is_blocked: false,
    is_surfaced: true,
    surface_reason: 'Contractual deadline - partner waiting',
    context: 'Emma completed 80% of integration. Remaining: OAuth flow and webhook handlers. TechCorp technical contact confirmed their staging environment is ready.',
  },
  {
    source: 'jira',
    source_id: 'demo-jira-003',
    title: 'MOBILE-234: iOS app crash on launch - App Store review',
    description: '2.3 star rating trending, affecting user acquisition',
    status: 'in_review',
    due_date: daysFromNow(2),
    assignee: 'Chris Taylor',
    project: 'Mobile',
    url: 'https://jira.company.com/browse/MOBILE-234',
    urgency: 'high',
    priority_score: 75,
    is_blocked: false,
    is_surfaced: true,
    surface_reason: 'App Store rating dropping, 847 crash reports',
    context: 'Crash caused by iOS 17.2 API change. Chris has the fix, needs QA sign-off before App Store submission.',
    related_signal_ids: ['demo-slack-005'], // Chris's message from #mobile
  },
  {
    source: 'asana',
    source_id: 'demo-asana-004',
    title: 'New Hire Onboarding - Senior Engineer starts Monday',
    description: 'Laptop, accounts, and team intro prep',
    status: 'in_progress',
    due_date: daysFromNow(2),
    assignee: 'HR Team',
    project: 'People Ops',
    url: 'https://app.asana.com/0/hr/onboarding-senior',
    urgency: 'high',
    priority_score: 72,
    is_blocked: false,
    is_surfaced: true,
    surface_reason: 'New team member starting in 2 days',
    context: 'Jennifer Martinez joining the platform team. Background: ex-Google, distributed systems. You\'re scheduled for 30-min intro on Monday 2pm.',
  },
  {
    source: 'clickup',
    source_id: 'demo-clickup-003',
    title: 'Marketing Campaign Launch - Product Hunt',
    description: 'Coordinating launch with marketing team',
    status: 'ready',
    due_date: daysFromNow(4),
    assignee: 'Lisa Park',
    project: 'Marketing',
    url: 'https://app.clickup.com/t/ph-launch',
    urgency: 'high',
    priority_score: 70,
    is_blocked: false,
    is_surfaced: true,
    surface_reason: 'Launch coordination needed',
    context: 'Assets ready. Lisa needs your quote for the launch post and approval on the demo video script.',
  },
  {
    source: 'jira',
    source_id: 'demo-jira-004',
    title: 'PERF-178: API response time regression',
    description: 'P95 latency up 40% after last deployment',
    status: 'investigating',
    due_date: daysFromNow(3),
    assignee: 'Backend Team',
    project: 'Performance',
    url: 'https://jira.company.com/browse/PERF-178',
    urgency: 'high',
    priority_score: 68,
    is_blocked: false,
    is_surfaced: true,
    surface_reason: 'Performance degradation detected',
    context: 'New logging middleware is the culprit. Team is evaluating async logging vs. sampling approaches.',
  },
  {
    source: 'asana',
    source_id: 'demo-asana-005',
    title: 'Budget Reallocation Request - Engineering Tools',
    description: 'Need approval for additional CI/CD capacity',
    status: 'pending_approval',
    due_date: daysFromNow(3),
    assignee: 'You',
    project: 'Finance',
    url: 'https://app.asana.com/0/finance/budget-request',
    urgency: 'high',
    priority_score: 66,
    is_blocked: false,
    is_surfaced: true,
    surface_reason: 'Budget approval needed',
    context: '$15K/month for additional GitHub Actions runners. ROI analysis shows 23% reduction in developer wait time. Finance pre-approved, needs your sign-off.',
  },
  {
    source: 'clickup',
    source_id: 'demo-clickup-004',
    title: 'Customer Success Review - Enterprise Accounts',
    description: 'Quarterly health check for top 10 accounts',
    status: 'scheduled',
    due_date: daysFromNow(4),
    assignee: 'Jessica Wong',
    project: 'Customer Success',
    url: 'https://app.clickup.com/t/cs-quarterly',
    urgency: 'high',
    priority_score: 65,
    is_blocked: false,
    is_surfaced: true,
    surface_reason: 'Executive review scheduled',
    context: '2 accounts flagged at-risk: DataFlow Inc (contract renewal in 60 days) and CloudBase (champion left the company). Jessica has mitigation plans ready for review.',
  },

  // =========================================
  // MEDIUM URGENCY (Score 40-64) - 12 items
  // =========================================
  {
    source: 'asana',
    source_id: 'demo-asana-006',
    title: 'Design System v2.0 - Component Library Review',
    description: 'New button, form, and modal components',
    status: 'in_progress',
    due_date: daysFromNow(7),
    assignee: 'Design Team',
    project: 'Design System',
    url: 'https://app.asana.com/0/design/v2-review',
    urgency: 'medium',
    priority_score: 62,
    is_blocked: false,
    is_surfaced: true,
    surface_reason: 'Ready for feedback',
    context: 'Figma link in the task. 47 new components, aligned with new brand guidelines. Accessibility audit passed.',
  },
  {
    source: 'jira',
    source_id: 'demo-jira-005',
    title: 'FEAT-892: Dark mode implementation',
    description: 'User-requested feature, 234 upvotes on feedback board',
    status: 'in_progress',
    due_date: daysFromNow(10),
    assignee: 'Frontend Team',
    project: 'Product',
    url: 'https://jira.company.com/browse/FEAT-892',
    urgency: 'medium',
    priority_score: 58,
    is_blocked: false,
    is_surfaced: true,
    surface_reason: 'High user demand feature',
    context: '60% complete. CSS variables migration done. Remaining: email templates and documentation.',
  },
  {
    source: 'clickup',
    source_id: 'demo-clickup-005',
    title: 'Vendor Evaluation - Analytics Platform',
    description: 'Comparing Amplitude, Mixpanel, and Heap',
    status: 'in_progress',
    due_date: daysFromNow(14),
    assignee: 'Data Team',
    project: 'Infrastructure',
    url: 'https://app.clickup.com/t/analytics-eval',
    urgency: 'medium',
    priority_score: 55,
    is_blocked: false,
    is_surfaced: true,
    surface_reason: 'Vendor decision needed for Q2',
    context: 'Data team recommends Amplitude. Pricing negotiation in progress. Demo scheduled with Mixpanel Thursday.',
  },
  {
    source: 'asana',
    source_id: 'demo-asana-007',
    title: 'Documentation Sprint - API Reference Update',
    description: 'Updating docs for v3 API release',
    status: 'in_progress',
    due_date: daysFromNow(12),
    assignee: 'Tech Writing',
    project: 'Documentation',
    url: 'https://app.asana.com/0/docs/api-v3',
    urgency: 'medium',
    priority_score: 52,
    is_blocked: false,
    is_surfaced: true,
    surface_reason: 'Aligned with product release',
  },
  {
    source: 'jira',
    source_id: 'demo-jira-006',
    title: 'TECH-234: Database indexing optimization',
    description: 'Query performance improvements for reporting',
    status: 'in_progress',
    due_date: daysFromNow(8),
    assignee: 'David Kim',
    project: 'Platform',
    url: 'https://jira.company.com/browse/TECH-234',
    urgency: 'medium',
    priority_score: 50,
    is_blocked: false,
    is_surfaced: true,
    surface_reason: 'Performance improvement in progress',
  },
  {
    source: 'clickup',
    source_id: 'demo-clickup-006',
    title: 'Training Material Update - New Features',
    description: 'Customer training docs for Q1 releases',
    status: 'in_progress',
    due_date: daysFromNow(15),
    assignee: 'Training Team',
    project: 'Enablement',
    url: 'https://app.clickup.com/t/training-q1',
    urgency: 'medium',
    priority_score: 48,
    is_blocked: false,
    is_surfaced: true,
    surface_reason: 'Customer enablement content',
  },
  {
    source: 'asana',
    source_id: 'demo-asana-008',
    title: 'Accessibility Audit - WCAG 2.1 Compliance',
    description: 'Annual accessibility review',
    status: 'scheduled',
    due_date: daysFromNow(20),
    assignee: 'QA Team',
    project: 'Compliance',
    url: 'https://app.asana.com/0/compliance/wcag-audit',
    urgency: 'medium',
    priority_score: 46,
    is_blocked: false,
    is_surfaced: true,
    surface_reason: 'Compliance requirement',
  },
  {
    source: 'jira',
    source_id: 'demo-jira-007',
    title: 'INFRA-567: Kubernetes cluster upgrade',
    description: 'Upgrading to K8s 1.28 for security patches',
    status: 'planned',
    due_date: daysFromNow(18),
    assignee: 'DevOps Team',
    project: 'Infrastructure',
    url: 'https://jira.company.com/browse/INFRA-567',
    urgency: 'medium',
    priority_score: 44,
    is_blocked: false,
    is_surfaced: true,
    surface_reason: 'Scheduled infrastructure update',
  },
  {
    source: 'clickup',
    source_id: 'demo-clickup-007',
    title: 'Competitive Analysis - Q1 Market Report',
    description: 'Quarterly competitor feature comparison',
    status: 'in_progress',
    due_date: daysFromNow(10),
    assignee: 'Product Team',
    project: 'Strategy',
    url: 'https://app.clickup.com/t/comp-analysis',
    urgency: 'medium',
    priority_score: 42,
    is_blocked: false,
    is_surfaced: false,
    surface_reason: null,
  },
  {
    source: 'asana',
    source_id: 'demo-asana-009',
    title: 'Team Retrospective Prep - Sprint 47',
    description: 'Gathering feedback for retro meeting',
    status: 'in_progress',
    due_date: daysFromNow(5),
    assignee: 'Scrum Master',
    project: 'Agile',
    url: 'https://app.asana.com/0/agile/retro-47',
    urgency: 'medium',
    priority_score: 41,
    is_blocked: false,
    is_surfaced: false,
    surface_reason: null,
  },
  {
    source: 'jira',
    source_id: 'demo-jira-008',
    title: 'TEST-123: E2E test coverage expansion',
    description: 'Adding tests for new checkout flow',
    status: 'in_progress',
    due_date: daysFromNow(12),
    assignee: 'QA Team',
    project: 'Quality',
    url: 'https://jira.company.com/browse/TEST-123',
    urgency: 'medium',
    priority_score: 40,
    is_blocked: false,
    is_surfaced: false,
    surface_reason: null,
  },
  {
    source: 'clickup',
    source_id: 'demo-clickup-008',
    title: 'Internal Tool - Time Tracking Dashboard',
    description: 'Building internal productivity metrics',
    status: 'in_progress',
    due_date: daysFromNow(25),
    assignee: 'Internal Tools',
    project: 'Operations',
    url: 'https://app.clickup.com/t/time-tracking',
    urgency: 'medium',
    priority_score: 40,
    is_blocked: false,
    is_surfaced: false,
    surface_reason: null,
  },

  // =========================================
  // LOW URGENCY (Score 0-39) - 10 items
  // =========================================
  {
    source: 'asana',
    source_id: 'demo-asana-010',
    title: 'Weekly Team Sync Notes - Documented',
    description: 'Meeting notes and action items uploaded',
    status: 'completed',
    due_date: null,
    assignee: 'Team',
    project: 'Team Ops',
    url: 'https://app.asana.com/0/team/sync-notes',
    urgency: 'low',
    priority_score: 35,
    is_blocked: false,
    is_surfaced: false,
    surface_reason: null,
  },
  {
    source: 'jira',
    source_id: 'demo-jira-009',
    title: 'DOCS-456: API changelog updated',
    description: 'Release notes for v2.8.3',
    status: 'completed',
    due_date: null,
    assignee: 'Tech Writing',
    project: 'Documentation',
    url: 'https://jira.company.com/browse/DOCS-456',
    urgency: 'low',
    priority_score: 30,
    is_blocked: false,
    is_surfaced: false,
    surface_reason: null,
  },
  {
    source: 'clickup',
    source_id: 'demo-clickup-009',
    title: 'Code Review Completed - PR #1847',
    description: 'User preferences module merged',
    status: 'completed',
    due_date: null,
    assignee: 'Chris Taylor',
    project: 'Platform',
    url: 'https://app.clickup.com/t/pr-1847',
    urgency: 'low',
    priority_score: 28,
    is_blocked: false,
    is_surfaced: false,
    surface_reason: null,
  },
  {
    source: 'asana',
    source_id: 'demo-asana-011',
    title: 'Office Supplies Order - Processed',
    description: 'Q1 supplies ordered and scheduled',
    status: 'completed',
    due_date: null,
    assignee: 'Office Manager',
    project: 'Admin',
    url: 'https://app.asana.com/0/admin/supplies',
    urgency: 'low',
    priority_score: 25,
    is_blocked: false,
    is_surfaced: false,
    surface_reason: null,
  },
  {
    source: 'jira',
    source_id: 'demo-jira-010',
    title: 'MINOR-789: Typo fix in settings page',
    description: 'UI text correction deployed',
    status: 'completed',
    due_date: null,
    assignee: 'Frontend Team',
    project: 'Product',
    url: 'https://jira.company.com/browse/MINOR-789',
    urgency: 'low',
    priority_score: 22,
    is_blocked: false,
    is_surfaced: false,
    surface_reason: null,
  },
  {
    source: 'clickup',
    source_id: 'demo-clickup-010',
    title: 'Staging Environment - Deployed',
    description: 'Latest build pushed to staging',
    status: 'completed',
    due_date: null,
    assignee: 'DevOps',
    project: 'Infrastructure',
    url: 'https://app.clickup.com/t/staging-deploy',
    urgency: 'low',
    priority_score: 20,
    is_blocked: false,
    is_surfaced: false,
    surface_reason: null,
  },
  {
    source: 'asana',
    source_id: 'demo-asana-012',
    title: 'Meeting Room Booking - Confirmed',
    description: 'Conference room A booked for planning',
    status: 'completed',
    due_date: null,
    assignee: 'Admin',
    project: 'Admin',
    url: 'https://app.asana.com/0/admin/rooms',
    urgency: 'low',
    priority_score: 18,
    is_blocked: false,
    is_surfaced: false,
    surface_reason: null,
  },
  {
    source: 'jira',
    source_id: 'demo-jira-011',
    title: 'CLEANUP-234: Remove deprecated endpoints',
    description: 'Legacy API cleanup completed',
    status: 'completed',
    due_date: null,
    assignee: 'Backend Team',
    project: 'Tech Debt',
    url: 'https://jira.company.com/browse/CLEANUP-234',
    urgency: 'low',
    priority_score: 15,
    is_blocked: false,
    is_surfaced: false,
    surface_reason: null,
  },
  {
    source: 'clickup',
    source_id: 'demo-clickup-011',
    title: 'Team Lunch Survey - Results In',
    description: 'Voted for Thursday team lunch spot',
    status: 'completed',
    due_date: null,
    assignee: 'Social Committee',
    project: 'Culture',
    url: 'https://app.clickup.com/t/lunch-survey',
    urgency: 'low',
    priority_score: 12,
    is_blocked: false,
    is_surfaced: false,
    surface_reason: null,
  },
  {
    source: 'asana',
    source_id: 'demo-asana-013',
    title: 'Birthday Celebration - Friday',
    description: 'Team celebration planned',
    status: 'scheduled',
    due_date: daysFromNow(3),
    assignee: 'Social Committee',
    project: 'Culture',
    url: 'https://app.asana.com/0/culture/birthday',
    urgency: 'low',
    priority_score: 10,
    is_blocked: false,
    is_surfaced: false,
    surface_reason: null,
  },
]

// =============================================================================
// COMMUNICATION SIGNALS: 15 conversations from Slack/Teams (CHANNELS ONLY - NO DMs)
// =============================================================================

// Helper to generate Slack/Teams message URLs
const slackMessageUrl = (channelId: string, messageId: string) => 
  `https://slack.com/app_redirect?channel=${channelId}&message_ts=${messageId}`
const teamsMessageUrl = (channelId: string, messageId: string) => 
  `https://teams.microsoft.com/l/message/${channelId}/${messageId}`

export const ALL_SIGNALS: MockSignal[] = [
  // =========================================
  // CRITICAL SIGNALS (Score 85-100) - 3 items
  // =========================================
  {
    source: 'slack',
    source_message_id: 'demo-slack-001',
    channel_id: 'C-LEADERSHIP',
    channel_name: '#leadership',
    sender_name: 'Marcus Chen',
    sender_role: 'CEO',
    signal_type: 'urgent',
    snippet: '@you Need the roadmap deck finalized ASAP. Investor call at 3pm.',
    full_context: 'The board wants to see our Q2-Q4 trajectory. Make sure the ARR projections match what finance sent yesterday. I\'ll need 10 mins with you before the call to align on messaging.',
    timestamp: hoursAgo(1),
    is_read: false,
    is_actioned: false,
    priority_score: 98,
    is_from_monitored_channel: true,
    detected_via: 'direct_mention',
    related_work_item_id: 'demo-asana-001',
    message_url: slackMessageUrl('C-LEADERSHIP', '1706369200.000001'),
    is_dm: false,
  },
  {
    source: 'slack',
    source_message_id: 'demo-slack-002',
    channel_id: 'C-ENGINEERING',
    channel_name: '#engineering',
    sender_name: 'Sarah Chen',
    sender_role: 'Senior Engineer',
    signal_type: 'escalation',
    snippet: '@you URGENT: Payment gateway fix ready. Need your approval to deploy hotfix to prod.',
    full_context: 'PR #2341 has the fix. Tested in staging, all payment flows passing. DevOps is standing by. Every hour we wait costs ~$4K in failed transactions. Can you review and approve?',
    timestamp: hoursAgo(2),
    is_read: false,
    is_actioned: false,
    priority_score: 95,
    is_from_monitored_channel: true,
    detected_via: 'direct_mention',
    related_work_item_id: 'demo-jira-001',
    message_url: slackMessageUrl('C-ENGINEERING', '1706365600.000002'),
    is_dm: false,
  },
  {
    source: 'teams',
    source_message_id: 'demo-teams-001',
    channel_id: 'T-SALES',
    channel_name: 'Enterprise Sales',
    sender_name: 'Mike Johnson',
    sender_role: 'Sales Director',
    signal_type: 'escalation',
    snippet: '@you Acme Corp CEO wants to talk technical requirements TODAY. $250K deal on the line.',
    full_context: 'They\'re comparing us vs Competitor X. Main concerns: SSO integration, SOC2 compliance, and data residency. I can set up a 30-min call for 4pm if you\'re available. Their CTO will join.',
    timestamp: hoursAgo(3),
    is_read: false,
    is_actioned: false,
    priority_score: 92,
    is_from_monitored_channel: true,
    detected_via: 'direct_mention',
    related_work_item_id: 'demo-clickup-001',
    message_url: teamsMessageUrl('T-SALES', '1706362000.000001'),
    is_dm: false,
  },

  // =========================================
  // HIGH SIGNALS (Score 65-84) - 4 items
  // =========================================
  {
    source: 'slack',
    source_message_id: 'demo-slack-003',
    channel_id: 'C-PRODUCT',
    channel_name: '#product',
    sender_name: 'Emma Wilson',
    sender_role: 'Product Designer',
    signal_type: 'question',
    snippet: '@you Quick question: Should the new onboarding flow include SSO setup or save for later?',
    full_context: 'Design is 90% done but I need your input on the enterprise flow. Current design assumes email/password first, SSO optional. Enterprise customers might expect SSO upfront.',
    timestamp: hoursAgo(4),
    is_read: false,
    is_actioned: false,
    priority_score: 75,
    is_from_monitored_channel: true,
    detected_via: 'direct_mention',
    message_url: slackMessageUrl('C-PRODUCT', '1706358400.000003'),
    is_dm: false,
  },
  {
    source: 'slack',
    source_message_id: 'demo-slack-004',
    channel_id: 'C-ENGINEERING',
    channel_name: '#engineering',
    sender_name: 'David Kim',
    sender_role: 'DevOps Lead',
    signal_type: 'mention',
    snippet: '@you FYI: DR test revealed failover issues. Not critical but needs discussion this week.',
    full_context: 'Replication lag was higher than expected (15s vs 5s target). I have a mitigation plan but it requires additional infrastructure budget (~$3K/mo). Can we sync tomorrow?',
    timestamp: hoursAgo(5),
    is_read: false,
    is_actioned: false,
    priority_score: 72,
    is_from_monitored_channel: true,
    detected_via: 'direct_mention',
    related_work_item_id: 'demo-jira-002',
    message_url: slackMessageUrl('C-ENGINEERING', '1706354800.000004'),
    is_dm: false,
  },
  {
    source: 'teams',
    source_message_id: 'demo-teams-002',
    channel_id: 'T-PRODUCT',
    channel_name: 'Product Team',
    sender_name: 'Lisa Park',
    sender_role: 'Marketing Manager',
    signal_type: 'question',
    snippet: 'Need your quote for the Product Hunt launch post. Can you send 2-3 sentences by EOD?',
    full_context: 'Launch is Thursday. I have the demo video, screenshots, and feature list ready. Just need a founder quote about the vision. Something about decision intelligence and cutting through noise.',
    timestamp: hoursAgo(6),
    is_read: false,
    is_actioned: false,
    priority_score: 68,
    is_from_monitored_channel: true,
    detected_via: 'email_alias',
    message_url: teamsMessageUrl('T-PRODUCT', '1706351200.000002'),
    is_dm: false,
  },
  {
    source: 'slack',
    source_message_id: 'demo-slack-005',
    channel_id: 'C-MOBILE',
    channel_name: '#mobile',
    sender_name: 'Chris Taylor',
    sender_role: 'iOS Developer',
    signal_type: 'mention',
    snippet: '@you iOS crash fix ready for review. App Store rating dropped to 2.3 stars.',
    full_context: 'The iOS 17.2 API change broke our launch sequence. Fix is straightforward - updated the deprecated method. QA passed. Need your sign-off to submit to App Store review.',
    timestamp: hoursAgo(8),
    is_read: false,
    is_actioned: false,
    priority_score: 65,
    is_from_monitored_channel: false,
    detected_via: 'direct_mention',
    related_work_item_id: 'demo-jira-003',
    message_url: slackMessageUrl('C-MOBILE', '1706344000.000005'),
    is_dm: false,
  },

  // =========================================
  // MEDIUM SIGNALS (Score 40-64) - 3 items
  // =========================================
  {
    source: 'slack',
    source_message_id: 'demo-slack-006',
    channel_id: 'C-RANDOM',
    channel_name: '#random',
    sender_name: 'HR Bot',
    signal_type: 'fyi',
    snippet: 'Reminder: Team happy hour today at 5pm in the lounge! 🎉',
    full_context: 'Drinks and snacks provided. Celebrating Q1 wins!',
    timestamp: hoursAgo(10),
    is_read: true,
    is_actioned: false,
    priority_score: 45,
    is_from_monitored_channel: false,
    detected_via: 'keyword',
    message_url: slackMessageUrl('C-RANDOM', '1706336800.000006'),
    is_dm: false,
  },
  {
    source: 'teams',
    source_message_id: 'demo-teams-003',
    channel_id: 'T-GENERAL',
    channel_name: 'General',
    sender_name: 'Jessica Wong',
    sender_role: 'Customer Success',
    signal_type: 'fyi',
    snippet: 'Great news! CloudBase just renewed for 2 years after the feature demo yesterday.',
    full_context: 'The new reporting dashboard sealed the deal. They\'re also interested in the enterprise tier upgrade. Setting up a call for next month.',
    timestamp: hoursAgo(12),
    is_read: true,
    is_actioned: false,
    priority_score: 50,
    is_from_monitored_channel: true,
    detected_via: 'channel_monitor',
    message_url: teamsMessageUrl('T-GENERAL', '1706329600.000003'),
    is_dm: false,
  },
  {
    source: 'slack',
    source_message_id: 'demo-slack-007',
    channel_id: 'C-ENGINEERING',
    channel_name: '#engineering',
    sender_name: 'Alex Rivera',
    sender_role: 'Backend Engineer',
    signal_type: 'fyi',
    snippet: 'Database migration completed successfully. Performance metrics looking good.',
    full_context: 'PostgreSQL 16 upgrade done during maintenance window. Query times improved 12% on average. No issues reported.',
    timestamp: hoursAgo(14),
    is_read: true,
    is_actioned: false,
    priority_score: 42,
    is_from_monitored_channel: true,
    detected_via: 'channel_monitor',
    message_url: slackMessageUrl('C-ENGINEERING', '1706322400.000007'),
    is_dm: false,
  },

  // =========================================
  // LOW SIGNALS (Score 0-39) - 2 items
  // =========================================
  {
    source: 'slack',
    source_message_id: 'demo-slack-008',
    channel_id: 'C-WATERCOOLER',
    channel_name: '#watercooler',
    sender_name: 'Social Committee',
    signal_type: 'fyi',
    snippet: 'Vote for next month\'s team lunch location! Poll closes Friday.',
    full_context: 'Options: Italian, Thai, Mexican, or Japanese. Current leader is Thai with 8 votes.',
    timestamp: hoursAgo(24),
    is_read: true,
    is_actioned: false,
    priority_score: 25,
    is_from_monitored_channel: false,
    detected_via: 'keyword',
    message_url: slackMessageUrl('C-WATERCOOLER', '1706286400.000008'),
    is_dm: false,
  },
  {
    source: 'teams',
    source_message_id: 'demo-teams-004',
    channel_id: 'T-GENERAL',
    channel_name: 'General',
    sender_name: 'Facilities',
    signal_type: 'fyi',
    snippet: 'Building maintenance scheduled for Saturday. No impact to remote work.',
    full_context: 'HVAC maintenance 8am-2pm. Office access will be limited.',
    timestamp: hoursAgo(36),
    is_read: true,
    is_actioned: false,
    priority_score: 15,
    is_from_monitored_channel: true,
    detected_via: 'channel_monitor',
    message_url: teamsMessageUrl('T-GENERAL', '1706243200.000004'),
    is_dm: false,
  },

  // =========================================
  // CROSS-CHANNEL @MENTION DETECTION - From non-monitored channels
  // These demonstrate the "Global @mention Detection" feature
  // =========================================
  {
    source: 'slack',
    source_message_id: 'demo-slack-cross-001',
    channel_id: 'C-SALES-WEST',
    channel_name: '#sales-west',
    sender_name: 'Jennifer Adams',
    sender_role: 'Regional Sales Rep',
    signal_type: 'mention',
    snippet: '@you Can you confirm the pricing for the Enterprise tier? Customer asking about volume discounts.',
    full_context: 'Big opportunity in the west region. Customer is comparing our pricing to Competitor Y. Need your input on whether we can offer 15% volume discount for 500+ seats.',
    timestamp: hoursAgo(3),
    is_read: false,
    is_actioned: false,
    priority_score: 70,
    is_from_monitored_channel: false,
    detected_via: 'direct_mention',
    message_url: slackMessageUrl('C-SALES-WEST', '1706362000.000009'),
    is_dm: false,
  },
  {
    source: 'teams',
    source_message_id: 'demo-teams-cross-001',
    channel_id: 'T-LEGAL',
    channel_name: 'Legal Team',
    sender_name: 'Robert Chen',
    sender_role: 'Legal Counsel',
    signal_type: 'question',
    snippet: 'Hey @you, quick question about the Acme contract terms - can we agree to their data deletion clause?',
    full_context: 'Acme wants 24-hour data deletion SLA instead of our standard 30-day. This affects our backup retention policy. Need your sign-off before I respond.',
    timestamp: hoursAgo(4),
    is_read: false,
    is_actioned: false,
    priority_score: 78,
    is_from_monitored_channel: false,
    detected_via: 'direct_mention',
    related_work_item_id: 'demo-clickup-001',
    message_url: teamsMessageUrl('T-LEGAL', '1706358400.000005'),
    is_dm: false,
  },
  {
    source: 'slack',
    source_message_id: 'demo-slack-cross-002',
    channel_id: 'C-QA-INTERNAL',
    channel_name: '#qa-internal',
    sender_name: 'Maria Santos',
    sender_role: 'QA Lead',
    signal_type: 'escalation',
    snippet: '@you Found a critical regression in the payment flow during testing. Same issue as PROD-892.',
    full_context: 'The fix that went out yesterday seems to have reintroduced the timeout issue under high load. Can we hold off on the full rollout until this is verified?',
    timestamp: hoursAgo(1),
    is_read: false,
    is_actioned: false,
    priority_score: 88,
    is_from_monitored_channel: false,
    detected_via: 'direct_mention',
    related_work_item_id: 'demo-jira-001',
    message_url: slackMessageUrl('C-QA-INTERNAL', '1706369200.000010'),
    is_dm: false,
  },
]

// =============================================================================
// MODE-BASED FILTERING AND BRIEF GENERATION
// =============================================================================

interface ModeConfig {
  workItemThreshold: number
  signalThreshold: number
  maxNeedsAttention: number
  maxFYI: number
  maxSignals: number
  includeContext: boolean
  briefStyle: 'minimal' | 'standard' | 'detailed' | 'comprehensive'
}

export const MODE_CONFIGS: Record<IntentMode, ModeConfig> = {
  calm: {
    workItemThreshold: 85,
    signalThreshold: 90,
    maxNeedsAttention: 3,
    maxFYI: 0,
    maxSignals: 2,
    includeContext: false,
    briefStyle: 'minimal',
  },
  on_the_go: {
    workItemThreshold: 65,
    signalThreshold: 70,
    maxNeedsAttention: 5,
    maxFYI: 3,
    maxSignals: 4,
    includeContext: false,
    briefStyle: 'standard',
  },
  work: {
    workItemThreshold: 45,
    signalThreshold: 50,
    maxNeedsAttention: 8,
    maxFYI: 6,
    maxSignals: 6,
    includeContext: true,
    briefStyle: 'detailed',
  },
  focus: {
    workItemThreshold: 20,
    signalThreshold: 20,
    maxNeedsAttention: 12,
    maxFYI: 10,
    maxSignals: 10,
    includeContext: true,
    briefStyle: 'comprehensive',
  },
}

export function getFilteredData(mode: IntentMode) {
  const config = MODE_CONFIGS[mode]
  
  // Filter work items by priority score
  const filteredItems = ALL_WORK_ITEMS.filter(item => item.priority_score >= config.workItemThreshold)
  
  // Categorize items
  const needsAttention = filteredItems
    .filter(item => item.urgency === 'high' || item.priority_score >= 75)
    .slice(0, config.maxNeedsAttention)
    .map(item => ({
      ...item,
      // Strip context for minimal modes
      context: config.includeContext ? item.context : undefined,
    }))

  const fyiItems = filteredItems
    .filter(item => item.urgency === 'medium' && item.priority_score < 75)
    .slice(0, config.maxFYI)
    .map(item => ({
      ...item,
      context: config.includeContext ? item.context : undefined,
    }))

  const handledItems = ALL_WORK_ITEMS
    .filter(item => item.urgency === 'low' || item.status === 'completed')
    .slice(0, 10)

  // Filter signals
  const filteredSignals = ALL_SIGNALS
    .filter(signal => signal.priority_score >= config.signalThreshold)
    .slice(0, config.maxSignals)
    .map(signal => ({
      ...signal,
      full_context: config.includeContext ? signal.full_context : undefined,
    }))

  return {
    needsAttention,
    fyiItems,
    handledItems,
    signals: filteredSignals,
    config,
  }
}

export function generateBriefText(mode: IntentMode): string {
  const { needsAttention, fyiItems, signals, config } = getFilteredData(mode)
  
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  })

  switch (config.briefStyle) {
    case 'minimal':
      // Calm mode - critical only, ultra brief
      return `${today}

${needsAttention.length} critical items need attention.

${needsAttention.map((item, i) => `${i + 1}. ${item.title}`).join('\n')}

${signals.length > 0 ? `\n${signals.length} urgent message${signals.length > 1 ? 's' : ''} waiting.` : 'No urgent messages.'}

Coverage: Your team is handling ${ALL_WORK_ITEMS.filter(i => i.urgency === 'low').length} items without you.`

    case 'standard':
      // On-the-go mode - key highlights with brief context
      return `${today}

**${needsAttention.length} items need attention:**

${needsAttention.map((item, i) => `${i + 1}. **${item.title}**
   ${item.surface_reason}`).join('\n\n')}

${fyiItems.length > 0 ? `\n**${fyiItems.length} items progressing (FYI):**\n${fyiItems.map(item => `- ${item.title}`).join('\n')}` : ''}

**Messages:** ${signals.length} conversation${signals.length !== 1 ? 's' : ''} need${signals.length === 1 ? 's' : ''} your response.
${signals.slice(0, 3).map(s => `- ${s.sender_name} in ${s.channel_name}: "${s.snippet.slice(0, 60)}..."`).join('\n')}

Team is handling ${ALL_WORK_ITEMS.filter(i => i.status === 'completed').length} items independently.`

    case 'detailed':
      // Work mode - standard working view with context
      return `${today}

**🚨 NEEDS YOUR ATTENTION (${needsAttention.length} items):**

${needsAttention.map((item, i) => `**${i + 1}. ${item.title}**
   Source: ${item.source.toUpperCase()} | ${item.project}
   Why: ${item.surface_reason}
   ${item.context ? `Context: ${item.context}` : ''}`).join('\n\n')}

---

**📋 FYI - Progressing Well (${fyiItems.length} items):**

${fyiItems.map(item => `- **${item.title}** (${item.assignee})
  ${item.surface_reason || 'On track'}`).join('\n')}

---

**💬 MESSAGES REQUIRING RESPONSE (${signals.length}):**

${signals.map(s => `- **${s.sender_name}** ${s.sender_role ? `(${s.sender_role})` : ''} in ${s.channel_name}
  "${s.snippet}"
  ${s.full_context ? `Context: ${s.full_context}` : ''}`).join('\n\n')}

---

**✅ HANDLED BY YOUR TEAM:** ${ALL_WORK_ITEMS.filter(i => i.status === 'completed').length} items completed without escalation.

**Coverage:** 89% of work items handled autonomously.`

    case 'comprehensive':
      // Focus mode - full context for pre-meeting/deep work
      return `${today} - FOCUS MODE BRIEFING

═══════════════════════════════════════════════════════════════
🚨 CRITICAL ACTION REQUIRED (${needsAttention.length} items)
═══════════════════════════════════════════════════════════════

${needsAttention.map((item, i) => `
▶ ${i + 1}. ${item.title.toUpperCase()}
  ├─ Source: ${item.source.toUpperCase()} | Project: ${item.project}
  ├─ Assignee: ${item.assignee} | Status: ${item.status}
  ├─ Due: ${item.due_date ? new Date(item.due_date).toLocaleDateString() : 'No date'}
  ├─ Why surfaced: ${item.surface_reason}
  ${item.is_blocked ? '├─ ⚠️ BLOCKER: Waiting on you\n' : ''}└─ Context: ${item.context || 'No additional context'}
`).join('\n')}

═══════════════════════════════════════════════════════════════
📋 FYI - IN PROGRESS (${fyiItems.length} items)
═══════════════════════════════════════════════════════════════

${fyiItems.map(item => `
• ${item.title}
  └─ ${item.assignee} | Due: ${item.due_date ? new Date(item.due_date).toLocaleDateString() : 'Flexible'} | ${item.surface_reason || 'On track'}`).join('\n')}

═══════════════════════════════════════════════════════════════
💬 COMMUNICATION SIGNALS (${signals.length} conversations)
═══════════════════════════════════════════════════════════════

${signals.map(s => `
▶ ${s.sender_name}${s.sender_role ? ` (${s.sender_role})` : ''}
  ├─ Channel: ${s.channel_name} | ${s.source.toUpperCase()}
  ├─ Time: ${new Date(s.timestamp).toLocaleTimeString()}
  ├─ Signal: ${s.signal_type.toUpperCase()}
  ├─ Message: "${s.snippet}"
  └─ Full context: ${s.full_context || 'No additional context'}`).join('\n')}

═══════════════════════════════════════════════════════════════
✅ HANDLED BY TEAM (${ALL_WORK_ITEMS.filter(i => i.status === 'completed').length} items)
═══════════════════════════════════════════════════════════════

${ALL_WORK_ITEMS.filter(i => i.status === 'completed').map(item => `• ${item.title} (${item.assignee})`).join('\n')}

═══════════════════════════════════════════════════════════════
📊 COVERAGE METRICS
═══════════════════════════════════════════════════════════════

Total items tracked: ${ALL_WORK_ITEMS.length}
Items requiring you: ${needsAttention.length + fyiItems.length}
Items handled autonomously: ${ALL_WORK_ITEMS.filter(i => i.status === 'completed').length}
Coverage percentage: 89%
Active integrations: Asana, ClickUp, Jira, Slack, Teams`

    default:
      return 'Brief generation failed'
  }
}

// Stats for the dashboard
export function getStats(mode: IntentMode) {
  const data = getFilteredData(mode)
  return {
    needsAttentionCount: data.needsAttention.length,
    fyiCount: data.fyiItems.length,
    handledCount: data.handledItems.length,
    signalsCount: data.signals.length,
    totalItems: ALL_WORK_ITEMS.length,
    totalSignals: ALL_SIGNALS.length,
    coveragePercentage: Math.round((data.handledItems.length / ALL_WORK_ITEMS.length) * 100 + 60),
  }
}

// =============================================================================
// DEDUPLICATION & CROSS-REFERENCE HELPERS
// =============================================================================

/**
 * Get all signals related to a specific work item
 * This enables the AI to show related conversations alongside tasks
 */
export function getRelatedSignals(workItemId: string): MockSignal[] {
  return ALL_SIGNALS.filter(signal => signal.related_work_item_id === workItemId)
}

/**
 * Get the work item that a signal is related to
 * This enables the AI to avoid showing duplicate info
 */
export function getRelatedWorkItem(signalId: string): MockWorkItem | undefined {
  const signal = ALL_SIGNALS.find(s => s.source_message_id === signalId)
  if (!signal?.related_work_item_id) return undefined
  return ALL_WORK_ITEMS.find(item => item.source_id === signal.related_work_item_id)
}

/**
 * Get signals from non-monitored channels (detected via @mention or email alias)
 * This demonstrates the "Global @mention Detection" feature
 */
export function getCrossChannelMentions(): MockSignal[] {
  return ALL_SIGNALS.filter(signal => !signal.is_from_monitored_channel)
}

/**
 * Deduplicated brief data - groups related signals with their work items
 * to avoid showing the same topic multiple times
 */
export function getDeduplicatedData(mode: IntentMode) {
  const data = getFilteredData(mode)
  
  // Create a map of work items with their related signals
  const workItemsWithSignals = data.needsAttention.map(item => {
    const relatedSignals = data.signals.filter(
      signal => signal.related_work_item_id === item.source_id
    )
    return {
      ...item,
      relatedSignals,
    }
  })
  
  // Get signals that are NOT related to any surfaced work item
  // (these are standalone conversations that need separate attention)
  const surfacedWorkItemIds = new Set(data.needsAttention.map(item => item.source_id))
  const standaloneSignals = data.signals.filter(
    signal => !signal.related_work_item_id || !surfacedWorkItemIds.has(signal.related_work_item_id)
  )
  
  // Get cross-channel mentions (from non-monitored channels)
  const crossChannelMentions = data.signals.filter(s => !s.is_from_monitored_channel)
  
  return {
    ...data,
    workItemsWithSignals,
    standaloneSignals,
    crossChannelMentions,
    deduplicationStats: {
      totalSignals: data.signals.length,
      groupedWithItems: data.signals.length - standaloneSignals.length,
      standalone: standaloneSignals.length,
      fromNonMonitoredChannels: crossChannelMentions.length,
    },
  }
}

/**
 * Check if user should be notified about a signal based on detection method
 * Prioritizes: direct_mention > email_alias > keyword > channel_monitor
 */
export function shouldNotifyUser(signal: MockSignal): boolean {
  // Always notify for direct @mentions or email aliases, regardless of channel monitoring
  if (signal.detected_via === 'direct_mention' || signal.detected_via === 'email_alias') {
    return true
  }
  // For channel monitors and keywords, only notify if above threshold
  return signal.priority_score >= 50
}
