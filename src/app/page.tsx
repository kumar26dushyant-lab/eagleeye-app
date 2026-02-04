'use client'

import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Shield, Check, ChevronDown, Clock, Zap, Eye, Lock, Crown } from 'lucide-react'
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

// Elite color scheme constants
const COLORS = {
  gold: '#D4AF37',
  goldLight: '#E8C547',
  goldDark: '#B8962E',
  electricBlue: '#22D3EE',
  charcoal: '#0D1117',
  charcoalLight: '#161B22',
}

// Integration logos
const integrations = [
  { name: 'WhatsApp', icon: '📱' },
  { name: 'Slack', icon: '💬' },
  { name: 'Asana', icon: '📋' },
  { name: 'Jira', icon: '🔷' },
  { name: 'Linear', icon: '🎯' },
  { name: 'GitHub', icon: '🐙' },
  { name: 'Teams', icon: '👥' },
]

// Chaos notifications for the nightmare section
const chaosNotifications = [
  { app: 'Slack', text: '@channel urgent meeting in 5', color: '#E01E5A' },
  { app: 'WhatsApp', text: 'Client: Where is the update???', color: '#25D366' },
  { app: 'Jira', text: 'Bug assigned: P1 - Production down', color: '#0052CC' },
  { app: 'Email', text: 'RE: RE: RE: Budget approval needed', color: '#EA4335' },
  { app: 'Teams', text: 'Sarah is typing...', color: '#6264A7' },
  { app: 'Asana', text: 'Task overdue: Q4 Report', color: '#F06A6A' },
  { app: 'Slack', text: 'DM: Hey, got a minute?', color: '#E01E5A' },
  { app: 'Calendar', text: 'Reminder: Stand-up in 10 min', color: '#4285F4' },
  { app: 'WhatsApp', text: 'Vendor: Payment received?', color: '#25D366' },
  { app: 'Jira', text: 'Sprint ending tomorrow', color: '#0052CC' },
]

// Signal cards (the filtered result)
const signalCards = [
  { 
    type: 'CRITICAL', 
    title: 'Payment Failed - Client Escalation', 
    source: 'WhatsApp',
    time: '2 min ago',
    color: COLORS.gold
  },
  { 
    type: 'BLOCKER', 
    title: 'Q4 Launch Blocked - API Dependency', 
    source: 'Jira',
    time: '15 min ago',
    color: COLORS.electricBlue
  },
  { 
    type: 'ACTION', 
    title: 'Budget Approval Required by EOD', 
    source: 'Email',
    time: '1 hour ago',
    color: '#4ADE80'
  },
]

// Animated chaos wall component
function ChaosWall({ intensity = 1 }: { intensity: number }) {
  return (
    <div className="relative h-[300px] overflow-hidden rounded-xl border border-red-500/30">
      {/* Red stress overlay */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-red-500/20 via-red-900/30 to-transparent transition-opacity duration-500"
        style={{ opacity: intensity }}
      />
      
      {/* Chaos notifications */}
      <div className="absolute inset-0 p-4">
        {chaosNotifications.map((notif, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ 
              opacity: intensity > 0.3 ? [0.4, 0.8, 0.4] : 0.1,
              x: 0,
              y: [0, -2, 0]
            }}
            transition={{ 
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: i * 0.15
            }}
            className="absolute px-3 py-2 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10 text-xs"
            style={{ 
              top: `${(i * 10) % 85}%`,
              left: `${(i * 15 + 5) % 70}%`,
              borderLeftColor: notif.color,
              borderLeftWidth: 3,
            }}
          >
            <span className="text-muted-foreground">{notif.app}:</span>
            <span className="ml-1 text-foreground/80">{notif.text}</span>
          </motion.div>
        ))}
      </div>
      
      {/* Blur overlay when chaotic */}
      <div 
        className="absolute inset-0 backdrop-blur-[2px] transition-all duration-500"
        style={{ opacity: intensity > 0.5 ? intensity * 0.3 : 0 }}
      />
      
      {/* Counter */}
      <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/50">
        <span className="text-red-400 font-mono text-sm">
          {Math.round(100 * intensity)}+ notifications
        </span>
      </div>
    </div>
  )
}

// Clean signals component
function CleanSignals({ intensity = 1 }: { intensity: number }) {
  return (
    <div className="relative h-[300px] overflow-hidden rounded-xl border border-cyan-500/30 bg-[#0D1117]/80">
      {/* Calm gradient */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5 transition-opacity duration-500"
        style={{ opacity: intensity }}
      />
      
      <div className="p-4 space-y-3 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs text-cyan-400 font-medium">Morning Brief</span>
          </div>
          <span className="text-xs text-muted-foreground">3 signals • 5 min read</span>
        </div>
        
        {/* Signal cards */}
        <div className="flex-1 space-y-2">
          {signalCards.map((signal, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: intensity, y: 0 }}
              transition={{ delay: i * 0.2 + 0.3 }}
              className="p-3 rounded-lg bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span 
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${signal.color}20`, color: signal.color }}
                    >
                      {signal.type}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{signal.source}</span>
                  </div>
                  <p className="text-sm font-medium text-foreground/90">{signal.title}</p>
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">{signal.time}</span>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Footer stat */}
        <div className="pt-2 border-t border-white/10 text-center">
          <span className="text-xs text-muted-foreground">
            <span className="text-cyan-400 font-semibold">97 notifications filtered</span> • 12 minutes saved
          </span>
        </div>
      </div>
    </div>
  )
}

// Interactive Chaos to Signal Slider
function ChaosSignalSlider() {
  const [sliderValue, setSliderValue] = useState(100)
  const chaosIntensity = sliderValue / 100
  const signalIntensity = 1 - chaosIntensity
  
  return (
    <div className="space-y-6">
      {/* Slider */}
      <div className="relative">
        <input
          type="range"
          min="0"
          max="100"
          value={sliderValue}
          onChange={(e) => setSliderValue(Number(e.target.value))}
          className="w-full h-3 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${COLORS.electricBlue} 0%, ${COLORS.electricBlue} ${100 - sliderValue}%, #ef4444 ${100 - sliderValue}%, #ef4444 100%)`
          }}
        />
        <div className="flex justify-between mt-2 text-xs">
          <span className="text-cyan-400 font-medium">← EagleEye View</span>
          <span className="text-red-400 font-medium">Chaos →</span>
        </div>
      </div>
      
      {/* Two views side by side on larger screens, stacked on mobile */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="relative">
          <div className="absolute -top-3 left-4 px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/50 text-xs text-cyan-400 z-10">
            EagleEye
          </div>
          <CleanSignals intensity={signalIntensity + 0.3} />
        </div>
        <div className="relative">
          <div className="absolute -top-3 left-4 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/50 text-xs text-red-400 z-10">
            Without EagleEye
          </div>
          <ChaosWall intensity={chaosIntensity} />
        </div>
      </div>
    </div>
  )
}

// Premium gold CTA button
function GoldButton({ children, href, size = 'default' }: { children: React.ReactNode; href: string; size?: 'default' | 'large' }) {
  const sizeClasses = size === 'large' 
    ? 'px-10 py-5 text-lg' 
    : 'px-8 py-4 text-base'
  
  return (
    <Link href={href}>
      <motion.button
        whileHover={{ scale: 1.02, boxShadow: `0 0 30px ${COLORS.gold}40` }}
        whileTap={{ scale: 0.98 }}
        className={`${sizeClasses} font-bold rounded-xl text-[#0D1117] transition-all flex items-center gap-2`}
        style={{
          background: `linear-gradient(135deg, ${COLORS.goldLight} 0%, ${COLORS.gold} 50%, ${COLORS.goldDark} 100%)`,
          boxShadow: `0 0 20px ${COLORS.gold}30`,
        }}
      >
        {children}
        <ArrowRight className="h-5 w-5" />
      </motion.button>
    </Link>
  )
}

// Expandable FAQ/Objection component
function ObjectionAccordion({ 
  icon, 
  title, 
  preview, 
  children,
}: { 
  icon: React.ReactNode
  title: string
  preview: string
  children: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <motion.div 
      className="border border-white/10 rounded-xl overflow-hidden bg-white/5"
      layout
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-5 flex items-center gap-4 text-left hover:bg-white/5 transition-colors"
      >
        <div className="text-2xl flex-shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold">{title}</h3>
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
            <div className="px-5 pb-5 pt-2 border-t border-white/10">
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
  const spotsLeft = 5
  
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-[#0D1117] text-white overflow-hidden">
      <Suspense fallback={null}>
        <CancelledSubscriptionHandler />
      </Suspense>
      
      {/* Subtle animated background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#161B22_0%,#0D1117_70%)]" />
        <div 
          className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full blur-[120px] opacity-20"
          style={{ background: COLORS.electricBlue }}
        />
        <div 
          className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full blur-[100px] opacity-10"
          style={{ background: COLORS.gold }}
        />
      </div>

      {/* Navigation */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-[#0D1117]/95 backdrop-blur-xl border-b border-white/10' : 'bg-transparent'
        }`}
      >
        <nav className="max-w-[1400px] mx-auto px-6 lg:px-12 h-20 flex items-center justify-between">
          <Logo size="lg" showText={true} showTagline={false} animated={true} variant="glow" />
          <div className="flex items-center gap-6">
            <Link href="/pricing" className="text-sm text-white/70 hover:text-white transition-colors hidden sm:block">
              Pricing
            </Link>
            <Link href="/login" className="text-sm text-white/70 hover:text-white transition-colors">
              Sign in
            </Link>
            <GoldButton href="/signup?plan=founder">
              <span className="hidden sm:inline">Claim Your Command Center</span>
              <span className="sm:hidden">Start Free</span>
            </GoldButton>
          </div>
        </nav>
      </motion.header>

      <main>
        {/* ============================================ */}
        {/* HERO: "Own the Signal. Master the Chaos." */}
        {/* ============================================ */}
        <section className="pt-32 pb-20 px-6 lg:px-12 relative">
          <div className="max-w-[1200px] mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Premium headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black mb-6 leading-tight tracking-tight">
                <span className="text-white">Own the Signal.</span>
                <br />
                <span 
                  className="bg-clip-text text-transparent"
                  style={{ 
                    backgroundImage: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldLight} 50%, ${COLORS.gold} 100%)` 
                  }}
                >
                  Master the Chaos.
                </span>
              </h1>
              
              {/* Sub-headline with authority */}
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-lg sm:text-xl text-white/70 max-w-3xl mx-auto mb-10 leading-relaxed"
              >
                While your competitors are drowning in 1,000+ notifications, you're already making the winning move. 
                EagleEye filters the noise of WhatsApp, Slack, and Jira into the 
                <span style={{ color: COLORS.gold }}> 3 critical priorities</span> that actually matter.
                <span className="block mt-2 text-white font-medium">Be the leader who knows first.</span>
              </motion.p>
              
              {/* CTA with gold button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-8"
              >
                <GoldButton href="/signup?plan=founder" size="large">
                  Claim Your Command Center
                </GoldButton>
              </motion.div>
              
              {/* Trust indicators */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="flex flex-wrap justify-center gap-6 text-sm text-white/50"
              >
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" style={{ color: COLORS.gold }} />
                  <span>7-day free trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4" style={{ color: COLORS.electricBlue }} />
                  <span>Read-only • Never posts</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" style={{ color: COLORS.gold }} />
                  <span>Setup in 2 minutes</span>
                </div>
              </motion.div>
            </motion.div>
            
            {/* Mini morning brief preview */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.6 }}
              className="mt-16 max-w-md mx-auto"
            >
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                    <Eye className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-white/50">Your Morning Brief</p>
                    <p className="text-sm font-semibold text-white">3 Critical Risks Found</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-xs" style={{ color: COLORS.gold }}>12 min saved</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ============================================ */}
        {/* NIGHTMARE SECTION: "The 650-Hour Tax" */}
        {/* ============================================ */}
        <section className="py-24 px-6 lg:px-12 relative">
          <div className="max-w-[1100px] mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl sm:text-5xl font-black mb-6">
                The <span className="text-red-400">650-Hour</span> Tax
              </h2>
              <p className="text-lg text-white/60 max-w-2xl mx-auto">
                The average leader loses 650 hours a year to "scrolling hell." 
                Searching for that one urgent WhatsApp message. Missing the Slack escalation. 
                Checking Jira for the fifth time. 
                <span className="block mt-2 text-white/80 font-medium">That's not leadership. That's admin.</span>
              </p>
            </motion.div>
            
            {/* Interactive Chaos/Signal Slider */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <ChaosSignalSlider />
            </motion.div>
          </div>
        </section>

        {/* ============================================ */}
        {/* THE "BIG THREE" FEATURES */}
        {/* ============================================ */}
        <section className="py-24 px-6 lg:px-12 bg-white/[0.02]">
          <div className="max-w-[1100px] mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl sm:text-5xl font-black mb-4">
                A <span style={{ color: COLORS.gold }}>'God-View'</span> for Your Business
              </h2>
              <p className="text-white/60">
                Three capabilities that change everything.
              </p>
            </motion.div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { 
                  icon: '🚨',
                  title: 'The Urgent Filter', 
                  desc: 'Sarah mentioned "Payment Failed" on WhatsApp? You\'ll know in seconds. Everything else waits.',
                  accent: COLORS.gold
                },
                { 
                  icon: '🔍',
                  title: 'The Blocker Detection', 
                  desc: 'Is the Q4 launch stuck in Jira? EagleEye surfaces the bottleneck before you even ask for an update.',
                  accent: COLORS.electricBlue
                },
                { 
                  icon: '📋',
                  title: 'The Morning Brief', 
                  desc: 'Your entire day, synthesized in 5 minutes. Clear. Actionable. Done.',
                  accent: '#4ADE80'
                },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all group"
                >
                  <div 
                    className="text-4xl mb-4 w-14 h-14 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${feature.accent}15` }}
                  >
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3" style={{ color: feature.accent }}>{feature.title}</h3>
                  <p className="text-white/60 leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* FORT KNOX SECTION: Security & Trust */}
        {/* ============================================ */}
        <section className="py-24 px-6 lg:px-12">
          <div className="max-w-[900px] mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30 mb-6">
                <Shield className="h-4 w-4 text-green-400" />
                <span className="text-green-400 text-sm font-medium">Enterprise-Grade Security</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black mb-4">
                Your Data is Your Business. <span className="text-green-400">Period.</span>
              </h2>
              <p className="text-white/60 max-w-xl mx-auto">
                Built for the Boardroom. We use Read-Only access. We never post. We never store raw data.
                We see the signal; we ignore the rest.
              </p>
            </motion.div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: '🔒', label: 'Read-Only Access', desc: 'We observe, never act' },
                { icon: '🛡️', label: 'AES-256 Encryption', desc: 'Bank-level security' },
                { icon: '🗑️', label: 'No Raw Storage', desc: 'Processed & discarded' },
                { icon: '✅', label: 'SOC 2 Ready', desc: 'Compliance-first design' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-4 rounded-xl bg-white/5 border border-white/10 text-center"
                >
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <p className="font-semibold text-sm mb-1">{item.label}</p>
                  <p className="text-xs text-white/50">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* FOMO PRICING SECTION */}
        {/* ============================================ */}
        <section className="py-24 px-6 lg:px-12 bg-white/[0.02]">
          <div className="max-w-[900px] mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl sm:text-4xl font-black mb-4">
                Buy Back Your <span style={{ color: COLORS.gold }}>Time</span>
              </h2>
              <p className="text-white/60">
                Two simple plans. No hidden fees. Cancel anytime.
              </p>
            </motion.div>
            
            <div className="grid md:grid-cols-2 gap-6 max-w-[700px] mx-auto">
              {/* Professional Plan */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="p-6 rounded-2xl bg-white/5 border border-white/10"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-white/10">
                    <Crown className="h-5 w-5 text-white/70" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Professional</h3>
                    <p className="text-xs text-white/50">For the rising leader</p>
                  </div>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-black">$29</span>
                  <span className="text-white/50">/month</span>
                </div>
                <ul className="space-y-3 mb-6">
                  {['10 tools connected', 'Daily morning brief', 'Email & push alerts', '90-day history'].map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-white/70">
                      <Check className="h-4 w-4 text-green-400" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup?plan=founder" className="block">
                  <button className="w-full py-3 rounded-xl border border-white/20 text-white font-semibold hover:bg-white/5 transition-colors">
                    Start 7-Day Free Trial
                  </button>
                </Link>
              </motion.div>
              
              {/* Executive Plan - MOST POPULAR */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="p-6 rounded-2xl border-2 relative"
                style={{ 
                  borderColor: COLORS.gold,
                  background: `linear-gradient(135deg, ${COLORS.gold}08 0%, transparent 50%)`
                }}
              >
                {/* Popular badge */}
                <div 
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold"
                  style={{ backgroundColor: COLORS.gold, color: '#0D1117' }}
                >
                  MOST POPULAR
                </div>
                
                <div className="flex items-center gap-3 mb-4 mt-2">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${COLORS.gold}20` }}>
                    <Zap className="h-5 w-5" style={{ color: COLORS.gold }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Executive</h3>
                    <p className="text-xs text-white/50">For Founders and VPs</p>
                  </div>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-black" style={{ color: COLORS.gold }}>$99</span>
                  <span className="text-white/50">/month</span>
                </div>
                <ul className="space-y-3 mb-6">
                  {[
                    'Everything in Professional',
                    'Real-time urgency alerts',
                    'Dedicated signal tuning',
                    'Priority support',
                    'Unlimited history'
                  ].map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-white/70">
                      <Check className="h-4 w-4" style={{ color: COLORS.gold }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <GoldButton href="/signup?plan=team">
                  Join the Elite
                </GoldButton>
                
                {/* FOMO ticker */}
                <div className="mt-4 text-center">
                  <p className="text-xs text-white/50">
                    <span style={{ color: COLORS.gold }} className="font-semibold">
                      Only {spotsLeft} Executive spots left
                    </span> for February intake
                  </p>
                </div>
              </motion.div>
            </div>
            
            <p className="text-center text-sm text-white/40 mt-8">
              All plans include a 7-day free trial. Card required. Cancel anytime.
            </p>
          </div>
        </section>

        {/* ============================================ */}
        {/* INTEGRATIONS */}
        {/* ============================================ */}
        <section className="py-16 px-6 lg:px-12">
          <div className="max-w-[1000px] mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-bold mb-6">Connects to Your Entire Stack</h2>
              <div className="flex flex-wrap justify-center gap-3">
                {integrations.map((tool, i) => (
                  <motion.div
                    key={tool.name}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm hover:border-white/20 transition-colors"
                  >
                    <span>{tool.icon}</span>
                    <span>{tool.name}</span>
                  </motion.div>
                ))}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: integrations.length * 0.05 }}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm"
                >
                  <span>+</span>
                  <span className="text-white/50">More coming</span>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ============================================ */}
        {/* FOUNDER'S NOTE */}
        {/* ============================================ */}
        <section className="py-20 px-6 lg:px-12">
          <div className="max-w-[600px] mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-8 rounded-2xl bg-white/5 border border-white/10 relative"
            >
              <div className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-[#0D1117] border border-white/10 text-xs text-white/50">
                Note from the Founder
              </div>
              
              <p className="text-white/80 leading-relaxed mb-4 italic">
                "I built EagleEye because I was tired of being a slave to my phone. 
                I wanted to be a leader again, not a notification processor.
              </p>
              <p className="text-white/80 leading-relaxed mb-6 italic">
                This is the tool I use every morning at 7:00 AM. It changed how I work.
                Join me."
              </p>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold">
                  D
                </div>
                <div>
                  <p className="font-semibold text-sm">Dushyant Kumar</p>
                  <p className="text-xs text-white/50">Founder, EagleEye</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ============================================ */}
        {/* FAQ / OBJECTION BUSTERS */}
        {/* ============================================ */}
        <section className="py-20 px-6 lg:px-12 bg-white/[0.02]">
          <div className="max-w-[700px] mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10"
            >
              <h2 className="text-2xl sm:text-3xl font-bold">
                Common Questions
              </h2>
            </motion.div>
            
            <div className="space-y-3">
              <ObjectionAccordion
                icon="🤔"
                title="What if I miss something important?"
                preview="EagleEye catches what humans miss"
              >
                <p className="text-white/60 text-sm leading-relaxed">
                  That fear is why you check compulsively. Here's the paradox: when you try to monitor 500 messages yourself, you're more likely to miss things. EagleEye never sleeps, never gets tired, and surfaces urgency instantly via push notifications.
                </p>
              </ObjectionAccordion>
              
              <ObjectionAccordion
                icon="🏖️"
                title="What about weekends and vacations?"
                preview="Enjoy your time off. If it's urgent, you'll know."
              >
                <p className="text-white/60 text-sm leading-relaxed">
                  EagleEye knows the difference between "need to know now" and "can wait until Monday." On weekends, you get a 2-line summary. On vacation, a 30-second brief. If the office is on fire, you'll know.
                </p>
              </ObjectionAccordion>
              
              <ObjectionAccordion
                icon="📱"
                title="Does it work on mobile?"
                preview="No app needed. Works on any device."
              >
                <p className="text-white/60 text-sm leading-relaxed">
                  EagleEye is a web app. Add it to your home screen, enable push notifications, and forget about it. No battery drain, no storage used. Works on iPhone, Android, iPad, or desktop.
                </p>
              </ObjectionAccordion>
              
              <ObjectionAccordion
                icon="⚡"
                title="How fast is setup?"
                preview="2 minutes. Connect and go."
              >
                <p className="text-white/60 text-sm leading-relaxed">
                  OAuth connections mean one-click authorization. Connect Slack, WhatsApp Business, Asana, Jira—all in under 2 minutes. Your first brief arrives within 24 hours.
                </p>
              </ObjectionAccordion>
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* FINAL CTA */}
        {/* ============================================ */}
        <section className="py-24 px-6 lg:px-12">
          <div className="max-w-[700px] mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="p-10 rounded-3xl border relative overflow-hidden"
              style={{ 
                borderColor: `${COLORS.gold}40`,
                background: `linear-gradient(135deg, ${COLORS.gold}08 0%, ${COLORS.electricBlue}08 100%)`
              }}
            >
              {/* Glow effect */}
              <div 
                className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[150px] rounded-full blur-[80px] opacity-30"
                style={{ background: COLORS.gold }}
              />
              
              <h2 className="text-3xl sm:text-4xl font-black mb-4 relative z-10">
                Tomorrow's 1,000 pings are coming.
              </h2>
              <p className="text-lg text-white/60 mb-8 relative z-10">
                Start your 7-day free trial. See what you've been missing.
              </p>
              
              <div className="relative z-10">
                <GoldButton href="/signup?plan=founder" size="large">
                  Claim Your Command Center
                </GoldButton>
              </div>
              
              <p className="text-sm text-white/40 mt-6 relative z-10">
                Card required • Cancel anytime • $29/month after trial
              </p>
            </motion.div>
          </div>
        </section>

        {/* Inquiry Section */}
        <InquirySection />
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6 lg:px-12 bg-[#0a0a0a]">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Logo size="md" animated={false} />
            <div className="flex items-center gap-8 text-sm text-white/50">
              <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <a href="mailto:hello@eagleeye.work" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/10 text-center text-sm text-white/40">
            © {new Date().getFullYear()} EagleEye. Own the Signal. Master the Chaos.
          </div>
        </div>
      </footer>
    </div>
  )
}
