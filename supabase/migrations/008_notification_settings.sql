-- Migration 008: Add notification settings support
-- This enables email digests and push notifications to work properly

-- ============================================
-- 1. ADD notification_settings JSONB to profiles
-- ============================================
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{
  "emailEnabled": true,
  "emailFrequency": "daily",
  "emailTime": "09:00",
  "slackDMEnabled": false,
  "slackDMFrequency": "daily",
  "slackDMTime": "09:00",
  "pushEnabled": true,
  "realtimeAlertsEnabled": true,
  "realtimeChannels": ["email", "push"],
  "timezone": "UTC"
}'::jsonb;

-- Index for querying users with email enabled
CREATE INDEX IF NOT EXISTS idx_profiles_email_digest_enabled 
ON public.profiles ((notification_settings->>'emailEnabled'))
WHERE notification_settings->>'emailEnabled' = 'true';

-- ============================================
-- 2. CREATE push_subscriptions TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One subscription per endpoint per user (user can have multiple devices)
  UNIQUE(user_id, endpoint)
);

-- Index for fetching user's subscriptions
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON public.push_subscriptions(user_id);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for push_subscriptions
CREATE POLICY "Users can view own push subscriptions" ON public.push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own push subscriptions" ON public.push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own push subscriptions" ON public.push_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own push subscriptions" ON public.push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- Auto-update timestamp trigger
CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 3. UPDATE user_settings for better notification config
-- ============================================
-- Add more granular notification settings to user_settings
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS digest_last_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS digest_frequency TEXT DEFAULT 'daily' CHECK (digest_frequency IN ('daily', 'weekly', 'realtime'));

-- ============================================
-- 4. CREATE notification_log TABLE (for tracking/debugging)
-- ============================================
CREATE TABLE IF NOT EXISTS public.notification_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('email_digest', 'push', 'slack_dm', 'realtime')),
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'skipped')),
  recipient TEXT, -- email address or push endpoint
  subject TEXT,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for recent notifications
CREATE INDEX IF NOT EXISTS idx_notification_log_user_recent 
ON public.notification_log(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own notification log" ON public.notification_log
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert notification log" ON public.notification_log
  FOR INSERT WITH CHECK (true); -- Service role can insert for any user

-- ============================================
-- 5. CREATE VIEW for users needing digest
-- ============================================
CREATE OR REPLACE VIEW public.v_users_for_digest AS
SELECT 
  p.id as user_id,
  p.email,
  p.full_name,
  p.notification_settings,
  p.notification_settings->>'emailEnabled' as email_enabled,
  p.notification_settings->>'emailFrequency' as email_frequency,
  p.notification_settings->>'emailTime' as email_time,
  p.notification_settings->>'timezone' as timezone,
  us.digest_last_sent_at
FROM public.profiles p
LEFT JOIN public.user_settings us ON us.user_id = p.id
WHERE p.notification_settings->>'emailEnabled' = 'true';
