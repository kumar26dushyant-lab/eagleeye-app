'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Check, Loader2, ArrowRight, Sparkles, Shield, Zap, Users, Crown, Building2, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/brand/Logo'

const PRICING_TIERS = [
  {
    id: 'solo',
    name: 'Solo',
    description: 'For Founders, VPs & Department Heads',
    price: 29,
    period: '/month',
    annualPrice: 24,
    features: [
      { text: 'Unlimited integrations', tooltip: 'Slack, WhatsApp Business, Asana, Jira & more' },
      { text: 'Real-time signal detection', tooltip: 'AI analyzes your tools 24/7' },
      { text: 'AI-powered daily briefs', tooltip: 'Audio briefings you can listen on the go' },
      { text: '90-day signal history', tooltip: 'Access past insights and patterns' },
      { text: 'Email & push notifications', tooltip: 'Never miss critical updates' },
      { text: 'Email support', tooltip: 'We respond within 48 hours' },
    ],
    cta: 'Start 7-Day Free Trial',
    popular: true,
    badge: 'Most Popular',
    icon: Crown,
  },
  {
    id: 'team',
    name: 'Team',
    description: 'For growing teams & departments',
    price: 79,
    period: '/month',
    annualPrice: 66,
    features: [
      { text: 'Everything in Solo', tooltip: 'All Solo features included' },
      { text: 'Up to 10 team members', tooltip: 'Each member gets their own brief' },
      { text: 'Team dashboard & analytics', tooltip: 'See team-wide signal patterns' },
      { text: 'Shared priorities view', tooltip: 'Align on what matters most' },
      { text: '1-year signal history', tooltip: 'Longer retention for insights' },
      { text: 'Integration requests', tooltip: 'Request tools and we\'ll add them' },
    ],
    cta: 'Start 7-Day Free Trial',
    popular: false,
    icon: Users,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For larger organizations',
    price: null,
    period: 'Custom',
    annualPrice: null,
    features: [
      { text: 'Everything in Team', tooltip: 'All Team features included' },
      { text: 'Unlimited team members', tooltip: 'No seat limits' },
      { text: 'SSO / SAML authentication', tooltip: 'Okta, Azure AD, Google Workspace' },
      { text: 'Custom AI training', tooltip: 'AI learns your company\'s context' },
      { text: 'On-premise deployment', tooltip: 'Run in your own infrastructure' },
      { text: 'SLA available', tooltip: 'Custom SLA based on your needs' },
    ],
    cta: 'Contact Us',
    popular: false,
    icon: Building2,
  },
]

const TRUST_BADGES = [
  { icon: Shield, label: 'Bank-level encryption' },
  { icon: Zap, label: 'Powered by Dodo Payments' },
]

const INTEGRATIONS = [
  { name: 'WhatsApp Business', icon: '📱', status: 'available', highlight: true },
  { name: 'Slack', icon: '💬', status: 'available' },
  { name: 'Asana', icon: '📋', status: 'available' },
  { name: 'Linear', icon: '🎯', status: 'available' },
  { name: 'Jira', icon: '🔷', status: 'available' },
  { name: 'ClickUp', icon: '✅', status: 'available' },
  { name: 'GitHub', icon: '🐙', status: 'available' },
  { name: 'MS Teams', icon: '👥', status: 'available' },
  { name: 'Notion', icon: '📝', status: 'available' },
]

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')
  const [productIds, setProductIds] = useState<Record<string, { monthly?: string; annual?: string }>>({})

  // Fetch product IDs on mount
  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => setProductIds(data))
      .catch(err => console.error('Failed to fetch product IDs:', err))
  }, [])

  const handleSubscribe = async (tierId: string) => {
    if (tierId === 'enterprise') {
      window.open('mailto:hello@eagleeye.work?subject=Enterprise%20Inquiry', '_blank')
      return
    }

    setLoading(tierId)
    
    // Get product ID based on tier and billing cycle
    const tierProducts = productIds[tierId]
    const productId = billingCycle === 'annual' ? tierProducts?.annual : tierProducts?.monthly
    
    if (!productId) {
      console.error('Product ID not found for tier:', tierId)
      setLoading(null)
      return
    }
    
    // Redirect to Dodo checkout
    window.location.href = `/api/checkout?productId=${productId}`
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <Logo size="md" animated={true} />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <Button variant="outline" size="sm" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              7-day free trial • Card required • Cancel anytime
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              One price, full access. No feature gates, no surprises.
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-3 p-1 bg-muted/50 rounded-lg">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  billingCycle === 'monthly' 
                    ? 'bg-background shadow-sm text-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                  billingCycle === 'annual' 
                    ? 'bg-background shadow-sm text-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Annual
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                  Save 17%
                </span>
              </button>
            </div>
          </motion.div>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap justify-center gap-6 md:gap-10 mb-16">
          {TRUST_BADGES.map((badge, i) => (
            <motion.div
              key={badge.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-2 text-muted-foreground"
            >
              <badge.icon className="h-4 w-4 text-primary/70" />
              <span className="text-sm">{badge.label}</span>
            </motion.div>
          ))}
        </div>

        {/* Pricing cards - Centered 3-column grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto mb-20">
          {PRICING_TIERS.map((tier, i) => {
            const Icon = tier.icon
            const displayPrice = billingCycle === 'annual' && tier.annualPrice ? tier.annualPrice : tier.price
            
            return (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`relative bg-card rounded-2xl overflow-hidden ${
                  tier.popular 
                    ? 'border-2 border-primary shadow-lg shadow-primary/10' 
                    : 'border border-border'
                }`}
              >
                {tier.badge && (
                  <div className="absolute top-0 left-0 right-0 bg-primary text-primary-foreground text-center py-1.5 text-xs font-semibold">
                    {tier.badge}
                  </div>
                )}

                <div className={`p-6 ${tier.badge ? 'pt-10' : ''}`}>
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className={`p-2 rounded-lg ${tier.popular ? 'bg-primary/20' : 'bg-muted'}`}>
                      <Icon className={`h-5 w-5 ${tier.popular ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{tier.name}</h3>
                      <p className="text-sm text-muted-foreground">{tier.description}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    {displayPrice !== null ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold">${displayPrice}</span>
                        <span className="text-muted-foreground">/month</span>
                        {billingCycle === 'annual' && tier.price && (
                          <span className="text-sm text-muted-foreground line-through ml-2">
                            ${tier.price}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="text-4xl font-bold">Custom</div>
                    )}
                    {billingCycle === 'annual' && displayPrice && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Billed ${displayPrice * 12}/year
                      </p>
                    )}
                  </div>

                  {/* CTA Button */}
                  <Button
                    className={`w-full mb-6 ${tier.popular ? '' : ''}`}
                    variant={tier.popular ? 'default' : 'outline'}
                    size="lg"
                    onClick={() => handleSubscribe(tier.id)}
                    disabled={loading === tier.id}
                  >
                    {loading === tier.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        {tier.cta}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>

                  {/* Features */}
                  <ul className="space-y-3">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{feature.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Integrations Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-20"
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Works with your favorite tools</h2>
            <p className="text-muted-foreground">Connect once, get insights forever</p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 max-w-3xl mx-auto">
            {INTEGRATIONS.map((integration: { name: string; icon: string; status: string; highlight?: boolean }) => (
              <div
                key={integration.name}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                  integration.highlight
                    ? 'border-green-500/50 bg-green-500/10 ring-1 ring-green-500/20'
                    : 'border-border bg-card hover:border-primary/30'
                }`}
              >
                <span className="text-lg">{integration.icon}</span>
                <span className="text-sm font-medium">{integration.name}</span>
                {integration.highlight && (
                  <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                    New
                  </span>
                )}
              </div>
            ))}
          </div>
          
          {/* Integration Notes */}
          <div className="mt-6 max-w-2xl mx-auto text-center">
            <p className="text-xs text-muted-foreground">
              <span className="text-amber-400">📱 WhatsApp Business:</span> One business account per EagleEye user (Solo plan). 
              <span className="text-blue-400 ml-2">💬 Other tools:</span> Team members can each connect their own accounts.
            </p>
          </div>
        </motion.div>

        {/* What's Signal History */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="mb-20 max-w-3xl mx-auto"
        >
          <div className="bg-card border border-border rounded-2xl p-8">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <MessageSquare className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">What is "Signal History"?</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  EagleEye doesn't store your raw messages or task content. Instead, we extract <strong className="text-foreground">signals</strong> — 
                  actionable insights like "Urgent blocker mentioned" or "Positive team feedback detected". 
                  These signals are stored for the retention period (90 days for Solo, 1 year for Team), 
                  helping you spot patterns and trends. Your actual data stays in your tools.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto mb-20">
          <h2 className="text-2xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-4">
            {[
              {
                q: 'How does the 7-day trial work?',
                a: 'You get full access to all features for 7 days. We collect your card details upfront (like Netflix), but you won\'t be charged until day 8. Cancel anytime during the trial with one click — no questions asked.',
              },
              {
                q: 'What happens when my trial ends?',
                a: "Your card will be charged for your chosen plan on day 8. We'll send you reminders at 3 days and 1 day before. You can cancel anytime from your billing settings.",
              },
              {
                q: 'Can I switch plans later?',
                a: "Absolutely! Upgrade or downgrade anytime. When upgrading, you pay the prorated difference. When downgrading, changes take effect at the next billing cycle.",
              },
              {
                q: 'Why is WhatsApp Business different from other integrations?',
                a: "WhatsApp Business uses phone number authentication, so one WhatsApp account can only be connected to one EagleEye user at a time (Solo plan). Other tools like Slack, Jira, and Asana use OAuth, allowing each team member to connect their own accounts independently.",
              },
              {
                q: 'What does "Priority integration requests" mean?',
                a: "On the Team plan, if your team uses a tool we don't support yet, we'll prioritize building that integration for you. Many of our integrations started as customer requests!",
              },
              {
                q: 'Is my data secure?',
                a: "Yes. We use bank-level encryption (AES-256), never store your raw messages permanently, and only access metadata needed to generate insights. You can disconnect any tool anytime.",
              },
              {
                q: 'Do you offer refunds?',
                a: "We offer a 30-day money-back guarantee on all paid plans. If EagleEye doesn't save you time, contact us for a full refund.",
              },
            ].map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 + i * 0.05 }}
                className="bg-card border border-border rounded-xl p-5"
              >
                <h3 className="font-semibold mb-2">{faq.q}</h3>
                <p className="text-sm text-muted-foreground">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-2xl p-10 max-w-3xl mx-auto"
        >
          <h2 className="text-2xl font-bold mb-2">Ready to save 2+ hours daily?</h2>
          <p className="text-muted-foreground mb-6">
            Join 500+ leaders who've reclaimed their focus
          </p>
          <Button size="lg" onClick={() => handleSubscribe('solo')}>
            Start Your 7-Day Free Trial
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
          <p className="text-xs text-muted-foreground mt-4">
            Card required • No charge until day 8 • Cancel anytime
          </p>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href="/">
            <Logo size="sm" />
          </Link>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/dashboard/support" className="hover:text-foreground transition-colors">Support</Link>
            <a href="mailto:hello@eagleeye.work" className="hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
