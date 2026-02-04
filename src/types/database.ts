// Auto-generated Supabase types
// Run `npx supabase gen types typescript --project-id <your-project-id> > src/types/database.ts`
// to regenerate from your actual database schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          timezone: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          timezone?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          timezone?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      integrations: {
        Row: {
          id: string
          user_id: string
          provider: 'asana' | 'clickup' | 'jira' | 'slack' | 'teams' | 'whatsapp'
          access_token: string
          refresh_token: string | null
          token_expires_at: string | null
          workspace_id: string | null
          workspace_name: string | null
          connected_at: string
          last_sync_at: string | null
          sync_enabled: boolean
          metadata: Json
        }
        Insert: {
          id?: string
          user_id: string
          provider: 'asana' | 'clickup' | 'jira' | 'slack' | 'teams' | 'whatsapp'
          access_token: string
          refresh_token?: string | null
          token_expires_at?: string | null
          workspace_id?: string | null
          workspace_name?: string | null
          connected_at?: string
          last_sync_at?: string | null
          sync_enabled?: boolean
          metadata?: Json
        }
        Update: {
          id?: string
          user_id?: string
          provider?: 'asana' | 'clickup' | 'jira' | 'slack' | 'teams' | 'whatsapp'
          access_token?: string
          refresh_token?: string | null
          token_expires_at?: string | null
          workspace_id?: string | null
          workspace_name?: string | null
          connected_at?: string
          last_sync_at?: string | null
          sync_enabled?: boolean
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: 'integrations_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      supervised_channels: {
        Row: {
          id: string
          user_id: string
          integration_id: string
          channel_id: string
          channel_name: string
          channel_type: 'public' | 'private' | 'dm' | 'group'
          is_supervised: boolean
          priority: 'high' | 'normal' | 'low'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          integration_id: string
          channel_id: string
          channel_name: string
          channel_type?: 'public' | 'private' | 'dm' | 'group'
          is_supervised?: boolean
          priority?: 'high' | 'normal' | 'low'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          integration_id?: string
          channel_id?: string
          channel_name?: string
          channel_type?: 'public' | 'private' | 'dm' | 'group'
          is_supervised?: boolean
          priority?: 'high' | 'normal' | 'low'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'supervised_channels_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'supervised_channels_integration_id_fkey'
            columns: ['integration_id']
            isOneToOne: false
            referencedRelation: 'integrations'
            referencedColumns: ['id']
          }
        ]
      }
      work_items: {
        Row: {
          id: string
          user_id: string
          integration_id: string
          external_id: string
          provider: 'asana' | 'clickup' | 'jira'
          title: string
          description: string | null
          status: string | null
          priority: string | null
          due_date: string | null
          assignee_name: string | null
          project_name: string | null
          url: string | null
          raw_data: Json
          importance_score: number | null
          importance_signals: string[]
          synced_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          integration_id: string
          external_id: string
          provider: 'asana' | 'clickup' | 'jira'
          title: string
          description?: string | null
          status?: string | null
          priority?: string | null
          due_date?: string | null
          assignee_name?: string | null
          project_name?: string | null
          url?: string | null
          raw_data?: Json
          importance_score?: number | null
          importance_signals?: string[]
          synced_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          integration_id?: string
          external_id?: string
          provider?: 'asana' | 'clickup' | 'jira'
          title?: string
          description?: string | null
          status?: string | null
          priority?: string | null
          due_date?: string | null
          assignee_name?: string | null
          project_name?: string | null
          url?: string | null
          raw_data?: Json
          importance_score?: number | null
          importance_signals?: string[]
          synced_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'work_items_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'work_items_integration_id_fkey'
            columns: ['integration_id']
            isOneToOne: false
            referencedRelation: 'integrations'
            referencedColumns: ['id']
          }
        ]
      }
      communication_signals: {
        Row: {
          id: string
          user_id: string
          integration_id: string
          channel_id: string | null
          message_id: string | null
          provider: 'slack' | 'teams' | 'whatsapp'
          signal_type: 'mention' | 'dm' | 'urgent' | 'question' | 'blocker' | 'escalation' | 'order' | 'complaint' | 'positive_feedback'
          sender_name: string | null
          content_preview: string | null
          url: string | null
          importance_score: number | null
          raw_data: Json
          synced_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          integration_id: string
          channel_id?: string | null
          message_id?: string | null
          provider: 'slack' | 'teams' | 'whatsapp'
          signal_type: 'mention' | 'dm' | 'urgent' | 'question' | 'blocker' | 'escalation' | 'order' | 'complaint' | 'positive_feedback'
          sender_name?: string | null
          content_preview?: string | null
          url?: string | null
          importance_score?: number | null
          raw_data?: Json
          synced_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          integration_id?: string
          channel_id?: string | null
          message_id?: string | null
          provider?: 'slack' | 'teams' | 'whatsapp'
          signal_type?: 'mention' | 'dm' | 'urgent' | 'question' | 'blocker' | 'escalation' | 'order' | 'complaint' | 'positive_feedback'
          sender_name?: string | null
          content_preview?: string | null
          url?: string | null
          importance_score?: number | null
          raw_data?: Json
          synced_at?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'communication_signals_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'communication_signals_integration_id_fkey'
            columns: ['integration_id']
            isOneToOne: false
            referencedRelation: 'integrations'
            referencedColumns: ['id']
          }
        ]
      }
      daily_briefs: {
        Row: {
          id: string
          user_id: string
          brief_date: string
          intent_mode: 'calm' | 'on_the_go' | 'work' | 'focus'
          text_content: string
          audio_url: string | null
          items_count: number
          signals_included: string[]
          generated_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          brief_date: string
          intent_mode: 'calm' | 'on_the_go' | 'work' | 'focus'
          text_content: string
          audio_url?: string | null
          items_count?: number
          signals_included?: string[]
          generated_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          brief_date?: string
          intent_mode?: 'calm' | 'on_the_go' | 'work' | 'focus'
          text_content?: string
          audio_url?: string | null
          items_count?: number
          signals_included?: string[]
          generated_at?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'daily_briefs_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          importance_threshold: number
          brief_delivery_time: string
          enable_audio_briefs: boolean
          audio_voice_id: string | null
          email_notifications: boolean
          push_notifications: boolean
          weekend_briefs: boolean
          default_intent_mode: 'calm' | 'on_the_go' | 'work' | 'focus'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          importance_threshold?: number
          brief_delivery_time?: string
          enable_audio_briefs?: boolean
          audio_voice_id?: string | null
          email_notifications?: boolean
          push_notifications?: boolean
          weekend_briefs?: boolean
          default_intent_mode?: 'calm' | 'on_the_go' | 'work' | 'focus'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          importance_threshold?: number
          brief_delivery_time?: string
          enable_audio_briefs?: boolean
          audio_voice_id?: string | null
          email_notifications?: boolean
          push_notifications?: boolean
          weekend_briefs?: boolean
          default_intent_mode?: 'calm' | 'on_the_go' | 'work' | 'focus'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_settings_user_id_fkey'
            columns: ['user_id']
            isOneToOne: true
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      sync_log: {
        Row: {
          id: string
          user_id: string
          integration_id: string | null
          sync_type: 'full' | 'incremental' | 'manual'
          status: 'started' | 'completed' | 'failed'
          items_synced: number
          error_message: string | null
          started_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          integration_id?: string | null
          sync_type: 'full' | 'incremental' | 'manual'
          status?: 'started' | 'completed' | 'failed'
          items_synced?: number
          error_message?: string | null
          started_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          integration_id?: string | null
          sync_type?: 'full' | 'incremental' | 'manual'
          status?: 'started' | 'completed' | 'failed'
          items_synced?: number
          error_message?: string | null
          started_at?: string
          completed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'sync_log_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'sync_log_integration_id_fkey'
            columns: ['integration_id']
            isOneToOne: false
            referencedRelation: 'integrations'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      channel_type: 'public' | 'private' | 'dm' | 'group'
      intent_mode: 'calm' | 'on_the_go' | 'work' | 'focus'
      integration_provider: 'asana' | 'clickup' | 'jira' | 'slack' | 'teams'
      priority_level: 'high' | 'normal' | 'low'
      signal_type: 'mention' | 'dm' | 'urgent' | 'question' | 'blocker' | 'escalation'
      sync_status: 'started' | 'completed' | 'failed'
      sync_type: 'full' | 'incremental' | 'manual'
      work_item_provider: 'asana' | 'clickup' | 'jira'
    }
  }
}

// Helper types for easier usage
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

// Convenient type aliases
export type Profile = Tables<'profiles'>
export type Integration = Tables<'integrations'>
export type SupervisedChannel = Tables<'supervised_channels'>
export type WorkItem = Tables<'work_items'>
export type CommunicationSignal = Tables<'communication_signals'>
export type DailyBrief = Tables<'daily_briefs'>
export type UserSettings = Tables<'user_settings'>
export type SyncLogEntry = Tables<'sync_log'>

// Insert types
export type InsertProfile = InsertTables<'profiles'>
export type InsertIntegration = InsertTables<'integrations'>
export type InsertSupervisedChannel = InsertTables<'supervised_channels'>
export type InsertWorkItem = InsertTables<'work_items'>
export type InsertCommunicationSignal = InsertTables<'communication_signals'>
export type InsertDailyBrief = InsertTables<'daily_briefs'>
export type InsertUserSettings = InsertTables<'user_settings'>
export type InsertSyncLog = InsertTables<'sync_log'>

// Enum types
export type IntentMode = Enums<'intent_mode'>
export type IntegrationProvider = Enums<'integration_provider'>
export type ChannelType = Enums<'channel_type'>
export type SignalType = Enums<'signal_type'>
export type SyncStatus = Enums<'sync_status'>
export type SyncType = Enums<'sync_type'>
