-- Add Dodo Payments columns to subscriptions table
-- Run this in Supabase SQL Editor

-- Add Dodo-specific columns
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS dodo_customer_id TEXT,
ADD COLUMN IF NOT EXISTS dodo_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS dodo_payment_id TEXT;

-- Create indexes for Dodo lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_dodo_customer ON public.subscriptions(dodo_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_dodo_subscription ON public.subscriptions(dodo_subscription_id);

-- Update tier check constraint to include 'solo' as alias for 'founder'
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_tier_check;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_tier_check 
  CHECK (tier IN ('trial', 'founder', 'solo', 'team', 'enterprise'));

-- Update status check constraint to include 'refunded'
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_status_check 
  CHECK (status IN ('trialing', 'active', 'past_due', 'cancelled', 'expired', 'refunded'));
