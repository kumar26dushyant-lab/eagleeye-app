-- Subscriptions and Trial Management
-- Run this in your Supabase SQL Editor

-- ============================================
-- SUBSCRIPTIONS TABLE
-- ============================================
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  
  -- Subscription status
  status TEXT NOT NULL DEFAULT 'trialing' CHECK (status IN ('trialing', 'active', 'past_due', 'cancelled', 'expired')),
  tier TEXT NOT NULL DEFAULT 'trial' CHECK (tier IN ('trial', 'founder', 'team', 'enterprise')),
  
  -- Trial tracking
  trial_started_at TIMESTAMPTZ DEFAULT NOW(),
  trial_ends_at TIMESTAMPTZ,
  
  -- Stripe integration
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  
  -- Billing cycle
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  
  -- Email reminder tracking
  welcome_email_sent BOOLEAN DEFAULT FALSE,
  day3_reminder_sent BOOLEAN DEFAULT FALSE,
  day1_reminder_sent BOOLEAN DEFAULT FALSE,
  expired_email_sent BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for lookups
CREATE INDEX idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer ON public.subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);

-- Function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_subscription_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscription_updated
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_timestamp();

-- RLS Policies
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only read their own subscription
CREATE POLICY "Users can read own subscription"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own subscription
CREATE POLICY "Users can update own subscription"
  ON public.subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow insert from service role (for signup)
CREATE POLICY "Service role can insert subscriptions"
  ON public.subscriptions
  FOR INSERT
  WITH CHECK (true);

-- ============================================
-- FUNCTION: Auto-create trial on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, status, tier, trial_started_at, trial_ends_at)
  VALUES (
    NEW.id,
    'trialing',
    'trial',
    NOW(),
    NOW() + INTERVAL '14 days'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create subscription when profile is created
CREATE TRIGGER on_profile_created_create_subscription
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_subscription();
