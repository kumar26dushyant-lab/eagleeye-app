'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Logo } from '@/components/brand/Logo'
import { ArrowLeft, Shield, Lock, Eye, Database, Mail, Globe } from 'lucide-react'

export default function PrivacyPage() {
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
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Privacy Policy</h1>
              <p className="text-muted-foreground">Last updated: February 2, 2026</p>
            </div>
          </div>

          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <p className="text-lg text-muted-foreground mb-8">
              At EagleEye, we take your privacy seriously. This policy describes how we collect, 
              use, and protect your information when you use our service.
            </p>

            <section className="mb-12">
              <div className="flex items-center gap-2 mb-4">
                <Database className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold m-0">Information We Collect</h2>
              </div>
              <div className="bg-card/50 border border-border/50 rounded-xl p-6 space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Account Information</h3>
                  <p className="text-muted-foreground text-sm">
                    When you sign up, we collect your email address and name to create your account.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Integration Data</h3>
                  <p className="text-muted-foreground text-sm">
                    When you connect integrations (WhatsApp Business, Slack, Asana, Linear, etc.), we access data from 
                    those services to provide you with signals. We only access the minimum data needed 
                    to detect important items that require your attention.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Usage Data</h3>
                  <p className="text-muted-foreground text-sm">
                    We collect information about how you use EagleEye to improve our service, 
                    including which signals you act on and your preference settings.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-12">
              <div className="flex items-center gap-2 mb-4">
                <Eye className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold m-0">How We Use Your Information</h2>
              </div>
              <div className="bg-card/50 border border-border/50 rounded-xl p-6">
                <ul className="space-y-3 text-muted-foreground text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    To provide and operate the EagleEye service
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    To analyze your connected tools and surface important signals
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    To send you notifications about signals that need your attention
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    To improve and personalize your experience
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    To communicate with you about your account and service updates
                  </li>
                </ul>
              </div>
            </section>

            <section className="mb-12">
              <div className="flex items-center gap-2 mb-4">
                <Lock className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold m-0">Data Security</h2>
              </div>
              <div className="bg-card/50 border border-border/50 rounded-xl p-6">
                <p className="text-muted-foreground text-sm mb-4">
                  We implement industry-standard security measures to protect your data:
                </p>
                <ul className="space-y-3 text-muted-foreground text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    All data is encrypted in transit (TLS 1.3) and at rest (AES-256)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    Integration tokens are securely stored and never logged
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    We perform regular security audits and penetration testing
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    Access to production systems is strictly controlled and audited
                  </li>
                </ul>
              </div>
            </section>

            <section className="mb-12">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold m-0">Third-Party Services</h2>
              </div>
              <div className="bg-card/50 border border-border/50 rounded-xl p-6">
                <p className="text-muted-foreground text-sm mb-4">
                  We use trusted third-party services to operate EagleEye:
                </p>
                <ul className="space-y-3 text-muted-foreground text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <strong>Supabase:</strong> Database and authentication
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <strong>Vercel:</strong> Hosting and deployment
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <strong>Dodo Payments:</strong> Payment processing (Merchant of Record)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <strong>Google AI:</strong> Signal analysis (no personal data is stored)
                  </li>
                </ul>
              </div>
            </section>

            <section className="mb-12">
              <div className="flex items-center gap-2 mb-4">
                <Mail className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold m-0">Contact Us</h2>
              </div>
              <div className="bg-card/50 border border-border/50 rounded-xl p-6">
                <p className="text-muted-foreground text-sm">
                  If you have any questions about this Privacy Policy, please contact us at{' '}
                  <a href="mailto:hello@eagleeye.work" className="text-primary hover:underline">
                    hello@eagleeye.work
                  </a>
                </p>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-xl font-semibold mb-4">Your Rights</h2>
              <div className="bg-card/50 border border-border/50 rounded-xl p-6">
                <p className="text-muted-foreground text-sm mb-4">
                  You have the right to:
                </p>
                <ul className="space-y-3 text-muted-foreground text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    Access the personal information we hold about you
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    Request correction of inaccurate data
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    Request deletion of your data
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    Export your data in a portable format
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    Disconnect integrations and revoke access at any time
                  </li>
                </ul>
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
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <a href="mailto:hello@eagleeye.work" className="hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
