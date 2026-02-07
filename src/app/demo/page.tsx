'use client'

import { motion } from 'framer-motion'
import { 
  AlertTriangle, 
  Clock, 
  MessageSquare, 
  CheckCircle2, 
  Zap,
  TrendingUp,
  Users,
  Calendar,
  ArrowRight,
  Filter,
  Bell
} from 'lucide-react'
import { Logo } from '@/components/brand/Logo'
import Link from 'next/link'

// Demo signal data - realistic business scenarios
const demoSignals = [
  {
    id: 1,
    type: 'CRITICAL',
    title: 'Payment Failed - Enterprise Client Acme Corp',
    source: 'WhatsApp Business',
    sourceIcon: '📱',
    sourceColor: '#25D366',
    time: '8 min ago',
    preview: 'CFO Sarah: "Our monthly payment of $45,000 bounced. Need resolution ASAP or we pause the contract."',
    urgency: 'critical',
    action: 'Respond immediately',
  },
  {
    id: 2,
    type: 'BLOCKER',
    title: 'Production API Down - 3 Clients Affected',
    source: 'Slack #incidents',
    sourceIcon: '💬',
    sourceColor: '#E01E5A',
    time: '23 min ago',
    preview: '@channel Production auth service returning 503. DevOps investigating. ETA unknown.',
    urgency: 'high',
    action: 'Join incident channel',
  },
  {
    id: 3,
    type: 'DECISION',
    title: 'Q1 Budget Approval Required by EOD',
    source: 'Email',
    sourceIcon: '📧',
    sourceColor: '#EA4335',
    time: '1 hour ago',
    preview: 'Finance needs your sign-off on the $280K marketing budget before 5 PM today.',
    urgency: 'high',
    action: 'Review & approve',
  },
  {
    id: 4,
    type: 'OPPORTUNITY',
    title: 'Hot Lead: Series B Startup Interested',
    source: 'WhatsApp Business',
    sourceIcon: '📱',
    sourceColor: '#25D366',
    time: '2 hours ago',
    preview: 'Rahul (CEO, TechFlow): "Loved the demo. Can we discuss enterprise pricing for 50 seats?"',
    urgency: 'medium',
    action: 'Schedule call',
  },
  {
    id: 5,
    type: 'TASK',
    title: 'Sprint Review Presentation Due Tomorrow',
    source: 'Jira',
    sourceIcon: '🔷',
    sourceColor: '#0052CC',
    time: '3 hours ago',
    preview: 'Task: Prepare Q4 sprint demo slides. Assigned by: Product Lead. Due: Tomorrow 10 AM',
    urgency: 'medium',
    action: 'Start preparation',
  },
]

// Filtered out noise (shown as comparison)
const filteredNoise = [
  { text: '47 "noted" replies in team channels', source: 'Slack' },
  { text: '23 CC emails (no action needed)', source: 'Email' },
  { text: '15 automated status updates', source: 'Jira' },
  { text: '12 "good morning" messages', source: 'WhatsApp' },
  { text: '8 meeting reminders (already on calendar)', source: 'Calendar' },
]

const urgencyColors: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/50',
  high: 'bg-amber-500/20 text-amber-400 border-amber-500/50',
  medium: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
}

const typeColors: Record<string, string> = {
  CRITICAL: 'bg-red-500 text-white',
  BLOCKER: 'bg-orange-500 text-white',
  DECISION: 'bg-purple-500 text-white',
  OPPORTUNITY: 'bg-green-500 text-white',
  TASK: 'bg-blue-500 text-white',
}

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-[#0D1117]">
      {/* Demo Banner */}
      <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-b border-cyan-500/30 py-3 px-4 text-center">
        <p className="text-sm text-cyan-400">
          📸 <span className="font-semibold">Demo Dashboard</span> - This is sample data showcasing EagleEye's signal intelligence
        </p>
      </div>

      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo size="md" showText={true} />
            <span className="text-white/40 text-sm">|</span>
            <span className="text-white/60 text-sm">Signal Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/30">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-green-400 text-xs font-medium">All systems connected</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-white/5 border border-white/10"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">2</p>
                <p className="text-xs text-white/50">Critical Signals</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 rounded-xl bg-white/5 border border-white/10"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">3</p>
                <p className="text-xs text-white/50">Need Attention Today</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-4 rounded-xl bg-white/5 border border-white/10"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Filter className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">105</p>
                <p className="text-xs text-white/50">Noise Filtered Out</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-4 rounded-xl bg-white/5 border border-white/10"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">2.1 hrs</p>
                <p className="text-xs text-white/50">Time Saved Today</p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Signals Column */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-cyan-400" />
                Today's Priority Signals
              </h2>
              <span className="text-xs text-white/40">AI-sorted by urgency</span>
            </div>

            <div className="space-y-3">
              {demoSignals.map((signal, index) => (
                <motion.div
                  key={signal.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-xl bg-white/5 border ${
                    signal.urgency === 'critical' ? 'border-red-500/50' : 
                    signal.urgency === 'high' ? 'border-amber-500/30' : 'border-white/10'
                  } hover:bg-white/10 transition-colors cursor-pointer`}
                >
                  <div className="flex items-start gap-4">
                    {/* Source Icon */}
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-lg"
                      style={{ backgroundColor: `${signal.sourceColor}20` }}
                    >
                      {signal.sourceIcon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${typeColors[signal.type]}`}>
                          {signal.type}
                        </span>
                        <span className="text-xs text-white/40">{signal.source}</span>
                        <span className="text-xs text-white/30">•</span>
                        <span className="text-xs text-white/40">{signal.time}</span>
                      </div>
                      
                      <h3 className="font-semibold text-white mb-1">{signal.title}</h3>
                      <p className="text-sm text-white/60 line-clamp-2">{signal.preview}</p>
                      
                      <div className="flex items-center gap-2 mt-3">
                        <button className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 text-xs font-medium hover:bg-cyan-500/30 transition-colors flex items-center gap-1">
                          {signal.action}
                          <ArrowRight className="w-3 h-3" />
                        </button>
                        <button className="px-3 py-1.5 rounded-lg bg-white/5 text-white/60 text-xs hover:bg-white/10 transition-colors">
                          Snooze
                        </button>
                      </div>
                    </div>

                    {/* Urgency Indicator */}
                    <div className={`px-2 py-1 rounded-full text-[10px] font-medium border ${urgencyColors[signal.urgency]}`}>
                      {signal.urgency.toUpperCase()}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* AI Brief Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="p-5 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30"
            >
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-cyan-400" />
                <h3 className="font-semibold text-white">AI Morning Brief</h3>
              </div>
              <div className="space-y-3 text-sm text-white/70">
                <p>
                  <span className="text-red-400 font-medium">🔴 Urgent:</span> Acme Corp payment issue needs immediate attention - $45K at risk.
                </p>
                <p>
                  <span className="text-amber-400 font-medium">⚠️ Today:</span> Production incident ongoing, budget approval due by 5 PM.
                </p>
                <p>
                  <span className="text-green-400 font-medium">💰 Opportunity:</span> Hot lead from TechFlow - potential 50-seat deal.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-xs text-white/40">Generated at 9:00 AM • Next brief in 23 hours</p>
              </div>
            </motion.div>

            {/* Filtered Noise */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="p-5 rounded-xl bg-white/5 border border-white/10"
            >
              <div className="flex items-center gap-2 mb-3">
                <Filter className="w-5 h-5 text-green-400" />
                <h3 className="font-semibold text-white">Noise Filtered Today</h3>
              </div>
              <div className="space-y-2">
                {filteredNoise.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-white/50">{item.text}</span>
                    <span className="text-white/30 text-xs">{item.source}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-white/10 text-center">
                <p className="text-green-400 font-medium text-lg">105 distractions blocked</p>
                <p className="text-xs text-white/40">So you can focus on what matters</p>
              </div>
            </motion.div>

            {/* Connected Tools */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="p-5 rounded-xl bg-white/5 border border-white/10"
            >
              <h3 className="font-semibold text-white mb-3">Connected Tools</h3>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { name: 'WhatsApp', icon: '📱', color: '#25D366' },
                  { name: 'Slack', icon: '💬', color: '#E01E5A' },
                  { name: 'Jira', icon: '🔷', color: '#0052CC' },
                  { name: 'Email', icon: '📧', color: '#EA4335' },
                ].map((tool) => (
                  <div key={tool.name} className="text-center">
                    <div 
                      className="w-10 h-10 rounded-lg mx-auto mb-1 flex items-center justify-center text-lg"
                      style={{ backgroundColor: `${tool.color}20` }}
                    >
                      {tool.icon}
                    </div>
                    <p className="text-[10px] text-white/50">{tool.name}</p>
                    <div className="w-2 h-2 rounded-full bg-green-500 mx-auto mt-1" />
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-12 text-center"
        >
          <p className="text-white/60 mb-4">Ready to cut through your notification chaos?</p>
          <Link 
            href="/signup?plan=founder"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold hover:from-cyan-400 hover:to-blue-400 transition-all"
          >
            Start Your 7-Day Free Trial
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-white/40 text-sm mt-3">No credit card required for viewing • $29/month after trial</p>
        </motion.div>
      </main>
    </div>
  )
}
