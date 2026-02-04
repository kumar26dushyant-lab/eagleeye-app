'use client'

import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Shield, Check, ChevronDown, AlertTriangle, Bell, Clock, Brain, Smartphone, Coffee, ChevronRight, Minus, Plus } from 'lucide-react'
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
      window.history.replaceState({}, '', '/')
    }
  }, [searchParams])
  
  return null
}

// Animated gradient orb
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

// Expandable FAQ/Objection component
function ObjectionAccordion({ 
  icon, 
  title, 
  preview, 
  children,
  color = 'cyan'
}: { 
  icon: React.ReactNode
  title: string
  preview: string
  children: React.ReactNode
  color?: 'cyan' | 'amber' | 'teal' | 'rose' | 'green'
}) {
  const [isOpen, setIsOpen] = useState(false)
  
  const colorClasses = {
    cyan: 'border-cyan-500/30 bg-cyan-500/5',
    amber: 'border-amber-500/30 bg-amber-500/5',
    teal: 'border-teal-500/30 bg-teal-500/5',
    rose: 'border-rose-500/30 bg-rose-500/5',
    green: 'border-green-500/30 bg-green-500/5',
  }
  
  return (
    <motion.div 
      className={`border rounded-2xl overflow-hidden transition-colors ${colorClasses[color]}`}
      layout
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 flex items-center gap-4 text-left hover:bg-white/5 transition-colors"
      >
        <div className="text-3xl flex-shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg">{title}</h3>
          <p className="text-sm text-muted-foreground truncate">{preview}</p>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        </motion.div>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-2 border-t border-border/50">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
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

      {/* Navigation */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-background/90 backdrop-blur-xl border-b border-border/50' : 'bg-transparent'
        }`}
      >
        <nav className="max-w-[1400px] mx-auto px-6 lg:px-12 h-20 flex items-center justify-between">
          <Logo size="lg" showText={true} showTagline={true} animated={true} variant="glow" />
          <div className="flex items-center gap-6">
            <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              Pricing
            </Link>
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
        {/* HERO: MULTIPLE PROBLEMS - Connect Different People */}
        {/* ============================================ */}
        <section className="pt-32 pb-20 px-6 lg:px-12 relative">
          <div className="max-w-[1200px] mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              {/* The hook - relatable problems */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Sound familiar?
              </h1>
              
              {/* Multiple scenarios different people relate to */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto mb-10">
                {[
                  { emoji: '😵', text: '100+ pings before lunch' },
                  { emoji: '😰', text: "Checked everything, still missed something" },
                  { emoji: '🏃', text: '"Quick check" turned into 45 mins' },
                  { emoji: '🔥', text: "Found out too late" },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="p-4 rounded-xl bg-red-500/10 border border-red-500/20"
                  >
                    <div className="text-3xl mb-2">{item.emoji}</div>
                    <p className="text-sm text-muted-foreground">{item.text}</p>
                  </motion.div>
                ))}
              </div>
              
              {/* The promise */}
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8"
              >
                Slack, WhatsApp, Asana, Jira, Teams... You're not supposed to monitor all of it. 
                <span className="text-cyan-400 font-medium"> Let EagleEye watch. You decide.</span>
              </motion.p>
              
              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              >
                <Link href="/signup?plan=founder">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-white rounded-xl font-semibold text-lg transition-colors flex items-center gap-2"
                  >
                    Try Free for 7 Days
                    <ArrowRight className="h-5 w-5" />
                  </motion.button>
                </Link>
                <p className="text-sm text-muted-foreground">
                  Card required • Cancel anytime • $9/mo after
                </p>
              </motion.div>
            </motion.div>
            
            {/* Social proof bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground"
            >
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-cyan-400" />
                <span><strong className="text-foreground">2+ hours</strong> saved daily</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-400" />
                <span>Read-only • <strong className="text-foreground">Never posts</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Coffee className="h-4 w-4 text-amber-400" />
                <span><strong className="text-foreground">5-min</strong> morning brief</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ============================================ */}
        {/* SOLUTION PREVIEW: Clean Signals */}
        {/* ============================================ */}
        <section className="py-20 px-6 lg:px-12 relative">
          <div className="max-w-[1000px] mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10"
            >
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                147 messages → <span className="text-cyan-400">3 that matter</span>
              </h2>
              <p className="text-muted-foreground">
                EagleEye reads everything. You see only what needs you.
              </p>
            </motion.div>
            
            {/* Signal cards preview */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-card/50 border border-border rounded-2xl p-6 space-y-4"
            >
              {[
                { 
                  type: '🚨 URGENT', 
                  title: 'Client escalation in #enterprise', 
                  desc: 'Sarah mentioned "urgent" - needs your response',
                  color: 'red',
                  badge: 'Slack'
                },
                { 
                  type: '⏰ BLOCKER', 
                  title: 'Q4 launch dependency at risk', 
                  desc: 'API integration blocked - assigned to you',
                  color: 'amber',
                  badge: 'Jira'
                },
                { 
                  type: '✅ WIN', 
                  title: 'Team shipped v2.0 early', 
                  desc: 'Milestone achieved ahead of schedule',
                  color: 'green',
                  badge: 'Asana'
                },
              ].map((signal, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className={`p-4 rounded-xl border bg-${signal.color}-500/5 border-${signal.color}-500/20`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold text-${signal.color}-400`}>{signal.type}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{signal.badge}</span>
                      </div>
                      <h4 className="font-medium">{signal.title}</h4>
                      <p className="text-sm text-muted-foreground">{signal.desc}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  </div>
                </motion.div>
              ))}
              
              <div className="text-center pt-4 border-t border-border/50">
                <p className="text-sm text-muted-foreground">
                  <span className="text-cyan-400 font-semibold">Done in 5 minutes</span> • 144 messages filtered out
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ============================================ */}
        {/* HOW IT WORKS: Simple 3-Step */}
        {/* ============================================ */}
        <section className="py-20 px-6 lg:px-12 bg-muted/30">
          <div className="max-w-[1000px] mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Set up once. Forget it.
              </h2>
              <p className="text-muted-foreground">
                No daily checking. Signals find you.
              </p>
            </motion.div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { 
                  step: '1', 
                  icon: '🔗', 
                  title: 'Connect', 
                  desc: 'Link your tools in 2 minutes. Read-only access.',
                  tools: 'Slack, WhatsApp, Asana, Jira...'
                },
                { 
                  step: '2', 
                  icon: '🦅', 
                  title: 'EagleEye Watches', 
                  desc: '24/7 monitoring for blockers, risks, and wins.',
                  tools: 'You focus on deep work'
                },
                { 
                  step: '3', 
                  icon: '📬', 
                  title: 'Signals Find You', 
                  desc: 'Daily brief in your inbox. Urgent = instant push.',
                  tools: 'Email, push, or Slack DM'
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="relative p-6 bg-card border border-border rounded-2xl"
                >
                  <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                    {item.step}
                  </div>
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground mb-3">{item.desc}</p>
                  <p className="text-xs text-muted-foreground/70">{item.tools}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* OBJECTION BUSTERS: Collapsible Accordions */}
        {/* ============================================ */}
        <section className="py-20 px-6 lg:px-12">
          <div className="max-w-[800px] mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10"
            >
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                You might be thinking...
              </h2>
            </motion.div>
            
            <div className="space-y-4">
              {/* Objection 1: Trust */}
              <ObjectionAccordion
                icon="🤔"
                title="What if I miss something important?"
                preview="EagleEye catches what humans miss"
                color="amber"
              >
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    That fear is why you check compulsively. Here's the paradox: when you try to monitor 500 messages yourself, you're <span className="text-amber-400">more likely</span> to miss things. Cognitive overload causes blindspots.
                  </p>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-background rounded-lg text-center">
                      <div className="text-2xl mb-1">🎯</div>
                      <p className="text-xs text-muted-foreground">EagleEye never sleeps</p>
                    </div>
                    <div className="p-3 bg-background rounded-lg text-center">
                      <div className="text-2xl mb-1">🚨</div>
                      <p className="text-xs text-muted-foreground">Urgent = instant push</p>
                    </div>
                    <div className="p-3 bg-background rounded-lg text-center">
                      <div className="text-2xl mb-1">📊</div>
                      <p className="text-xs text-muted-foreground">Nothing falls through</p>
                    </div>
                  </div>
                </div>
              </ObjectionAccordion>
              
              {/* Objection 2: Weekend/Vacation */}
              <ObjectionAccordion
                icon="🏖️"
                title="What about weekends and vacations?"
                preview="Enjoy your time off. If it's urgent, you'll know."
                color="teal"
              >
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    EagleEye knows the difference between "need to know now" and "can wait until Monday."
                  </p>
                  <div className="space-y-3">
                    <div className="p-3 bg-background rounded-lg flex items-start gap-3">
                      <span className="text-xl">🏠</span>
                      <div>
                        <p className="font-medium text-sm">Weekends</p>
                        <p className="text-xs text-muted-foreground">One 2-line summary: "Nothing urgent. Enjoy your weekend."</p>
                      </div>
                    </div>
                    <div className="p-3 bg-background rounded-lg flex items-start gap-3">
                      <span className="text-xl">✈️</span>
                      <div>
                        <p className="font-medium text-sm">Vacations</p>
                        <p className="text-xs text-muted-foreground">30-second daily brief. If the office is on fire, you'll know.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </ObjectionAccordion>
              
              {/* Objection 3: Mobile */}
              <ObjectionAccordion
                icon="📱"
                title="Does it work on mobile?"
                preview="No app needed. Works on any device."
                color="cyan"
              >
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    EagleEye is a web app. Add it to your home screen, enable push notifications, and forget about it. No battery drain, no storage used.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-background rounded-full text-xs">✓ iPhone</span>
                    <span className="px-3 py-1 bg-background rounded-full text-xs">✓ Android</span>
                    <span className="px-3 py-1 bg-background rounded-full text-xs">✓ Push notifications</span>
                    <span className="px-3 py-1 bg-background rounded-full text-xs">✓ Works offline</span>
                  </div>
                </div>
              </ObjectionAccordion>
              
              {/* Objection 4: Hustle culture */}
              <ObjectionAccordion
                icon="💭"
                title="But being responsive is part of my job"
                preview="Responsive ≠ reactive. There's a difference."
                color="rose"
              >
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="font-medium text-red-400 text-sm mb-1">❌ Reactive</p>
                      <p className="text-xs text-muted-foreground">Checking every ping, responding instantly, context-switching 100x/day</p>
                    </div>
                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <p className="font-medium text-green-400 text-sm mb-1">✅ Responsive</p>
                      <p className="text-xs text-muted-foreground">Fast on urgent, batched on rest, protecting deep work</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <span className="text-rose-400 font-semibold">23 minutes</span> — time to refocus after each interruption. EagleEye makes you strategically responsive.
                  </p>
                </div>
              </ObjectionAccordion>
              
              {/* Security */}
              <ObjectionAccordion
                icon="🔒"
                title="Is my data safe?"
                preview="Bank-level encryption. We never post or store raw data."
                color="green"
              >
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-background rounded-lg text-center">
                      <p className="font-medium text-sm">Read-only</p>
                      <p className="text-xs text-muted-foreground">We observe, never act</p>
                    </div>
                    <div className="p-3 bg-background rounded-lg text-center">
                      <p className="font-medium text-sm">No retention</p>
                      <p className="text-xs text-muted-foreground">Raw data processed & discarded</p>
                    </div>
                    <div className="p-3 bg-background rounded-lg text-center">
                      <p className="font-medium text-sm">Encrypted</p>
                      <p className="text-xs text-muted-foreground">TLS 1.3 + AES-256</p>
                    </div>
                    <div className="p-3 bg-background rounded-lg text-center">
                      <p className="font-medium text-sm">Delete anytime</p>
                      <p className="text-xs text-muted-foreground">Your data goes with you</p>
                    </div>
                  </div>
                </div>
              </ObjectionAccordion>
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* INTEGRATIONS: Quick Visual */}
        {/* ============================================ */}
        <section className="py-16 px-6 lg:px-12 bg-muted/30">
          <div className="max-w-[1000px] mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-bold mb-6">Works with your stack</h2>
              <div className="flex flex-wrap justify-center gap-3">
                {integrations.map((tool, i) => (
                  <motion.div
                    key={tool.name}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-full text-sm"
                  >
                    <span>{tool.icon}</span>
                    <span>{tool.name}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ============================================ */}
        {/* FINAL CTA: Urgency */}
        {/* ============================================ */}
        <section className="py-24 px-6 lg:px-12">
          <div className="max-w-[700px] mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="p-10 rounded-3xl bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10 border border-cyan-500/20"
            >
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Tomorrow's 100 pings are coming.
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Start your 7-day free trial. See what you've been missing.
              </p>
              <Link href="/signup?plan=founder">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-10 py-5 bg-cyan-500 hover:bg-cyan-400 text-white rounded-xl font-semibold text-xl transition-colors flex items-center gap-2 mx-auto"
                >
                  Start Free Trial
                  <ArrowRight className="h-6 w-6" />
                </motion.button>
              </Link>
              <p className="text-sm text-muted-foreground mt-4">
                Card required • Cancel anytime • $9/month after trial
              </p>
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
