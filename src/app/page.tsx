'use client'

import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Eye, Shield, Zap, Volume2, Sparkles, Check, Play, ChevronRight, ExternalLink } from 'lucide-react'
import { useRef } from 'react'
import { Logo } from '@/components/brand/Logo'
import { InquirySection } from '@/components/home/InquirySection'

// Animated gradient orb component
function GradientOrb({ className }: { className?: string }) {
  return (
    <div className={`absolute rounded-full blur-3xl opacity-20 ${className}`} />
  )
}

// Floating animation variants
const floatVariants = {
  animate: {
    y: [0, -20, 0],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut" as const
    }
  }
}

// Stagger children animation
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const }
  }
}

// Integration logos
const integrations = [
  { name: 'Slack', icon: '💬' },
  { name: 'Asana', icon: '📋' },
  { name: 'Jira', icon: '🔷' },
  { name: 'Linear', icon: '🎯' },
  { name: 'GitHub', icon: '🐙' },
  { name: 'Teams', icon: '👥' },
]

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  })
  
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95])

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 -z-10">
        <GradientOrb className="w-[600px] h-[600px] bg-primary/30 -top-48 -left-48 animate-pulse" />
        <GradientOrb className="w-[500px] h-[500px] bg-purple-500/20 top-1/3 -right-48" />
        <GradientOrb className="w-[400px] h-[400px] bg-blue-500/20 bottom-0 left-1/3" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--background))_70%)]" />
      </div>

      {/* Navigation */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl"
      >
        <nav className="max-w-[1400px] mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
          <Logo size="md" animated={true} />
          <div className="flex items-center gap-6">
            <Link
              href="/pricing"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
            >
              Pricing
            </Link>
            <a
              href="#inquiry"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
            >
              Contact
            </a>
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
            <Link href="/signup?plan=founder">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium relative overflow-hidden group"
              >
                <span className="relative z-10">Get Started</span>
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-primary via-purple-500 to-primary bg-[length:200%_100%]"
                  animate={{ backgroundPosition: ['0%', '100%', '0%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                />
              </motion.button>
            </Link>
          </div>
        </nav>
      </motion.header>

      <main className="pt-16">
        {/* Hero Section - Full width split layout */}
        <motion.section 
          ref={heroRef}
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="relative min-h-[90vh] flex items-center px-6 lg:px-12"
        >
          <div className="w-full max-w-[1400px] mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left side - Content */}
            <div className="relative">
              {/* Floating badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 text-sm mb-6"
              >
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                <span className="text-muted-foreground">AI-Powered Decision Intelligence</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </motion.div>
              
              {/* Main headline with gradient */}
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight mb-6"
              >
                <span className="bg-gradient-to-r from-foreground via-foreground to-foreground/50 bg-clip-text text-transparent">
                  See what matters
                </span>
                <br />
                <span className="bg-gradient-to-r from-primary via-purple-500 to-blue-500 bg-clip-text text-transparent">
                  before it's a problem
                </span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-lg sm:text-xl text-muted-foreground mb-6 leading-relaxed"
              >
                EagleEye connects to your tools and surfaces only what needs your attention.
              </motion.p>
              
              {/* USP Highlight - Just Signals */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                className="mb-8"
              >
                <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-primary/20 via-purple-500/20 to-blue-500/20 border border-primary/30">
                  <span className="text-lg text-muted-foreground">No noise.</span>
                  <span className="text-lg text-muted-foreground">No summaries.</span>
                  <motion.span 
                    className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary via-purple-400 to-blue-400 bg-clip-text text-transparent"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    Just Signals.
                  </motion.span>
                </div>
              </motion.div>
              
              {/* CTA buttons */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col sm:flex-row items-start gap-4 mb-8"
              >
                <Link href="/signup?plan=founder">
                  <motion.button
                    whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(var(--primary), 0.3)' }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold text-lg shadow-lg shadow-primary/25 relative overflow-hidden group"
                  >
                    <span className="relative z-10">Start Free Trial</span>
                    <ArrowRight className="h-5 w-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                    <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.button>
                </Link>
                <a href="#demo-video">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-2 px-8 py-4 border border-border rounded-xl font-medium text-lg hover:bg-muted/50 transition-colors"
                  >
                    <Play className="h-5 w-5" />
                    See How It Works
                  </motion.button>
                </a>
              </motion.div>

              {/* Privacy Trust Badge */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex items-center gap-2 text-sm text-green-400 mb-6"
              >
                <Shield className="h-4 w-4" />
                <span>Your data is never used for AI training • Read-only access • SOC 2 compliant</span>
              </motion.div>

              {/* Integrations preview */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="flex flex-wrap items-center gap-3"
              >
                <span className="text-sm text-muted-foreground">Works with:</span>
                {integrations.map((tool, i) => (
                  <motion.div
                    key={tool.name}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 + i * 0.1 }}
                    whileHover={{ scale: 1.1, y: -2 }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 rounded-full text-sm border border-border/50 hover:border-primary/50 transition-colors cursor-default"
                  >
                    <span>{tool.icon}</span>
                    <span className="text-muted-foreground">{tool.name}</span>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Right side - Dashboard preview */}
            <motion.div
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="relative"
            >
              <motion.div 
                variants={floatVariants}
                animate="animate"
                className="relative"
              >
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-purple-500/20 to-blue-500/20 rounded-2xl blur-2xl" />
                <div className="relative bg-card/80 backdrop-blur border border-border/50 rounded-2xl p-6 shadow-2xl">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="ml-4 text-sm text-muted-foreground">EagleEye Dashboard</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <span className="text-2xl">🚨</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">Client escalation detected</p>
                        <p className="text-xs text-muted-foreground truncate">Sarah mentioned "urgent" in #enterprise-deals</p>
                      </div>
                      <span className="text-xs text-red-400 font-medium shrink-0">CRITICAL</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <span className="text-2xl">⏰</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">Deadline at risk</p>
                        <p className="text-xs text-muted-foreground truncate">Q4 launch blocked by API integration</p>
                      </div>
                      <span className="text-xs text-yellow-400 font-medium shrink-0">HIGH</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <span className="text-2xl">🎉</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">Milestone achieved</p>
                        <p className="text-xs text-muted-foreground truncate">Team shipped v2.0 ahead of schedule</p>
                      </div>
                      <span className="text-xs text-green-400 font-medium shrink-0">POSITIVE</span>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              {/* Additional floating stats cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                className="absolute -bottom-6 -left-6 bg-card border border-border rounded-xl p-4 shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">47</p>
                    <p className="text-xs text-muted-foreground">Signals this week</p>
                  </div>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4 }}
                className="absolute -top-4 -right-4 bg-card border border-border rounded-xl p-3 shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-medium">Live monitoring</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.section>

        {/* SECTION 1: The Problem - Hook them with the pain */}
        <section className="py-24 px-6 lg:px-12 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 via-transparent to-transparent" />
          <div className="max-w-[1400px] mx-auto relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                className="inline-block px-6 py-2.5 rounded-full bg-red-500/15 border-2 border-red-500/30 mb-6"
              >
                <span className="text-red-400 text-lg sm:text-xl font-bold tracking-wide">⚠️ THE PROBLEM</span>
              </motion.div>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                You&apos;re drowning in notifications
              </h2>
              <p className="text-muted-foreground text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed">
                Slack pings. Email threads. Asana updates. Jira tickets. By the time you check everything, 
                you&apos;ve lost half your day... and still missed what actually mattered.
              </p>
            </motion.div>
            
            {/* Time Cost Calculator - The "Aha" moment */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-card border border-red-500/20 rounded-2xl p-8 mb-8"
            >
              <h3 className="text-center text-lg font-semibold mb-6 text-red-400">⏱️ Calculate Your Lost Time</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
                <div className="p-4 bg-red-500/5 rounded-xl">
                  <div className="text-4xl font-bold text-red-500 mb-2">2.5 hrs</div>
                  <p className="text-sm text-muted-foreground">Daily time checking Slack, email & PM tools</p>
                </div>
                <div className="p-4 bg-red-500/5 rounded-xl">
                  <div className="text-4xl font-bold text-red-500 mb-2">23 min</div>
                  <p className="text-sm text-muted-foreground">Time to refocus after each interruption</p>
                </div>
                <div className="p-4 bg-yellow-500/5 rounded-xl">
                  <div className="text-4xl font-bold text-yellow-500 mb-2">12.5 hrs</div>
                  <p className="text-sm text-muted-foreground">Weekly time lost to tool chaos</p>
                </div>
                <div className="p-4 bg-red-500/5 rounded-xl">
                  <div className="text-4xl font-bold text-red-500 mb-2">$65k</div>
                  <p className="text-sm text-muted-foreground">Annual cost at $100/hr rate</p>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-center text-muted-foreground">
                  <span className="text-foreground font-semibold">That&apos;s 650 hours per year</span> spent 
                  scrolling through noise looking for signals. What would you do with that time back?
                </p>
              </div>
            </motion.div>

            {/* Research proof */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid md:grid-cols-3 gap-4"
            >
              {[
                {
                  stat: "10",
                  insight: "apps used per day — constant app-switching destroys focus and productivity",
                  source: "Asana Anatomy of Work 2023 (9,615 workers)",
                  link: "https://asana.com/resources/anatomy-of-work"
                },
                {
                  stat: "62%",
                  insight: "of the workday lost to repetitive, mundane tasks instead of strategic work",
                  source: "Asana Anatomy of Work 2023",
                  link: "https://asana.com/resources/anatomy-of-work"
                },
                {
                  stat: "5.3 hrs",
                  insight: "per week spent waiting for information or tracking down colleagues who have it",
                  source: "Panopto Workplace Knowledge Study",
                  link: "https://www.panopto.com/resource/valuing-workplace-knowledge/"
                }
              ].map((item, index) => (
                <motion.a
                  key={index}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  variants={itemVariants}
                  className="bg-card/50 border border-border rounded-xl p-5 hover:border-primary/50 transition-colors group"
                >
                  <div className="text-3xl font-bold text-primary mb-2">{item.stat}</div>
                  <p className="text-sm text-muted-foreground mb-3">{item.insight}</p>
                  <div className="flex items-center gap-1.5 text-xs text-primary/70 group-hover:text-primary">
                    <span>{item.source}</span>
                    <ExternalLink className="h-3 w-3" />
                  </div>
                </motion.a>
              ))}
            </motion.div>
          </div>
        </section>

        {/* SECTION 2: The Solution - Transition to hope */}
        <section className="py-24 px-6 lg:px-12 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-500/5 to-transparent" />
          <div className="max-w-[1400px] mx-auto relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                className="inline-block px-6 py-2.5 rounded-full bg-green-500/15 border-2 border-green-500/30 mb-6"
              >
                <span className="text-green-400 text-lg sm:text-xl font-bold tracking-wide">✓ THE SOLUTION</span>
              </motion.div>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                Meet <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">EagleEye</span>
              </h2>
              <p className="text-muted-foreground text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed">
                Our AI reads your Slack, Asana, Jira, and email so you don&apos;t have to. 
                It filters out the noise and delivers only what needs your attention, 
                in <span className="text-green-400 font-semibold">10 minutes or less</span> each morning.
              </p>
            </motion.div>

            {/* Before/After comparison */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="grid md:grid-cols-2 gap-6 mb-12"
            >
              <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
                  <span>❌</span> Without EagleEye
                </h3>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>2.5 hours daily scrolling through Slack channels</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>Miss critical escalations buried in threads</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>Context-switch 50+ times per day</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>End the day exhausted, still unsure what&apos;s at risk</span>
                  </li>
                </ul>
              </div>
              <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-green-400 mb-4 flex items-center gap-2">
                  <span>✓</span> With EagleEye
                </h3>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span>10-minute daily brief with only what needs action</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span>AI surfaces blockers, risks, and escalations instantly</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span>Choose delivery: email, Slack, or audio brief</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span>Stay informed without the information overload</span>
                  </li>
                </ul>
              </div>
            </motion.div>

            {/* Time saved highlight */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="bg-gradient-to-r from-green-500/10 via-primary/10 to-green-500/10 border border-green-500/30 rounded-2xl p-8 text-center"
            >
              <p className="text-lg text-muted-foreground mb-2">EagleEye users save an average of</p>
              <p className="text-5xl font-bold text-green-400 mb-2">10+ hours/week</p>
              <p className="text-muted-foreground">That&apos;s <span className="text-foreground font-semibold">500+ hours per year</span> back in your calendar</p>
            </motion.div>
          </div>
        </section>

        {/* DEMO VIDEO SECTION */}
        <section id="demo-video" className="py-24 px-6 lg:px-12 relative">
          <div className="max-w-[1000px] mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10"
            >
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                See EagleEye in Action
              </h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                Watch how EagleEye transforms your chaotic mornings into focused productivity
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative aspect-video bg-card/50 border border-border rounded-2xl overflow-hidden shadow-2xl"
            >
              {/* Replace this with your actual video embed */}
              {/* Option 1: YouTube embed */}
              {/* <iframe 
                className="w-full h-full"
                src="https://www.youtube.com/embed/YOUR_VIDEO_ID"
                title="EagleEye Demo"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              /> */}
              
              {/* Option 2: Loom embed */}
              {/* <iframe 
                className="w-full h-full"
                src="https://www.loom.com/embed/YOUR_LOOM_ID"
                allowFullScreen
              /> */}

              {/* Placeholder until video is ready */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-purple-500/10 to-blue-500/10">
                <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-4 border-2 border-primary/50">
                  <Play className="h-8 w-8 text-primary ml-1" />
                </div>
                <p className="text-lg font-medium text-foreground mb-2">Demo Video Coming Soon</p>
                <p className="text-sm text-muted-foreground max-w-md text-center px-4">
                  We&apos;re preparing an end-to-end walkthrough showing how EagleEye saves you hours every day
                </p>
              </div>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center text-sm text-muted-foreground mt-4"
            >
              🎬 2-minute walkthrough • No signup required to watch
            </motion.p>
          </div>
        </section>

        {/* SECTION 3: How it works */}
        <section className="py-24 px-6 lg:px-12 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/30 to-transparent" />
          <div className="max-w-[1400px] mx-auto relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                How EagleEye works
              </h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                Three simple steps to stop drowning in notifications
              </p>
            </motion.div>

            <motion.div 
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid md:grid-cols-3 gap-8"
            >
              {[
                {
                  step: '01',
                  icon: <Eye className="h-6 w-6" />,
                  title: 'Connect Your Tools',
                  description: 'Link Slack, Asana, Jira, Linear, and more in seconds. Read-only access keeps your data safe.',
                  gradient: 'from-blue-500 to-cyan-500'
                },
                {
                  step: '02',
                  icon: <Zap className="h-6 w-6" />,
                  title: 'AI Detects Signals',
                  description: 'Our AI scans for blockers, escalations, commitments, and risks. Not summaries. Actionable signals.',
                  gradient: 'from-purple-500 to-pink-500'
                },
                {
                  step: '03',
                  icon: <Volume2 className="h-6 w-6" />,
                  title: 'Get Your Brief',
                  description: 'Daily email, Slack DM, or audio brief. Choose your format, control your alert level.',
                  gradient: 'from-orange-500 to-red-500'
                }
              ].map((item, i) => (
                <motion.div
                  key={item.step}
                  variants={itemVariants}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className="relative group"
                >
                  <div className="absolute -inset-px bg-gradient-to-r from-border to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative bg-card border border-border rounded-2xl p-8 h-full">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r ${item.gradient} text-white mb-6`}>
                      {item.icon}
                    </div>
                    <div className="text-sm font-medium text-primary mb-2">Step {item.step}</div>
                    <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Trust section */}
        <section className="py-24 px-6 lg:px-12">
          <div className="max-w-[1400px] mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-sm text-green-400 mb-6">
                <Shield className="h-4 w-4" />
                Your data is never used for AI training
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Privacy-first. Always.
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                We analyze signals to help <strong>you</strong>, not to train AI models. Your team's conversations and data stay private. Period.
              </p>
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {[
                { 
                  icon: '🔒', 
                  title: 'Read-only Access', 
                  desc: 'We only read. Never post, edit, or act on your behalf.' 
                },
                { 
                  icon: '🚫', 
                  title: 'Zero Data Storage', 
                  desc: 'Messages processed in memory, then discarded. We keep only signals.' 
                },
                { 
                  icon: '🤖', 
                  title: 'No AI Training', 
                  desc: 'Your data is NEVER used to train AI models. Ever. We contractually guarantee this.' 
                },
                { 
                  icon: '🛡️', 
                  title: 'SOC 2 Compliant', 
                  desc: 'Enterprise-grade security with encryption at rest and in transit.' 
                },
              ].map((item) => (
                <motion.div
                  key={item.title}
                  variants={itemVariants}
                  whileHover={{ scale: 1.02 }}
                  className="p-6 bg-card/50 backdrop-blur border border-border rounded-2xl text-center"
                >
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>
            
            {/* Data Promise Banner */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-12 p-6 bg-green-500/10 border border-green-500/30 rounded-2xl"
            >
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-center md:text-left">
                <div className="text-4xl">📜</div>
                <div>
                  <h4 className="font-bold text-lg text-green-400">Our Data Promise</h4>
                  <p className="text-muted-foreground">
                    We sign a Data Processing Agreement (DPA) with every customer. Your Slack messages, Asana tasks, and tool data are 
                    <strong className="text-foreground"> never sold, shared, or used for AI training</strong>. 
                    We exist to give you visibility. Nothing more, nothing less.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Inquiry Section */}
        <InquirySection />

        {/* Final CTA - Full width banner */}
        <section className="py-32 px-6 lg:px-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-purple-500/10 to-blue-500/10" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-[1400px] mx-auto relative"
          >
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl sm:text-5xl font-bold mb-6">
                  Ready to see what matters?
                </h2>
                <p className="text-xl text-muted-foreground mb-8">
                  Start your 14-day free trial. Cancel anytime before it ends.
                </p>
                <Link href="/signup?plan=founder">
                  <motion.button
                    whileHover={{ scale: 1.02, boxShadow: '0 0 60px rgba(var(--primary), 0.4)' }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center gap-3 px-10 py-5 bg-primary text-primary-foreground rounded-2xl font-semibold text-xl shadow-2xl shadow-primary/30"
                  >
                    Start Free Trial
                    <ArrowRight className="h-6 w-6" />
                  </motion.button>
                </Link>
                <p className="mt-6 text-sm text-muted-foreground">
                  ✓ 14-day free trial &nbsp;·&nbsp; ✓ No charge until day 14 &nbsp;·&nbsp; ✓ Cancel anytime
                </p>
              </div>
              
              {/* Right side - Feature highlights */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: '⚡', title: 'Instant Setup', desc: 'Connect in under 2 minutes' },
                  { icon: '🔒', title: 'Enterprise Security', desc: 'SOC 2 compliant' },
                  { icon: '🎯', title: 'Smart Filtering', desc: 'Only what matters' },
                  { icon: '📱', title: 'Multi-platform', desc: 'Email, Slack, Audio' },
                ].map((feature) => (
                  <motion.div
                    key={feature.title}
                    whileHover={{ scale: 1.02 }}
                    className="bg-card/50 backdrop-blur border border-border/50 rounded-xl p-4"
                  >
                    <span className="text-2xl mb-2 block">{feature.icon}</span>
                    <h4 className="font-semibold mb-1">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground">{feature.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </section>
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
            © {new Date().getFullYear()} EagleEye. See what matters before it becomes a problem.
          </div>
        </div>
      </footer>
    </div>
  )
}
