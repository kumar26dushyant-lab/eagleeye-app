import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTrialStatus } from '@/lib/trial/manager'

/**
 * Protected routes that require active subscription OR trial
 */
const PROTECTED_ROUTES = [
  '/dashboard',
  '/settings',
  '/integrations',
  '/insights',
  '/reports',
]

/**
 * Public routes that anyone can access
 */
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/pricing',
  '/about',
  '/privacy',
  '/terms',
  '/api/auth',
  '/api/payments',
]

/**
 * Check if a path matches any of the given routes
 */
function matchesRoute(path: string, routes: string[]): boolean {
  return routes.some(route => 
    path === route || path.startsWith(`${route}/`) || path.startsWith(`${route}?`)
  )
}

/**
 * Trial enforcement middleware
 * Blocks access to protected routes when trial has expired and no active subscription
 */
export async function trialMiddleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Skip public routes and API routes (except protected ones)
  if (matchesRoute(path, PUBLIC_ROUTES)) {
    return NextResponse.next()
  }

  // Skip static files
  if (path.includes('.') || path.startsWith('/_next')) {
    return NextResponse.next()
  }

  // For protected routes, check trial/subscription status
  if (matchesRoute(path, PROTECTED_ROUTES)) {
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()

      // No user - redirect to login
      if (!user) {
        return NextResponse.redirect(new URL('/login', request.url))
      }

      // Check trial status
      const trialStatus = await getTrialStatus(user.id)

      // If paid subscription, allow access
      if (trialStatus.isPaid) {
        return NextResponse.next()
      }

      // If trial still active, allow access
      if (trialStatus.isActive && trialStatus.daysLeft > 0) {
        // Add trial info to headers for client components
        const response = NextResponse.next()
        response.headers.set('x-trial-active', 'true')
        response.headers.set('x-trial-days-left', trialStatus.daysLeft.toString())
        return response
      }

      // Trial expired and no subscription - redirect to pricing
      // Allow access to billing page to upgrade
      if (path === '/settings/billing' || path.startsWith('/settings/billing')) {
        return NextResponse.next()
      }

      // Redirect to billing page with expired message
      return NextResponse.redirect(
        new URL('/settings/billing?expired=true', request.url)
      )
    } catch (error) {
      console.error('Trial middleware error:', error)
      // On error, allow access but log the issue
      return NextResponse.next()
    }
  }

  return NextResponse.next()
}
