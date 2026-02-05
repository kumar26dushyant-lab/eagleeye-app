# EagleEye Technical Documentation

> **Version:** 1.0  
> **Last Updated:** February 5, 2026  
> **Status:** Production

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Authentication & User Management](#2-authentication--user-management)
3. [Payment Integration (Dodo Payments)](#3-payment-integration-dodo-payments)
4. [Third-Party Integrations](#4-third-party-integrations)
5. [Signal Processing Engine](#5-signal-processing-engine)
6. [Email & Notifications System](#6-email--notifications-system)
7. [API Reference](#7-api-reference)
8. [Database Schema](#8-database-schema)
9. [Environment Variables](#9-environment-variables)

---

## 1. Project Overview

### 1.1 What is EagleEye?

EagleEye is a **decision-intelligence dashboard** for founders, VPs, and department heads. It connects to work tools (Slack, Asana, Jira, etc.) and surfaces only the signals that truly need attention, filtering out noise and presenting actionable insights.

### 1.2 Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16.1.5 (App Router) |
| **Language** | TypeScript 5.x |
| **Runtime** | React 19.2.3 |
| **Auth & Database** | Supabase (Auth + PostgreSQL) |
| **Payments** | Dodo Payments (primary), Stripe (legacy support) |
| **AI/LLM** | Google Gemini 1.5 Flash (primary), OpenAI (fallback) |
| **Email** | Resend |
| **Push Notifications** | Web Push (VAPID) |
| **Styling** | Tailwind CSS 4.x |
| **UI Components** | Radix UI, Framer Motion |
| **Deployment** | Vercel |

### 1.3 Folder Structure

```
eagleeye-app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Auth pages (login, signup, etc.)
│   │   ├── api/                # API routes (73 endpoints)
│   │   ├── dashboard/          # Protected dashboard pages
│   │   └── ...                 # Public pages
│   ├── components/             # React components
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── dashboard/          # Dashboard-specific components
│   │   ├── integrations/       # Integration UI components
│   │   └── ...
│   ├── lib/                    # Core business logic
│   │   ├── supabase/           # Supabase client configs
│   │   ├── payments/           # Payment providers (Dodo, Stripe)
│   │   ├── integrations/       # Integration adapters (Slack, Asana, etc.)
│   │   ├── notifications/      # Push, email, Slack DM
│   │   ├── email/              # Email templates & sending
│   │   ├── trial/              # Trial management
│   │   ├── signals.ts          # Signal detection engine
│   │   ├── importance.ts       # Importance scoring
│   │   └── ai.ts               # AI brief generation
│   └── types/                  # TypeScript types
├── supabase/
│   └── migrations/             # Database migrations
├── public/                     # Static assets, PWA manifest
└── docs/                       # Documentation
```

### 1.4 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                       │
│   Dashboard → Brief View → Integrations → Settings → Billing    │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                          API Layer                               │
│  /api/integrations/*  /api/brief/*  /api/webhooks/*  /api/sync/* │
└─────────────────────────────────────────────────────────────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          ▼                     ▼                     ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Supabase Auth  │  │ Integration Hub │  │   Dodo Payments │
│   + Database    │  │ (Slack, Asana,  │  │    Webhooks     │
│   + RLS         │  │  Jira, etc.)    │  │                 │
└─────────────────┘  └─────────────────┘  └─────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Signal Processing Engine                      │
│   Detection → Classification → Importance Scoring → Surfacing   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Notification Layer                           │
│   Email Digest → Web Push → Slack DM → Realtime Alerts          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Authentication & User Management

### 2.1 Authentication Flow

EagleEye uses **Supabase Auth** with cookie-based session management via `@supabase/ssr`.

#### Flow:
1. User signs up/logs in via `/login` or `/signup`
2. Supabase creates session, sets cookies
3. Middleware validates session on each request
4. Protected routes redirect unauthenticated users to `/login`

### 2.2 Supabase Client Configuration

**Three client types** are used:

#### Browser Client (`src/lib/supabase/client.ts`)
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

#### Server Client (`src/lib/supabase/server.ts`)
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll, setAll } }
  )
}

// Service role client (bypasses RLS)
export async function createServiceClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll, setAll } }
  )
}
```

### 2.3 Middleware (`middleware.ts`)

The middleware handles session refresh and route protection:

```typescript
// Routes that skip middleware entirely:
const skipMiddleware = 
  pathname.startsWith('/api') ||        // API handles own auth
  pathname.startsWith('/reset-password') ||
  pathname.startsWith('/forgot-password') ||
  pathname.startsWith('/auth/confirm')

// Route protection:
if (!user && isDashboardPage) → redirect('/login')
if (user && isAuthPage) → redirect('/dashboard')
```

**Matcher Pattern:**
```typescript
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### 2.4 Protected Routes

| Route Pattern | Protection |
|---------------|------------|
| `/dashboard/*` | Requires authentication |
| `/login`, `/signup` | Redirects authenticated users |
| `/api/*` | API-level auth (handles own validation) |
| `/reset-password` | Public (handles own auth state) |

---

## 3. Payment Integration (Dodo Payments)

### 3.1 Overview

EagleEye uses **Dodo Payments** as the primary payment processor with **Stripe** as legacy fallback.

**Business Model:**
- 7-day free trial (credit card required upfront)
- Auto-charge after trial ends
- Grace period (3 days) for failed payments

### 3.2 Pricing Tiers

| Tier | Monthly | Annual | Product ID Env |
|------|---------|--------|----------------|
| **Solo** | $29 | $24/mo | `DODO_SOLO_PRODUCT_ID` |
| **Team** | $79 | $66/mo | `DODO_TEAM_PRODUCT_ID` |
| **Enterprise** | Custom | Custom | N/A |

### 3.3 Checkout Flow

**Location:** `src/app/api/checkout/route.ts`

```
User clicks "Subscribe" → GET /api/checkout?productId=xxx
                              │
                              ▼
                     Create Dodo checkout session
                              │
                              ▼
                     Redirect to Dodo hosted checkout
                              │
                              ▼
                     User completes payment
                              │
                              ▼
                     Redirect to /checkout/success
                              │
                              ▼
                     Webhook fires (payment.succeeded)
```

**Code:**
```typescript
export async function GET(request: NextRequest) {
  const productId = searchParams.get("productId")?.trim();
  
  const client = getDodoClient();
  const session = await client.checkoutSessions.create({
    product_cart: [{ product_id: productId, quantity: 1 }],
    return_url: returnUrl,
  });
  
  return NextResponse.redirect(session.checkout_url);
}
```

### 3.4 Webhook Handling

**Location:** `src/app/api/webhooks/dodo/route.ts`

**Supported Events:**

| Event | Handler | Action |
|-------|---------|--------|
| `payment.succeeded` | `handlePaymentSucceeded` | Create/update subscription, send confirmation email |
| `payment.failed` | `handlePaymentFailed` | Set grace period, log failure, send warning email |
| `subscription.active` | `handleSubscriptionActive` | Update status to active |
| `subscription.cancelled` | `handleSubscriptionCancelled` | Update status, send cancellation email |
| `subscription.renewed` | `handleSubscriptionRenewed` | Update status to active |
| `refund.succeeded` | `handleRefundSucceeded` | Update status to refunded |

**Payment Failure Flow:**
```
payment.failed webhook
        │
        ▼
Set status = 'payment_failed'
Set grace_period_ends_at = NOW + 3 days
Set account_deletion_scheduled_at = grace_period_ends_at + 1 day
        │
        ▼
Log to payment_failure_logs table
        │
        ▼
Send payment failed email with retry date
```

### 3.5 Dodo Client Configuration

**Location:** `src/lib/payments/dodo.ts`

```typescript
export function getDodo(): DodoPayments {
  return new DodoPayments({
    bearerToken: process.env.DODO_PAYMENTS_API_KEY || '',
    environment: (process.env.DODO_PAYMENTS_ENVIRONMENT as 'test_mode' | 'live_mode') || 'test_mode',
  });
}
```

### 3.6 Subscription Management

**Database Fields (subscriptions table):**
```sql
- status: 'trialing' | 'active' | 'payment_failed' | 'cancelled' | 'refunded'
- tier: 'trial' | 'founder' | 'team' | 'enterprise'
- dodo_customer_id, dodo_subscription_id, dodo_payment_id
- payment_failed_at, grace_period_ends_at
- payment_retry_count, last_payment_error
```

---

## 4. Third-Party Integrations

### 4.1 Unified Integration Layer (UIL)

EagleEye normalizes all integration data to a **UnifiedSignal** format:

**Location:** `src/lib/integrations/types.ts`

```typescript
export interface UnifiedSignal {
  id: string                    // Unique ID (source-prefixed)
  source: IntegrationSource     // 'slack' | 'asana' | 'jira' | etc.
  sourceId: string              // Original ID in source system
  category: SignalCategory      // 'commitment' | 'deadline' | 'blocker' | etc.
  confidence: number            // 0-1 confidence score
  title: string                 // Max 100 chars
  snippet: string               // Max 300 chars
  owner?: string
  ownerEmail?: string
  sender?: string
  timestamp: string             // ISO timestamp
  deadline?: string
  url: string                   // Direct link to source
  channel?: string
  metadata: Record<string, unknown>
}
```

### 4.2 Integration Adapters

Each integration implements the `IntegrationAdapter` interface:

```typescript
interface IntegrationAdapter {
  source: IntegrationSource
  checkHealth(): Promise<IntegrationHealth>
  fetchSignals(since?: Date): Promise<UnifiedSignal[]>
  getAuthUrl?(redirectUri: string): string
  handleCallback?(code: string): Promise<{ accessToken: string }>
}
```

### 4.3 Slack Integration

**Location:** `src/lib/integrations/adapters/slack.ts`

**Required Scopes (READ-ONLY):**
```
channels:history   - Read public channel messages
channels:read      - List channels
channels:join      - Join public channels
users:read         - Get user info
users:read.email   - Get user emails
team:read          - Get workspace info
```

**NOT Requested:** `im:history` (DMs), `groups:history` (private channels), write scopes

**OAuth Flow:**
1. `GET /api/integrations/slack/oauth` → Generate state, redirect to Slack
2. Slack redirects to `/api/integrations/slack/callback`
3. Exchange code for token, store in `integrations` table

**Signal Classification:**
```typescript
// High confidence patterns
'blocked', 'stuck', "can't proceed" → 'blocker' (0.9)
'approve', 'decision needed' → 'decision' (0.85)
'urgent', 'asap', 'critical' → 'escalation' (0.85)

// Noise filtering (messages that are skipped)
- Under 4 words (unless urgency keywords)
- Pure greetings: "hi", "hello", "good morning"
- Acknowledgements: "ok", "thanks", "cool"
- Emoji-only messages
```

### 4.4 Asana Integration

**Location:** `src/lib/integrations/adapters/asana.ts`, `src/lib/asana.ts`

**OAuth Flow:**
1. `GET /api/asana/connect` → Redirect to Asana OAuth
2. `GET /api/asana/callback` → Exchange code, get workspace, store token

**Task Classification:**
```typescript
// Overdue tasks → 'deadline' (0.95)
// Due within 3 days → 'deadline' (0.85)
// Tags include 'blocked' → 'blocker' (0.9)
```

### 4.5 Jira Integration

**Location:** `src/lib/jira.ts`

**OAuth Scopes:** Atlassian Cloud OAuth 2.0

**Key Functions:**
```typescript
getJiraCloudId(accessToken): JiraCloud[]       // Get accessible resources
getJiraIssues(accessToken, cloudId): JiraIssue[]
getJiraWatchedIssues(accessToken, cloudId): JiraIssue[]
normalizeJiraIssue(issue, cloudUrl)            // Convert to standard format
```

**Urgency Mapping:**
- Overdue → High
- Due within 2 days → High
- Due within 7 days → Medium
- Priority: Highest/High/Blocker/Critical → High

### 4.6 ClickUp Integration

**Location:** `src/lib/clickup.ts`

**OAuth Scopes:** Default ClickUp API access

**Key Functions:**
```typescript
getClickUpWorkspaces(accessToken): ClickUpWorkspace[]
getClickUpTasks(accessToken, teamId): ClickUpTask[]
```

**Hierarchy:** Team → Space → Folder → List → Tasks

### 4.7 Microsoft Teams Integration

**Location:** `src/lib/teams.ts`

**OAuth:** Microsoft Graph API (OAuth 2.0)

**Key Functions:**
```typescript
getTeamsJoinedTeams(accessToken): TeamsTeam[]
getTeamsChannels(accessToken, teamId): TeamsChannel[]
getTeamsChannelMessages(accessToken, teamId, channelId): TeamsMessage[]
getTeamsChats(accessToken): TeamsChat[]
```

### 4.8 Linear Integration

**Location:** `src/lib/integrations/linear.ts`

**API:** GraphQL

**Key Functions:**
```typescript
getCurrentLinearUser(token): LinearUser
getLinearTeams(token): LinearTeam[]
getMyLinearIssues(token): LinearIssue[]
getTeamIssues(teamId, token): LinearIssue[]
```

### 4.9 WhatsApp Integration

**Location:** `src/app/api/whatsapp/*`

**Status:** Business API integration for receiving customer messages

---

## 5. Signal Processing Engine

### 5.1 Signal Detection

**Location:** `src/lib/signals.ts`

The engine detects multiple signal types from work items and messages:

**Keyword Categories:**

| Category | Keywords |
|----------|----------|
| **Blocking** | blocked, waiting, pending, on hold, depends, stuck |
| **Escalation** | urgent, asap, critical, escalat, emergency, blocker, p0, p1 |
| **Appreciation** | thanks, great job, kudos, awesome, crushed it, nailed it |
| **Milestone** | launched, shipped, completed, released, milestone, deployed |
| **Aggression** | stupid, idiot, incompetent, unacceptable, disaster |
| **Harassment** | hate, worthless, threatening, harass, discriminat |
| **Conflict** | disagree strongly, absolutely wrong, you always, fed up |

### 5.2 Signal Flags

```typescript
interface SignalFlags {
  // Problem signals
  hasCommitment: boolean       // Owner + due date
  hasTimePressure: boolean     // Due within 3 days
  hasMovementGap: boolean      // No activity 3+ days when due within 7
  hasDependency: boolean       // Blocked status
  hasEscalation: boolean       // Urgency keywords
  
  // Positive signals
  hasAppreciation: boolean
  hasMilestone: boolean
  hasPositiveFeedback: boolean
  
  // Negative behavior signals
  hasAggression: boolean
  hasHarassment: boolean
  hasConflict: boolean
  
  // Discussion signals
  isLongDiscussion: boolean    // 10+ messages OR 3+ participants
  discussionParticipantCount: number
  discussionMessageCount: number
}
```

### 5.3 Surfacing Rules

**Core Rule:**
```
Surface IF:
  (commitment AND time_pressure AND (movement_gap OR dependency))
  OR escalation
  OR positive_signal (appreciation, milestone, feedback)
  OR negative_signal (harassment, aggression, conflict)
  OR long_discussion
```

**Signal Types & Priorities:**

| Priority | Type | Example Reason |
|----------|------|----------------|
| 1 (Highest) | `negative` | 🚨 Harassment detected |
| 2 | `negative` | ⚠️ Aggressive language |
| 3 | `negative` | ⚡ Conflict escalation |
| 4 | `discussion` | 💬 Long discussion (X messages) |
| 5 | `positive` | 🎉 Milestone achieved! |
| 6 | `positive` | 👏 Team appreciation |
| 7 | `problem` | Escalation detected |
| 8 | `problem` | Deadline approaching with no activity |

### 5.4 Importance Scoring

**Location:** `src/lib/importance.ts`

```typescript
function calculateImportance(item): number {
  let score = 0
  
  // Due date scoring (max 60 points)
  if (overdue) score += 40 + min(overdayDays * 2, 20)
  else if (dueToday) score += 35
  else if (dueTomorrow) score += 28
  else if (dueIn3Days) score += 15
  
  // Activity gap (max 25 points)
  if (noActivityFor7Days) score += 25
  else if (noActivityFor5Days) score += 20
  else if (noActivityFor3Days) score += 15
  
  // Flags
  if (hasDependency) score += 15
  if (hasEscalation) score += 20
  
  return min(score, 100)
}
```

### 5.5 Intent Modes

| Mode | Threshold | Description |
|------|-----------|-------------|
| 🏖️ **Calm** | 80 | Emergencies only (vacation mode) |
| 🚗 **On-the-Go** | 60 | Critical + celebrations |
| 💼 **Work** | 40 | Full actionable view |
| 🎯 **Focus** | 20 | Deep work, only blockers |

### 5.6 AI Brief Generation

**Location:** `src/lib/ai.ts`

**Model:** Google Gemini 1.5 Flash

```typescript
async function generateBriefText(input: BriefInput): Promise<string> {
  const model = gemini.getGenerativeModel({ 
    model: 'gemini-1.5-flash',
    generationConfig: {
      maxOutputTokens: 300,
      temperature: 0.7,
    },
  });
  
  // Generate flowing prose suitable for audio playback
  // No bullet points or lists
}
```

**Fallback:** If Gemini unavailable, generates simple template-based brief.

---

## 6. Email & Notifications System

### 6.1 Email Service

**Location:** `src/lib/email/index.ts`

**Provider:** Resend

**Available Email Functions:**
```typescript
sendWelcomeEmail({ to, userName, confirmationLink })
sendPaymentConfirmationEmail({ to, planName, amount, loginLink })
sendSupportTicketConfirmation({ to, ticketId, subject })
sendSupportTicketToAdmin({ ticketId, subject, message, userEmail })
sendIntegrationConnectedEmail({ to, integrationName })
sendIntegrationDisconnectedEmail({ to, integrationName, reason })
sendIntegrationFailedEmail({ to, integrationName, errorDetails })
sendTrialEndingEmail({ to, daysRemaining })
sendSubscriptionCancelledEmail({ to })
```

### 6.2 Email Templates

**Location:** `src/lib/email/templates.ts`

All templates use a consistent dark theme:
- Background: `#0a0a0a`
- Accent: `#22d3ee` (cyan)
- Text: `#fafafa` (white), `#a1a1aa` (gray)

**Sender Addresses:**
- General: `EagleEye <noreply@eagleeye.work>`
- Billing: `EagleEye <billing@eagleeye.work>`
- Support: `EagleEye Support <support@eagleeye.work>`
- Alerts: `EagleEye Alerts <alerts@eagleeye.work>`
- Briefs: `EagleEye <brief@eagleeye.work>`

### 6.3 Web Push Notifications

**Location:** `src/lib/notifications/web-push.ts`

**Technology:** Web Push with VAPID keys

```typescript
interface PushNotification {
  title: string
  body: string
  icon?: string          // Default: /icon-192.png
  badge?: string         // Default: /badge-72.png
  tag?: string
  url?: string
  urgency?: 'very-low' | 'low' | 'normal' | 'high'
}

// Functions
sendPushNotification(subscription, notification)
sendUrgentAlert(subscription, title, body, url)
sendBlockerAlert(subscription, taskTitle, blockerReason)
```

### 6.4 Email Digest

**Location:** `src/lib/notifications/email-digest.ts`

**Frequencies:** Daily, Weekly, Realtime

**Content:**
```typescript
interface SignalSummary {
  blockers: number
  decisions: number
  mentions: number
  overdueTasks: number
  topItems: Array<{
    source: string
    title: string
    urgency: 'high' | 'medium' | 'low'
    url: string
  }>
}
```

**Subject Line Logic:**
- Urgent items: `🔴 X urgent items need your attention`
- Decisions only: `📋 X decisions waiting for you`
- All clear: `✅ Your daily brief - all clear!`

### 6.5 Slack DM Notifications

**Location:** `src/lib/notifications/slack-dm.ts`

Sends brief summaries directly to users in Slack using Block Kit:

```typescript
// Opens DM channel with user
const dmResponse = await client.conversations.open({ users: slackUserId })

// Sends rich Block Kit message with:
// - Header: "🦅 EagleEye Brief"
// - Stats: blockers, overdue, decisions, mentions
// - Top items list with urgency indicators
// - Action buttons: "Open Dashboard", "Settings"
```

### 6.6 Notification Triggers

**Location:** `src/lib/notifications/triggers.ts`

**Event Types:**
- `blocker` - Blocked task detected
- `overdue` - Task overdue
- `urgent_mention` - Urgent @mention
- `escalation` - Issue escalated
- `milestone` - Milestone achieved

**Trigger Flow:**
```
Event occurs → Check user's notification_settings
                     │
       ┌─────────────┴─────────────┐
       ▼                           ▼
Push enabled?                 Email enabled?
       │                           │
       ▼                           ▼
Send to all devices       Send urgent email
(cleanup expired subs)    (for blockers/escalations)
```

---

## 7. API Reference

### 7.1 Authentication APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/callback` | GET | Supabase auth callback handler |

### 7.2 User APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/user/data` | GET | Get user profile data |
| `/api/user/subscription` | GET | Get subscription status |
| `/api/settings` | GET/PUT | User settings CRUD |
| `/api/settings/notifications` | GET/PUT | Notification preferences |

### 7.3 Integration APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/integrations` | GET | List all integrations |
| `/api/integrations/status` | GET | Health status of integrations |
| `/api/integrations/connect` | POST | Generic connect endpoint |
| `/api/integrations/disconnect` | POST | Disconnect integration |

#### Slack
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/integrations/slack/oauth` | GET | Start OAuth flow |
| `/api/integrations/slack/callback` | GET | OAuth callback |
| `/api/integrations/slack/channels` | GET | List channels |
| `/api/integrations/slack/join-channels` | POST | Join public channels |
| `/api/integrations/slack/sync` | POST | Trigger sync |
| `/api/integrations/slack/test` | GET | Test connection |

#### Asana
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/asana/connect` | GET | Start OAuth flow |
| `/api/asana/callback` | GET | OAuth callback |
| `/api/asana/sync` | POST | Trigger sync |
| `/api/integrations/asana/test` | GET | Test connection |
| `/api/integrations/asana/sync` | POST | Sync tasks |

#### Jira
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/jira/connect` | GET | Start OAuth flow |
| `/api/jira/callback` | GET | OAuth callback |
| `/api/jira/sync` | POST | Trigger sync |

#### ClickUp
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/clickup/connect` | GET | Start OAuth flow |
| `/api/clickup/callback` | GET | OAuth callback |
| `/api/clickup/sync` | POST | Trigger sync |

#### Teams
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/teams/connect` | GET | Start OAuth flow |
| `/api/teams/callback` | GET | OAuth callback |
| `/api/teams/channels` | GET | List teams/channels |

#### WhatsApp
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/whatsapp/connect` | POST | Connect WhatsApp Business |
| `/api/whatsapp/webhook` | POST | Incoming message webhook |

#### Linear
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/integrations/linear/sync` | POST | Sync issues |
| `/api/integrations/linear/test` | GET | Test connection |

### 7.4 Brief APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/brief/generate` | GET | Generate/fetch today's brief |
| `/api/brief/refresh` | POST | Force regenerate brief |
| `/api/brief/audio` | GET | Get audio version of brief |

### 7.5 Signal APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/signals` | GET | Get detected signals |
| `/api/unified` | GET | Get unified signals from all sources |
| `/api/data` | GET | Get dashboard data |

### 7.6 Payment APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/checkout` | GET/POST | Create checkout session |
| `/api/products` | GET | List available products |
| `/api/payments/checkout` | POST | Stripe checkout (legacy) |
| `/api/payments/webhook` | POST | Stripe webhook (legacy) |
| `/api/payments/cancel` | POST | Cancel subscription |
| `/api/payments/change-plan` | POST | Upgrade/downgrade |
| `/api/payments/portal` | GET | Billing portal redirect |
| `/api/customer-portal` | GET | Dodo customer portal |
| `/api/webhooks/dodo` | POST | Dodo payment webhooks |

### 7.7 Trial APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/trial/status` | GET | Get trial status |
| `/api/trial/cron` | GET | Trial reminder cron job |

### 7.8 Notification APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/notifications/subscription` | POST | Register push subscription |
| `/api/notifications/test-email` | POST | Send test email |
| `/api/notifications/generate-vapid` | GET | Generate VAPID keys (dev) |
| `/api/digest/cron` | GET | Email digest cron job |

### 7.9 Support APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/support/tickets` | POST | Create support ticket |
| `/api/support/reactivate` | POST | Request account reactivation |
| `/api/inquiry` | POST | General inquiry form |

### 7.10 Cron Jobs

| Endpoint | Schedule | Description |
|----------|----------|-------------|
| `/api/sync/cron` | Daily | Background sync all integrations |
| `/api/trial/cron` | Daily 9 AM | Trial reminder emails |
| `/api/digest/cron` | Daily | Send email digests |

### 7.11 Admin/Debug APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/debug/slack` | GET | Debug Slack connection |
| `/api/demo/seed` | POST | Seed demo data |
| `/api/demo/mode` | GET/POST | Toggle demo mode |
| `/api/accounts/cleanup` | POST | Cleanup expired accounts |

---

## 8. Database Schema

### 8.1 Core Tables

#### profiles
Extends Supabase `auth.users`:
```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  full_name TEXT,
  company_name TEXT,
  timezone TEXT DEFAULT 'UTC',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  notification_settings JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

#### integrations
OAuth tokens and connection state:
```sql
CREATE TABLE public.integrations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  provider TEXT CHECK (provider IN ('asana', 'clickup', 'jira', 'slack', 'teams', 'whatsapp')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  workspace_id TEXT,
  workspace_name TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_sync_at TIMESTAMPTZ,
  sync_error TEXT,
  UNIQUE(user_id, provider)
);
```

#### subscriptions
Payment and trial tracking:
```sql
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) UNIQUE,
  status TEXT CHECK (status IN ('trialing', 'active', 'payment_failed', 'cancelled', 'expired', 'refunded')),
  tier TEXT CHECK (tier IN ('trial', 'founder', 'team', 'enterprise')),
  
  -- Trial
  trial_started_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  
  -- Dodo Payments
  dodo_customer_id TEXT,
  dodo_subscription_id TEXT,
  dodo_payment_id TEXT,
  customer_email TEXT,
  
  -- Stripe (legacy)
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  
  -- Payment failure handling
  payment_failed_at TIMESTAMPTZ,
  grace_period_ends_at TIMESTAMPTZ,
  account_deletion_scheduled_at TIMESTAMPTZ,
  payment_retry_count INTEGER DEFAULT 0,
  last_payment_error TEXT,
  
  -- Email tracking
  welcome_email_sent BOOLEAN DEFAULT FALSE,
  day1_reminder_sent BOOLEAN DEFAULT FALSE,
  payment_failed_email_sent BOOLEAN DEFAULT FALSE
);
```

#### work_items
Tasks from project management tools:
```sql
CREATE TABLE public.work_items (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  integration_id UUID REFERENCES integrations(id),
  external_id TEXT NOT NULL,
  provider TEXT CHECK (provider IN ('asana', 'clickup', 'jira')),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT,
  priority TEXT,
  due_date TIMESTAMPTZ,
  assignee_name TEXT,
  project_name TEXT,
  url TEXT,
  urgency TEXT CHECK (urgency IN ('high', 'medium', 'low')),
  is_blocked BOOLEAN DEFAULT FALSE,
  is_surfaced BOOLEAN DEFAULT FALSE,
  surface_reason TEXT,
  importance_score INTEGER,
  importance_signals TEXT[],
  raw_data JSONB,
  synced_at TIMESTAMPTZ,
  UNIQUE(user_id, provider, external_id)
);
```

#### communication_signals
Signals from messaging tools:
```sql
CREATE TABLE public.communication_signals (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  integration_id UUID REFERENCES integrations(id),
  channel_id TEXT,
  message_id TEXT,
  provider TEXT CHECK (provider IN ('slack', 'teams', 'whatsapp')),
  signal_type TEXT CHECK (signal_type IN ('mention', 'dm', 'urgent', 'question', 'blocker', 'escalation', 'order', 'complaint', 'positive_feedback')),
  sender_name TEXT,
  content_preview TEXT,
  url TEXT,
  importance_score INTEGER,
  raw_data JSONB,
  synced_at TIMESTAMPTZ,
  UNIQUE(user_id, provider, message_id)
);
```

#### daily_briefs
Generated AI briefs:
```sql
CREATE TABLE public.daily_briefs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  brief_date DATE NOT NULL,
  intent_mode TEXT CHECK (intent_mode IN ('calm', 'on_the_go', 'work', 'focus')),
  needs_attention JSONB DEFAULT '[]',
  fyi_items JSONB DEFAULT '[]',
  handled_items JSONB DEFAULT '[]',
  brief_text TEXT,
  audio_url TEXT,
  audio_duration_seconds INTEGER,
  coverage_percentage INTEGER,
  total_items_processed INTEGER,
  items_surfaced INTEGER,
  UNIQUE(user_id, brief_date, intent_mode)
);
```

#### user_settings
User preferences:
```sql
CREATE TABLE public.user_settings (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) UNIQUE,
  default_intent_mode TEXT DEFAULT 'calm',
  brief_time TIME DEFAULT '08:00',
  brief_timezone TEXT DEFAULT 'UTC',
  voice_id TEXT DEFAULT 'alloy',
  audio_speed REAL DEFAULT 1.0,
  audio_enabled BOOLEAN DEFAULT TRUE,
  email_digest BOOLEAN DEFAULT FALSE,
  push_enabled BOOLEAN DEFAULT FALSE,
  urgency_threshold TEXT DEFAULT 'medium',
  max_items_per_brief INTEGER DEFAULT 10
);
```

### 8.2 Supporting Tables

```sql
-- supervised_channels: Slack/Teams channels to watch
-- sync_log: Integration sync history
-- push_subscriptions: Web push subscription endpoints
-- payment_failure_logs: Payment failure audit trail
```

### 8.3 Row Level Security (RLS)

All tables have RLS enabled with user-scoped policies:

```sql
-- Example: Users can only view own data
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view own integrations" ON public.integrations
  FOR SELECT USING (auth.uid() = user_id);
```

**Service role** bypasses RLS for cron jobs and webhooks.

---

## 9. Environment Variables

### 9.1 Required Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_APP_URL` | App URL (e.g., `https://eagleeye.work`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server only) |

### 9.2 Payment Variables

| Variable | Description |
|----------|-------------|
| `DODO_PAYMENTS_API_KEY` | Dodo Payments API key |
| `DODO_PAYMENTS_ENVIRONMENT` | `test_mode` or `live_mode` |
| `DODO_PAYMENTS_WEBHOOK_KEY` | Webhook signature key |
| `DODO_PAYMENTS_RETURN_URL` | Post-checkout redirect URL |
| `DODO_SOLO_PRODUCT_ID` | Solo plan product ID |
| `DODO_SOLO_ANNUAL_PRODUCT_ID` | Solo annual product ID |
| `DODO_TEAM_PRODUCT_ID` | Team plan product ID |
| `DODO_TEAM_ANNUAL_PRODUCT_ID` | Team annual product ID |
| `STRIPE_SECRET_KEY` | Stripe secret key (legacy) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret (legacy) |

### 9.3 Integration OAuth Variables

| Variable | Description |
|----------|-------------|
| `SLACK_CLIENT_ID` | Slack OAuth client ID |
| `SLACK_CLIENT_SECRET` | Slack OAuth client secret |
| `SLACK_BOT_TOKEN` | Slack bot token (env-based auth) |
| `ASANA_CLIENT_ID` | Asana OAuth client ID |
| `ASANA_CLIENT_SECRET` | Asana OAuth client secret |
| `ASANA_ACCESS_TOKEN` | Asana PAT (env-based auth) |
| `JIRA_CLIENT_ID` | Jira OAuth client ID |
| `JIRA_CLIENT_SECRET` | Jira OAuth client secret |
| `CLICKUP_CLIENT_ID` | ClickUp OAuth client ID |
| `CLICKUP_CLIENT_SECRET` | ClickUp OAuth client secret |
| `TEAMS_CLIENT_ID` | Microsoft Teams client ID |
| `TEAMS_CLIENT_SECRET` | Microsoft Teams client secret |
| `LINEAR_API_KEY` | Linear API key |

### 9.4 AI & Audio Variables

| Variable | Description |
|----------|-------------|
| `GOOGLE_API_KEY` | Google Gemini API key |
| `GEMINI_API_KEY` | Alias for Google API key |
| `OPENAI_API_KEY` | OpenAI API key (legacy fallback) |
| `ELEVENLABS_API_KEY` | ElevenLabs TTS API key |
| `ELEVENLABS_VOICE_ID` | ElevenLabs voice ID |

### 9.5 Email & Notifications

| Variable | Description |
|----------|-------------|
| `RESEND_API_KEY` | Resend email API key |
| `SUPPORT_EMAIL` | Support ticket recipient |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Web push public key |
| `VAPID_PRIVATE_KEY` | Web push private key |
| `VAPID_EMAIL` | VAPID contact email |

### 9.6 Security & Cron

| Variable | Description |
|----------|-------------|
| `CRON_SECRET` | Secret for cron job authentication |
| `NODE_ENV` | `development`, `production`, or `test` |
| `LOG_LEVEL` | `debug`, `info`, `warn`, `error` |

---

## Appendix: Key Files Quick Reference

| Purpose | Location |
|---------|----------|
| Middleware | `middleware.ts` |
| Supabase Clients | `src/lib/supabase/*.ts` |
| Dodo Payments | `src/lib/payments/dodo.ts` |
| Stripe Payments | `src/lib/payments/stripe.ts` |
| Signal Detection | `src/lib/signals.ts` |
| Importance Scoring | `src/lib/importance.ts` |
| AI Brief Generation | `src/lib/ai.ts` |
| Integration Manager | `src/lib/integrations/manager.ts` |
| Slack Adapter | `src/lib/integrations/adapters/slack.ts` |
| Asana Adapter | `src/lib/integrations/adapters/asana.ts` |
| Email Service | `src/lib/email/index.ts` |
| Email Templates | `src/lib/email/templates.ts` |
| Push Notifications | `src/lib/notifications/web-push.ts` |
| Email Digest | `src/lib/notifications/email-digest.ts` |
| Notification Triggers | `src/lib/notifications/triggers.ts` |
| Database Types | `src/types/database.ts` |
| Database Migrations | `supabase/migrations/*.sql` |
| Env Validation | `src/lib/env.ts` |

---

*Generated for EagleEye v0.1.0*
