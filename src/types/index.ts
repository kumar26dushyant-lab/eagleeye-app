export type IntentMode = 'calm' | 'on_the_go' | 'work' | 'focus'

export type IntegrationProvider = 'asana' | 'clickup' | 'jira' | 'linear' | 'slack' | 'teams'

export type TaskProvider = 'asana' | 'clickup' | 'jira' | 'linear'

// Sources that can generate communication signals (messages and tasks)
export type CommunicationProvider = 'slack' | 'teams' | 'asana' | 'linear' | 'jira' | 'clickup'

export type Urgency = 'high' | 'medium' | 'low'

export type SignalType = 'mention' | 'urgent' | 'question' | 'escalation' | 'fyi' | 'blocker' | 'decision_needed'

export type DetectionMethod = 'channel_monitor' | 'direct_mention' | 'email_alias' | 'keyword' | 'asana_task' | 'linear_issue' | 'jira_ticket'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  company_name: string | null
  timezone: string
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

export interface Integration {
  id: string
  user_id: string
  provider: IntegrationProvider
  access_token: string
  refresh_token: string | null
  token_expires_at: string | null
  workspace_id: string | null
  workspace_name: string | null
  is_active: boolean
  last_sync_at: string | null
  sync_error: string | null
  created_at: string
  updated_at: string
}

export interface SupervisedChannel {
  id: string
  user_id: string
  source: CommunicationProvider
  channel_id: string
  channel_name: string
  workspace_id: string | null
  workspace_name: string | null
  is_active: boolean
  created_at: string
}

export interface WorkItem {
  id: string
  user_id: string
  source: TaskProvider
  source_id: string
  title: string
  description: string | null
  status: string | null
  due_date: string | null
  assignee: string | null
  project: string | null
  url: string | null
  urgency: Urgency | null
  is_blocked: boolean
  is_surfaced: boolean
  surface_reason: string | null
  raw_data: Record<string, unknown> | null
  synced_at: string
  created_at: string
}

export interface CommunicationSignal {
  id: string
  user_id: string
  source: CommunicationProvider
  source_message_id: string
  channel_id: string
  channel_name: string | null
  sender_name: string | null
  signal_type: SignalType | null
  snippet: string | null
  timestamp: string
  is_read: boolean
  is_actioned: boolean
  raw_metadata: Record<string, unknown> | null
  created_at: string
  // Detection features
  is_from_monitored_channel?: boolean
  detected_via?: DetectionMethod
  related_work_item_id?: string
  message_url?: string // Direct link to open conversation in Slack/Teams
}

export interface DailyBrief {
  id: string
  user_id: string
  brief_date: string
  intent_mode: IntentMode
  needs_attention: WorkItem[] | Record<string, unknown>[]
  fyi_items: WorkItem[] | Record<string, unknown>[]
  handled_items: WorkItem[] | Record<string, unknown>[]
  brief_text: string | null
  audio_url: string | null
  audio_duration_seconds: number | null
  coverage_percentage: number
  total_items_processed: number
  items_surfaced: number
  generated_at: string
  created_at: string
}

export interface UserSettings {
  id: string
  user_id: string
  default_intent_mode: IntentMode
  brief_time: string
  brief_timezone: string
  voice_id: string
  audio_speed: number
  audio_enabled: boolean
  email_digest: boolean
  push_enabled: boolean
  urgency_threshold: Urgency
  max_items_per_brief: number
  created_at: string
  updated_at: string
}
export interface SyncLog {
  id: string
  user_id: string
  provider: string
  status: 'started' | 'completed' | 'failed'
  items_synced: number
  error_message: string | null
  duration_ms: number | null
  started_at: string
  completed_at: string | null
}

// Re-export database types
export type { Database } from './database'
