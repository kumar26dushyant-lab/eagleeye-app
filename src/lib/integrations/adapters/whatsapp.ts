/**
 * WhatsApp Business API Integration Adapter
 * 
 * Uses the official WhatsApp Business Cloud API (Meta)
 * Documentation: https://developers.facebook.com/docs/whatsapp/cloud-api
 * 
 * SETUP REQUIREMENTS:
 * 1. Create Meta Business Account
 * 2. Create WhatsApp Business App in Meta Developer Portal
 * 3. Get Phone Number ID and Access Token
 * 4. Configure Webhook for incoming messages
 * 
 * Environment Variables Needed:
 * - WHATSAPP_ACCESS_TOKEN: Permanent access token from Meta
 * - WHATSAPP_PHONE_NUMBER_ID: Your WhatsApp Business phone number ID
 * - WHATSAPP_BUSINESS_ACCOUNT_ID: Your Business Account ID
 * - WHATSAPP_WEBHOOK_VERIFY_TOKEN: Token for webhook verification
 */

// WhatsApp-specific types
interface WhatsAppConfig {
  accessToken?: string
  phoneNumberId?: string
  businessAccountId?: string
}

interface WhatsAppConnectionStatus {
  connected: boolean
  error?: string
  setup_url?: string
  account_name?: string
  phone_number?: string
  quality_rating?: string
}

interface WhatsAppNormalizedItem {
  id: string
  source: string
  source_id: string
  type: string
  title: string
  description: string
  author: string
  author_id: string
  created_at: string
  updated_at: string
  url: string | null
  priority: 'high' | 'medium' | 'low'
  metadata: Record<string, unknown>
}

// WhatsApp Business API base URL
const WHATSAPP_API_BASE = 'https://graph.facebook.com/v18.0'

// Signal keywords for business context
const URGENT_KEYWORDS = [
  'urgent', 'asap', 'immediately', 'emergency', 'critical',
  'today', 'now', 'right away', 'as soon as possible',
  'jaldi', 'turant', 'abhi', // Hindi
  'urgente', 'ahora', // Spanish
]

const ORDER_KEYWORDS = [
  'order', 'purchase', 'buy', 'payment', 'invoice', 'bill',
  'delivery', 'shipping', 'dispatch', 'track',
  'refund', 'return', 'exchange', 'cancel order',
  'cod', 'cash on delivery', 'upi', 'gpay', 'phonepe',
  'price', 'cost', 'rate', 'quote', 'quotation',
  'booking', 'appointment', 'reserve', 'book',
]

const COMPLAINT_KEYWORDS = [
  'complaint', 'problem', 'issue', 'not working', 'broken',
  'disappointed', 'unhappy', 'bad', 'worst', 'terrible',
  'waiting', 'delayed', 'late', 'where is my', 'still waiting',
  'scam', 'fraud', 'cheated', 'fake', 'wrong', 'damaged',
  'missing', 'never received', 'did not receive', 'not delivered',
  'failed', 'error', 'stuck', 'help me', 'need help',
]

const POSITIVE_KEYWORDS = [
  'thank you', 'thanks', 'great', 'excellent', 'amazing',
  'happy', 'satisfied', 'good job', 'well done', 'appreciated',
  'recommend', 'best', 'love it', 'perfect',
]

// Questions that need responses (SMB-relevant)
const QUESTION_KEYWORDS = [
  'how much', 'what is', 'do you have', 'is it', 'can i', 'can you',
  'when will', 'where is', 'why is', 'how do', 'how can',
  'available', 'stock', 'open', 'closed', 'timing', 'hours',
  '?', // Any question mark indicates a question needing response
]

// Greetings to SKIP (don't need action)
const GREETING_PATTERNS = [
  /^hi+$/i, /^hello+$/i, /^hey+$/i, /^hii+$/i,
  /^good\s*(morning|afternoon|evening|night)$/i,
  /^how\s*are\s*you\??$/i, /^what'?s?\s*up\??$/i,
  /^ok+$/i, /^okay+$/i, /^k+$/i, /^yes+$/i, /^no+$/i,
  /^thanks?$/i, /^thank\s*you$/i, /^ty$/i, /^thx$/i,
  /^bye+$/i, /^goodbye$/i, /^see\s*you$/i,
  /^👋|👍|🙏|😊|🙂|😀$/,
]

export interface WhatsAppMessage {
  id: string
  from: string // Phone number
  timestamp: string
  type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'sticker' | 'location' | 'contacts'
  text?: {
    body: string
  }
  context?: {
    from: string
    id: string // Reply to message ID
  }
  // Contact info if we have it
  contact_name?: string
}

export interface WhatsAppConversation {
  id: string
  name: string // Contact or Group name
  type: 'individual' | 'group'
  participant_count?: number
  last_message_at: string
  unread_count: number
}

export interface WhatsAppWebhookPayload {
  object: 'whatsapp_business_account'
  entry: Array<{
    id: string
    changes: Array<{
      value: {
        messaging_product: 'whatsapp'
        metadata: {
          display_phone_number: string
          phone_number_id: string
        }
        contacts?: Array<{
          profile: { name: string }
          wa_id: string
        }>
        messages?: WhatsAppMessage[]
        statuses?: Array<{
          id: string
          status: 'sent' | 'delivered' | 'read' | 'failed'
          timestamp: string
          recipient_id: string
        }>
      }
      field: string
    }>
  }>
}

class WhatsAppAdapter {
  id = 'whatsapp'
  name = 'WhatsApp Business'
  icon = '📱'
  description = 'Business chats, customer messages, group discussions'
  
  // WhatsApp uses webhook-based auth, not OAuth
  // User provides their Meta Business credentials
  authType: 'oauth' | 'api_key' | 'webhook' = 'webhook'
  
  private accessToken: string | null = null
  private phoneNumberId: string | null = null
  private businessAccountId: string | null = null

  /**
   * Initialize with credentials
   */
  async connect(config: WhatsAppConfig): Promise<WhatsAppConnectionStatus> {
    try {
      this.accessToken = config.accessToken || process.env.WHATSAPP_ACCESS_TOKEN || null
      this.phoneNumberId = config.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID || null
      this.businessAccountId = config.businessAccountId || process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || null

      if (!this.accessToken || !this.phoneNumberId) {
        return {
          connected: false,
          error: 'Missing WhatsApp Business API credentials',
          setup_url: 'https://business.facebook.com/wa/manage/phone-numbers/',
        }
      }

      // Verify connection by fetching phone number info
      const response = await fetch(
        `${WHATSAPP_API_BASE}/${this.phoneNumberId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      )

      if (!response.ok) {
        const error = await response.json()
        return {
          connected: false,
          error: error.error?.message || 'Failed to connect to WhatsApp Business API',
        }
      }

      const phoneInfo = await response.json()

      return {
        connected: true,
        account_name: phoneInfo.verified_name || phoneInfo.display_phone_number,
        phone_number: phoneInfo.display_phone_number,
        quality_rating: phoneInfo.quality_rating,
      }
    } catch (error: any) {
      return {
        connected: false,
        error: error.message || 'Failed to connect to WhatsApp',
      }
    }
  }

  async disconnect(): Promise<void> {
    this.accessToken = null
    this.phoneNumberId = null
    this.businessAccountId = null
  }

  async testConnection(): Promise<boolean> {
    if (!this.accessToken || !this.phoneNumberId) return false

    try {
      const response = await fetch(
        `${WHATSAPP_API_BASE}/${this.phoneNumberId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      )
      return response.ok
    } catch {
      return false
    }
  }

  /**
   * Process incoming webhook messages and extract signals
   * This is called when WhatsApp sends us a webhook
   * 
   * For WhatsApp Business (SMBs): We're SELECTIVE, not exhaustive
   * - Surface: Complaints, orders, urgent requests, support needs
   * - Skip: Casual greetings, "hi how are you", simple thanks
   * 
   * SMBs have limited time - only show what NEEDS action
   */
  async processWebhook(payload: WhatsAppWebhookPayload): Promise<WhatsAppNormalizedItem[]> {
    const items: WhatsAppNormalizedItem[] = []

    for (const entry of payload.entry) {
      for (const change of entry.changes) {
        const { value } = change
        
        if (!value.messages) continue

        for (const message of value.messages) {
          if (message.type !== 'text' || !message.text?.body) continue

          const contactName = value.contacts?.find(c => c.wa_id === message.from)?.profile?.name || message.from
          const messageText = message.text.body

          // Analyze message for priority scoring
          const signals = this.analyzeMessage(messageText)
          
          // IMPORTANT: Only surface ACTIONABLE signals
          // Skip generic greetings, casual messages, simple "thanks"
          if (!signals.isSignal) {
            console.log(`[WhatsApp] Skipping non-signal message: "${messageText.substring(0, 50)}..."`)
            continue
          }

          // Also skip very short messages that are likely greetings
          if (messageText.length < 15 && signals.signalType === 'none') {
            console.log(`[WhatsApp] Skipping short greeting: "${messageText}"`)
            continue
          }

          items.push({
            id: `whatsapp-${message.id}`,
            source: 'whatsapp',
            source_id: message.id,
            type: signals.type,
            title: this.generateTitle(messageText, signals),
            description: messageText.substring(0, 500),
            author: contactName,
            author_id: message.from,
            created_at: new Date(parseInt(message.timestamp) * 1000).toISOString(),
            updated_at: new Date(parseInt(message.timestamp) * 1000).toISOString(),
            url: null, // WhatsApp doesn't have web URLs
            priority: signals.priority,
            metadata: {
              phone_number: message.from,
              contact_name: contactName,
              signal_type: signals.signalType,
              keywords_matched: signals.keywordsMatched,
              is_reply: !!message.context,
              reply_to: message.context?.id,
            },
          })
        }
      }
    }

    return items
  }

  /**
   * Analyze a message for business signals
   * SMB-focused: Prioritize customer issues that need ACTION
   */
  private analyzeMessage(text: string): {
    isSignal: boolean
    type: 'problem' | 'positive' | 'neutral' | 'task'
    signalType: string
    priority: 'high' | 'medium' | 'low'
    keywordsMatched: string[]
  } {
    const textLower = text.toLowerCase().trim()
    const keywordsMatched: string[] = []

    // FIRST: Skip pure greetings (no action needed)
    if (GREETING_PATTERNS.some(pattern => pattern.test(textLower))) {
      return {
        isSignal: false,
        type: 'neutral',
        signalType: 'greeting',
        priority: 'low',
        keywordsMatched: [],
      }
    }

    // Skip very short messages (likely greetings or acknowledgments)
    if (textLower.length < 10 && !textLower.includes('?')) {
      return {
        isSignal: false,
        type: 'neutral',
        signalType: 'short_message',
        priority: 'low',
        keywordsMatched: [],
      }
    }

    // Check for urgent messages
    const urgentMatches = URGENT_KEYWORDS.filter(kw => textLower.includes(kw))
    if (urgentMatches.length > 0) {
      keywordsMatched.push(...urgentMatches)
    }

    // Check for complaints (highest priority - customer at risk!)
    const complaintMatches = COMPLAINT_KEYWORDS.filter(kw => textLower.includes(kw))
    if (complaintMatches.length > 0) {
      return {
        isSignal: true,
        type: 'problem',
        signalType: 'complaint',
        priority: 'high',
        keywordsMatched: [...keywordsMatched, ...complaintMatches],
      }
    }

    // Check for order-related messages (revenue opportunity!)
    const orderMatches = ORDER_KEYWORDS.filter(kw => textLower.includes(kw))
    if (orderMatches.length > 0) {
      const isUrgent = urgentMatches.length > 0
      return {
        isSignal: true,
        type: 'task',
        signalType: 'order',
        priority: isUrgent ? 'high' : 'medium',
        keywordsMatched: [...keywordsMatched, ...orderMatches],
      }
    }

    // Check for questions (need response)
    const isQuestion = textLower.includes('?') || QUESTION_KEYWORDS.some(kw => textLower.includes(kw))
    if (isQuestion) {
      return {
        isSignal: true,
        type: 'task',
        signalType: 'question',
        priority: urgentMatches.length > 0 ? 'high' : 'medium',
        keywordsMatched: [...keywordsMatched, 'question'],
      }
    }

    // Check for positive feedback (good for morale, lower priority)
    const positiveMatches = POSITIVE_KEYWORDS.filter(kw => textLower.includes(kw))
    if (positiveMatches.length > 0 && textLower.length > 20) {
      // Only count as signal if it's a meaningful message, not just "thanks"
      return {
        isSignal: true,
        type: 'positive',
        signalType: 'appreciation',
        priority: 'low',
        keywordsMatched: positiveMatches,
      }
    }

    // Urgent but no specific category
    if (urgentMatches.length > 0) {
      return {
        isSignal: true,
        type: 'task',
        signalType: 'urgent_request',
        priority: 'high',
        keywordsMatched: urgentMatches,
      }
    }

    // Not a signal - skip it
    return {
      isSignal: false,
      type: 'neutral',
      signalType: 'casual',
      priority: 'low',
      keywordsMatched: [],
    }
  }

  /**
   * Generate a concise title for the signal
   */
  private generateTitle(text: string, signals: { signalType: string; keywordsMatched: string[] }): string {
    const prefix: Record<string, string> = {
      complaint: '🚨 Customer Issue',
      order: '📦 Order/Inquiry',
      question: '❓ Question',
      appreciation: '🌟 Happy Customer',
      urgent_request: '⚡ Urgent Request',
      none: '💬 Message',
      casual: '💬 Message',
    }

    const icon = prefix[signals.signalType] || '💬 Message'

    // Extract first meaningful sentence
    const firstSentence = text.split(/[.!?\n]/)[0].trim()
    const truncated = firstSentence.length > 50 
      ? firstSentence.substring(0, 47) + '...' 
      : firstSentence

    return `${icon}: ${truncated}`
  }

  /**
   * Fetch recent messages (if using polling instead of webhooks)
   * Note: WhatsApp Cloud API primarily uses webhooks, but we can store
   * messages in our DB and fetch them for the brief
   */
  async fetchItems(since?: Date): Promise<WhatsAppNormalizedItem[]> {
    // WhatsApp Cloud API doesn't support fetching message history
    // Messages come in via webhooks and should be stored in DB
    // This method would fetch from our stored messages
    
    console.log('[WhatsApp] fetchItems called - messages come via webhooks')
    return []
  }

  /**
   * Get business profile info
   */
  async getBusinessProfile(): Promise<{
    name: string
    description: string
    address: string
    email: string
    websites: string[]
  } | null> {
    if (!this.accessToken || !this.phoneNumberId) return null

    try {
      const response = await fetch(
        `${WHATSAPP_API_BASE}/${this.phoneNumberId}/whatsapp_business_profile?fields=about,address,description,email,websites,vertical`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      )

      if (!response.ok) return null

      const data = await response.json()
      return data.data?.[0] || null
    } catch {
      return null
    }
  }

  /**
   * Send a message (for future use - notifications back to WhatsApp)
   */
  async sendMessage(to: string, text: string): Promise<boolean> {
    if (!this.accessToken || !this.phoneNumberId) return false

    try {
      const response = await fetch(
        `${WHATSAPP_API_BASE}/${this.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to,
            type: 'text',
            text: { body: text },
          }),
        }
      )

      return response.ok
    } catch {
      return false
    }
  }
}

export const whatsappAdapter = new WhatsAppAdapter()
export default whatsappAdapter
