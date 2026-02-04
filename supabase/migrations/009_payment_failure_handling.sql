-- Payment Failure & Grace Period Handling
-- Run this in your Supabase SQL Editor

-- ============================================
-- ENSURE customer_email COLUMN EXISTS
-- (Required for Dodo webhook lookups)
-- ============================================
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS customer_email TEXT;

-- Create unique index on customer_email for lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_customer_email 
ON public.subscriptions(customer_email) 
WHERE customer_email IS NOT NULL;

-- Backfill customer_email from profiles table for existing records
UPDATE public.subscriptions s
SET customer_email = LOWER(p.email)
FROM public.profiles p
WHERE s.user_id = p.id AND s.customer_email IS NULL;

-- ============================================
-- ADD PAYMENT FAILURE FIELDS TO SUBSCRIPTIONS
-- ============================================

-- Add new status to existing check constraint
ALTER TABLE public.subscriptions 
DROP CONSTRAINT IF EXISTS subscriptions_status_check;

ALTER TABLE public.subscriptions 
ADD CONSTRAINT subscriptions_status_check 
CHECK (status IN ('trialing', 'active', 'past_due', 'payment_failed', 'grace_period', 'cancelled', 'expired', 'deleted', 'refunded'));

-- Add payment failure tracking fields
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS payment_failed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS grace_period_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_retry_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_payment_error TEXT,
ADD COLUMN IF NOT EXISTS payment_failed_email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS grace_period_email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS account_deletion_scheduled_at TIMESTAMPTZ;

-- Index for cleanup cron to find accounts to delete
CREATE INDEX IF NOT EXISTS idx_subscriptions_grace_period 
ON public.subscriptions(status, grace_period_ends_at) 
WHERE status IN ('payment_failed', 'grace_period');

CREATE INDEX IF NOT EXISTS idx_subscriptions_deletion 
ON public.subscriptions(account_deletion_scheduled_at) 
WHERE account_deletion_scheduled_at IS NOT NULL;

-- ============================================
-- PAYMENT FAILURE LOG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.payment_failure_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  customer_email TEXT NOT NULL,
  failure_reason TEXT,
  payment_provider TEXT DEFAULT 'dodo',
  payment_id TEXT,
  amount TEXT,
  attempted_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT, -- 'auto_retry', 'manual', 'support'
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_payment_failures_email 
ON public.payment_failure_logs(customer_email);

CREATE INDEX IF NOT EXISTS idx_payment_failures_unresolved 
ON public.payment_failure_logs(resolved_at) 
WHERE resolved_at IS NULL;

-- RLS for payment failure logs
ALTER TABLE public.payment_failure_logs ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role full access on payment_failure_logs"
ON public.payment_failure_logs
FOR ALL
USING (true)
WITH CHECK (true);

-- ============================================
-- REACTIVATION TOKENS TABLE (for support-assisted reactivation)
-- ============================================
CREATE TABLE IF NOT EXISTS public.reactivation_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  created_by TEXT, -- support agent email
  reason TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reactivation_tokens_email 
ON public.reactivation_tokens(customer_email);

CREATE INDEX IF NOT EXISTS idx_reactivation_tokens_token 
ON public.reactivation_tokens(token);

-- RLS for reactivation tokens
ALTER TABLE public.reactivation_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on reactivation_tokens"
ON public.reactivation_tokens
FOR ALL
USING (true)
WITH CHECK (true);

COMMENT ON TABLE public.payment_failure_logs IS 'Tracks payment failures for audit and support';
COMMENT ON TABLE public.reactivation_tokens IS 'Tokens for support-assisted account reactivation without new trial';
