'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Rocket, 
  CheckCircle2, 
  ArrowRight, 
  Slack, 
  Bell, 
  Mail, 
  Zap,
  Shield,
  Clock,
  ChevronRight,
  Sparkles,
  MessageSquare
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { createClient } from '@/lib/supabase/client'

interface OnboardingModalProps {
  isOpen: boolean
  onComplete: () => void
  userName?: string
}

const STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to EagleEye! 🦅',
    description: 'Your AI-powered command center for work signals. Set up once, stay informed forever.',
  },
  {
    id: 'integrations',
    title: 'Connect Your Tools',
    description: 'EagleEye works best when connected to your daily tools. We\'ll scan for important signals automatically.',
  },
  {
    id: 'notifications',
    title: 'Stay in the Loop',
    description: 'Choose how you want to receive updates. You can always change these in Settings.',
  },
  {
    id: 'ready',
    title: 'You\'re All Set! 🎉',
    description: 'EagleEye will now monitor your connected tools and surface what matters most.',
  },
]

export function OnboardingModal({ isOpen, onComplete, userName }: OnboardingModalProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [notificationSettings, setNotificationSettings] = useState({
    emailDigest: true,
    pushNotifications: true,
    realtimeAlerts: false,
  })
  const [saving, setSaving] = useState(false)

  const step = STEPS[currentStep]

  const handleNext = async () => {
    if (currentStep === 2) {
      // Save notification settings
      setSaving(true)
      try {
        const response = await fetch('/api/settings/notifications', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            settings: {
              emailEnabled: notificationSettings.emailDigest,
              emailFrequency: 'daily',
              emailTime: '09:00',
              pushEnabled: notificationSettings.pushNotifications,
              realtimeAlertsEnabled: notificationSettings.realtimeAlerts,
              realtimeChannels: ['email', 'push'],
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
            }
          }),
        })
        if (!response.ok) throw new Error('Failed to save')
      } catch (error) {
        console.error('Failed to save notification settings:', error)
      }
      setSaving(false)
    }
    
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // Mark onboarding as complete
      await markOnboardingComplete()
      onComplete()
    }
  }

  const handleGoToIntegrations = async () => {
    // Save current progress
    if (currentStep === 2) {
      await handleNext()
    }
    await markOnboardingComplete()
    router.push('/dashboard/integrations')
    onComplete()
  }

  const markOnboardingComplete = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Use type assertion since onboarding_completed may not be in generated types
        await (supabase as any)
          .from('profiles')
          .update({ onboarding_completed: true })
          .eq('id', user.id)
      }
    } catch (error) {
      console.error('Failed to mark onboarding complete:', error)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-card rounded-2xl shadow-2xl border border-border/50 overflow-hidden"
        >
          {/* Progress bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-muted">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-cyan-400"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Content */}
          <div className="p-8 pt-10">
            {/* Step indicator */}
            <div className="flex justify-center gap-2 mb-6">
              {STEPS.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    idx <= currentStep ? 'bg-primary' : 'bg-muted-foreground/30'
                  }`}
                />
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Welcome Step */}
                {currentStep === 0 && (
                  <div className="text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', delay: 0.1 }}
                      className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-cyan-500/20 flex items-center justify-center"
                    >
                      <Rocket className="w-10 h-10 text-primary" />
                    </motion.div>
                    <h2 className="text-2xl font-bold mb-2">
                      {userName ? `Welcome, ${userName.split(' ')[0]}!` : step.title}
                    </h2>
                    <p className="text-muted-foreground mb-6">{step.description}</p>
                    
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="p-4 rounded-xl bg-muted/50 text-center">
                        <Shield className="w-6 h-6 mx-auto mb-2 text-green-500" />
                        <p className="text-xs text-muted-foreground">Zero noise</p>
                      </div>
                      <div className="p-4 rounded-xl bg-muted/50 text-center">
                        <Clock className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                        <p className="text-xs text-muted-foreground">Save 2+ hrs/day</p>
                      </div>
                      <div className="p-4 rounded-xl bg-muted/50 text-center">
                        <Zap className="w-6 h-6 mx-auto mb-2 text-amber-500" />
                        <p className="text-xs text-muted-foreground">Real-time alerts</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Integrations Step */}
                {currentStep === 1 && (
                  <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">{step.title}</h2>
                    <p className="text-muted-foreground mb-6">{step.description}</p>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 border border-border/50">
                        <div className="w-10 h-10 rounded-lg bg-[#25D366] flex items-center justify-center">
                          <MessageSquare className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium">WhatsApp Business</p>
                          <p className="text-xs text-muted-foreground">Client messages, urgent requests</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                      
                      <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 border border-border/50">
                        <div className="w-10 h-10 rounded-lg bg-[#4A154B] flex items-center justify-center">
                          <Slack className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium">Slack</p>
                          <p className="text-xs text-muted-foreground">@mentions, urgent messages, threads</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                      
                      <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 border border-border/50">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#F06A6A] to-[#E8384F] flex items-center justify-center">
                          <span className="text-white font-bold text-sm">A</span>
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium">Asana / Linear / Jira</p>
                          <p className="text-xs text-muted-foreground">Blockers, overdue tasks, assignments</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </div>

                    <Button 
                      onClick={handleGoToIntegrations}
                      className="w-full bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90"
                    >
                      Connect Your Tools
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    
                    <button
                      onClick={handleNext}
                      className="mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      I'll do this later →
                    </button>
                  </div>
                )}

                {/* Notifications Step */}
                {currentStep === 2 && (
                  <div>
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold mb-2">{step.title}</h2>
                      <p className="text-muted-foreground">{step.description}</p>
                    </div>
                    
                    <div className="space-y-4 mb-6">
                      <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border/50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <Mail className="w-5 h-5 text-blue-500" />
                          </div>
                          <div>
                            <p className="font-medium">Daily Email Digest</p>
                            <p className="text-xs text-muted-foreground">Summary of important items at 9 AM</p>
                          </div>
                        </div>
                        <Switch
                          checked={notificationSettings.emailDigest}
                          onCheckedChange={(checked) => 
                            setNotificationSettings(prev => ({ ...prev, emailDigest: checked }))
                          }
                        />
                      </div>
                      
                      <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border/50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                            <Bell className="w-5 h-5 text-purple-500" />
                          </div>
                          <div>
                            <p className="font-medium">Push Notifications</p>
                            <p className="text-xs text-muted-foreground">Browser alerts for urgent items</p>
                          </div>
                        </div>
                        <Switch
                          checked={notificationSettings.pushNotifications}
                          onCheckedChange={(checked) => 
                            setNotificationSettings(prev => ({ ...prev, pushNotifications: checked }))
                          }
                        />
                      </div>
                      
                      <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border/50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-amber-500" />
                          </div>
                          <div>
                            <p className="font-medium">Real-time Alerts</p>
                            <p className="text-xs text-muted-foreground">Instant notification for blockers</p>
                          </div>
                        </div>
                        <Switch
                          checked={notificationSettings.realtimeAlerts}
                          onCheckedChange={(checked) => 
                            setNotificationSettings(prev => ({ ...prev, realtimeAlerts: checked }))
                          }
                        />
                      </div>
                    </div>

                    <p className="text-xs text-center text-muted-foreground mb-4">
                      ✨ Recommended: Keep Email Digest & Push Notifications enabled
                    </p>
                  </div>
                )}

                {/* Ready Step */}
                {currentStep === 3 && (
                  <div className="text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', delay: 0.1 }}
                      className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center"
                    >
                      <CheckCircle2 className="w-10 h-10 text-green-500" />
                    </motion.div>
                    <h2 className="text-2xl font-bold mb-2">{step.title}</h2>
                    <p className="text-muted-foreground mb-6">{step.description}</p>
                    
                    <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-cyan-500/10 border border-primary/20 mb-6">
                      <div className="flex items-center gap-2 justify-center mb-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        <p className="font-medium">Here's what happens next:</p>
                      </div>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Daily digest emails with your important signals</li>
                        <li>• Push alerts when blockers are detected</li>
                        <li>• AI-powered summaries of your work landscape</li>
                      </ul>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Action Button */}
            {currentStep !== 1 && (
              <Button
                onClick={handleNext}
                disabled={saving}
                className="w-full bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90"
              >
                {saving ? 'Saving...' : currentStep === STEPS.length - 1 ? 'Go to Dashboard' : 'Continue'}
                {!saving && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            )}

            {/* Skip option */}
            {currentStep === 0 && (
              <button
                onClick={() => {
                  markOnboardingComplete()
                  onComplete()
                }}
                className="w-full mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip setup, explore on my own
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Hook to check if onboarding should be shown
export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [userName, setUserName] = useState<string | undefined>()

  useEffect(() => {
    async function checkOnboardingStatus() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          setIsLoading(false)
          return
        }

        setUserName(user.user_metadata?.full_name || user.email?.split('@')[0])

        // Check if onboarding is completed
        // Use type assertion since column may not be in generated types
        const { data: profile } = await (supabase as any)
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single()

        // Show onboarding if not completed
        if (profile && !profile.onboarding_completed) {
          setShowOnboarding(true)
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkOnboardingStatus()
  }, [])

  return {
    showOnboarding,
    setShowOnboarding,
    isLoading,
    userName,
  }
}
