// API Middleware Composition
// Combines validation, rate limiting, error handling, and auth into reusable handlers

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from './supabase/server'
import { handleApiError, logger, UnauthorizedError } from './errors'
import { checkRateLimit, RateLimitConfig, RATE_LIMITS, getClientIP } from './rate-limit'

// ============================================
// TYPES
// ============================================

export interface ApiContext {
  userId: string
  request: Request
}

export interface ApiOptions<TInput> {
  // Authentication
  requireAuth?: boolean
  
  // Rate limiting
  rateLimit?: RateLimitConfig | keyof typeof RATE_LIMITS
  
  // Input validation
  schema?: z.ZodSchema<TInput>
  
  // Logging
  logRequest?: boolean
}

type ApiHandler<TInput, TOutput> = (
  input: TInput,
  context: ApiContext
) => Promise<TOutput>

// ============================================
// API WRAPPER
// ============================================

/**
 * Creates a type-safe, validated, rate-limited API handler
 * 
 * @example
 * export const POST = createApiHandler({
 *   requireAuth: true,
 *   rateLimit: 'briefGeneration',
 *   schema: GenerateBriefRequestSchema,
 * }, async (input, { userId }) => {
 *   // input is typed from schema
 *   // userId is guaranteed to exist
 *   return { success: true }
 * })
 */
export function createApiHandler<TInput, TOutput>(
  options: ApiOptions<TInput>,
  handler: ApiHandler<TInput, TOutput>
) {
  return async (request: Request): Promise<NextResponse> => {
    const startTime = Date.now()
    let userId: string | null = null
    
    try {
      // 1. Authentication check
      if (options.requireAuth !== false) {
        const supabase = await createClient()
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error || !user) {
          throw new UnauthorizedError()
        }
        
        userId = user.id
      }
      
      // 2. Rate limiting
      if (options.rateLimit) {
        const config = typeof options.rateLimit === 'string' 
          ? RATE_LIMITS[options.rateLimit]
          : options.rateLimit
        
        const identifier = userId || getClientIP(request)
        const result = checkRateLimit(identifier, config)
        
        if (!result.success) {
          return NextResponse.json(
            { error: 'Too many requests', retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000) },
            { 
              status: 429,
              headers: {
                'Retry-After': Math.ceil((result.resetAt - Date.now()) / 1000).toString(),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': result.resetAt.toString(),
              }
            }
          )
        }
      }
      
      // 3. Parse and validate input
      let input: TInput = undefined as TInput
      
      if (options.schema) {
        const body = await request.json().catch(() => ({}))
        const parsed = options.schema.safeParse(body)
        
        if (!parsed.success) {
          return NextResponse.json(
            { 
              error: 'Validation failed',
              details: parsed.error.message
            },
            { status: 400 }
          )
        }
        
        input = parsed.data
      }
      
      // 4. Execute handler
      const result = await handler(input, { 
        userId: userId || '',
        request,
      })
      
      // 5. Log success
      if (options.logRequest !== false) {
        const duration = Date.now() - startTime
        logger.info('API request completed', {
          method: request.method,
          url: request.url,
          userId,
          duration: `${duration}ms`,
        })
      }
      
      // 6. Return response
      return NextResponse.json(result)
      
    } catch (error) {
      // Log error
      const duration = Date.now() - startTime
      logger.error('API request failed', {
        error,
        method: request.method,
        url: request.url,
        userId,
        duration: `${duration}ms`,
      })
      
      return handleApiError(error)
    }
  }
}

// ============================================
// SPECIALIZED HANDLERS
// ============================================

/**
 * Create a handler for GET requests (no body validation)
 */
export function createGetHandler<TOutput>(
  options: Omit<ApiOptions<never>, 'schema'>,
  handler: (context: ApiContext) => Promise<TOutput>
) {
  return createApiHandler<never, TOutput>(options, (_, context) => handler(context))
}

/**
 * Create a public API handler (no auth required)
 */
export function createPublicHandler<TInput, TOutput>(
  options: Omit<ApiOptions<TInput>, 'requireAuth'>,
  handler: ApiHandler<TInput, TOutput>
) {
  return createApiHandler({ ...options, requireAuth: false }, handler)
}

// ============================================
// QUERY PARAMS HELPER
// ============================================

export function parseQueryParams<T extends z.ZodSchema>(
  request: Request,
  schema: T
): z.infer<T> | null {
  const url = new URL(request.url)
  const params: Record<string, string> = {}
  
  url.searchParams.forEach((value, key) => {
    params[key] = value
  })
  
  const result = schema.safeParse(params)
  return result.success ? result.data : null
}

// ============================================
// RESPONSE HELPERS
// ============================================

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json(data, { status })
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export function redirectResponse(url: string) {
  return NextResponse.redirect(url)
}
