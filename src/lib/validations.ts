// Zod Validation Schemas
// Type-safe runtime validation for API inputs

import { z } from 'zod'

// ============================================
// COMMON SCHEMAS
// ============================================

export const IntentModeSchema = z.enum(['calm', 'on_the_go', 'work', 'focus'])
export type IntentMode = z.infer<typeof IntentModeSchema>

export const IntegrationProviderSchema = z.enum(['asana', 'clickup', 'jira', 'slack', 'teams', 'whatsapp'])
export type IntegrationProvider = z.infer<typeof IntegrationProviderSchema>

export const UrgencyLevelSchema = z.enum(['high', 'medium', 'low'])
export type UrgencyLevel = z.infer<typeof UrgencyLevelSchema>

export const SignalTypeSchema = z.enum(['mention', 'urgent', 'question', 'escalation', 'fyi'])
export type SignalType = z.infer<typeof SignalTypeSchema>

// ============================================
// API REQUEST SCHEMAS
// ============================================

// Brief generation request
export const GenerateBriefRequestSchema = z.object({
  intentMode: IntentModeSchema.optional().default('calm'),
  forceRefresh: z.boolean().optional().default(false),
})
export type GenerateBriefRequest = z.infer<typeof GenerateBriefRequestSchema>

// Settings update request
export const UpdateSettingsRequestSchema = z.object({
  defaultIntentMode: IntentModeSchema.optional(),
  briefTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format').optional(),
  briefTimezone: z.string().optional(),
  voiceId: z.string().optional(),
  audioSpeed: z.number().min(0.5).max(2.0).optional(),
  audioEnabled: z.boolean().optional(),
  emailDigest: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
  urgencyThreshold: UrgencyLevelSchema.optional(),
  maxItemsPerBrief: z.number().min(1).max(50).optional(),
})
export type UpdateSettingsRequest = z.infer<typeof UpdateSettingsRequestSchema>

// Slack channel selection
export const SaveSlackChannelsRequestSchema = z.object({
  channelIds: z.array(z.string()),
})
export type SaveSlackChannelsRequest = z.infer<typeof SaveSlackChannelsRequestSchema>

// Teams channel selection
export const SaveTeamsChannelsRequestSchema = z.object({
  channelIds: z.array(z.object({
    channelId: z.string(),
    teamId: z.string(),
    channelName: z.string(),
    teamName: z.string(),
  })),
})
export type SaveTeamsChannelsRequest = z.infer<typeof SaveTeamsChannelsRequestSchema>

// Profile update
export const UpdateProfileRequestSchema = z.object({
  fullName: z.string().min(1).max(100).optional(),
  companyName: z.string().max(100).optional(),
  timezone: z.string().optional(),
})
export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequestSchema>

// ============================================
// RESPONSE SCHEMAS
// ============================================

export const BriefItemSchema = z.object({
  id: z.string(),
  source: IntegrationProviderSchema,
  title: z.string(),
  summary: z.string().optional(),
  urgency: UrgencyLevelSchema,
  reason: z.string(),
  url: z.string().url().optional(),
  dueDate: z.string().datetime().optional(),
  project: z.string().optional(),
})
export type BriefItem = z.infer<typeof BriefItemSchema>

export const DailyBriefResponseSchema = z.object({
  id: z.string(),
  date: z.string(),
  intentMode: IntentModeSchema,
  needsAttention: z.array(BriefItemSchema),
  fyiItems: z.array(BriefItemSchema),
  handledItems: z.array(BriefItemSchema),
  briefText: z.string().optional(),
  audioUrl: z.string().url().optional(),
  coveragePercentage: z.number().min(0).max(100),
  generatedAt: z.string().datetime(),
})
export type DailyBriefResponse = z.infer<typeof DailyBriefResponseSchema>

// ============================================
// VALIDATION HELPER
// ============================================

export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data)
  
  if (result.success) {
    return { success: true, data: result.data }
  }
  
  const errorMessages = result.error.message
  
  return { success: false, error: errorMessages }
}

// ============================================
// API ROUTE HELPER
// ============================================

import { NextResponse } from 'next/server'

export function withValidation<T>(
  schema: z.ZodSchema<T>,
  handler: (data: T) => Promise<NextResponse>
) {
  return async (request: Request) => {
    try {
      const body = await request.json()
      const validation = validateRequest(schema, body)
      
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: validation.error },
          { status: 400 }
        )
      }
      
      return handler(validation.data)
    } catch (error) {
      if (error instanceof SyntaxError) {
        return NextResponse.json(
          { error: 'Invalid JSON' },
          { status: 400 }
        )
      }
      throw error
    }
  }
}
