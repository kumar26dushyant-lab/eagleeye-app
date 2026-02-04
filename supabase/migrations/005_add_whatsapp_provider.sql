-- ============================================
-- ADD WHATSAPP PROVIDER TO EAGLEEYE
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Update integrations table to allow 'whatsapp' provider
-- The table uses a CHECK constraint, not an ENUM, so we need to drop and recreate

-- Drop the old constraint
ALTER TABLE integrations DROP CONSTRAINT IF EXISTS integrations_provider_check;

-- Add new constraint with whatsapp included
ALTER TABLE integrations ADD CONSTRAINT integrations_provider_check 
  CHECK (provider IN ('slack', 'asana', 'linear', 'github', 'notion', 'whatsapp'));

-- Step 2: Update communication_signals table to allow 'whatsapp' source
ALTER TABLE public.communication_signals DROP CONSTRAINT IF EXISTS communication_signals_source_check;

ALTER TABLE public.communication_signals ADD CONSTRAINT communication_signals_source_check 
  CHECK (source IN ('slack', 'teams', 'whatsapp'));

-- Step 3: Add additional signal types for WhatsApp business context
ALTER TABLE public.communication_signals DROP CONSTRAINT IF EXISTS communication_signals_signal_type_check;

ALTER TABLE public.communication_signals ADD CONSTRAINT communication_signals_signal_type_check 
  CHECK (signal_type IN (
    'mention', 'urgent', 'question', 'escalation', 'fyi',
    'order', 'complaint', 'positive_feedback', 'payment', 'delivery'
  ));

-- Verify the changes
-- SELECT constraint_name, check_clause 
-- FROM information_schema.check_constraints 
-- WHERE constraint_schema = 'public';
