'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Logo } from '@/components/brand/Logo'
import { ArrowLeft, FileText, CheckCircle2, AlertTriangle, CreditCard, Scale } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <nav className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <Logo size="md" animated={false} />
          </Link>
          <Link 
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </nav>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-primary/10">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Terms of Service</h1>
              <p className="text-muted-foreground">Last updated: February 2, 2026</p>
            </div>
          </div>

          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <p className="text-lg text-muted-foreground mb-8">
              Welcome to EagleEye. By using our service, you agree to these terms. 
              Please read them carefully.
            </p>

            <section className="mb-12">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold m-0">Acceptance of Terms</h2>
              </div>
              <div className="bg-card/50 border border-border/50 rounded-xl p-6">
                <p className="text-muted-foreground text-sm">
                  By accessing or using EagleEye ("the Service"), you agree to be bound by these 
                  Terms of Service and our Privacy Policy. If you disagree with any part of these 
                  terms, you may not access the Service.
                </p>
              </div>
            </section>

            <section className="mb-12">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold m-0">Description of Service</h2>
              </div>
              <div className="bg-card/50 border border-border/50 rounded-xl p-6 space-y-4">
                <p className="text-muted-foreground text-sm">
                  EagleEye is an AI-powered decision intelligence platform that:
                </p>
                <ul className="space-y-3 text-muted-foreground text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    Connects to your workplace tools (WhatsApp Business, Slack, Asana, Linear, etc.)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    Analyzes communications and tasks to identify important items
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    Surfaces actionable signals that require your attention
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    Delivers notifications via email, Slack, or audio briefings
                  </li>
                </ul>
              </div>
            </section>

            <section className="mb-12">
              <div className="flex items-center gap-2 mb-4">
                <Scale className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold m-0">User Responsibilities</h2>
              </div>
              <div className="bg-card/50 border border-border/50 rounded-xl p-6">
                <p className="text-muted-foreground text-sm mb-4">
                  When using EagleEye, you agree to:
                </p>
                <ul className="space-y-3 text-muted-foreground text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    Provide accurate account information
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    Maintain the security of your account credentials
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    Only connect integrations you have authorization to access
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    Not use the Service for any unlawful purposes
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    Not attempt to reverse engineer or compromise the Service
                  </li>
                </ul>
              </div>
            </section>

            <section className="mb-12">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold m-0">Subscription & Billing</h2>
              </div>
              <div className="bg-card/50 border border-border/50 rounded-xl p-6 space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Free Trial</h3>
                  <p className="text-muted-foreground text-sm">
                    New users receive a 7-day free trial. Credit card is required upfront but won't be charged until the trial ends.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Paid Plans</h3>
                  <p className="text-muted-foreground text-sm">
                    After your trial, you may subscribe to a paid plan. Subscriptions are billed 
                    monthly in advance. Prices are subject to change with 30 days notice.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Cancellation</h3>
                  <p className="text-muted-foreground text-sm">
                    You may cancel your subscription at any time from your account settings. 
                    Cancellation takes effect at the end of your current billing period.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Refunds</h3>
                  <p className="text-muted-foreground text-sm">
                    We offer a 30-day money-back guarantee for new subscribers. Contact support 
                    to request a refund within 30 days of your first payment.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-12">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h2 className="text-xl font-semibold m-0">Limitations of Liability</h2>
              </div>
              <div className="bg-card/50 border border-border/50 rounded-xl p-6">
                <p className="text-muted-foreground text-sm mb-4">
                  EagleEye is provided "as is" without warranties of any kind. We do not guarantee:
                </p>
                <ul className="space-y-3 text-muted-foreground text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-1">•</span>
                    Uninterrupted or error-free service
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-1">•</span>
                    That all important signals will be detected
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-1">•</span>
                    Results from using the Service for business decisions
                  </li>
                </ul>
                <p className="text-muted-foreground text-sm mt-4">
                  EagleEye is a tool to assist decision-making, not replace professional judgment. 
                  You remain responsible for your business decisions.
                </p>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-xl font-semibold mb-4">Intellectual Property</h2>
              <div className="bg-card/50 border border-border/50 rounded-xl p-6">
                <p className="text-muted-foreground text-sm">
                  The Service and its original content, features, and functionality are owned by 
                  EagleEye and are protected by international copyright, trademark, and other 
                  intellectual property laws. Your data remains yours—we claim no ownership over 
                  content from your connected integrations.
                </p>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-xl font-semibold mb-4">Termination</h2>
              <div className="bg-card/50 border border-border/50 rounded-xl p-6">
                <p className="text-muted-foreground text-sm">
                  We may terminate or suspend your account immediately, without prior notice, 
                  for conduct that we believe violates these Terms or is harmful to other users, 
                  us, or third parties. Upon termination, your right to use the Service ceases 
                  immediately.
                </p>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-xl font-semibold mb-4">Changes to Terms</h2>
              <div className="bg-card/50 border border-border/50 rounded-xl p-6">
                <p className="text-muted-foreground text-sm">
                  We reserve the right to modify these terms at any time. We will notify users 
                  of material changes via email or through the Service. Continued use of the 
                  Service after changes constitutes acceptance of the new terms.
                </p>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-xl font-semibold mb-4">Contact</h2>
              <div className="bg-card/50 border border-border/50 rounded-xl p-6">
                <p className="text-muted-foreground text-sm">
                  For questions about these Terms, please contact us at{' '}
                  <a href="mailto:hello@eagleeye.work" className="text-primary hover:underline">
                    hello@eagleeye.work
                  </a>
                </p>
              </div>
            </section>

          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} EagleEye. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <a href="mailto:hello@eagleeye.work" className="hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
