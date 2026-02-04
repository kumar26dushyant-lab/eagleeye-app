'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  HelpCircle, 
  ChevronDown, 
  ChevronRight,
  Search,
  Mail,
  Zap,
  Link2,
  Bell,
  Settings,
  CreditCard,
  Shield,
  Clock,
  Copy,
  CheckCircle2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

// FAQ Categories with questions
const FAQ_CATEGORIES = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: Zap,
    color: 'text-green-400',
    questions: [
      {
        q: 'How does EagleEye work?',
        a: 'EagleEye connects to your work tools (WhatsApp Business, Slack, Asana, Jira, etc.) and uses AI to analyze your tasks, messages, and priorities. Every morning, you get a personalized brief that tells you exactly what needs your attention - no more inbox overwhelm!'
      },
      {
        q: 'How long does setup take?',
        a: 'Most users are up and running in under 5 minutes. Just connect your integrations, and EagleEye starts learning your work patterns immediately. Your first brief will be ready within 24 hours.'
      },
      {
        q: 'Is my data secure?',
        a: 'Absolutely. We use bank-level encryption (AES-256), never store your actual messages or task content permanently, and only access what\'s needed to generate your brief. You can disconnect any integration at any time, and we\'ll delete all associated data.'
      },
      {
        q: 'What if I use tools you don\'t support yet?',
        a: 'We\'re constantly adding new integrations! Check our roadmap or contact support to request a specific tool. Many users start with just 1-2 integrations and add more over time.'
      }
    ]
  },
  {
    id: 'integrations',
    title: 'Integrations',
    icon: Link2,
    color: 'text-blue-400',
    questions: [
      {
        q: 'How do I connect Asana?',
        a: 'Go to Dashboard → Integrations → Click "Connect" next to Asana. You\'ll be redirected to Asana to authorize EagleEye. Once approved, select which projects you want to track, and you\'re done!'
      },
      {
        q: 'How do I connect WhatsApp Business?',
        a: 'Go to Dashboard → Integrations → Click "Connect" next to WhatsApp Business. You\'ll need your Meta Business Account credentials (Access Token, Phone Number ID, Business Account ID) from the Meta Developer Portal. We only read incoming messages - we never send messages on your behalf.'
      },
      {
        q: 'How do I connect Slack?',
        a: 'Go to Dashboard → Integrations → Click "Connect" next to Slack. Authorize EagleEye in your Slack workspace, then choose which channels to monitor. We only read messages - we never post on your behalf.'
      },
      {
        q: 'Can I connect multiple workspaces?',
        a: 'Yes! You can connect multiple Slack workspaces, multiple Asana workspaces, WhatsApp Business accounts, etc. Each integration is tracked separately, and your brief will consolidate information from all of them.'
      },
      {
        q: 'Why isn\'t my integration syncing?',
        a: 'First, check if the integration shows as "Connected" in your Integrations page. If it\'s connected but not syncing: 1) Try disconnecting and reconnecting, 2) Ensure you have the right permissions in that tool, 3) Check if the tool\'s API is having issues. If problems persist, contact support.'
      },
      {
        q: 'How do I disconnect an integration?',
        a: 'Go to Dashboard → Integrations → Find the integration → Click the "Disconnect" button. Your data from that integration will be removed from your briefs immediately.'
      }
    ]
  },
  {
    id: 'daily-brief',
    title: 'Your Daily Brief',
    icon: Clock,
    color: 'text-purple-400',
    questions: [
      {
        q: 'When do I receive my daily brief?',
        a: 'By default, your brief is generated at 6 AM in your local timezone, so it\'s ready when you start your day. You can change this time in Settings → Notifications.'
      },
      {
        q: 'How does the AI prioritize tasks?',
        a: 'EagleEye looks at multiple signals: due dates, mentions of your name, urgency keywords, who\'s asking (your manager vs. a colleague), project importance, and patterns from your past behavior. Over time, it learns what matters most to YOU.'
      },
      {
        q: 'What does "Needs Attention" mean?',
        a: 'These are items that require your action today. They\'re time-sensitive, have urgent signals, or have been waiting too long. Start here!'
      },
      {
        q: 'What does "FYI" mean?',
        a: 'These are updates you should know about but don\'t need to act on immediately. Important context, but not urgent.'
      },
      {
        q: 'Can I get my brief as audio?',
        a: 'Yes! Click the audio icon on your dashboard to hear your brief read aloud. Perfect for your commute or while getting ready in the morning.'
      },
      {
        q: 'How do I refresh my brief?',
        a: 'Click the refresh button on your dashboard. This will re-sync all your integrations and generate an updated brief. Note: Refreshes are limited to prevent API overuse.'
      }
    ]
  },
  {
    id: 'notifications',
    title: 'Notifications',
    icon: Bell,
    color: 'text-yellow-400',
    questions: [
      {
        q: 'What notification options do I have?',
        a: 'You can receive notifications via: 1) Email digest (daily summary), 2) Web push notifications (real-time alerts in browser), 3) Slack DM (if Slack is connected). Configure all of these in Settings → Notifications.'
      },
      {
        q: 'How do I turn off notifications?',
        a: 'Go to Settings → Notifications. You can turn off all notifications, or customize which types you receive (email, push, Slack) and when (quiet hours).'
      },
      {
        q: 'Why am I not receiving email notifications?',
        a: 'Check: 1) Your email is verified in your account settings, 2) Email notifications are enabled in Settings → Notifications, 3) Our emails aren\'t going to spam (add us to your contacts), 4) The email address is correct.'
      }
    ]
  },
  {
    id: 'account',
    title: 'Account & Settings',
    icon: Settings,
    color: 'text-gray-400',
    questions: [
      {
        q: 'How do I change my password?',
        a: 'Go to the login page and click "Forgot password?" Enter your email, and we\'ll send you a secure link to reset your password.'
      },
      {
        q: 'How do I update my email address?',
        a: 'Currently, email changes require contacting support. This is for security reasons. Email us and we\'ll help you update it securely.'
      },
      {
        q: 'How do I delete my account?',
        a: 'Contact support to request account deletion. We\'ll remove all your data within 30 days, including all integration data and generated briefs. This action cannot be undone.'
      },
      {
        q: 'Can I export my data?',
        a: 'Yes! Contact support to request a data export. We\'ll provide all your briefs and settings in a standard format within 7 business days.'
      }
    ]
  },
  {
    id: 'billing',
    title: 'Billing & Subscription',
    icon: CreditCard,
    color: 'text-emerald-400',
    questions: [
      {
        q: 'How does the 7-day trial work?',
        a: 'You get full access to all features for 7 days. Card is required upfront but you won\'t be charged until day 8. You can cancel anytime before the trial ends.'
      },
      {
        q: 'What happens when my trial ends?',
        a: 'You\'ll receive reminders as your trial approaches its end. If you don\'t subscribe, your account will be paused - your settings and integrations are saved, but you won\'t receive new briefs until you subscribe.'
      },
      {
        q: 'How do I upgrade or downgrade my plan?',
        a: 'Go to Dashboard → Billing → Click "Change Plan". Changes are prorated, so you\'ll only pay the difference when upgrading, or receive credit when downgrading.'
      },
      {
        q: 'How do I cancel my subscription?',
        a: 'Go to Dashboard → Billing → Click "Cancel Subscription". You\'ll retain access until the end of your current billing period. You can resubscribe anytime.'
      },
      {
        q: 'What payment methods do you accept?',
        a: 'We accept all major credit cards (Visa, Mastercard, American Express) and some regional payment methods through our payment processor. All payments are securely processed.'
      }
    ]
  },
  {
    id: 'privacy',
    title: 'Privacy & Security',
    icon: Shield,
    color: 'text-red-400',
    questions: [
      {
        q: 'What data do you collect?',
        a: 'We only access data needed to generate your brief: task titles, due dates, message previews, and metadata. We never access file attachments, personal messages, or data outside your selected projects/channels.'
      },
      {
        q: 'How long do you keep my data?',
        a: 'Integration data is processed in real-time and not stored permanently. Generated briefs are kept for 90 days (Solo plan) or 1 year (Team plan) so you can reference past summaries. You can request deletion anytime.'
      },
      {
        q: 'Is EagleEye SOC 2 compliant?',
        a: 'We\'re currently working toward SOC 2 Type II certification. Contact us if you need specific security documentation for your organization.'
      },
      {
        q: 'Can my employer see my briefs?',
        a: 'No. Your EagleEye account is personal to you. Even on Team plans, each member has their own private briefs. Administrators can only see aggregated usage stats, not individual content.'
      }
    ]
  }
]

// FAQ Item Component
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border-b border-zinc-800 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 flex items-start justify-between text-left hover:bg-zinc-800/30 transition-colors rounded-lg px-2 -mx-2"
      >
        <span className="text-zinc-200 font-medium pr-4">{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-zinc-500 flex-shrink-0 mt-0.5" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="pb-4 px-2 text-zinc-400 leading-relaxed">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Category Section Component  
function CategorySection({ category, isExpanded, onToggle }: { 
  category: typeof FAQ_CATEGORIES[0]
  isExpanded: boolean
  onToggle: () => void
}) {
  const Icon = category.icon

  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <button
        onClick={onToggle}
        className="w-full text-left"
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-zinc-800 ${category.color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg text-zinc-100">{category.title}</CardTitle>
              <CardDescription className="text-zinc-500">
                {category.questions.length} articles
              </CardDescription>
            </div>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight className="w-5 h-5 text-zinc-500" />
          </motion.div>
        </CardHeader>
      </button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CardContent className="pt-2">
              {category.questions.map((faq, idx) => (
                <FAQItem key={idx} question={faq.q} answer={faq.a} />
              ))}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

export default function SupportPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategory, setExpandedCategory] = useState<string | null>('getting-started')
  const [copied, setCopied] = useState(false)

  const supportEmail = 'support@eagleeye.work'

  // Filter FAQs based on search
  const filteredCategories = searchQuery
    ? FAQ_CATEGORIES.map(cat => ({
        ...cat,
        questions: cat.questions.filter(
          faq => 
            faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.a.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(cat => cat.questions.length > 0)
    : FAQ_CATEGORIES

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(supportEmail)
    setCopied(true)
    toast.success('Email copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 rounded-full border border-zinc-800 mb-6"
          >
            <HelpCircle className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-zinc-400">Help Center</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-bold text-white mb-4"
          >
            How can we help you?
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-zinc-400 text-lg max-w-2xl mx-auto"
          >
            Find answers to common questions about EagleEye, or reach out to our support team.
          </motion.p>
        </div>

        {/* Email Support Card - Primary CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <Card className="bg-gradient-to-br from-blue-900/40 to-cyan-900/30 border-blue-700/50">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="p-4 bg-blue-500/20 rounded-2xl">
                  <Mail className="w-10 h-10 text-blue-400" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-xl font-semibold text-white mb-2">Email Support</h3>
                  <p className="text-zinc-400 mb-4">
                    Have a question or issue? Email us directly and we&apos;ll get back to you within 24 hours.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <a 
                      href={`mailto:${supportEmail}`}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                      {supportEmail}
                    </a>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyEmail}
                      className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
                    >
                      {copied ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2 text-green-400" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="relative mb-8"
        >
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search for answers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
          />
        </motion.div>

        {/* FAQ Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-4"
        >
          <h2 className="text-xl font-semibold text-white mb-6">
            {searchQuery ? `Search Results for "${searchQuery}"` : 'Browse by Topic'}
          </h2>
          
          {filteredCategories.length > 0 ? (
            filteredCategories.map((category) => (
              <CategorySection
                key={category.id}
                category={category}
                isExpanded={searchQuery ? true : expandedCategory === category.id}
                onToggle={() => setExpandedCategory(
                  expandedCategory === category.id ? null : category.id
                )}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-zinc-500" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No results found</h3>
              <p className="text-zinc-400 mb-6">
                Try a different search term or email us directly.
              </p>
              <Button
                asChild
                className="bg-blue-600 hover:bg-blue-700"
              >
                <a href={`mailto:${supportEmail}`}>
                  <Mail className="w-4 h-4 mr-2" />
                  Email Support
                </a>
              </Button>
            </div>
          )}
        </motion.div>

        {/* Footer CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center border-t border-zinc-800 pt-12"
        >
          <h3 className="text-lg font-medium text-white mb-2">Still need help?</h3>
          <p className="text-zinc-400 mb-6">
            Our support team is here to assist you via email.
          </p>
          <Button
            asChild
            className="bg-blue-600 hover:bg-blue-700"
          >
            <a href={`mailto:${supportEmail}`}>
              <Mail className="w-4 h-4 mr-2" />
              Email Us at {supportEmail}
            </a>
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
