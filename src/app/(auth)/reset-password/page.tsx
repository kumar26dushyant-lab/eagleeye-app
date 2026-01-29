'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Loader2, CheckCircle, AlertCircle, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Logo } from '@/components/brand/Logo'

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validatingToken, setValidatingToken] = useState(true)

  // Password strength indicators
  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  }
  const passwordStrength = Object.values(passwordChecks).filter(Boolean).length

  useEffect(() => {
    // Supabase handles the token exchange automatically when using the redirect
    // We just need to check if we have a session
    const checkSession = async () => {
      const supabase = createClient()
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Session error:', error)
        setError('Invalid or expired reset link. Please request a new one.')
      }
      
      setValidatingToken(false)
    }

    // Small delay to allow Supabase to process the token from URL
    setTimeout(checkSession, 500)
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!password || !confirmPassword) {
      toast.error('Please fill in all fields')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (passwordStrength < 3) {
      toast.error('Please choose a stronger password')
      return
    }
    
    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) {
        console.error('Password update error:', error)
        if (error.message.includes('should be different')) {
          toast.error('New password must be different from your old password')
        } else {
          toast.error(error.message || 'Failed to reset password')
        }
        setLoading(false)
        return
      }

      setSuccess(true)
      toast.success('Password reset successfully!')
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (err) {
      console.error('Password reset exception:', err)
      toast.error('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  if (validatingToken) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Validating reset link...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="text-center space-y-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="mx-auto mb-4"
          >
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </motion.div>
          <CardTitle className="text-2xl font-semibold">Link expired</CardTitle>
          <CardDescription className="text-muted-foreground">
            {error}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/forgot-password">
            <Button className="w-full">Request new reset link</Button>
          </Link>
          <div className="mt-4 text-center">
            <Link 
              href="/login" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Back to sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (success) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="text-center space-y-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="mx-auto mb-4"
          >
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </motion.div>
          <CardTitle className="text-2xl font-semibold">Password reset!</CardTitle>
          <CardDescription className="text-muted-foreground">
            Your password has been updated successfully.
            <br />
            Redirecting you to dashboard...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="text-center space-y-2">
        <div className="mx-auto mb-4">
          <Logo size="lg" showText={true} animated={true} />
        </div>
        <CardTitle className="text-2xl font-semibold">Set new password</CardTitle>
        <CardDescription className="text-muted-foreground">
          Choose a strong password for your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              New password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoFocus
                className="w-full pl-10 pr-10 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            
            {/* Password strength indicator */}
            {password && (
              <div className="space-y-2 mt-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        passwordStrength >= level
                          ? passwordStrength <= 1
                            ? 'bg-red-500'
                            : passwordStrength <= 2
                            ? 'bg-yellow-500'
                            : passwordStrength <= 3
                            ? 'bg-blue-500'
                            : 'bg-green-500'
                          : 'bg-border'
                      }`}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <span className={passwordChecks.length ? 'text-green-500' : 'text-muted-foreground'}>
                    {passwordChecks.length ? '✓' : '○'} 8+ characters
                  </span>
                  <span className={passwordChecks.uppercase ? 'text-green-500' : 'text-muted-foreground'}>
                    {passwordChecks.uppercase ? '✓' : '○'} Uppercase
                  </span>
                  <span className={passwordChecks.lowercase ? 'text-green-500' : 'text-muted-foreground'}>
                    {passwordChecks.lowercase ? '✓' : '○'} Lowercase
                  </span>
                  <span className={passwordChecks.number ? 'text-green-500' : 'text-muted-foreground'}>
                    {passwordChecks.number ? '✓' : '○'} Number
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-10 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-red-500">Passwords do not match</p>
            )}
            {confirmPassword && password === confirmPassword && (
              <p className="text-xs text-green-500">✓ Passwords match</p>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full h-11" 
            disabled={loading || passwordStrength < 3 || password !== confirmPassword}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resetting password...
              </>
            ) : (
              'Reset password'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link 
            href="/login" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Back to sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

// Loading fallback for Suspense
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

// Main page component with Suspense wrapper
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResetPasswordContent />
    </Suspense>
  )
}
