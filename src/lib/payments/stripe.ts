// Stripe payment configuration and utilities
import Stripe from 'stripe'

// Lazy-init Stripe to avoid errors at build time when env vars aren't available
let stripeInstance: Stripe | null = null
function getStripe(): Stripe {
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2026-01-28.clover',
      typescript: true,
    })
  }
  return stripeInstance
}

// Pricing tiers for EagleEye - No free tier, only 7-day trial then paid
export const PRICING_TIERS = {
  founder: {
    id: 'founder',
    name: 'Solo',
    description: 'For Founders, VPs & Department Heads',
    price: 29,
    priceId: process.env.STRIPE_FOUNDER_PRICE_ID,
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
    priceId: process.env.STRIPE_TEAM_PRICE_ID,
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
      emailDigest: true,
      slackDM: true,
      webPush: true,
      aiInsights: true,
      teamMembers: 10,
    },
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For larger organizations',
    price: null, // Custom pricing
    priceId: null,
    trialDays: 0, // No trial for enterprise - custom onboarding
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
      emailDigest: true,
      slackDM: true,
      webPush: true,
      aiInsights: true,
      teamMembers: -1,
    },
  },
}

export type PricingTier = keyof typeof PRICING_TIERS

/**
 * Create a Stripe checkout session for subscription
 */
export async function createCheckoutSession({
  priceId,
  customerId,
  customerEmail,
  successUrl,
  cancelUrl,
  trialDays,
  metadata,
}: {
  priceId: string
  customerId?: string
  customerEmail?: string
  successUrl: string
  cancelUrl: string
  trialDays?: number
  metadata?: Record<string, string>
}): Promise<Stripe.Checkout.Session> {
  const sessionConfig: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
    subscription_data: {
      metadata,
      // Add trial period (7 days) - card required upfront, charged after trial ends
      ...(trialDays && { trial_period_days: trialDays }),
    },
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    tax_id_collection: {
      enabled: true,
    },
    // ALWAYS collect payment method upfront for trials (Netflix/Spotify model)
    // Card is stored, first charge happens after trial_period_days
    payment_method_collection: 'always',
  }

  // Use existing customer or create by email
  if (customerId) {
    sessionConfig.customer = customerId
  } else if (customerEmail) {
    sessionConfig.customer_email = customerEmail
  }

  return getStripe().checkout.sessions.create(sessionConfig)
}

/**
 * Create a customer portal session for managing subscription
 */
export async function createPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string
  returnUrl: string
}): Promise<Stripe.BillingPortal.Session> {
  return getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
}

/**
 * Get subscription details
 */
export async function getSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription | null> {
  try {
    return await getStripe().subscriptions.retrieve(subscriptionId)
  } catch (error) {
    console.error('Failed to get subscription:', error)
    return null
  }
}

/**
 * Cancel subscription at period end
 */
export async function cancelSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return getStripe().subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  })
}

/**
 * Resume a cancelled subscription
 */
export async function resumeSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return getStripe().subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  })
}

/**
 * Create or retrieve Stripe customer
 */
export async function getOrCreateCustomer({
  email,
  name,
  metadata,
}: {
  email: string
  name?: string
  metadata?: Record<string, string>
}): Promise<Stripe.Customer> {
  // Check if customer exists
  const existingCustomers = await getStripe().customers.list({
    email,
    limit: 1,
  })

  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0]
  }

  // Create new customer
  return getStripe().customers.create({
    email,
    name,
    metadata,
  })
}

/**
 * Get tier from price ID
 */
export function getTierFromPriceId(priceId: string): PricingTier | null {
  for (const [tier, config] of Object.entries(PRICING_TIERS)) {
    if (config.priceId === priceId) {
      return tier as PricingTier
    }
  }
  return null
}

/**
 * Verify webhook signature
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET not configured')
  }
  return getStripe().webhooks.constructEvent(payload, signature, webhookSecret)
}

export { getStripe }
