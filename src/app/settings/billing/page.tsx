'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function BillingRedirectContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Build redirect URL preserving params
    const params = searchParams.toString()
    const redirectUrl = params 
      ? `/dashboard/billing?${params}` 
      : '/dashboard/billing'
    
    router.replace(redirectUrl)
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Redirecting to billing...</p>
      </div>
    </div>
  )
}

/**
 * Redirect old billing page to new dashboard/billing
 * Preserves query params for Stripe success redirect compatibility
 */
export default function OldBillingRedirect() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <BillingRedirectContent />
    </Suspense>
  )
}
