// Dodo Payments configuration and utilities
import DodoPayments from 'dodopayments'

// Lazy-init Dodo client to avoid errors at build time
let dodoInstance: DodoPayments | null = null
export function getDodo(): DodoPayments {
  if (!dodoInstance) {
    dodoInstance = new DodoPayments({
      bearerToken: process.env.DODO_PAYMENTS_API_KEY || '',
      environment: (process.env.DODO_PAYMENTS_ENVIRONMENT as 'test_mode' | 'live_mode') || 'test_mode',
    })
  }
  return dodoInstance
}

// Pricing tiers for EagleEye
export const PRICING_TIERS = {
  solo: {
    id: 'solo',
    name: 'Solo',
    description: 'For Founders, VPs & Department Heads',
    price: 29,
    annualPrice: 24,
    productId: process.env.DODO_SOLO_PRODUCT_ID,
    annualProductId: process.env.DODO_SOLO_ANNUAL_PRODUCT_ID,
    popular: true,
    trialDays: 7,
    features: [
      'Unlimited integrations',
      'Real-time signal detection',
      'AI-powered daily briefs',
      '90-day signal history',
      'Email & push notifications',
      'Email support',
    ],
    limits: {
      integrations: -1, // unlimited
      historyDays: 90,
      emailDigest: true,
      webPush: true,
      aiInsights: true,
    },
  },
  team: {
    id: 'team',
    name: 'Team',
    description: 'For growing teams & departments',
    price: 79,
    annualPrice: 66,
    productId: process.env.DODO_TEAM_PRODUCT_ID,
    annualProductId: process.env.DODO_TEAM_ANNUAL_PRODUCT_ID,
    popular: false,
    trialDays: 7,
    features: [
      'Everything in Solo',
      'Up to 10 team members',
      'Team dashboard & analytics',
      'Shared priorities view',
      '1-year signal history',
      'Integration requests',
    ],
    limits: {
      integrations: -1,
      historyDays: 365,
      teamMembers: 10,
      emailDigest: true,
      webPush: true,
      aiInsights: true,
      teamDashboard: true,
    },
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For larger organizations',
    price: null,
    annualPrice: null,
    productId: null, // Custom pricing
    annualProductId: null,
    popular: false,
    trialDays: 14,
    features: [
      'Everything in Team',
      'Unlimited team members',
      'SSO / SAML authentication',
      'Custom AI training',
      'On-premise deployment',
      'SLA available',
    ],
    limits: {
      integrations: -1,
      historyDays: -1, // unlimited
      teamMembers: -1, // unlimited
      emailDigest: true,
      webPush: true,
      aiInsights: true,
      teamDashboard: true,
      sso: true,
      customAI: true,
    },
  },
} as const

export type PricingTier = keyof typeof PRICING_TIERS

// Get tier by product ID
export function getTierFromProductId(productId: string): PricingTier | null {
  for (const [key, tier] of Object.entries(PRICING_TIERS)) {
    if (tier.productId === productId || (tier.annualProductId && tier.annualProductId === productId)) {
      return key as PricingTier
    }
  }
  return null
}

// Create checkout URL for a tier
export function getCheckoutUrl(tier: PricingTier, annual: boolean = false): string {
  const tierConfig = PRICING_TIERS[tier]
  const productId = annual ? tierConfig.annualProductId : tierConfig.productId
  
  if (!productId) {
    throw new Error(`No product ID configured for tier: ${tier}`)
  }
  
  return `/api/checkout?productId=${productId}`
}
