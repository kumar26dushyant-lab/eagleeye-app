-- EagleEye Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES (extends Supabase auth.users)
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  company_name TEXT,
  timezone TEXT DEFAULT 'UTC',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for email lookups
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- ============================================
-- INTEGRATIONS (OAuth tokens for all providers)
-- ============================================
CREATE TABLE public.integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('asana', 'clickup', 'jira', 'slack', 'teams')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  workspace_id TEXT,
  workspace_name TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_sync_at TIMESTAMPTZ,
  sync_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Each user can only have one integration per provider
  UNIQUE(user_id, provider)
);

-- Index for user's integrations
CREATE INDEX idx_integrations_user ON public.integrations(user_id);
CREATE INDEX idx_integrations_provider ON public.integrations(provider);

-- ============================================
-- SUPERVISED CHANNELS (Slack/Teams channels to watch)
-- ============================================
CREATE TABLE public.supervised_channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('slack', 'teams')),
  channel_id TEXT NOT NULL,
  channel_name TEXT NOT NULL,
  workspace_id TEXT,
  workspace_name TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Each channel can only be supervised once per user
  UNIQUE(user_id, source, channel_id)
);

-- Index for user's channels
CREATE INDEX idx_supervised_channels_user ON public.supervised_channels(user_id);

-- ============================================
-- WORK ITEMS (Tasks from Asana/ClickUp/Jira)
-- ============================================
CREATE TABLE public.work_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('asana', 'clickup', 'jira')),
  source_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT,
  due_date TIMESTAMPTZ,
  assignee TEXT,
  project TEXT,
  url TEXT,
  urgency TEXT CHECK (urgency IN ('high', 'medium', 'low')),
  is_blocked BOOLEAN DEFAULT FALSE,
  is_surfaced BOOLEAN DEFAULT FALSE,
  surface_reason TEXT,
  raw_data JSONB,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Each work item unique per user and source
  UNIQUE(user_id, source, source_id)
);

-- Indexes for queries
CREATE INDEX idx_work_items_user ON public.work_items(user_id);
CREATE INDEX idx_work_items_urgency ON public.work_items(urgency);
CREATE INDEX idx_work_items_due_date ON public.work_items(due_date);
CREATE INDEX idx_work_items_surfaced ON public.work_items(is_surfaced);

-- ============================================
-- COMMUNICATION SIGNALS (from Slack/Teams)
-- ============================================
CREATE TABLE public.communication_signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('slack', 'teams')),
  source_message_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  channel_name TEXT,
  sender_name TEXT,
  signal_type TEXT CHECK (signal_type IN ('mention', 'urgent', 'question', 'escalation', 'fyi')),
  snippet TEXT, -- Short preview, not full content
  timestamp TIMESTAMPTZ NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  is_actioned BOOLEAN DEFAULT FALSE,
  raw_metadata JSONB, -- No message content, just metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, source, source_message_id)
);

-- Indexes for queries
CREATE INDEX idx_signals_user ON public.communication_signals(user_id);
CREATE INDEX idx_signals_type ON public.communication_signals(signal_type);
CREATE INDEX idx_signals_timestamp ON public.communication_signals(timestamp DESC);
CREATE INDEX idx_signals_unread ON public.communication_signals(user_id, is_read) WHERE is_read = FALSE;

-- ============================================
-- DAILY BRIEFS (Generated summaries)
-- ============================================
CREATE TABLE public.daily_briefs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  brief_date DATE NOT NULL,
  intent_mode TEXT NOT NULL CHECK (intent_mode IN ('calm', 'on_the_go', 'work', 'focus')),
  
  -- Structured content
  needs_attention JSONB DEFAULT '[]'::jsonb,
  fyi_items JSONB DEFAULT '[]'::jsonb,
  handled_items JSONB DEFAULT '[]'::jsonb,
  
  -- Generated text and audio
  brief_text TEXT,
  audio_url TEXT,
  audio_duration_seconds INTEGER,
  
  -- Coverage stats
  coverage_percentage INTEGER DEFAULT 0,
  total_items_processed INTEGER DEFAULT 0,
  items_surfaced INTEGER DEFAULT 0,
  
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One brief per user per day per mode
  UNIQUE(user_id, brief_date, intent_mode)
);

-- Index for fetching latest brief
CREATE INDEX idx_briefs_user_date ON public.daily_briefs(user_id, brief_date DESC);

-- ============================================
-- USER SETTINGS
-- ============================================
CREATE TABLE public.user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  
  -- Brief preferences
  default_intent_mode TEXT DEFAULT 'calm' CHECK (default_intent_mode IN ('calm', 'on_the_go', 'work', 'focus')),
  brief_time TIME DEFAULT '08:00',
  brief_timezone TEXT DEFAULT 'UTC',
  
  -- Audio preferences  
  voice_id TEXT DEFAULT 'alloy',
  audio_speed REAL DEFAULT 1.0,
  audio_enabled BOOLEAN DEFAULT TRUE,
  
  -- Notification preferences
  email_digest BOOLEAN DEFAULT FALSE,
  push_enabled BOOLEAN DEFAULT FALSE,
  
  -- Thresholds
  urgency_threshold TEXT DEFAULT 'medium' CHECK (urgency_threshold IN ('high', 'medium', 'low')),
  max_items_per_brief INTEGER DEFAULT 10,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SYNC LOG (for debugging/monitoring)
-- ============================================
CREATE TABLE public.sync_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
  items_synced INTEGER DEFAULT 0,
  error_message TEXT,
  duration_ms INTEGER,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Index for recent syncs
CREATE INDEX idx_sync_log_user_recent ON public.sync_log(user_id, started_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supervised_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_log ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only see/edit their own
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Integrations: Users can only manage their own
CREATE POLICY "Users can view own integrations" ON public.integrations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own integrations" ON public.integrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own integrations" ON public.integrations
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own integrations" ON public.integrations
  FOR DELETE USING (auth.uid() = user_id);

-- Supervised Channels
CREATE POLICY "Users can view own channels" ON public.supervised_channels
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own channels" ON public.supervised_channels
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own channels" ON public.supervised_channels
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own channels" ON public.supervised_channels
  FOR DELETE USING (auth.uid() = user_id);

-- Work Items
CREATE POLICY "Users can view own work items" ON public.work_items
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own work items" ON public.work_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own work items" ON public.work_items
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own work items" ON public.work_items
  FOR DELETE USING (auth.uid() = user_id);

-- Communication Signals
CREATE POLICY "Users can view own signals" ON public.communication_signals
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own signals" ON public.communication_signals
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own signals" ON public.communication_signals
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own signals" ON public.communication_signals
  FOR DELETE USING (auth.uid() = user_id);

-- Daily Briefs
CREATE POLICY "Users can view own briefs" ON public.daily_briefs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own briefs" ON public.daily_briefs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own briefs" ON public.daily_briefs
  FOR UPDATE USING (auth.uid() = user_id);

-- User Settings
CREATE POLICY "Users can view own settings" ON public.user_settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Sync Log
CREATE POLICY "Users can view own sync log" ON public.sync_log
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sync log" ON public.sync_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON public.integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name')
  );
  
  -- Also create default settings
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- VIEWS (for common queries)
-- ============================================

-- Active integrations view
CREATE VIEW public.v_active_integrations AS
SELECT 
  i.*,
  p.email as user_email
FROM public.integrations i
JOIN public.profiles p ON p.id = i.user_id
WHERE i.is_active = TRUE;

-- Items needing attention (high urgency or blocked)
CREATE VIEW public.v_needs_attention AS
SELECT * FROM public.work_items
WHERE is_surfaced = TRUE 
  AND (urgency = 'high' OR is_blocked = TRUE)
ORDER BY 
  CASE WHEN is_blocked THEN 0 ELSE 1 END,
  due_date NULLS LAST;
