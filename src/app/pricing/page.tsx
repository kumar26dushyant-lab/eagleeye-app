'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Check, Loader2, ArrowRight, Sparkles, Shield, Zap, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Logo } from '@/components/brand/Logo'

const PRICING_TIERS = [
  {
    id: 'founder',
    name: 'Founder',
    description: 'For solo founders & small teams',
    price: 29,
    period: '/month',
    features: [
      'Unlimited integrations',
      'Real-time notifications',
      'AI-powered insights',
      '90-day history',
      'Daily email digest',
      'Browser push alerts',
      'Priority support',
    ],
    cta: 'Start Free Trial',
    popular: true,
    badge: 'Most Popular',
  },
  {
    id: 'team',
    name: 'Team',
    description: 'For growing teams',
    price: 79,
    period: '/month',
    features: [
      'Everything in Founder',
      'Up to 10 team members',
      'Team dashboard',
      'Shared priorities',
      '1-year history',
      'Custom integrations',
      'Dedicated support',
    ],
    cta: 'Start Free Trial',
    popular: false,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For larger organizations',
    price: null,
    period: 'Custom',
    features: [
      'Everything in Team',
      'Unlimited team members',
      'SSO / SAML',
      'Custom AI training',
      'On-premise option',
      'SLA guarantee',
      'Dedicated success manager',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
]

const TRUST_BADGES = [
  { icon: Shield, label: 'SOC 2 Compliant' },
  { icon: Zap, label: 'Powered by Stripe' },
  { icon: Users, label: '500+ Founders' },
]

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [email, setEmail] = useState('')

  const handleSubscribe = async (tierId: string) => {
    if (tierId === 'enterprise') {
      window.open('https://calendly.com/eagleeye/enterprise', '_blank')
      return
    }

    // Redirect to signup page with plan pre-selected
    // This ensures we collect card details upfront for the trial
    window.location.href = `/signup?plan=${tierId}`
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-4 flex items-center justify-between">
          <Logo size="md" animated={true} />
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
              Dashboard
            </Link>
            <Button variant="outline" size="sm" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 lg:px-12 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              14-day free trial on all paid plans
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Start free and upgrade as you grow. No hidden fees, cancel anytime.
            </p>
          </motion.div>
        </div>

        {/* Trust badges */}
        <div className="flex justify-center gap-8 mb-12">
          {TRUST_BADGES.map((badge, i) => (
            <motion.div
              key={badge.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-2 text-muted-foreground"
            >
              <badge.icon className="h-4 w-4" />
              <span className="text-sm">{badge.label}</span>
            </motion.div>
          ))}
        </div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {PRICING_TIERS.map((tier, i) => (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`relative bg-card border rounded-xl p-6 ${
                tier.popular 
                  ? 'border-primary ring-2 ring-primary/20' 
                  : 'border-border'
              }`}
            >
              {tier.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium">
                  {tier.badge}
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-1">{tier.name}</h3>
                <p className="text-sm text-muted-foreground">{tier.description}</p>
              </div>

              <div className="mb-6">
                {tier.price !== null ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">${tier.price}</span>
                    <span className="text-muted-foreground">{tier.period}</span>
                  </div>
                ) : (
                  <div className="text-4xl font-bold">Custom</div>
                )}
              </div>

              <Button
                className="w-full mb-6"
                variant={tier.popular ? 'default' : 'outline'}
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

              <ul className="space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-4">
            {[
              {
                q: 'Can I try EagleEye before paying?',
                a: 'Yes! Every plan includes a 14-day free trial. We collect your payment details upfront, but you won\'t be charged until day 15. Cancel anytime during the trial — no questions asked.',
              },
              {
                q: 'What happens when my trial ends?',
                a: "Your card will be charged for your chosen plan on day 15. We'll send you reminders at 3 days and 1 day before. You can cancel anytime from your billing settings.",
              },
              {
                q: 'Can I change plans later?',
                a: "Yes! Upgrade or downgrade anytime. When upgrading, you'll be prorated. When downgrading, changes take effect at the next billing cycle.",
              },
              {
                q: 'Is my data secure?',
                a: "Yes. We're SOC 2 compliant, all data is encrypted at rest and in transit, and we never store your integration credentials on our servers.",
              },
              {
                q: 'What payment methods do you accept?',
                a: 'We accept all major credit cards, debit cards, and in some regions, local payment methods through our partner Stripe.',
              },
              {
                q: 'Do you offer refunds?',
                a: "We offer a 30-day money-back guarantee on all paid plans. If you're not satisfied, contact us for a full refund.",
              },
            ].map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                className="bg-card border border-border rounded-lg p-5"
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
          className="mt-16 text-center bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-xl p-8"
        >
          <h2 className="text-2xl font-bold mb-2">Ready to save 2+ hours daily?</h2>
          <p className="text-muted-foreground mb-6">
            Join 500+ founders who've reclaimed their focus
          </p>
          <Button size="lg" onClick={() => handleSubscribe('founder')}>
            Start Your Free Trial
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
          <p className="text-xs text-muted-foreground mt-4">
            Card required • No charge until day 14 • Cancel anytime
          </p>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🦅</span>
            <span className="font-semibold">EagleEye</span>
            <span className="text-muted-foreground text-sm">• Decision Intelligence</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
            <Link href="/security" className="hover:text-foreground">Security</Link>
            <a href="mailto:hello@eagleeye.app" className="hover:text-foreground">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
