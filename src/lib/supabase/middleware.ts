import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // FAST PATH: Skip auth check entirely for routes that don't need it
  // This dramatically improves performance by avoiding Supabase calls
  const isApiRoute = pathname.startsWith('/api')
  const isCallbackRoute = pathname.includes('/callback') || pathname.includes('/confirm')
  const isPublicAsset = pathname.startsWith('/_next') || pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|css|js)$/)
  const isLandingPage = pathname === '/'
  
  // For public assets, API routes, and landing page - return immediately without auth check
  if (isPublicAsset || isApiRoute || isCallbackRoute || isLandingPage) {
    return NextResponse.next({ request })
  }

  // Only create Supabase client for routes that actually need auth
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Auth check - only runs for protected/auth routes now
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Route classification
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup')
  const isDashboard = pathname.startsWith('/dashboard')

  // Redirect unauthenticated users to login for protected routes (dashboard)
  if (!user && isDashboard) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages to dashboard
  if (user && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
