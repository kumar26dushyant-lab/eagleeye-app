'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Loader2, Check, CreditCard, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Logo } from '@/components/brand/Logo'

function SignupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan') || 'founder'
  
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'form' | 'processing'>('form')

  const planInfo = {
    founder: { name: 'Founder', price: 29 },
    team: { name: 'Team', price: 79 },
  }[plan] || { name: 'Founder', price: 29 }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setStep('processing')

    try {
      const supabase = createClient()
      
      // Step 1: Create Supabase auth account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (authError) {
        // If Supabase rejects the email, still allow checkout for testing
        // This handles cases like test@example.com which Supabase blocks
        console.warn('Auth warning:', authError.message)
        
        // Proceed to checkout anyway - user can complete payment and we'll handle auth later
        const checkoutRes = await fetch('/api/payments/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            tier: plan, 
            email,
          }),
        })

        const checkoutData = await checkoutRes.json()

        if (checkoutData.checkoutUrl) {
          window.location.href = checkoutData.checkoutUrl
          return
        } else {
          toast.error(authError.message)
          setStep('form')
          setLoading(false)
          return
        }
      }

      // Step 2: Redirect to payment checkout with 7-day trial
      const checkoutRes = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tier: plan, 
          email,
        }),
      })

      const checkoutData = await checkoutRes.json()

      if (checkoutData.checkoutUrl) {
        // Redirect to payment checkout for card details
        window.location.href = checkoutData.checkoutUrl
      } else if (checkoutData.error) {
        // Show the actual error
        console.error('Checkout error:', checkoutData)
        toast.error(checkoutData.error || 'Payment setup failed. Please try again.')
        setStep('form')
      } else {
        // Unexpected response
        console.error('Unexpected checkout response:', checkoutData)
        toast.error('Payment setup unavailable. Please contact support.')
        setStep('form')
      }
    } catch (err) {
      console.error('Signup error:', err)
      toast.error('Something went wrong. Please try again.')
      setStep('form')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="text-center space-y-2">
        <div className="mx-auto mb-4">
          <Logo size="lg" showText={true} animated={true} />
        </div>
        <CardTitle className="text-2xl font-semibold">Start your 7-day free trial</CardTitle>
        <CardDescription className="text-muted-foreground">
          {planInfo.name} Plan • ${planInfo.price}/mo after trial • Card required
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === 'form' ? (
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="fullName" className="text-sm font-medium">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Smith"
                required
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Work Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Continue to Payment'
              )}
            </Button>
            
            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3 text-green-500" />
                <span>No AI training</span>
              </div>
              <div className="flex items-center gap-1">
                <CreditCard className="h-3 w-3" />
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center gap-1">
                <Check className="h-3 w-3 text-green-500" />
                <span>Read-only access</span>
              </div>
            </div>
            
            {/* Data privacy notice */}
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-xs text-center">
              <p className="text-green-400 font-medium">🔒 Your data stays private</p>
              <p className="text-muted-foreground mt-1">
                We never use your data for AI training. Messages are analyzed in real-time and immediately discarded.
              </p>
            </div>
          </form>
        ) : (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
            <p className="font-medium">Setting up your trial...</p>
            <p className="text-sm text-muted-foreground">Redirecting to secure payment</p>
          </div>
        )}
        
        <p className="mt-4 text-xs text-center text-muted-foreground">
          💳 Card required • You won't be charged until {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
        </p>
        <div className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

// Loading fallback
function LoadingFallback() {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading...</p>
      </CardContent>
    </Card>
  )
}

// Main page with Suspense
export default function SignupPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SignupContent />
    </Suspense>
  )
}
