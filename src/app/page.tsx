'use client'

import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Shield, Check, ChevronDown, Clock, Zap, Eye, Lock, Crown, Building2 } from 'lucide-react'
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

// Brand color scheme constants - Cyan/Blue theme
const COLORS = {
  primary: '#22D3EE',
  primaryLight: '#67E8F9',
  primaryDark: '#06B6D4',
  accent: '#0EA5E9',
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
    color: '#EF4444'
  },
  { 
    type: 'BLOCKER', 
    title: 'Q4 Launch Blocked - API Dependency', 
    source: 'Jira',
    time: '15 min ago',
    color: '#F59E0B'
  },
  { 
    type: 'ACTION', 
    title: 'Budget Approval Required by EOD', 
    source: 'Email',
    time: '1 hour ago',
    color: '#22D3EE'
  },
]

// Animated chaos wall component (mobile responsive)
function ChaosWall({ intensity = 1 }: { intensity: number }) {
  return (
    <div className="relative h-[220px] sm:h-[300px] overflow-hidden rounded-xl border border-red-500/30">
      {/* Red stress overlay */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-red-500/20 via-red-900/30 to-transparent transition-opacity duration-500"
        style={{ opacity: intensity }}
      />
      
      {/* Chaos notifications */}
      <div className="absolute inset-0 p-2 sm:p-4">
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
            className="absolute px-2 py-1 sm:px-3 sm:py-2 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10 text-[10px] sm:text-xs max-w-[140px] sm:max-w-none"
            style={{ 
              top: `${(i * 10) % 85}%`,
              left: `${(i * 15 + 5) % 60}%`,
              borderLeftColor: notif.color,
              borderLeftWidth: 3,
            }}
          >
            <span className="text-muted-foreground">{notif.app}:</span>
            <span className="ml-1 text-foreground/80 line-clamp-1">{notif.text}</span>
          </motion.div>
        ))}
      </div>
      
      {/* Blur overlay when chaotic */}
      <div 
        className="absolute inset-0 backdrop-blur-[2px] transition-all duration-500"
        style={{ opacity: intensity > 0.5 ? intensity * 0.3 : 0 }}
      />
      
      {/* Counter */}
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-red-500/20 border border-red-500/50">
        <span className="text-red-400 font-mono text-[10px] sm:text-sm">
          <span className="hidden sm:inline">{Math.round(100 * intensity)}+ notifications</span>
          <span className="sm:hidden">{Math.round(100 * intensity)}+</span>
        </span>
      </div>
    </div>
  )
}

// Clean signals component with glow effect based on intensity (mobile responsive)
function CleanSignals({ intensity = 1 }: { intensity: number }) {
  // Calculate visual state - higher intensity = more vibrant/glowing
  const glowOpacity = Math.min(1, intensity * 1.2)
  const borderOpacity = 0.3 + (intensity * 0.5)
  const cardOpacity = 0.3 + (intensity * 0.7)
  
  return (
    <div 
      className="relative h-[220px] sm:h-[300px] overflow-hidden rounded-xl border bg-[#0D1117]/80 transition-all duration-300"
      style={{ 
        borderColor: `rgba(34, 211, 238, ${borderOpacity})`,
        boxShadow: intensity > 0.5 ? `0 0 ${30 * intensity}px rgba(34, 211, 238, ${intensity * 0.3})` : 'none'
      }}
    >
      {/* Calm gradient - glows when active */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-blue-500/10 transition-opacity duration-300"
        style={{ opacity: glowOpacity }}
      />
      
      {/* Glow overlay when EagleEye is dominant */}
      <div 
        className="absolute inset-0 bg-gradient-to-t from-cyan-500/5 to-transparent transition-opacity duration-300"
        style={{ opacity: intensity > 0.5 ? intensity : 0 }}
      />
      
      <div className="p-3 sm:p-4 space-y-2 sm:space-y-3 h-full flex flex-col relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div 
              className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all duration-300"
              style={{ 
                backgroundColor: `rgba(34, 211, 238, ${glowOpacity})`,
                boxShadow: intensity > 0.5 ? `0 0 8px rgba(34, 211, 238, ${intensity})` : 'none'
              }}
            />
            <span 
              className="text-[10px] sm:text-xs font-medium transition-all duration-300"
              style={{ color: `rgba(34, 211, 238, ${glowOpacity})` }}
            >
              Morning Brief
            </span>
          </div>
          <span 
            className="text-[10px] sm:text-xs transition-opacity duration-300"
            style={{ opacity: cardOpacity }}
          >
            3 signals • 5 min
          </span>
        </div>
        
        {/* Signal cards - fade in/out based on intensity */}
        <div className="flex-1 space-y-1.5 sm:space-y-2 overflow-hidden">
          {signalCards.map((signal, i) => (
            <motion.div
              key={i}
              className="p-2 sm:p-3 rounded-lg border transition-all duration-300"
              style={{ 
                opacity: cardOpacity,
                backgroundColor: `rgba(255, 255, 255, ${0.03 + (intensity * 0.03)})`,
                borderColor: intensity > 0.5 ? `rgba(34, 211, 238, ${intensity * 0.3})` : 'rgba(255, 255, 255, 0.1)',
                transform: `scale(${0.95 + (intensity * 0.05)})`
              }}
            >
              <div className="flex items-start justify-between gap-1.5 sm:gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                    <span 
                      className="text-[8px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap"
                      style={{ backgroundColor: `${signal.color}20`, color: signal.color }}
                    >
                      {signal.type}
                    </span>
                    <span className="text-[8px] sm:text-[10px] text-muted-foreground truncate">{signal.source}</span>
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-foreground/90 truncate">{signal.title}</p>
                </div>
                <span className="text-[8px] sm:text-[10px] text-muted-foreground whitespace-nowrap">{signal.time}</span>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Footer stat */}
        <div className="pt-1.5 sm:pt-2 border-t border-white/10 text-center">
          <span className="text-[10px] sm:text-xs text-muted-foreground">
            <span className="text-cyan-400 font-semibold">97 filtered</span> • 12 min saved
          </span>
        </div>
      </div>
    </div>
  )
}

// Interactive Chaos to Signal Slider with Auto-Animation
function ChaosSignalSlider() {
  const [sliderValue, setSliderValue] = useState(100)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [direction, setDirection] = useState<'down' | 'up'>('down')
  const chaosIntensity = sliderValue / 100
  const signalIntensity = 1 - chaosIntensity
  
  // Smooth auto-animation using requestAnimationFrame pattern
  useEffect(() => {
    if (!isAutoPlaying) return
    
    let animationId: number
    let lastTime = 0
    const speed = 0.8 // Lower = slower, smoother
    
    const animate = (currentTime: number) => {
      if (!lastTime) lastTime = currentTime
      const delta = currentTime - lastTime
      
      if (delta > 16) { // ~60fps
        lastTime = currentTime
        
        setSliderValue(prev => {
          if (direction === 'down') {
            if (prev <= 5) {
              // Pause at calm state, then go back up
              setTimeout(() => setDirection('up'), 1500)
              return 0
            }
            return Math.max(0, prev - speed)
          } else {
            if (prev >= 95) {
              // Pause at chaos state, then go back down
              setTimeout(() => setDirection('down'), 1500)
              return 100
            }
            return Math.min(100, prev + speed)
          }
        })
      }
      
      animationId = requestAnimationFrame(animate)
    }
    
    animationId = requestAnimationFrame(animate)
    
    return () => {
      if (animationId) cancelAnimationFrame(animationId)
    }
  }, [isAutoPlaying, direction])
  
  // Stop auto-play when user interacts
  const handleManualChange = (value: number) => {
    setIsAutoPlaying(false)
    setSliderValue(value)
  }
  
  const restartDemo = () => {
    setSliderValue(100)
    setDirection('down')
    setIsAutoPlaying(true)
  }
  
  return (
    <div className="space-y-6">
      {/* Slider with visual track */}
      <div className="relative py-2">
        {/* Slider track background with gradient glow */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-5 rounded-full bg-gradient-to-r from-cyan-500/20 via-yellow-500/10 to-red-500/20 blur-lg" />
        
        <input
          type="range"
          min="0"
          max="100"
          value={sliderValue}
          onChange={(e) => handleManualChange(Number(e.target.value))}
          className="w-full h-4 rounded-full appearance-none cursor-pointer relative z-10"
          style={{
            background: `linear-gradient(to right, 
              #22D3EE 0%, 
              #22D3EE ${Math.max(0, 100 - sliderValue - 5)}%, 
              #fbbf24 ${Math.max(0, 100 - sliderValue)}%, 
              #ef4444 ${Math.min(100, 100 - sliderValue + 20)}%, 
              #ef4444 100%)`
          }}
        />
        
        {/* Animated thumb indicator */}
        <motion.div 
          className="absolute top-1/2 -translate-y-1/2 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white shadow-lg border-2 pointer-events-none z-20"
          style={{ 
            left: `calc(${100 - sliderValue}% - 12px)`,
            borderColor: sliderValue > 50 ? '#ef4444' : '#22D3EE',
            boxShadow: sliderValue > 50 
              ? '0 0 15px rgba(239, 68, 68, 0.5)' 
              : '0 0 15px rgba(34, 211, 238, 0.5)'
          }}
        />
        
        <div className="flex justify-between mt-4 sm:mt-5 text-xs sm:text-sm font-medium">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div 
              className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-cyan-400 transition-all duration-300"
              style={{ 
                boxShadow: signalIntensity > 0.5 ? '0 0 10px rgba(34, 211, 238, 0.8)' : 'none',
                opacity: 0.5 + (signalIntensity * 0.5)
              }}
            />
            <span className="text-cyan-400 hidden sm:inline">EagleEye View</span>
            <span className="text-cyan-400 sm:hidden">EagleEye</span>
          </div>
          <div className="text-center text-white/50 text-[10px] sm:text-xs">
            {isAutoPlaying ? (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="hidden sm:inline">Auto demo</span>
                <span className="sm:hidden">Auto</span>
              </span>
            ) : (
              <button 
                onClick={restartDemo}
                className="text-cyan-400 hover:underline"
              >
                ↻ <span className="hidden sm:inline">Replay demo</span><span className="sm:hidden">Replay</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-red-400">Chaos</span>
            <div 
              className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-400 transition-all duration-300"
              style={{ 
                boxShadow: chaosIntensity > 0.5 ? '0 0 10px rgba(239, 68, 68, 0.8)' : 'none',
                opacity: 0.5 + (chaosIntensity * 0.5)
              }}
            />
          </div>
        </div>
      </div>
      
      {/* Two views side by side on larger screens, stacked on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="relative">
          <motion.div 
            className="absolute -top-3 left-3 sm:left-4 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-cyan-500/20 border border-cyan-500/50 text-[10px] sm:text-xs text-cyan-400 z-10 flex items-center gap-1.5 sm:gap-2 transition-all duration-300"
            style={{ 
              opacity: 0.4 + (signalIntensity * 0.6),
              boxShadow: signalIntensity > 0.5 ? '0 0 10px rgba(34, 211, 238, 0.3)' : 'none'
            }}
          >
            <span 
              className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-cyan-400 transition-all duration-300" 
              style={{ opacity: signalIntensity }} 
            />
            EagleEye
          </motion.div>
          <CleanSignals intensity={signalIntensity} />
        </div>
        <div className="relative">
          <motion.div 
            className="absolute -top-3 left-3 sm:left-4 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-red-500/20 border border-red-500/50 text-[10px] sm:text-xs text-red-400 z-10 flex items-center gap-1.5 sm:gap-2 transition-all duration-300"
            style={{ 
              opacity: 0.4 + (chaosIntensity * 0.6),
              boxShadow: chaosIntensity > 0.5 ? '0 0 10px rgba(239, 68, 68, 0.3)' : 'none'
            }}
          >
            <span 
              className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-400 transition-all duration-300" 
              style={{ opacity: chaosIntensity }} 
            />
            <span className="hidden sm:inline">Without EagleEye</span>
            <span className="sm:hidden">Without</span>
          </motion.div>
          <ChaosWall intensity={chaosIntensity} />
        </div>
      </div>
    </div>
  )
}
// Primary CTA button - matches brand cyan (mobile responsive)
function PrimaryButton({ children, href, size = 'default' }: { children: React.ReactNode; href: string; size?: 'default' | 'large' }) {
  const sizeClasses = size === 'large' 
    ? 'px-6 py-3.5 sm:px-10 sm:py-5 text-sm sm:text-lg' 
    : 'px-5 py-3 sm:px-8 sm:py-4 text-sm sm:text-base'
  
  return (
    <Link href={href}>
      <motion.button
        whileHover={{ scale: 1.02, boxShadow: `0 0 30px ${COLORS.primary}50` }}
        whileTap={{ scale: 0.98 }}
        className={`${sizeClasses} font-bold rounded-xl text-[#0D1117] transition-all flex items-center gap-2`}
        style={{
          background: `linear-gradient(135deg, ${COLORS.primaryLight} 0%, ${COLORS.primary} 50%, ${COLORS.primaryDark} 100%)`,
          boxShadow: `0 0 20px ${COLORS.primary}30`,
        }}
      >
        {children}
        <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
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
          style={{ background: COLORS.primary }}
        />
        <div 
          className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full blur-[100px] opacity-15"
          style={{ background: COLORS.accent }}
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
        <nav className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 h-16 sm:h-20 flex items-center justify-between">
          {/* Logo */}
          <div className="flex-shrink-0">
            <div className="hidden md:block">
              <Logo size="lg" showText={true} showTagline={false} animated={true} variant="glow" />
            </div>
            <div className="hidden sm:block md:hidden">
              <Logo size="md" showText={true} showTagline={false} animated={true} variant="glow" />
            </div>
            <div className="sm:hidden">
              <Logo size="sm" showText={true} showTagline={false} animated={false} variant="default" />
            </div>
          </div>
          
          {/* Nav items */}
          <div className="flex items-center gap-4 sm:gap-6 flex-shrink-0">
            <Link href="/pricing" className="text-sm text-white/70 hover:text-white transition-colors hidden sm:block">
              Pricing
            </Link>
            <Link href="/login" className="text-xs sm:text-sm text-white/70 hover:text-white transition-colors whitespace-nowrap">
              Sign in
            </Link>
            <Link href="/signup?plan=founder">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-3 py-1.5 sm:px-6 sm:py-3 text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl text-[#0D1117] transition-all flex items-center gap-1 sm:gap-2 whitespace-nowrap"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.primaryLight} 0%, ${COLORS.primary} 50%, ${COLORS.primaryDark} 100%)`,
                }}
              >
                <span className="hidden sm:inline">Start Free Trial</span>
                <span className="sm:hidden">Start Free</span>
                <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
              </motion.button>
            </Link>
          </div>
        </nav>
      </motion.header>

      <main>
        {/* ============================================ */}
        {/* HERO: "Own the Signal. Master the Chaos." */}
        {/* ============================================ */}
        <section className="pt-24 sm:pt-32 pb-12 sm:pb-20 px-4 sm:px-6 lg:px-12 xl:px-20 relative">
          <div className="max-w-[1800px] mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Premium headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-7xl font-black mb-4 sm:mb-6 leading-tight tracking-tight">
                <span className="text-white">Own the Signal.</span>
                <br />
                <span 
                  className="bg-clip-text text-transparent"
                  style={{ 
                    backgroundImage: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryLight} 50%, ${COLORS.primary} 100%)` 
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
                className="text-base sm:text-xl text-white/70 max-w-4xl mx-auto mb-6 sm:mb-10 leading-relaxed px-2"
              >
                While your competitors are drowning in 1,000+ notifications, you're already making the winning move. 
                EagleEye filters the noise of WhatsApp, Slack, and Jira into
                <span className="text-cyan-400"> the critical priorities</span> that actually matter.
                <span className="block mt-2 text-white font-medium">Be the leader who knows first.</span>
              </motion.p>
              
              {/* CTA button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center mb-6 sm:mb-8"
              >
                <PrimaryButton href="/signup?plan=founder" size="large">
                  Start Your Free Trial
                </PrimaryButton>
              </motion.div>
              
              {/* Trust indicators */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-white/50"
              >
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-cyan-400" />
                  <span>7-day free trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-cyan-400" />
                  <span>Read-only • Never posts</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-cyan-400" />
                  <span>Setup in 2 minutes</span>
                </div>
              </motion.div>
            </motion.div>
            
            {/* Mini morning brief preview */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.6 }}
              className="mt-10 sm:mt-16 max-w-md mx-auto px-2"
            >
              <div className="p-3 sm:p-4 rounded-2xl bg-white/5 border border-cyan-500/30 backdrop-blur-sm">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                    <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs text-white/50">Your Morning Brief</p>
                    <p className="text-xs sm:text-sm font-semibold text-white truncate">3 signals need attention</p>
                  </div>
                  <div className="ml-auto flex-shrink-0">
                    <span className="text-[10px] sm:text-xs px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-400 whitespace-nowrap">5 min read</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ============================================ */}
        {/* NIGHTMARE SECTION: "The 650-Hour Tax" */}
        {/* ============================================ */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-12 xl:px-20 relative">
          <div className="max-w-[1600px] mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-8 sm:mb-12"
            >
              <h2 className="text-2xl sm:text-3xl lg:text-5xl font-black mb-4 sm:mb-6">
                The <span className="text-red-400">650-Hour</span> Tax
              </h2>
              <p className="text-sm sm:text-lg text-white/60 max-w-2xl mx-auto px-2">
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
        <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-12 xl:px-20 bg-white/[0.02]">
          <div className="max-w-[1600px] mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10 sm:mb-16"
            >
              <h2 className="text-2xl sm:text-3xl lg:text-5xl font-black mb-4">
                A <span className="text-cyan-400">'God-View'</span> for Your Business
              </h2>
              <p className="text-white/60 text-sm sm:text-base">
                Three capabilities that change everything.
              </p>
            </motion.div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[
                { 
                  icon: '🚨',
                  title: 'The Urgent Filter', 
                  desc: 'Sarah mentioned "Payment Failed" on WhatsApp? You\'ll know in seconds. Everything else waits.',
                  accent: '#EF4444'
                },
                { 
                  icon: '🔍',
                  title: 'The Blocker Detection', 
                  desc: 'Is the Q4 launch stuck in Jira? EagleEye surfaces the bottleneck before you even ask for an update.',
                  accent: '#22D3EE'
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
                  className="p-4 sm:p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all group"
                >
                  <div 
                    className="text-3xl sm:text-4xl mb-3 sm:mb-4 w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${feature.accent}15` }}
                  >
                    {feature.icon}
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3" style={{ color: feature.accent }}>{feature.title}</h3>
                  <p className="text-white/60 leading-relaxed text-sm sm:text-base">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* FORT KNOX SECTION: Security & Trust */}
        {/* ============================================ */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-12 xl:px-20">
          <div className="max-w-[1600px] mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10 sm:mb-12"
            >
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30 mb-4 sm:mb-6">
                <Shield className="h-4 w-4 text-green-400" />
                <span className="text-green-400 text-xs sm:text-sm font-medium">Enterprise-Grade Security</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black mb-4">
                Your Data is Your Business. <span className="text-green-400">Period.</span>
              </h2>
              <p className="text-white/60 max-w-xl mx-auto text-sm sm:text-base px-2">
                Built for the Boardroom. We use Read-Only access. We never post. We never store raw data.
                We see the signal; we ignore the rest.
              </p>
            </motion.div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
                  className="p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10 text-center"
                >
                  <div className="text-xl sm:text-2xl mb-2">{item.icon}</div>
                  <p className="font-semibold text-xs sm:text-sm mb-1">{item.label}</p>
                  <p className="text-[10px] sm:text-xs text-white/50">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* FOMO PRICING SECTION */}
        {/* ============================================ */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-12 xl:px-20 bg-white/[0.02]">
          <div className="max-w-[1400px] mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10 sm:mb-12"
            >
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black mb-4">
                Buy Back Your <span className="text-cyan-400">Time</span>
              </h2>
              <p className="text-white/60 text-sm sm:text-base">
                Simple pricing. No hidden fees. Cancel anytime.
              </p>
            </motion.div>
            
            <div className="grid md:grid-cols-3 gap-4 sm:gap-6 max-w-[1200px] mx-auto">
              {/* Solo Plan */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="p-4 sm:p-6 rounded-2xl bg-white/5 border border-white/10"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-white/10">
                    <Crown className="h-5 w-5 text-white/70" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base sm:text-lg">Solo</h3>
                    <p className="text-xs text-white/50">For individual professionals</p>
                  </div>
                </div>
                <div className="mb-4 sm:mb-6">
                  <span className="text-3xl sm:text-4xl font-black">$29</span>
                  <span className="text-white/50">/month</span>
                </div>
                <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                  {['10 tools connected', 'Daily morning brief', 'Email & push alerts', '90-day history'].map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs sm:text-sm text-white/70">
                      <Check className="h-4 w-4 text-green-400 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup?plan=founder" className="block">
                  <button className="w-full py-2.5 sm:py-3 rounded-xl border border-white/20 text-white font-semibold hover:bg-white/5 transition-colors text-sm sm:text-base">
                    Start 7-Day Free Trial
                  </button>
                </Link>
              </motion.div>
              
              {/* Team Plan - MOST POPULAR */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="p-4 sm:p-6 rounded-2xl border-2 relative"
                style={{ 
                  borderColor: '#22D3EE',
                  background: 'linear-gradient(135deg, rgba(34,211,238,0.08) 0%, transparent 50%)'
                }}
              >
                {/* Popular badge */}
                <div 
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 sm:px-4 py-1 rounded-full text-xs font-bold bg-cyan-400 text-gray-900"
                >
                  MOST POPULAR
                </div>
                
                <div className="flex items-center gap-3 mb-4 mt-2">
                  <div className="p-2 rounded-lg bg-cyan-400/20">
                    <Zap className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base sm:text-lg">Team</h3>
                    <p className="text-xs text-white/50">For growing teams</p>
                  </div>
                </div>
                <div className="mb-4 sm:mb-6">
                  <span className="text-3xl sm:text-4xl font-black text-cyan-400">$79</span>
                  <span className="text-white/50">/month</span>
                </div>
                <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                  {[
                    'Everything in Solo',
                    'Up to 10 team members',
                    'Shared signal dashboard',
                    'Priority support',
                    'Unlimited history'
                  ].map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs sm:text-sm text-white/70">
                      <Check className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <PrimaryButton href="/signup?plan=team">
                  Start 7-Day Free Trial
                </PrimaryButton>
              </motion.div>
              
              {/* Enterprise Plan */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="p-4 sm:p-6 rounded-2xl bg-white/5 border border-white/10"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-white/10">
                    <Building2 className="h-5 w-5 text-white/70" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base sm:text-lg">Enterprise</h3>
                    <p className="text-xs text-white/50">For larger organizations</p>
                  </div>
                </div>
                <div className="mb-4 sm:mb-6">
                  <span className="text-3xl sm:text-4xl font-black">Custom</span>
                </div>
                <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                  {[
                    'Everything in Team',
                    'Unlimited team members',
                    'SSO / SAML authentication',
                    'Custom AI training',
                    'On-premise deployment',
                    'SLA available'
                  ].map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs sm:text-sm text-white/70">
                      <Check className="h-4 w-4 text-green-400 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="mailto:hello@eagleeye.work?subject=Enterprise%20Inquiry" className="block">
                  <button className="w-full py-2.5 sm:py-3 rounded-xl border border-white/20 text-white font-semibold hover:bg-white/5 transition-colors text-sm sm:text-base flex items-center justify-center gap-2">
                    Contact Us <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
              </motion.div>
            </div>
            
            <p className="text-center text-xs sm:text-sm text-white/40 mt-6 sm:mt-8">
              All plans include a 7-day free trial. Cancel anytime.
            </p>
          </div>
        </section>

        {/* ============================================ */}
        {/* INTEGRATIONS */}
        {/* ============================================ */}
        <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-12 xl:px-20">
          <div className="max-w-[1600px] mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Connects to Your Entire Stack</h2>
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                {integrations.map((tool, i) => (
                  <motion.div
                    key={tool.name}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/5 border border-white/10 rounded-full text-xs sm:text-sm hover:border-white/20 transition-colors"
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
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/5 border border-white/10 rounded-full text-xs sm:text-sm"
                >
                  <span>+</span>
                  <span className="text-white/50">More coming</span>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ============================================ */}
        {/* THE COST OF CONTEXT SWITCHING */}
        {/* ============================================ */}
        <section className="py-14 sm:py-20 px-4 sm:px-6 lg:px-12 xl:px-20">
          <div className="max-w-[1600px] mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-8 sm:mb-10"
            >
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3">
                The Hidden Cost of <span className="text-cyan-400">Always On</span>
              </h2>
              <p className="text-white/50 text-xs sm:text-sm">Research-backed insights on notification overload</p>
            </motion.div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="p-4 sm:p-6 rounded-2xl bg-white/5 border border-white/10 text-center"
              >
                <div className="text-3xl sm:text-4xl font-black text-red-400 mb-2">23 min</div>
                <p className="text-xs sm:text-sm text-white/70 mb-2">to refocus after an interruption</p>
                <p className="text-[10px] sm:text-xs text-white/40">UC Irvine Research Study</p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="p-4 sm:p-6 rounded-2xl bg-white/5 border border-white/10 text-center"
              >
                <div className="text-3xl sm:text-4xl font-black text-amber-400 mb-2">74%</div>
                <p className="text-xs sm:text-sm text-white/70 mb-2">of workers feel overwhelmed by notifications</p>
                <p className="text-[10px] sm:text-xs text-white/40">Workfront State of Work Report</p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="p-4 sm:p-6 rounded-2xl bg-white/5 border border-white/10 text-center"
              >
                <div className="text-3xl sm:text-4xl font-black text-cyan-400 mb-2">2.5 hrs</div>
                <p className="text-xs sm:text-sm text-white/70 mb-2">average daily time lost to context switching</p>
                <p className="text-[10px] sm:text-xs text-white/40">RescueTime Productivity Study</p>
              </motion.div>
            </div>
            
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center text-white/50 text-xs sm:text-sm mt-6 sm:mt-8 max-w-lg mx-auto px-2"
            >
              EagleEye eliminates the noise so you can focus on what matters. 
              One brief, once a day, everything you need to know.
            </motion.p>
          </div>
        </section>

        {/* ============================================ */}
        {/* ABOUT US / OUR STORY */}
        {/* ============================================ */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-12 xl:px-20 relative overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-0 w-[500px] h-[500px] rounded-full bg-cyan-500/5 blur-[120px]" />
            <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[100px]" />
          </div>
          
          <div className="max-w-[1200px] mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12 sm:mb-16"
            >
              <span className="inline-block px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs sm:text-sm font-medium mb-4">
                Our Story
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black mb-4">
                Why We Built <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">EagleEye</span>
              </h2>
              <p className="text-white/60 max-w-2xl mx-auto text-sm sm:text-base">
                We were drowning in the same chaos. Then we decided to fix it.
              </p>
            </motion.div>

            {/* Story Content */}
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center mb-12 sm:mb-16">
              {/* Left: The Story */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                      <span className="text-xl">😫</span>
                    </div>
                    <h3 className="font-bold text-lg">The Problem We Lived</h3>
                  </div>
                  <p className="text-white/60 text-sm leading-relaxed">
                    We started as busy professionals juggling WhatsApp groups, Slack channels, Jira boards, and endless email threads. 
                    Every morning began with anxiety: "What did I miss?" Every evening ended with guilt: "I was busy all day but got nothing important done."
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                      <span className="text-xl">💡</span>
                    </div>
                    <h3 className="font-bold text-lg">The Realization</h3>
                  </div>
                  <p className="text-white/60 text-sm leading-relaxed">
                    The problem wasn't the tools—it was the signal-to-noise ratio. Out of 1,000 daily notifications, 
                    only a handful actually needed immediate attention. The rest? Just noise disguised as urgency.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center overflow-hidden">
                      <img src="/icon-192.png" alt="EagleEye" className="w-8 h-8 object-contain" />
                    </div>
                    <h3 className="font-bold text-lg">The Solution</h3>
                  </div>
                  <p className="text-white/60 text-sm leading-relaxed">
                    We built EagleEye to be our own command center—an AI that reads everything and tells us only what matters. 
                    No more FOMO. No more doom-scrolling. Just clarity, delivered once a day.
                  </p>
                </div>
              </motion.div>

              {/* Right: Mission & Values */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="lg:pl-8"
              >
                <div className="p-8 rounded-3xl bg-gradient-to-br from-[#0D1117] to-[#161B22] border border-white/10 relative overflow-hidden">
                  {/* Decorative glow */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/20 rounded-full blur-[60px]" />
                  
                  <h3 className="text-xl sm:text-2xl font-bold mb-6 relative z-10">Our Mission</h3>
                  
                  <blockquote className="text-lg sm:text-xl text-white/80 italic mb-8 relative z-10 leading-relaxed">
                    "To give every professional the superpower of knowing exactly what needs their attention—without drowning in digital noise."
                  </blockquote>

                  <div className="space-y-4 relative z-10">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3.5 h-3.5 text-cyan-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Time is your most valuable asset</p>
                        <p className="text-white/50 text-xs">We protect it by filtering the noise</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3.5 h-3.5 text-cyan-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">AI should augment, not replace</p>
                        <p className="text-white/50 text-xs">You make decisions, we surface signals</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3.5 h-3.5 text-cyan-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Privacy is non-negotiable</p>
                        <p className="text-white/50 text-xs">Your data is encrypted and never sold</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3.5 h-3.5 text-cyan-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Built by users, for users</p>
                        <p className="text-white/50 text-xs">We use EagleEye every single day</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Bottom Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
            >
              <div className="text-center p-4 sm:p-6 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-2xl sm:text-3xl font-black text-cyan-400 mb-1">2026</div>
                <p className="text-white/50 text-xs sm:text-sm">Founded</p>
              </div>
              <div className="text-center p-4 sm:p-6 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-2xl sm:text-3xl font-black text-cyan-400 mb-1">Global</div>
                <p className="text-white/50 text-xs sm:text-sm">Remote-First</p>
              </div>
              <div className="text-center p-4 sm:p-6 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-2xl sm:text-3xl font-black text-cyan-400 mb-1">7+</div>
                <p className="text-white/50 text-xs sm:text-sm">Integrations</p>
              </div>
              <div className="text-center p-4 sm:p-6 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-2xl sm:text-3xl font-black text-cyan-400 mb-1">24/7</div>
                <p className="text-white/50 text-xs sm:text-sm">Signal Intelligence</p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ============================================ */}
        {/* FAQ / OBJECTION BUSTERS */}
        {/* ============================================ */}
        <section className="py-14 sm:py-20 px-4 sm:px-6 lg:px-12 xl:px-20 bg-white/[0.02]">
          <div className="max-w-[1200px] mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-8 sm:mb-10"
            >
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold">
                Common Questions
              </h2>
            </motion.div>
            
            <div className="space-y-2 sm:space-y-3">
              <ObjectionAccordion
                icon="🤔"
                title="What if I miss something important?"
                preview="EagleEye catches what humans miss"
              >
                <p className="text-white/60 text-xs sm:text-sm leading-relaxed">
                  That fear is why you check compulsively. Here's the paradox: when you try to monitor 500 messages yourself, you're more likely to miss things. EagleEye never sleeps, never gets tired, and surfaces urgency instantly via push notifications.
                </p>
              </ObjectionAccordion>
              
              <ObjectionAccordion
                icon="🏖️"
                title="What about weekends and vacations?"
                preview="Enjoy your time off. If it's urgent, you'll know."
              >
                <p className="text-white/60 text-xs sm:text-sm leading-relaxed">
                  EagleEye knows the difference between "need to know now" and "can wait until Monday." On weekends, you get a 2-line summary. On vacation, a 30-second brief. If the office is on fire, you'll know.
                </p>
              </ObjectionAccordion>
              
              <ObjectionAccordion
                icon="📱"
                title="Does it work on mobile?"
                preview="No app needed. Works on any device."
              >
                <p className="text-white/60 text-xs sm:text-sm leading-relaxed">
                  EagleEye is a web app. Add it to your home screen, enable push notifications, and forget about it. No battery drain, no storage used. Works on iPhone, Android, iPad, or desktop.
                </p>
              </ObjectionAccordion>
              
              <ObjectionAccordion
                icon="⚡"
                title="How fast is setup?"
                preview="2 minutes. Connect and go."
              >
                <p className="text-white/60 text-xs sm:text-sm leading-relaxed">
                  OAuth connections mean one-click authorization. Connect Slack, WhatsApp Business, Asana, Jira—all in under 2 minutes. Your first brief arrives within 24 hours.
                </p>
              </ObjectionAccordion>
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* FINAL CTA */}
        {/* ============================================ */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-12 xl:px-20">
          <div className="max-w-[1200px] mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="p-6 sm:p-10 rounded-3xl border relative overflow-hidden"
              style={{ 
                borderColor: 'rgba(34,211,238,0.4)',
                background: 'linear-gradient(135deg, rgba(34,211,238,0.08) 0%, rgba(59,130,246,0.08) 100%)'
              }}
            >
              {/* Glow effect */}
              <div 
                className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[150px] rounded-full blur-[80px] opacity-30 bg-cyan-400"
              />
              
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black mb-3 sm:mb-4 relative z-10">
                Tomorrow's 1,000 pings are coming.
              </h2>
              <p className="text-sm sm:text-lg text-white/60 mb-6 sm:mb-8 relative z-10 px-2">
                Start your 7-day free trial. See what you've been missing.
              </p>
              
              <div className="relative z-10">
                <PrimaryButton href="/signup?plan=founder" size="large">
                  Start Your Free Trial
                </PrimaryButton>
              </div>
              
              <p className="text-xs sm:text-sm text-white/40 mt-4 sm:mt-6 relative z-10">
                7-day free trial • Cancel anytime • $29/month after trial
              </p>
            </motion.div>
          </div>
        </section>

        {/* Inquiry Section */}
        <InquirySection />
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 sm:py-12 px-4 sm:px-6 lg:px-12 xl:px-20 bg-[#0a0a0a]">
        <div className="max-w-[1800px] mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
            <Logo size="lg" animated={false} />
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm text-white/50">
              <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <a href="mailto:hello@eagleeye.work" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
          <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-white/10 text-center text-xs sm:text-sm text-white/40">
            © {new Date().getFullYear()} EagleEye. Own the Signal. Master the Chaos.
          </div>
        </div>
      </footer>
    </div>
  )
}
