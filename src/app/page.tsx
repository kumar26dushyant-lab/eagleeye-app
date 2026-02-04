'use client'

import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Shield, Check, ChevronDown, AlertTriangle, Bell } from 'lucide-react'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Logo } from '@/components/brand/Logo'
import { InquirySection } from '@/components/home/InquirySection'
import { toast } from 'sonner'

// Component to handle cancelled subscription toast
function CancelledSubscriptionHandler() {
  const searchParams = useSearchParams()
  
  useEffect(() => {
    if (searchParams.get('cancelled') === 'true') {
      toast.success('Your subscription has been cancelled', {
        description: 'All data has been removed. We hope to see you again!',
        duration: 6000
      })
      // Clean up URL
      window.history.replaceState({}, '', '/')
    }
  }, [searchParams])
  
  return null
}

// Animated gradient orb component
function GradientOrb({ className }: { className?: string }) {
  return (
    <div className={`absolute rounded-full blur-3xl opacity-20 ${className}`} />
  )
}

// Integration logos
const integrations = [
  { name: 'WhatsApp Business', icon: '📱' },
  { name: 'Slack', icon: '💬' },
  { name: 'Asana', icon: '📋' },
  { name: 'Jira', icon: '🔷' },
  { name: 'Linear', icon: '🎯' },
  { name: 'GitHub', icon: '🐙' },
  { name: 'Teams', icon: '👥' },
]

// Animated notification chaos for problem section
function NotificationChaos() {
  const notifications = [
    { app: 'WhatsApp', msg: '🆘 Customer: My order never arrived!', color: 'bg-green-500' },
    { app: 'Slack', msg: '@channel Anyone seen the Q4 report?', color: 'bg-purple-500' },
    { app: 'Email', msg: 'RE: RE: RE: Meeting follow-up', color: 'bg-blue-500' },
    { app: 'Asana', msg: 'Task assigned: Review designs', color: 'bg-orange-500' },
    { app: 'WhatsApp', msg: 'Urgent: Payment failed, need help', color: 'bg-green-500' },
    { app: 'Jira', msg: 'BUG-1234 updated', color: 'bg-blue-600' },
    { app: 'Slack', msg: '🔥 Production is down!', color: 'bg-red-600' },
    { app: 'Teams', msg: 'You missed a call', color: 'bg-indigo-500' },
  ]
  
  return (
    <div className="relative h-[280px] overflow-hidden">
      {notifications.map((notif, i) => (
        <motion.div
          key={i}
          initial={{ x: -100, opacity: 0 }}
          animate={{ 
            x: [null, 0, 0, 100],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: 4,
            delay: i * 0.5,
            repeat: Infinity,
            repeatDelay: notifications.length * 0.5 - 4,
          }}
          className={`absolute left-0 right-0 mx-4 p-3 rounded-lg ${notif.color}/20 border border-white/10 backdrop-blur`}
          style={{ top: `${(i % 4) * 65 + 10}px` }}
        >
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${notif.color}`} />
            <span className="text-xs font-medium text-white/60">{notif.app}</span>
            <span className="text-sm text-white/80 truncate">{notif.msg}</span>
          </div>
        </motion.div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
    </div>
  )
}

export default function Home() {
  const [scrolled, setScrolled] = useState(false)
  
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Handle cancelled subscription toast */}
      <Suspense fallback={null}>
        <CancelledSubscriptionHandler />
      </Suspense>
      
      {/* Animated background */}
      <div className="fixed inset-0 -z-10">
        <GradientOrb className="w-[600px] h-[600px] bg-red-500/20 -top-48 -left-48" />
        <GradientOrb className="w-[500px] h-[500px] bg-cyan-500/20 top-1/3 -right-48" />
        <GradientOrb className="w-[400px] h-[400px] bg-blue-500/20 bottom-0 left-1/3" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--background))_70%)]" />
      </div>

      {/* Navigation - Premium Brand */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-background/90 backdrop-blur-xl border-b border-border/50' : 'bg-transparent'
        }`}
      >
        <nav className="max-w-[1400px] mx-auto px-6 lg:px-12 h-20 flex items-center justify-between">
          {/* Premium Brand Logo */}
          <Logo size="lg" showText={true} showTagline={true} animated={true} variant="glow" />
          <div className="flex items-center gap-6">
            <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              Pricing
            </Link>
            <a href="#inquiry" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              Contact
            </a>
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Sign in
            </Link>
            <Link href="/signup?plan=founder">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Start Free Trial
              </motion.button>
            </Link>
          </div>
        </nav>
      </motion.header>

      <main>
        {/* ============================================ */}
        {/* SECTION 1: THE PROBLEM - Hook with Pain */}
        {/* ============================================ */}
        <section className="min-h-screen flex flex-col justify-center pt-24 pb-12 px-6 lg:px-12 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 via-transparent to-transparent" />
          
          <div className="max-w-[1400px] mx-auto w-full relative">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left - The Pain */}
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                {/* Problem Badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/30 mb-8"
                >
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <span className="text-red-400 text-sm font-medium">The Problem</span>
                </motion.div>

                {/* HUGE Hook Headline */}
                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight mb-6 leading-[0.9]"
                >
                  <span className="text-red-400">Drowning</span>
                  <br />
                  <span className="text-foreground">in notifications?</span>
                </motion.h1>

                {/* Pain Points */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-4 mb-8"
                >
                  {[
                    { icon: '😵', text: '100+ pings before lunch' },
                    { icon: '😰', text: 'Still missed something critical' },
                    { icon: '🔥', text: 'Found out too late' },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + i * 0.1 }}
                      className="flex items-center gap-4"
                    >
                      <span className="text-3xl">{item.icon}</span>
                      <span className="text-xl text-muted-foreground">{item.text}</span>
                    </motion.div>
                  ))}
                </motion.div>

                {/* The Cost */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.9 }}
                  className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20"
                >
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-5xl font-black text-red-400">650</span>
                    <span className="text-xl text-red-400/80">hours/year</span>
                  </div>
                  <p className="text-muted-foreground">Lost to notification chaos. Scrolling, searching, still missing what matters.</p>
                </motion.div>
              </motion.div>

              {/* Right - Visual Chaos */}
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-3xl blur-3xl" />
                <div className="relative bg-card/30 backdrop-blur border border-red-500/20 rounded-3xl p-6 overflow-hidden">
                  <div className="flex items-center gap-2 mb-4">
                    <Bell className="h-5 w-5 text-red-400 animate-pulse" />
                    <span className="text-sm text-red-400 font-medium">Your typical morning...</span>
                  </div>
                  <NotificationChaos />
                  <div className="absolute bottom-6 left-6 right-6 text-center">
                    <p className="text-lg text-muted-foreground">
                      <span className="text-red-400 font-semibold">Which one matters?</span> You won't know until it's too late.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

          </div>
          
          {/* Scroll Indicator - Fixed at bottom of viewport */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10"
          >
            <span className="text-sm text-muted-foreground bg-background/80 px-4 py-1 rounded-full backdrop-blur">There's a better way</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="bg-cyan-500/20 p-2 rounded-full"
            >
              <ChevronDown className="h-6 w-6 text-cyan-400" />
            </motion.div>
          </motion.div>
        </section>

        {/* ============================================ */}
        {/* SECTION 2: THE SOLUTION - Hope & Relief */}
        {/* ============================================ */}
        <section className="min-h-screen flex flex-col justify-center py-20 px-6 lg:px-12 relative overflow-hidden">
          {/* Vibrant animated background */}
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-blue-500/5 to-transparent" />
          <div className="absolute top-1/4 -right-32 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 -left-32 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          
          <div className="max-w-[1400px] mx-auto w-full relative">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left - Clean Dashboard Preview */}
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="relative order-2 lg:order-1"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-3xl blur-3xl" />
                <div className="relative bg-card/80 backdrop-blur border border-cyan-500/30 rounded-3xl p-6 shadow-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <span className="text-sm text-cyan-400 font-medium">Your morning with EagleEye</span>
                  </div>
                  
                  {/* Clean Signal Cards */}
                  <div className="space-y-3">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 }}
                      className="flex items-center gap-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
                    >
                      <div className="text-3xl">🚨</div>
                      <div className="flex-1">
                        <p className="font-semibold">Client escalation in #enterprise</p>
                        <p className="text-sm text-muted-foreground">Sarah mentioned "urgent" - needs your response</p>
                      </div>
                      <span className="px-3 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded-full">CRITICAL</span>
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.4 }}
                      className="flex items-center gap-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl"
                    >
                      <div className="text-3xl">⏰</div>
                      <div className="flex-1">
                        <p className="font-semibold">Q4 launch blocked</p>
                        <p className="text-sm text-muted-foreground">API integration dependency at risk</p>
                      </div>
                      <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded-full">HIGH</span>
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5 }}
                      className="flex items-center gap-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl"
                    >
                      <div className="text-3xl">✅</div>
                      <div className="flex-1">
                        <p className="font-semibold">Team shipped v2.0 early</p>
                        <p className="text-sm text-muted-foreground">Milestone achieved ahead of schedule</p>
                      </div>
                      <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full">WIN</span>
                    </motion.div>
                  </div>
                  
                  {/* Footer stat */}
                  <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">3 signals from 147 messages</span>
                    <span className="text-sm text-cyan-400 font-medium">Done in 5 min ✓</span>
                  </div>
                </div>
              </motion.div>

              {/* Right - The Solution */}
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="order-1 lg:order-2"
              >
                {/* Solution Badge - Glowing */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/50 mb-8 shadow-lg shadow-cyan-500/20"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Check className="h-5 w-5 text-cyan-400" />
                  </motion.div>
                  <span className="text-cyan-300 text-sm font-semibold">The Solution</span>
                </motion.div>

                {/* Solution Headline - More Dynamic */}
                <motion.h2 
                  className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight mb-6 leading-[0.9]"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <span className="text-foreground">Just the</span>
                  <br />
                  <motion.span 
                    className="bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent bg-[length:200%_auto]"
                    animate={{ backgroundPosition: ['0%', '100%', '0%'] }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                  >
                    signals.
                  </motion.span>
                </motion.h2>

                <motion.p 
                  className="text-xl text-muted-foreground mb-8 leading-relaxed"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  EagleEye connects to your tools and delivers only what needs your attention. 
                  No noise. No summaries. <span className="text-cyan-400 font-semibold">Just clarity.</span>
                </motion.p>

                {/* Benefits */}
                <div className="space-y-4 mb-8">
                  {[
                    { icon: '🔗', text: 'Connect WhatsApp, Slack, Asana in seconds' },
                    { icon: '🎯', text: 'Only see what actually needs you' },
                    { icon: '☕', text: '10-minute morning brief, done' },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="flex items-center gap-4"
                    >
                      <span className="text-2xl">{item.icon}</span>
                      <span className="text-lg text-muted-foreground">{item.text}</span>
                    </motion.div>
                  ))}
                </div>

                {/* CTA */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 }}
                  className="flex flex-col sm:flex-row gap-4"
                >
                  <Link href="/signup?plan=founder">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center justify-center gap-2 px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-white rounded-xl font-semibold text-lg transition-colors"
                    >
                      Start Free Trial
                      <ArrowRight className="h-5 w-5" />
                    </motion.button>
                  </Link>
                  <a href="#how-it-works">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center justify-center gap-2 px-8 py-4 border border-border hover:bg-muted/50 rounded-xl font-medium text-lg transition-colors"
                    >
                      <ChevronDown className="h-5 w-5" />
                      How It Works
                    </motion.button>
                  </a>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* SECTION 3: HOW IT WORKS */}
        {/* ============================================ */}
        <section id="how-it-works" className="py-24 px-6 lg:px-12 relative">
          <div className="max-w-[1200px] mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl sm:text-5xl font-bold mb-4">
                How it works
              </h2>
              <p className="text-xl text-muted-foreground">
                Set up once, then forget it. No app to check daily.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: '01',
                  icon: '🔗',
                  title: 'Connect Once',
                  desc: 'Link WhatsApp Business, Slack, Asana, Linear. Takes 2 minutes. Read-only access.',
                  time: '2 min setup',
                  highlight: 'bg-blue-500/10 border-blue-500/30'
                },
                {
                  step: '02',
                  icon: '�',
                  title: 'EagleEye Watches 24/7',
                  desc: 'EagleEye monitors all your channels, detecting blockers, risks, and escalations.',
                  time: 'Automatic',
                  highlight: 'bg-purple-500/10 border-purple-500/30'
                },
                {
                  step: '03',
                  icon: '📬',
                  title: 'Signals Come to You',
                  desc: 'Wake up to a daily brief in your inbox. Get push alerts only for truly urgent items.',
                  time: 'In your inbox',
                  highlight: 'bg-cyan-500/10 border-cyan-500/30'
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className={`relative p-8 rounded-2xl border ${item.highlight} backdrop-blur`}
                >
                  <div className="text-5xl mb-4">{item.icon}</div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground font-medium">Step {item.step}</span>
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">{item.time}</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </motion.div>
              ))}
            </div>
            
            {/* No App Banner */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 text-center"
            >
              <p className="text-lg">
                <span className="font-semibold text-cyan-400">No dashboard to check.</span>{' '}
                <span className="text-muted-foreground">
                  Important signals find you — in your email, Slack DM, or as a push notification.
                </span>
              </p>
            </motion.div>
          </div>
        </section>

        {/* ============================================ */}
        {/* SECTION 4: WHAT IF I MISS SOMETHING? (Trust) */}
        {/* ============================================ */}
        <section className="py-24 px-6 lg:px-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-500/5 to-transparent" />
          <div className="max-w-[1200px] mx-auto relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 mb-6">
                <Shield className="h-4 w-4 text-amber-400" />
                <span className="text-amber-400 text-sm font-medium">The #1 Question We Get</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold mb-4">
                "What if I miss something important?"
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                We understand. That fear is why you check everything compulsively in the first place. 
                Here's why EagleEye makes you <span className="text-amber-400 font-semibold">more</span> reliable, not less.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: '🎯',
                  title: 'EagleEye Never Sleeps',
                  desc: 'While you sleep, eat, or focus on deep work — EagleEye is scanning every message, every channel, every thread. It catches what humans miss.',
                  highlight: 'bg-amber-500/10 border-amber-500/30'
                },
                {
                  icon: '🚨',
                  title: 'Urgent = Instant Alert',
                  desc: 'If something truly urgent comes in — a client emergency, a production issue, a time-sensitive request — you get an immediate push notification.',
                  highlight: 'bg-red-500/10 border-red-500/30'
                },
                {
                  icon: '📊',
                  title: 'Nothing Falls Through',
                  desc: 'Every message is logged and scored. Review your daily brief to see everything ranked by importance. You decide what deserves attention.',
                  highlight: 'bg-blue-500/10 border-blue-500/30'
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className={`relative p-8 rounded-2xl border ${item.highlight} backdrop-blur`}
                >
                  <div className="text-5xl mb-4">{item.icon}</div>
                  <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-12 p-8 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl"
            >
              <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                <div className="text-6xl">🧠</div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">The paradox of checking everything</h3>
                  <p className="text-muted-foreground text-lg">
                    When you try to monitor 500 messages yourself, you're actually <span className="text-amber-400">more likely</span> to miss things. 
                    Cognitive overload causes blindspots. Let EagleEye do the scanning, you do the deciding.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ============================================ */}
        {/* SECTION 5: WEEKEND & VACATION */}
        {/* ============================================ */}
        <section className="py-24 px-6 lg:px-12 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-teal-500/5 to-transparent" />
          <div className="max-w-[1200px] mx-auto relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/30 mb-6">
                <span className="text-teal-400 text-sm font-medium">🏖️ Time Off, Peace On</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold mb-4">
                Actually enjoy your weekends
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Wedding? Vacation? Kid's recital? EagleEye has your back. 
                Only the truly urgent will reach you — everything else waits.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                <div className="p-6 bg-card/50 border border-border rounded-2xl">
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">🏠</div>
                    <div>
                      <h3 className="font-bold text-xl mb-2">Weekends</h3>
                      <p className="text-muted-foreground">
                        Saturday morning. Your phone buzzes once with a 2-line summary: "Nothing urgent. Team is handling Q4 planning. Enjoy your weekend." That's it.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 bg-card/50 border border-border rounded-2xl">
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">✈️</div>
                    <div>
                      <h3 className="font-bold text-xl mb-2">Vacations</h3>
                      <p className="text-muted-foreground">
                        Two weeks in Bali? EagleEye sends you a daily 30-second brief. If the office is on fire, you'll know. Otherwise, enjoy the beach.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 bg-card/50 border border-border rounded-2xl">
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">🎭</div>
                    <div>
                      <h3 className="font-bold text-xl mb-2">Personal Events</h3>
                      <p className="text-muted-foreground">
                        At your daughter's graduation? A family dinner? EagleEye knows the difference between "need to know now" and "can wait 3 hours."
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="p-8 bg-gradient-to-br from-teal-500/10 to-cyan-500/10 border border-teal-500/20 rounded-2xl"
              >
                <div className="text-center mb-6">
                  <div className="text-6xl mb-4">📱</div>
                  <h3 className="text-2xl font-bold">The "Quick Check" Trap</h3>
                </div>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    "I'll just check Slack for 2 minutes..." <span className="line-through">→ 45 minutes later</span>
                  </p>
                  <p>
                    Sound familiar? Every "quick check" during time off pulls you back into work mode. 
                    Your brain can't context-switch that fast.
                  </p>
                  <p className="text-teal-400 font-semibold">
                    EagleEye eliminates the need to check. If it matters, it finds you.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* SECTION 6: MOBILE — IT JUST WORKS */}
        {/* ============================================ */}
        <section className="py-24 px-6 lg:px-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/5 to-transparent" />
          <div className="max-w-[1200px] mx-auto relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/30 mb-6">
                <span className="text-indigo-400 text-sm font-medium">📱 Works on Mobile</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold mb-4">
                No app to download. Seriously.
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                EagleEye runs silently in the background. Add it to your home screen, enable notifications, and forget about it.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: '1',
                  icon: '🌐',
                  title: 'Open in Browser',
                  desc: 'Visit EagleEye from Safari or Chrome on your phone. Sign in once.',
                  color: 'indigo'
                },
                {
                  step: '2',
                  icon: '📲',
                  title: 'Add to Home Screen',
                  desc: 'Tap "Add to Home Screen" — it looks and feels like a native app.',
                  color: 'purple'
                },
                {
                  step: '3',
                  icon: '🔔',
                  title: 'Enable Push Notifications',
                  desc: 'Get instant alerts for urgent signals. Tap to open your dashboard.',
                  color: 'pink'
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className={`relative p-8 rounded-2xl border bg-${item.color}-500/10 border-${item.color}-500/30 backdrop-blur`}
                >
                  <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">
                    {item.step}
                  </div>
                  <div className="text-5xl mb-4">{item.icon}</div>
                  <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-12 grid md:grid-cols-2 gap-6"
            >
              <div className="p-6 bg-card/50 border border-border rounded-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">⚡</span>
                  <h3 className="font-bold text-xl">Silent & Lightweight</h3>
                </div>
                <p className="text-muted-foreground">
                  No battery drain. No storage used. No background processes. 
                  EagleEye's AI runs in the cloud — your phone just receives the signals.
                </p>
              </div>
              
              <div className="p-6 bg-card/50 border border-border rounded-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">🔒</span>
                  <h3 className="font-bold text-xl">Works Anywhere</h3>
                </div>
                <p className="text-muted-foreground">
                  iPhone, Android, tablet, desktop — same experience everywhere. 
                  Your signals follow you across devices seamlessly.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ============================================ */}
        {/* SECTION 7: BUT ISN'T BEING RESPONSIVE PART OF MY JOB? */}
        {/* ============================================ */}
        <section className="py-24 px-6 lg:px-12 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-rose-500/5 to-transparent" />
          <div className="max-w-[1000px] mx-auto relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/10 border border-rose-500/30 mb-6">
                <span className="text-rose-400 text-sm font-medium">💭 The Mindset Shift</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold mb-4">
                "But being responsive is part of my job"
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div className="p-8 bg-card/50 border border-border rounded-2xl">
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Yes, being responsive matters. But there's a difference between:
                </p>
                <div className="mt-6 grid md:grid-cols-2 gap-6">
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <p className="font-semibold text-red-400 mb-2">❌ Reactive</p>
                    <p className="text-muted-foreground text-sm">
                      Checking every notification, responding to everything instantly, context-switching 100 times a day
                    </p>
                  </div>
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                    <p className="font-semibold text-green-400 mb-2">✅ Responsive</p>
                    <p className="text-muted-foreground text-sm">
                      Addressing urgent items quickly, batching non-urgent responses, protecting deep work time
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="p-6 bg-card/50 border border-border rounded-2xl text-center">
                  <div className="text-4xl mb-3">🎯</div>
                  <p className="text-muted-foreground">
                    <span className="font-bold text-foreground">Top performers</span> respond thoughtfully, not instantly
                  </p>
                </div>
                <div className="p-6 bg-card/50 border border-border rounded-2xl text-center">
                  <div className="text-4xl mb-3">⏱️</div>
                  <p className="text-muted-foreground">
                    <span className="font-bold text-foreground">23 minutes</span> to refocus after an interruption
                  </p>
                </div>
                <div className="p-6 bg-card/50 border border-border rounded-2xl text-center">
                  <div className="text-4xl mb-3">🧠</div>
                  <p className="text-muted-foreground">
                    <span className="font-bold text-foreground">Deep work</span> is how real value gets created
                  </p>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="p-8 bg-gradient-to-r from-rose-500/10 to-purple-500/10 border border-rose-500/20 rounded-2xl text-center"
              >
                <p className="text-xl font-semibold mb-2">
                  EagleEye doesn't make you less responsive.
                </p>
                <p className="text-lg text-muted-foreground">
                  It makes you <span className="text-rose-400 font-bold">strategically responsive</span> — 
                  fast on what matters, focused on everything else.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ============================================ */}
        {/* SECTION 8: SECURITY & TRUST */}
        {/* ============================================ */}
        <section className="py-24 px-6 lg:px-12 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-500/5 to-transparent" />
          <div className="max-w-[1200px] mx-auto relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30 mb-6">
                <Shield className="h-4 w-4 text-green-400" />
                <span className="text-green-400 text-sm font-medium">Enterprise-grade Security</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold mb-4">
                Your data is protected
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Built with security-first architecture. Your team's data stays private and secure.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: '🔒', title: 'Read-only', desc: 'We observe, never act. No posting or editing.' },
                { icon: '🗑️', title: 'No retention', desc: 'Raw data processed and discarded instantly.' },
                { icon: '🔐', title: 'Encrypted', desc: 'TLS 1.3 in transit, AES-256 at rest.' },
                { icon: '🛡️', title: 'SOC 2', desc: 'Compliant with enterprise security standards.' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-6 bg-card/50 border border-border rounded-2xl text-center"
                >
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* Data Promise */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-12 p-8 bg-green-500/10 border border-green-500/30 rounded-2xl text-center"
            >
              <h3 className="text-2xl font-bold text-green-400 mb-3">Our Promise</h3>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Your data is yours. We don't sell it, share it, or use it for anything other than showing you what matters. 
                Delete your account anytime and all your data goes with it.
              </p>
            </motion.div>
          </div>
        </section>

        {/* ============================================ */}
        {/* SECTION 5: INTEGRATIONS */}
        {/* ============================================ */}
        <section className="py-24 px-6 lg:px-12">
          <div className="max-w-[1200px] mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl sm:text-5xl font-bold mb-4">
                Works with your tools
              </h2>
              <p className="text-xl text-muted-foreground">
                Connect in seconds. No complex setup.
              </p>
            </motion.div>

            <div className="flex flex-wrap justify-center gap-4">
              {integrations.map((tool, i) => (
                <motion.div
                  key={tool.name}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ scale: 1.05, y: -4 }}
                  className="flex items-center gap-3 px-6 py-4 bg-card border border-border rounded-2xl"
                >
                  <span className="text-3xl">{tool.icon}</span>
                  <span className="font-medium text-lg">{tool.name}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* SECTION 6: FINAL CTA */}
        {/* ============================================ */}
        <section className="py-24 px-6 lg:px-12">
          <div className="max-w-[900px] mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative p-12 rounded-3xl overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20" />
              <div className="absolute inset-0 bg-card/80 backdrop-blur" />
              
              <div className="relative text-center">
                <h2 className="text-4xl sm:text-5xl font-bold mb-4">
                  Ready for clarity?
                </h2>
                <p className="text-xl text-muted-foreground mb-8 max-w-lg mx-auto">
                  Start your 7-day free trial. Card required, cancel anytime before trial ends.
                </p>
                <Link href="/signup?plan=founder">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center gap-2 px-10 py-5 bg-cyan-500 hover:bg-cyan-400 text-white rounded-xl font-semibold text-xl transition-colors"
                  >
                    Start Free Trial
                    <ArrowRight className="h-6 w-6" />
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Inquiry Section */}
        <InquirySection />
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12 px-6 lg:px-12">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Logo size="md" animated={false} />
            <div className="flex items-center gap-8 text-sm text-muted-foreground">
              <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <a href="mailto:hello@eagleeye.work" className="hover:text-foreground transition-colors">Contact</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border/50 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} EagleEye. Signal. Focus. Succeed.
          </div>
        </div>
      </footer>
    </div>
  )
}
