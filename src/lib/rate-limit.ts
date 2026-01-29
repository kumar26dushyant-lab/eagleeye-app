// Rate Limiting Utility
// Simple in-memory rate limiter for API routes

interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory store (use Redis in production for multi-instance)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean every minute

export interface RateLimitConfig {
  windowMs: number    // Time window in milliseconds
  maxRequests: number // Max requests per window
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: number
}

export function checkRateLimit(
  identifier: string, // Usually user ID or IP
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now()
  const key = identifier
  
  let entry = rateLimitStore.get(key)
  
  // Create new entry if doesn't exist or expired
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 0,
      resetAt: now + config.windowMs,
    }
    rateLimitStore.set(key, entry)
  }
  
  entry.count++
  
  const remaining = Math.max(0, config.maxRequests - entry.count)
  const success = entry.count <= config.maxRequests
  
  return {
    success,
    remaining,
    resetAt: entry.resetAt,
  }
}

// ============================================
// PRESET CONFIGURATIONS
// ============================================

export const RATE_LIMITS = {
  // API routes - general
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,     // 60 requests per minute
  },
  
  // Brief generation (expensive AI calls)
  briefGeneration: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,      // 5 per minute
  },
  
  // Audio generation (expensive)
  audioGeneration: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 3,      // 3 per minute
  },
  
  // Sync operations
  sync: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,     // 10 per minute
  },
  
  // OAuth connect attempts
  oauth: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 10,          // 10 per 5 minutes
  },
} as const

// ============================================
// MIDDLEWARE HELPER
// ============================================

import { NextResponse } from 'next/server'
import { RateLimitError } from './errors'

export function withRateLimit(
  config: RateLimitConfig,
  getIdentifier: (request: Request) => string | Promise<string>
) {
  return function <T>(
    handler: (request: Request) => Promise<NextResponse<T>>
  ) {
    return async (request: Request): Promise<NextResponse<T>> => {
      const identifier = await getIdentifier(request)
      const result = checkRateLimit(identifier, config)
      
      if (!result.success) {
        throw new RateLimitError()
      }
      
      const response = await handler(request)
      
      // Add rate limit headers
      response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
      response.headers.set('X-RateLimit-Reset', result.resetAt.toString())
      
      return response
    }
  }
}

// ============================================
// IP EXTRACTION (for unauthenticated routes)
// ============================================

export function getClientIP(request: Request): string {
  // Check various headers for proxied requests
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }
  
  // Fallback
  return 'unknown'
}
