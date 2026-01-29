-- Create integrations table to store user OAuth tokens
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('slack', 'asana', 'linear', 'github', 'notion')),
  
  -- OAuth tokens (encrypt in production!)
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  
  -- Provider-specific data
  team_id TEXT,
  team_name TEXT,
  authed_user_id TEXT,
  scopes TEXT,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_sync_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Each user can only have one connection per provider
  UNIQUE(user_id, provider)
);

-- Enable RLS
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- Users can only see their own integrations
CREATE POLICY "Users can view own integrations" ON integrations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own integrations" ON integrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own integrations" ON integrations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own integrations" ON integrations
  FOR DELETE USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_integrations_user_id ON integrations(user_id);
CREATE INDEX idx_integrations_provider ON integrations(provider);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER integrations_updated_at
  BEFORE UPDATE ON integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
