// Environment Variable Validation
// Validates all required env vars at startup

import { z } from 'zod'

// ============================================
// SCHEMA DEFINITION
// ============================================

const envSchema = z.object({
  // App
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(), // Optional for client-only ops
  
  // OpenAI
  OPENAI_API_KEY: z.string().startsWith('sk-').optional(),
  
  // ElevenLabs
  ELEVENLABS_API_KEY: z.string().optional(),
  ELEVENLABS_VOICE_ID: z.string().optional(),
  
  // Asana OAuth
  ASANA_CLIENT_ID: z.string().optional(),
  ASANA_CLIENT_SECRET: z.string().optional(),
  
  // ClickUp OAuth
  CLICKUP_CLIENT_ID: z.string().optional(),
  CLICKUP_CLIENT_SECRET: z.string().optional(),
  
  // Jira OAuth
  JIRA_CLIENT_ID: z.string().optional(),
  JIRA_CLIENT_SECRET: z.string().optional(),
  
  // Slack OAuth
  SLACK_CLIENT_ID: z.string().optional(),
  SLACK_CLIENT_SECRET: z.string().optional(),
  
  // Microsoft Teams OAuth
  TEAMS_CLIENT_ID: z.string().optional(),
  TEAMS_CLIENT_SECRET: z.string().optional(),
  
  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).optional(),
})

// ============================================
// VALIDATION
// ============================================

export type Env = z.infer<typeof envSchema>

let cachedEnv: Env | null = null

export function validateEnv(): Env {
  if (cachedEnv) return cachedEnv

  const result = envSchema.safeParse(process.env)
  
  if (!result.success) {
    console.error('❌ Invalid environment variables:')
    console.error(result.error.message)
    
    // In production, throw. In dev, warn but continue.
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Invalid environment configuration')
    }
  }

  cachedEnv = result.data as Env
  return cachedEnv
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getEnv(): Env {
  return validateEnv()
}

export function isIntegrationConfigured(provider: string): boolean {
  const env = getEnv()
  
  switch (provider) {
    case 'asana':
      return !!(env.ASANA_CLIENT_ID && env.ASANA_CLIENT_SECRET)
    case 'clickup':
      return !!(env.CLICKUP_CLIENT_ID && env.CLICKUP_CLIENT_SECRET)
    case 'jira':
      return !!(env.JIRA_CLIENT_ID && env.JIRA_CLIENT_SECRET)
    case 'slack':
      return !!(env.SLACK_CLIENT_ID && env.SLACK_CLIENT_SECRET)
    case 'teams':
      return !!(env.TEAMS_CLIENT_ID && env.TEAMS_CLIENT_SECRET)
    default:
      return false
  }
}

export function isAIConfigured(): boolean {
  const env = getEnv()
  return !!env.OPENAI_API_KEY
}

export function isAudioConfigured(): boolean {
  const env = getEnv()
  return !!(env.ELEVENLABS_API_KEY && env.ELEVENLABS_VOICE_ID)
}

// ============================================
// TYPE-SAFE GETTERS
// ============================================

export function getSupabaseUrl(): string {
  return getEnv().NEXT_PUBLIC_SUPABASE_URL
}

export function getSupabaseAnonKey(): string {
  return getEnv().NEXT_PUBLIC_SUPABASE_ANON_KEY
}

export function getAppUrl(): string {
  return getEnv().NEXT_PUBLIC_APP_URL
}

export function getOpenAIKey(): string | undefined {
  return getEnv().OPENAI_API_KEY
}

export function getElevenLabsConfig(): { apiKey: string; voiceId: string } | null {
  const env = getEnv()
  if (!env.ELEVENLABS_API_KEY || !env.ELEVENLABS_VOICE_ID) return null
  return {
    apiKey: env.ELEVENLABS_API_KEY,
    voiceId: env.ELEVENLABS_VOICE_ID,
  }
}
