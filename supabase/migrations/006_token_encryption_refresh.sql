-- ============================================
-- TOKEN ENCRYPTION & REFRESH MIGRATION
-- Run this in Supabase SQL Editor
-- Date: February 5, 2026
-- ============================================

-- Step 1: Ensure token_expires_at column exists
-- This column tracks when OAuth tokens expire for auto-refresh
ALTER TABLE integrations 
ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ;

-- Step 2: Ensure all required providers are allowed
-- The code uses: slack, asana, linear, github, notion, whatsapp, jira, teams, clickup
ALTER TABLE integrations DROP CONSTRAINT IF EXISTS integrations_provider_check;

ALTER TABLE integrations ADD CONSTRAINT integrations_provider_check 
  CHECK (provider IN ('slack', 'asana', 'linear', 'github', 'notion', 'whatsapp', 'jira', 'teams', 'clickup'));

-- Step 3: Add updated_at column if it doesn't exist (for tracking token refreshes)
ALTER TABLE integrations 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Step 4: Create an index on token_expires_at for efficient refresh queries
CREATE INDEX IF NOT EXISTS idx_integrations_token_expires 
ON integrations (token_expires_at) 
WHERE token_expires_at IS NOT NULL AND is_active = true;

-- Step 5: Create an index for looking up integrations by user and provider
CREATE INDEX IF NOT EXISTS idx_integrations_user_provider 
ON integrations (user_id, provider);

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'integrations' 
  AND column_name IN ('token_expires_at', 'updated_at', 'refresh_token');

-- View constraint
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'integrations_provider_check';
