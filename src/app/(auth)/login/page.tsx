'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Loader2, Mail, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Logo } from '@/components/brand/Logo'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const message = searchParams.get('message')
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showEmailBanner, setShowEmailBanner] = useState(message === 'confirm-email')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast.error('Please enter email and password')
      return
    }
    
    setLoading(true)

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('Login error:', error)
        // Provide helpful message for unconfirmed emails
        if (error.message.includes('Email not confirmed') || error.message.includes('email not confirmed')) {
          setShowEmailBanner(true) // Show the email confirmation banner
          toast.error('📧 Please confirm your email first! Check your inbox (and spam folder)')
        } else {
          toast.error(error.message)
        }
        setLoading(false)
        return
      }

      if (data.user) {
        toast.success('Welcome back!')
        // Use window.location for a full page navigation to ensure cookies are set
        window.location.href = '/dashboard'
      }
    } catch (err) {
      console.error('Login exception:', err)
      toast.error('Something went wrong')
      setLoading(false)
    }
  }

  // Resend confirmation email
  const resendConfirmation = async () => {
    if (!email) {
      toast.error('Please enter your email address first')
      return
    }
    
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      })
      
      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Confirmation email sent! Check your inbox.')
      }
    } catch (err) {
      toast.error('Failed to resend email')
    }
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="text-center space-y-2">
        <div className="mx-auto mb-4">
          <Logo size="lg" showText={true} animated={true} />
        </div>
        <CardTitle className="text-2xl font-semibold">Welcome back</CardTitle>
        <CardDescription className="text-muted-foreground">
          Sign in to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Email confirmation banner - always show for new signups */}
        {showEmailBanner && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30"
          >
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-400 mb-1">📧 Check your email first!</p>
                <p className="text-muted-foreground mb-2">
                  We sent a confirmation link to activate your account. You must click it before you can login.
                </p>
                <p className="text-muted-foreground text-xs mb-3">
                  <strong>💡 Tip:</strong> Check your <span className="text-amber-400">Spam/Junk folder</span> if you don't see it in your inbox.
                </p>
                <button
                  type="button"
                  onClick={resendConfirmation}
                  className="text-xs px-4 py-2 bg-amber-500/20 text-amber-400 rounded-full hover:bg-amber-500/30 transition-colors font-medium"
                >
                  Resend confirmation email
                </button>
              </div>
            </div>
          </motion.div>
        )}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
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
            <div className="text-right">
              <Link 
                href="/forgot-password" 
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                Forgot password?
              </Link>
            </div>
          </div>
          <Button type="submit" className="w-full h-11" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </Button>
        </form>
        <div className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-primary hover:underline font-medium">
            Sign up
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

function LoadingFallback() {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="text-center space-y-2">
        <div className="mx-auto mb-4">
          <Logo size="lg" showText={true} animated={true} />
        </div>
        <CardTitle className="text-2xl font-semibold">Welcome back</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LoginContent />
    </Suspense>
  )
}
