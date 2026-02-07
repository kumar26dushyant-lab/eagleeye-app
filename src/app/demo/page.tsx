'use client'

import { motion } from 'framer-motion'
import { 
  AlertTriangle, 
  Clock, 
  ExternalLink,
  CheckCircle2, 
  Zap,
  TrendingUp,
  Activity,
  Settings,
  Sparkles,
  ArrowRight,
  PartyPopper,
  Info
} from 'lucide-react'
import { Logo } from '@/components/brand/Logo'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

// Demo signal data - matches the real data structure
const needsAttentionItems = [
  {
    id: 1,
    signal_type: 'urgent',
    title: 'Payment Failed - Enterprise Client Acme Corp',
    summary: 'CFO Sarah: "Our monthly payment of $45,000 bounced. Need resolution ASAP or we pause the contract."',
    source: 'whatsapp',
    sender: 'Sarah Chen (CFO)',
    timestamp: new Date(Date.now() - 8 * 60000).toISOString(),
    url: '#',
  },
  {
    id: 2,
    signal_type: 'blocker',
    title: 'Production API Down - 3 Clients Affected',
    summary: '@channel Production auth service returning 503. DevOps investigating. ETA unknown.',
    source: 'slack',
    sender: '#incidents',
    timestamp: new Date(Date.now() - 23 * 60000).toISOString(),
    url: '#',
  },
  {
    id: 3,
    signal_type: 'decision_needed',
    title: 'Q1 Budget Approval Required by EOD',
    summary: 'Finance needs your sign-off on the $280K marketing budget before 5 PM today.',
    source: 'email',
    sender: 'Finance Team',
    timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
    url: '#',
  },
]

const kudosItems = [
  {
    id: 4,
    signal_type: 'kudos',
    title: 'Great job on the client presentation!',
    summary: 'The demo went amazingly well. Client was very impressed with the new features.',
    source: 'slack',
    sender: 'Product Lead',
    timestamp: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
    url: '#',
  },
  {
    id: 5,
    signal_type: 'celebration',
    title: 'Q4 Revenue Target Achieved! 🎉',
    summary: 'Team hit 112% of target. Bonuses will be processed this week.',
    source: 'slack',
    sender: '#wins',
    timestamp: new Date(Date.now() - 4 * 60 * 60000).toISOString(),
    url: '#',
  },
]

const fyiItems = [
  {
    id: 6,
    signal_type: 'fyi',
    title: 'Hot Lead: Series B Startup Interested',
    summary: 'Rahul (CEO, TechFlow): "Loved the demo. Can we discuss enterprise pricing for 50 seats?"',
    source: 'whatsapp',
    sender: 'Rahul (TechFlow)',
    timestamp: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
    url: '#',
  },
  {
    id: 7,
    signal_type: 'fyi',
    title: 'Sprint Review Presentation Due Tomorrow',
    summary: 'Task: Prepare Q4 sprint demo slides. Assigned by: Product Lead. Due: Tomorrow 10 AM',
    source: 'jira',
    sender: 'EAGLE-234',
    timestamp: new Date(Date.now() - 3 * 60 * 60000).toISOString(),
    url: '#',
  },
  {
    id: 8,
    signal_type: 'fyi',
    title: 'New team member joining Monday',
    summary: 'Please welcome Priya to the engineering team. She\'ll be working on the mobile app.',
    source: 'slack',
    sender: '#general',
    timestamp: new Date(Date.now() - 5 * 60 * 60000).toISOString(),
    url: '#',
  },
]

// Get signal badge color based on type
function getSignalColor(type: string): string {
  switch (type) {
    case 'blocker':
    case 'escalation':
      return 'bg-red-500/10 text-red-500 border-red-500/20'
    case 'urgent':
      return 'bg-orange-500/10 text-orange-500 border-orange-500/20'
    case 'decision_needed':
      return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
    case 'kudos':
    case 'celebration':
      return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
    case 'fyi':
      return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    default:
      return 'bg-muted'
  }
}

// Format signal type for display
function formatSignalType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

// Format timestamp to relative time
function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return 'yesterday'
}

// Source icon component
function SourceIcon({ source }: { source: string }) {
  const colors: Record<string, string> = {
    whatsapp: 'bg-[#25D366]/10 text-[#25D366]',
    slack: 'bg-[#4A154B]/10 text-[#E01E5A]',
    jira: 'bg-[#0052CC]/10 text-[#0052CC]',
    email: 'bg-[#EA4335]/10 text-[#EA4335]',
    asana: 'bg-[#F06A6A]/10 text-[#F06A6A]',
  }
  const icons: Record<string, string> = {
    whatsapp: '📱',
    slack: '💬',
    jira: '🔷',
    email: '📧',
    asana: '📋',
  }
  return (
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${colors[source] || 'bg-muted'}`}>
      {icons[source] || '📌'}
    </div>
  )
}

// Signal Card Component (matches real NeedsAttention component style)
function SignalCard({ item }: { item: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 border border-border/50 transition-colors cursor-pointer group"
    >
      <div className="flex gap-3">
        <SourceIcon source={item.source} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getSignalColor(item.signal_type)}`}>
              {formatSignalType(item.signal_type)}
            </Badge>
            <span className="text-xs text-muted-foreground">{item.sender}</span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">{formatRelativeTime(item.timestamp)}</span>
          </div>
          <h4 className="font-medium text-sm mb-1 group-hover:text-primary transition-colors">{item.title}</h4>
          <p className="text-xs text-muted-foreground line-clamp-2">{item.summary}</p>
        </div>
        <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      </div>
    </motion.div>
  )
}

export default function DemoPage() {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const stats = {
    needsAttention: 3,
    kudos: 2,
    fyi: 3,
    total: 8,
  }

  const healthScore = Math.max(0, 100 - (stats.needsAttention * 20)) // 40%

  return (
    <div className="min-h-screen bg-background">
      {/* Demo Banner */}
      <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-b border-cyan-500/30 py-2.5 px-4 text-center">
        <p className="text-sm text-cyan-400">
          📸 <span className="font-semibold">Demo Dashboard</span> - This shows exactly what paying customers see (with sample data)
        </p>
      </div>

      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/20 via-background to-indigo-950/10" />
        <motion.div
          className="absolute top-20 right-20 w-96 h-96 rounded-full blur-3xl opacity-20 bg-indigo-500"
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8"
        >
          <div className="flex items-center gap-6">
            <Logo size="sm" animated={true} />
            <div className="hidden md:block h-8 w-px bg-border" />
            <div className="hidden md:block">
              <p className="text-sm text-muted-foreground">{today}</p>
              <h1 className="text-xl font-semibold flex items-center gap-2">
                {greeting}
                <motion.span animate={{ rotate: [0, 14, 0] }} transition={{ duration: 0.5, delay: 0.5 }}>
                  👋
                </motion.span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-muted/50 backdrop-blur-sm rounded-full p-1 border border-border/50">
              {[
                { id: 'today', label: 'Today', icon: <Zap className="h-3 w-3" />, active: true },
                { id: 'yesterday', label: 'Yesterday', icon: <Clock className="h-3 w-3" /> },
                { id: '3days', label: '3 days', icon: <TrendingUp className="h-3 w-3" /> },
                { id: 'week', label: 'Week', icon: <Activity className="h-3 w-3" /> },
              ].map((option) => (
                <button
                  key={option.id}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full transition-all ${
                    option.active
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {option.icon}
                  <span className="hidden sm:inline">{option.label}</span>
                </button>
              ))}
            </div>
            
            <Button variant="ghost" size="icon" className="rounded-full">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </motion.header>

        {/* Status Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 p-4 rounded-2xl bg-card/50 backdrop-blur-md border border-border/50 shadow-xl"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <motion.div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-indigo-500/20" whileHover={{ scale: 1.05 }}>
                <span className="text-2xl">👀</span>
              </motion.div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold">EagleEye</h2>
                  <span className="px-2 py-0.5 text-[10px] rounded-full bg-green-500/10 text-green-500 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    SYNCED
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">3 items need attention</p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {[
                { name: 'WhatsApp', color: '#25D366' },
                { name: 'Slack', color: '#4A154B' },
                { name: 'Jira', color: '#0052CC' },
                { name: 'Email', color: '#EA4335' },
              ].map((tool) => (
                <motion.div 
                  key={tool.name}
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border"
                  style={{ 
                    backgroundColor: `${tool.color}10`,
                    borderColor: `${tool.color}20`,
                  }}
                >
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-medium">{tool.name}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Sidebar */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-4">
            <div className="lg:sticky lg:top-4 space-y-4">
              
              {/* Health Score Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="p-5 rounded-2xl bg-card/50 backdrop-blur-md border border-border/50 shadow-lg"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Workspace Health
                  </h3>
                  <span className={`text-2xl font-bold ${healthScore >= 80 ? 'text-emerald-500' : healthScore >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                    {healthScore}%
                  </span>
                </div>
                
                <div className="h-3 bg-muted rounded-full overflow-hidden mb-4">
                  <motion.div
                    className={`h-full rounded-full bg-gradient-to-r ${healthScore >= 80 ? 'from-emerald-500 to-green-400' : healthScore >= 50 ? 'from-amber-500 to-yellow-400' : 'from-red-500 to-orange-400'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${healthScore}%` }}
                    transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <motion.div whileHover={{ scale: 1.02 }} className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <div className="text-2xl font-bold text-red-500">{stats.needsAttention}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Critical</div>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <div className="text-2xl font-bold text-emerald-500">{stats.kudos}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Kudos</div>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <div className="text-2xl font-bold text-amber-500">{stats.fyi}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">FYI</div>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <div className="text-2xl font-bold text-blue-500">{stats.total}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</div>
                  </motion.div>
                </div>
              </motion.div>

              {/* AI Brief Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="p-5 rounded-2xl bg-gradient-to-br from-primary/5 to-indigo-500/5 border border-primary/20 shadow-lg"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">Today's Brief</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  You have <span className="text-red-400 font-medium">3 urgent items</span> including a payment issue with Acme Corp ($45K at risk). 
                  Production incident ongoing in Slack. Budget approval due by EOD. 
                  Good news: <span className="text-emerald-400 font-medium">Q4 target achieved!</span>
                </p>
                <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50">
                  Generated at 9:00 AM • Based on 847 messages
                </p>
              </motion.div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-6">
            
            {/* Needs Attention */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="bg-card/50 backdrop-blur-md border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    🔴 Needs Attention
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Urgent items requiring your action</p>
                </CardHeader>
                <CardContent className="space-y-2">
                  {needsAttentionItems.map((item) => (
                    <SignalCard key={item.id} item={item} />
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Kudos & Wins */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="bg-card/50 backdrop-blur-md border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <PartyPopper className="h-4 w-4 text-emerald-500" />
                    🏆 Kudos & Wins
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Celebrations, appreciation, good vibes</p>
                </CardHeader>
                <CardContent className="space-y-2">
                  {kudosItems.map((item) => (
                    <SignalCard key={item.id} item={item} />
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* FYI */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card className="bg-card/50 backdrop-blur-md border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Info className="h-4 w-4 text-blue-500" />
                    📩 For Your Info
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Updates and context</p>
                </CardHeader>
                <CardContent className="space-y-2">
                  {fyiItems.map((item) => (
                    <SignalCard key={item.id} item={item} />
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center pb-8"
        >
          <p className="text-muted-foreground mb-4">This is the exact dashboard you'll get. Ready to cut through your notification chaos?</p>
          <Link 
            href="/signup?plan=founder"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold hover:from-cyan-400 hover:to-blue-400 transition-all"
          >
            Start Your 7-Day Free Trial
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-muted-foreground text-sm mt-3">Card required • Cancel anytime • $29/month after trial</p>
        </motion.div>
      </div>
    </div>
  )
}
