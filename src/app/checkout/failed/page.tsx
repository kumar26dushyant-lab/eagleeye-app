'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, CreditCard, RefreshCw, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

function FailedContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const tier = searchParams.get('tier') || 'solo'
  const [showTips, setShowTips] = useState(true)

  // Common error codes and their meanings
  const getErrorInfo = (errorCode: string | null) => {
    if (!errorCode) return null
    
    const errorMap: Record<string, { title: string; description: string }> = {
      '58': {
        title: 'Card not enabled for subscriptions',
        description: 'Your bank requires you to enable recurring payments on this card.'
      },
      'TNP': {
        title: 'Terminal/Network issue',
        description: 'There was a communication issue with your bank. Please try again.'
      },
      'declined': {
        title: 'Card declined',
        description: 'Your bank declined the transaction. Please try a different card.'
      }
    }

    for (const [code, info] of Object.entries(errorMap)) {
      if (errorCode.toLowerCase().includes(code.toLowerCase())) {
        return info
      }
    }
    return null
  }

  const errorInfo = getErrorInfo(error)

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Error Icon */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/10 rounded-full mb-4">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Payment Unsuccessful</h1>
          <p className="text-muted-foreground">
            {errorInfo?.description || "We couldn't process your payment. Don't worry, you weren't charged."}
          </p>
        </div>

        {/* Error Details (if available) */}
        {error && (
          <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-400 font-medium">
              {errorInfo?.title || 'Transaction failed'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Error: {error}
            </p>
          </div>
        )}

        {/* Helpful Tips */}
        <div className="bg-muted/50 rounded-lg mb-6">
          <button 
            onClick={() => setShowTips(!showTips)}
            className="w-full flex items-center justify-between p-4 text-left"
          >
            <span className="font-medium text-sm">💡 Common solutions</span>
            {showTips ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          
          {showTips && (
            <div className="px-4 pb-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">1</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Try a different card</p>
                  <p className="text-xs text-muted-foreground">Credit cards work better than debit cards for subscriptions</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">2</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Enable recurring payments</p>
                  <p className="text-xs text-muted-foreground">In your net banking, look for "E-Mandate" or "Standing Instructions" and enable them</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">3</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Check card limits</p>
                  <p className="text-xs text-muted-foreground">Ensure your card has sufficient limit and international transactions enabled</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">4</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Contact your bank</p>
                  <p className="text-xs text-muted-foreground">Ask them to enable "recurring payment authorization" for online subscriptions</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link href={`/signup?plan=${tier}`} className="block">
            <Button className="w-full" size="lg">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </Link>
          
          <Link href="/pricing" className="block">
            <Button variant="outline" className="w-full" size="lg">
              <CreditCard className="h-4 w-4 mr-2" />
              View Plans
            </Button>
          </Link>
        </div>

        {/* Support Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Still having trouble?
          </p>
          <Link 
            href="/contact?subject=Payment%20Issue" 
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <MessageCircle className="h-4 w-4" />
            Contact Support
          </Link>
        </div>

        {/* Reassurance */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            🔒 Your card was not charged. All payment data is encrypted and secure.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutFailedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    }>
      <FailedContent />
    </Suspense>
  )
}
