'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Loader2, CreditCard, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}

export default function ReactivatePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ReactivateContent />
    </Suspense>
  )
}

function ReactivateContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'expired' | 'used'>('loading')
  const [email, setEmail] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (!token) {
      setStatus('invalid')
      return
    }

    // Validate the token
    validateToken(token)
  }, [token])

  async function validateToken(token: string) {
    try {
      const res = await fetch('/api/reactivate/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      const data = await res.json()

      if (data.valid) {
        setStatus('valid')
        setEmail(data.email)
      } else if (data.reason === 'expired') {
        setStatus('expired')
      } else if (data.reason === 'used') {
        setStatus('used')
      } else {
        setStatus('invalid')
      }
    } catch (error) {
      setStatus('invalid')
    }
  }

  async function handleProceedToPayment() {
    if (!token) return
    
    setIsProcessing(true)
    
    try {
      // Mark token as used and redirect to checkout
      const res = await fetch('/api/reactivate/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      const data = await res.json()

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        // Fallback to billing page
        router.push('/dashboard/billing')
      }
    } catch (error) {
      console.error('Reactivation error:', error)
      setIsProcessing(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Validating your reactivation link...</p>
        </div>
      </div>
    )
  }

  if (status === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle>Invalid Link</CardTitle>
            <CardDescription>
              This reactivation link is not valid. Please contact support for a new link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full"
              onClick={() => window.location.href = 'mailto:support@eagleeye.work'}
            >
              Contact Support
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <CardTitle>Link Expired</CardTitle>
            <CardDescription>
              This reactivation link has expired. Please contact support for a new link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full"
              onClick={() => window.location.href = 'mailto:support@eagleeye.work'}
            >
              Contact Support
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === 'used') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <CardTitle>Link Already Used</CardTitle>
            <CardDescription>
              This reactivation link has already been used. If you need help, please contact support.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full"
              onClick={() => router.push('/login')}
            >
              Go to Login
            </Button>
            <Button 
              variant="outline"
              className="w-full"
              onClick={() => window.location.href = 'mailto:support@eagleeye.work'}
            >
              Contact Support
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Valid token - show reactivation option
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <Card>
          <CardHeader className="text-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <CreditCard className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Welcome Back!</CardTitle>
            <CardDescription>
              Complete payment to reactivate your EagleEye account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">Account</p>
              <p className="font-medium">{email}</p>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Your data is waiting</p>
                  <p className="text-muted-foreground">All your integrations and settings are preserved</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Instant access</p>
                  <p className="text-muted-foreground">Start using EagleEye immediately after payment</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Solo Plan - $29/month</p>
                  <p className="text-muted-foreground">Unlimited integrations, AI insights, 90-day history</p>
                </div>
              </div>
            </div>

            <Button 
              className="w-full"
              size="lg"
              onClick={handleProceedToPayment}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Complete Payment
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              By proceeding, you agree to our Terms of Service and will be charged $29/month.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
