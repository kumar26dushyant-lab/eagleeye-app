// Error Handling Utilities
// Consistent error responses and logging

import { NextResponse } from 'next/server'
import { ServiceError } from './services'
import { ZodError } from 'zod'

// ============================================
// ERROR TYPES
// ============================================

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED')
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN')
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not found') {
    super(message, 404, 'NOT_FOUND')
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', public details?: string) {
    super(message, 400, 'VALIDATION_ERROR')
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED')
  }
}

export class IntegrationError extends AppError {
  constructor(
    message: string,
    public provider: string,
    public originalError?: unknown
  ) {
    super(message, 502, 'INTEGRATION_ERROR')
  }
}

// ============================================
// ERROR HANDLER
// ============================================

interface ErrorResponse {
  error: string
  code?: string
  details?: string
}

export function handleApiError(error: unknown): NextResponse<ErrorResponse> {
  // Log error for debugging (would send to monitoring in production)
  console.error('[API Error]', error)

  // Known error types
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        details: error instanceof ValidationError ? error.details : undefined,
      },
      { status: error.statusCode }
    )
  }

  if (error instanceof ServiceError) {
    return NextResponse.json(
      { error: error.message, code: 'SERVICE_ERROR' },
      { status: 500 }
    )
  }

  if (error instanceof ZodError) {
    const zodErrors = error.format() as { _errors?: string[] }
    const details = zodErrors._errors?.join(', ') || error.message
    return NextResponse.json(
      { error: 'Validation failed', code: 'VALIDATION_ERROR', details },
      { status: 400 }
    )
  }

  // OAuth errors from external providers
  if (error instanceof Error && error.message.includes('token')) {
    return NextResponse.json(
      { error: 'Authentication expired. Please reconnect.', code: 'TOKEN_EXPIRED' },
      { status: 401 }
    )
  }

  // Network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return NextResponse.json(
      { error: 'Failed to connect to external service', code: 'NETWORK_ERROR' },
      { status: 502 }
    )
  }

  // Unknown errors
  return NextResponse.json(
    { error: 'An unexpected error occurred', code: 'INTERNAL_ERROR' },
    { status: 500 }
  )
}

// ============================================
// API ROUTE WRAPPER
// ============================================

type ApiHandler = (request: Request) => Promise<NextResponse>

export function withErrorHandling(handler: ApiHandler): ApiHandler {
  return async (request: Request) => {
    try {
      return await handler(request)
    } catch (error) {
      return handleApiError(error)
    }
  }
}

// ============================================
// AUTH CHECK HELPER
// ============================================

import { createClient } from '@/lib/supabase/server'

export async function requireAuth() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new UnauthorizedError()
  }
  
  return user
}

// ============================================
// INTEGRATION CHECK HELPER
// ============================================

import { IntegrationService } from './services'
import type { IntegrationProvider } from '@/types'

export async function requireIntegration(
  userId: string,
  provider: IntegrationProvider
) {
  const integration = await IntegrationService.getByProvider(userId, provider)
  
  if (!integration) {
    throw new AppError(
      `${provider.charAt(0).toUpperCase() + provider.slice(1)} not connected`,
      400,
      'INTEGRATION_NOT_CONNECTED'
    )
  }
  
  return integration
}

// ============================================
// LOGGING UTILITIES
// ============================================

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const CURRENT_LOG_LEVEL = (process.env.LOG_LEVEL as LogLevel) || 'info'

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[CURRENT_LOG_LEVEL]
}

export const logger = {
  debug: (message: string, data?: unknown) => {
    if (shouldLog('debug')) {
      console.debug(`[DEBUG] ${message}`, data || '')
    }
  },
  
  info: (message: string, data?: unknown) => {
    if (shouldLog('info')) {
      console.info(`[INFO] ${message}`, data || '')
    }
  },
  
  warn: (message: string, data?: unknown) => {
    if (shouldLog('warn')) {
      console.warn(`[WARN] ${message}`, data || '')
    }
  },
  
  error: (message: string, error?: unknown) => {
    if (shouldLog('error')) {
      console.error(`[ERROR] ${message}`, error || '')
    }
  },

  // Structured logging for sync operations
  sync: (provider: string, action: string, details?: Record<string, unknown>) => {
    if (shouldLog('info')) {
      console.info(`[SYNC] [${provider.toUpperCase()}] ${action}`, details || '')
    }
  },
}
