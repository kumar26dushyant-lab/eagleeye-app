// Application-wide constants
// Centralized configuration for consistency across the app

// ============================================
// INTENT MODES
// ============================================

export const INTENT_MODES = {
  calm: {
    id: 'calm',
    label: 'Calm',
    description: 'Minimal updates, only truly urgent items',
    emoji: '🧘',
    itemLimit: 3,
    priorityThreshold: 0.9, // Only very high importance
  },
  on_the_go: {
    id: 'on_the_go',
    label: 'On the Go',
    description: 'Quick summary, top priorities only',
    emoji: '🚶',
    itemLimit: 5,
    priorityThreshold: 0.7,
  },
  work: {
    id: 'work',
    label: 'Work',
    description: 'Full context on all active items',
    emoji: '💼',
    itemLimit: 10,
    priorityThreshold: 0.5,
  },
  focus: {
    id: 'focus',
    label: 'Focus',
    description: 'Deep work mode, block all but blockers',
    emoji: '🎯',
    itemLimit: 3,
    priorityThreshold: 0.95, // Only blockers/escalations
  },
} as const

export type IntentModeKey = keyof typeof INTENT_MODES

// ============================================
// INTEGRATIONS
// ============================================

export const INTEGRATIONS = {
  asana: {
    id: 'asana',
    name: 'Asana',
    category: 'task',
    icon: '📋',
    color: '#F06A6A',
    description: 'Project and task management',
  },
  clickup: {
    id: 'clickup',
    name: 'ClickUp',
    category: 'task',
    icon: '✅',
    color: '#7B68EE',
    description: 'Work management platform',
  },
  jira: {
    id: 'jira',
    name: 'Jira',
    category: 'task',
    icon: '🎫',
    color: '#0052CC',
    description: 'Issue and project tracking',
  },
  slack: {
    id: 'slack',
    name: 'Slack',
    category: 'communication',
    icon: '💬',
    color: '#4A154B',
    description: 'Team messaging and collaboration',
  },
  teams: {
    id: 'teams',
    name: 'Microsoft Teams',
    category: 'communication',
    icon: '👥',
    color: '#6264A7',
    description: 'Team collaboration and chat',
  },
} as const

export type IntegrationKey = keyof typeof INTEGRATIONS

export const TASK_INTEGRATIONS = ['asana', 'clickup', 'jira'] as const
export const COMMUNICATION_INTEGRATIONS = ['slack', 'teams'] as const

// ============================================
// SIGNAL TYPES
// ============================================

export const SIGNAL_TYPES = {
  mention: {
    id: 'mention',
    label: '@Mention',
    icon: '📣',
    baseScore: 0.7,
    description: 'Someone mentioned you directly',
  },
  dm: {
    id: 'dm',
    label: 'Direct Message',
    icon: '✉️',
    baseScore: 0.6,
    description: 'Private message to you',
  },
  urgent: {
    id: 'urgent',
    label: 'Urgent',
    icon: '🚨',
    baseScore: 0.95,
    description: 'Marked as urgent or emergency',
  },
  question: {
    id: 'question',
    label: 'Question',
    icon: '❓',
    baseScore: 0.5,
    description: 'Someone asked you a question',
  },
  blocker: {
    id: 'blocker',
    label: 'Blocker',
    icon: '🛑',
    baseScore: 0.9,
    description: 'Blocking issue requiring attention',
  },
  escalation: {
    id: 'escalation',
    label: 'Escalation',
    icon: '⬆️',
    baseScore: 0.95,
    description: 'Issue escalated to you',
  },
  deadline: {
    id: 'deadline',
    label: 'Deadline',
    icon: '⏰',
    baseScore: 0.85,
    description: 'Approaching or missed deadline',
  },
  decision_needed: {
    id: 'decision_needed',
    label: 'Decision',
    icon: '🤔',
    baseScore: 0.8,
    description: 'Decision or approval needed',
  },
  // Positive signal types
  kudos: {
    id: 'kudos',
    label: 'Kudos',
    icon: '🙏',
    baseScore: 0.6,
    description: 'Recognition or appreciation',
    category: 'positive',
  },
  celebration: {
    id: 'celebration',
    label: 'Celebration',
    icon: '🎉',
    baseScore: 0.65,
    description: 'Team win or announcement',
    category: 'positive',
  },
  milestone: {
    id: 'milestone',
    label: 'Milestone',
    icon: '🏆',
    baseScore: 0.55,
    description: 'Project milestone achieved',
    category: 'positive',
  },
} as const

export type SignalTypeKey = keyof typeof SIGNAL_TYPES

// ============================================
// IMPORTANCE SCORING
// ============================================

export const IMPORTANCE_WEIGHTS = {
  // Time-based factors
  dueToday: 0.3,
  dueThisWeek: 0.15,
  overdue: 0.4,
  
  // Priority-based factors
  highPriority: 0.25,
  criticalPriority: 0.35,
  
  // Signal-based factors
  hasBlocker: 0.35,
  hasEscalation: 0.4,
  hasMention: 0.2,
  hasQuestion: 0.15,
  
  // Context factors
  assignedToMe: 0.1,
  recentlyUpdated: 0.1,
  hasUnreadComments: 0.15,
} as const

export const IMPORTANCE_THRESHOLDS = {
  critical: 0.9,
  high: 0.7,
  medium: 0.5,
  low: 0.3,
} as const

// ============================================
// API & SYNC
// ============================================

export const API_CONFIG = {
  // Pagination
  defaultPageSize: 50,
  maxPageSize: 100,
  
  // Timeouts (ms)
  requestTimeout: 30000,
  syncTimeout: 120000,
  
  // Sync intervals (ms)
  syncIntervalMinutes: 15,
  fullSyncIntervalHours: 24,
} as const

// ============================================
// BRIEF GENERATION
// ============================================

export const BRIEF_CONFIG = {
  // Character limits
  maxTextLength: 2000,
  maxItemSummary: 150,
  
  // Audio settings
  defaultVoiceId: '21m00Tcm4TlvDq8ikWAM', // ElevenLabs Rachel voice
  audioFormat: 'mp3_44100_128',
  
  // Item limits per intent mode (fallback if not in INTENT_MODES)
  maxItemsDefault: 10,
} as const

// ============================================
// UI CONSTANTS
// ============================================

export const UI = {
  // Animation durations (ms)
  animationFast: 150,
  animationNormal: 300,
  animationSlow: 500,
  
  // Debounce/throttle (ms)
  debounceSearch: 300,
  debounceInput: 150,
  throttleScroll: 100,
  
  // Toast durations (ms)
  toastDuration: 4000,
  toastDurationError: 6000,
  
  // Refresh intervals (ms)
  dashboardRefresh: 60000, // 1 minute
  statusRefresh: 30000,    // 30 seconds
} as const

// ============================================
// ERROR MESSAGES
// ============================================

export const ERROR_MESSAGES = {
  // Authentication
  unauthorized: 'Please sign in to continue',
  sessionExpired: 'Your session has expired. Please sign in again.',
  
  // Integration
  integrationNotConnected: 'Please connect this integration first',
  integrationSyncFailed: 'Failed to sync with integration',
  oauthFailed: 'Failed to connect account. Please try again.',
  
  // Brief generation
  briefGenerationFailed: 'Failed to generate brief. Please try again.',
  audioGenerationFailed: 'Failed to generate audio. Please try again.',
  noItemsForBrief: 'No items to include in brief',
  
  // General
  networkError: 'Network error. Please check your connection.',
  serverError: 'Something went wrong. Please try again later.',
  rateLimited: 'Too many requests. Please wait a moment.',
  validationFailed: 'Invalid input. Please check your data.',
} as const

// ============================================
// ROUTES
// ============================================

export const ROUTES = {
  home: '/',
  login: '/login',
  signup: '/signup',
  dashboard: '/dashboard',
  settings: '/settings',
  
  // API routes
  api: {
    brief: '/api/brief',
    audio: '/api/audio',
    integrations: '/api/integrations',
    sync: '/api/sync',
    settings: '/api/settings',
    
    // OAuth
    asana: {
      connect: '/api/asana/connect',
      callback: '/api/asana/callback',
    },
    clickup: {
      connect: '/api/clickup/connect',
      callback: '/api/clickup/callback',
    },
    jira: {
      connect: '/api/jira/connect',
      callback: '/api/jira/callback',
    },
    slack: {
      connect: '/api/slack/connect',
      callback: '/api/slack/callback',
      channels: '/api/slack/channels',
    },
    teams: {
      connect: '/api/teams/connect',
      callback: '/api/teams/callback',
      channels: '/api/teams/channels',
    },
  },
} as const
