# EagleEye - Comprehensive Technical Documentation
## Version 1.0 | Generated: February 5, 2026

---

# TABLE OF CONTENTS

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Folder Structure](#4-folder-structure)
5. [Authentication System](#5-authentication-system)
6. [Payment System](#6-payment-system)
7. [Integration System](#7-integration-system)
8. [Signal Processing](#8-signal-processing)
9. [Notification System](#9-notification-system)
10. [API Reference](#10-api-reference)
11. [Database Schema](#11-database-schema)
12. [Environment Variables](#12-environment-variables)
13. [Deployment](#13-deployment)

---

# 1. PROJECT OVERVIEW

## What is EagleEye?
EagleEye is an AI-powered executive briefing system that aggregates signals from multiple communication and project management tools, filters noise, and surfaces the most important updates that leaders need to know.

## Core Value Proposition
- **Signal Detection**: Automatically identifies urgent, blocking, and important messages across 7+ integrations
- **Noise Filtering**: Uses AI and keyword analysis to filter out non-essential messages
- **Morning Brief**: Delivers a synthesized daily brief via email, push notification, or audio
- **Real-time Alerts**: Immediate notifications for critical escalations

## Target Users
- Founders and CEOs
- Team Leaders
- Project Managers
- Anyone managing multiple communication channels

---

# 2. ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                               │
├─────────────────────────────────────────────────────────────────────┤
│  Next.js 16 App Router │ React 19 │ Tailwind CSS │ Framer Motion   │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────┐
│                           API LAYER                                  │
├─────────────────────────────────────────────────────────────────────┤
│  Next.js Route Handlers │ Middleware (Auth) │ Rate Limiting         │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────┐
│                        SERVICE LAYER                                 │
├──────────────┬────────────────┬─────────────────┬───────────────────┤
│  Integrations│   Signals      │  Notifications  │    Payments       │
│  Manager     │   Processor    │  Service        │    Service        │
└──────┬───────┴───────┬────────┴────────┬────────┴──────────┬────────┘
       │               │                 │                   │
┌──────▼───────┐ ┌─────▼─────┐ ┌─────────▼───────┐ ┌────────▼────────┐
│  OAuth       │ │  AI       │ │  Email (Resend) │ │  Dodo Payments  │
│  Providers   │ │  (OpenAI) │ │  Push (VAPID)   │ │  API            │
└──────────────┘ └───────────┘ └─────────────────┘ └─────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────┐
│                        DATA LAYER                                    │
├─────────────────────────────────────────────────────────────────────┤
│  Supabase (PostgreSQL) │ Row Level Security │ Realtime Subscriptions│
└─────────────────────────────────────────────────────────────────────┘
```

---

# 3. TECHNOLOGY STACK

## Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.1.5 | React framework with App Router |
| React | 19.0.0 | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.x | Styling |
| Framer Motion | 12.x | Animations |
| Lucide React | - | Icons |
| shadcn/ui | - | Component library |

## Backend
| Technology | Purpose |
|------------|---------|
| Next.js API Routes | REST API endpoints |
| Supabase | Database + Auth + Realtime |
| OpenAI GPT-4 | AI signal processing |
| ElevenLabs | Audio brief generation |

## External Services
| Service | Purpose |
|---------|---------|
| Dodo Payments | Payment processing |
| Resend | Transactional emails |
| Vercel | Hosting + Edge functions |
| Supabase | Database + Authentication |

---

# 4. FOLDER STRUCTURE

```
eagleeye-app/
├── public/                      # Static assets
│   ├── icon-192.png            # PWA icons
│   ├── icon-512.png
│   ├── manifest.json           # PWA manifest
│   └── eagleeye-logo.svg       # Brand logo
│
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth group layout
│   │   │   ├── forgot-password/
│   │   │   ├── login/
│   │   │   ├── reset-password/
│   │   │   └── signup/
│   │   │
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # Auth callbacks
│   │   │   ├── brief/         # Brief generation
│   │   │   ├── integrations/  # Integration APIs
│   │   │   ├── notifications/ # Push notifications
│   │   │   ├── payments/      # Payment flows
│   │   │   ├── settings/      # User settings
│   │   │   ├── signals/       # Signal CRUD
│   │   │   ├── sync/          # Data sync
│   │   │   └── webhooks/      # External webhooks
│   │   │
│   │   ├── checkout/          # Checkout flow
│   │   ├── dashboard/         # Protected dashboard
│   │   │   ├── billing/
│   │   │   ├── integrations/
│   │   │   ├── settings/
│   │   │   └── support/
│   │   │
│   │   ├── pricing/           # Pricing page
│   │   ├── privacy/           # Privacy policy
│   │   ├── terms/             # Terms of service
│   │   │
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Homepage
│   │
│   ├── components/            # React components
│   │   ├── brand/            # Logo, branding
│   │   ├── layout/           # Sidebar, navigation
│   │   └── ui/               # shadcn components
│   │
│   ├── lib/                   # Core libraries
│   │   ├── ai.ts             # OpenAI integration
│   │   ├── email/            # Email service
│   │   ├── importance.ts     # Signal scoring
│   │   ├── integrations/     # Integration adapters
│   │   ├── notifications/    # Push notifications
│   │   ├── payments/         # Payment utilities
│   │   ├── signals.ts        # Signal detection
│   │   ├── supabase/         # DB clients
│   │   └── utils.ts          # Utilities
│   │
│   └── types/                 # TypeScript definitions
│
├── middleware.ts              # Auth middleware
├── package.json
└── tsconfig.json
```

---

# 5. AUTHENTICATION SYSTEM

## Overview
EagleEye uses Supabase Auth with cookie-based sessions and SSR support.

## Auth Flow
```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  User    │────▶│  Signup  │────▶│  Email   │────▶│  Confirm │
│          │     │  Form    │     │  Verify  │     │  /auth   │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                                                         │
┌──────────┐     ┌──────────┐     ┌──────────┐          │
│Dashboard │◀────│  Session │◀────│  Cookie  │◀─────────┘
│          │     │  Created │     │  Set     │
└──────────┘     └──────────┘     └──────────┘
```

## Middleware Protection
**File:** `middleware.ts`

Protected routes:
- `/dashboard/*` - Requires authentication
- `/api/*` - Most require authentication (some public)

Public routes:
- `/` - Homepage
- `/login`, `/signup` - Auth pages
- `/pricing`, `/privacy`, `/terms` - Static pages
- `/api/webhooks/*` - External webhooks

## Supabase Clients

### 1. Browser Client (`src/lib/supabase/client.ts`)
```typescript
createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
```
- Used in client components
- Cookie-based auth

### 2. Server Client (`src/lib/supabase/server.ts`)
```typescript
createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, { cookies })
```
- Used in Server Components and Route Handlers
- Reads cookies from request

### 3. Service Role Client (`src/lib/supabase/server.ts`)
```typescript
createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
```
- Bypasses RLS
- Used for admin operations

---

# 6. PAYMENT SYSTEM

## Provider: Dodo Payments

## Pricing Plans
| Plan | Price | Features |
|------|-------|----------|
| Solo | $29/month | 10 tools, 90-day history |
| Team | $79/month | 5 members, unlimited history |

## Payment Flow
```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Signup  │────▶│  Checkout│────▶│  Dodo    │────▶│  Webhook │
│  Form    │     │  API     │     │  Payment │     │  Received│
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                                                         │
┌──────────┐     ┌──────────┐     ┌──────────┐          │
│  Active  │◀────│  Trial   │◀────│  Account │◀─────────┘
│  User    │     │  Started │     │  Created │
└──────────┘     └──────────┘     └──────────┘
```

## Key Files
| File | Purpose |
|------|---------|
| `src/app/api/payments/checkout/route.ts` | Creates checkout session |
| `src/app/api/webhooks/dodo/route.ts` | Handles Dodo webhooks |
| `src/lib/payments/dodo.ts` | Dodo SDK wrapper |

## Webhook Events Handled
- `subscription.active` - New subscription activated
- `subscription.failed` - Payment failed
- `subscription.cancelled` - User cancelled
- `subscription.renewed` - Renewal successful

## Trial System
- 7-day free trial
- Credit card required upfront
- Auto-charge after trial ends
- 3-day grace period for failed payments

---

# 7. INTEGRATION SYSTEM

## Supported Integrations

| Integration | Status | OAuth | Sync | Adapter |
|-------------|--------|-------|------|---------|
| Slack | ✅ Working | Yes | Yes | Yes |
| Asana | ✅ Working | Yes | Yes | Yes |
| Jira | ✅ Working | Yes | Yes | Yes |
| Microsoft Teams | ⚠️ Partial | Yes | Yes | Yes |
| Linear | ⚠️ Token Only | No | Yes | Yes |
| WhatsApp Business | ✅ Working | Webhook | Webhook | Yes |
| ClickUp | ❌ Library Only | No | No | Yes |
| Notion | ❌ Not Implemented | - | - | - |
| GitHub | ❌ Not Implemented | - | - | - |

## Integration Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                 UNIFIED INTEGRATION LAYER                    │
├─────────────────────────────────────────────────────────────┤
│                   IntegrationManager                         │
│  - connect(provider)    - disconnect(provider)               │
│  - sync(provider)       - getStatus()                        │
└─────────────────────────────────┬───────────────────────────┘
                                  │
    ┌─────────────┬───────────────┼───────────────┬─────────────┐
    │             │               │               │             │
┌───▼───┐   ┌─────▼───┐   ┌───────▼───┐   ┌───────▼───┐   ┌───▼───┐
│ Slack │   │  Asana  │   │   Jira    │   │  Linear   │   │ Teams │
│Adapter│   │ Adapter │   │  Adapter  │   │  Adapter  │   │Adapter│
└───────┘   └─────────┘   └───────────┘   └───────────┘   └───────┘
```

## OAuth Flow (Example: Slack)
1. User clicks "Connect Slack"
2. Redirect to `/api/integrations/slack/oauth`
3. Slack authorization page
4. Callback to `/api/integrations/slack/callback`
5. Token stored in `integrations` table
6. User redirected to dashboard

## Signal Normalization
All integrations normalize signals to:
```typescript
interface UnifiedSignal {
  id: string
  source: 'slack' | 'asana' | 'jira' | 'linear' | 'teams' | 'whatsapp'
  type: 'message' | 'task' | 'issue' | 'comment'
  title: string
  content: string
  author: string
  timestamp: Date
  url?: string
  metadata: Record<string, any>
  flags: SignalFlag[]
  importance: number
}
```

---

# 8. SIGNAL PROCESSING

## Signal Detection Keywords

### Problem Signals
| Category | Keywords |
|----------|----------|
| Blocker | blocked, blocking, stuck, cannot proceed, waiting on |
| Escalation | escalate, escalating, urgent, critical, emergency |
| Deadline | deadline, due date, overdue, past due, running late |
| Risk | at risk, risk, concern, worried, issue |

### Positive Signals
| Category | Keywords |
|----------|----------|
| Milestone | shipped, launched, completed, finished, done |
| Appreciation | great job, thank you, kudos, excellent, amazing |
| Achievement | hit target, achieved, milestone, success |

### Negative Behavior Signals
| Category | Keywords |
|----------|----------|
| Aggression | unacceptable, incompetent, useless, terrible |
| Conflict | disagree, argument, dispute, conflict |
| Harassment | (various patterns detected) |

## Importance Scoring Algorithm
**File:** `src/lib/importance.ts`

```
Score = Base(50) + Urgency(0-30) + Mentions(0-10) + Sender(0-10) + Recency(0-10)

Where:
- Urgency: Keywords like "urgent", "critical", "blocker" add points
- Mentions: @channel, @here, direct mentions add points
- Sender: Known VIPs/executives add points
- Recency: More recent = higher score
```

## Signal Surfacing Rules
Signals are surfaced if:
1. Importance score >= 60, OR
2. Contains blocker/escalation flags, OR
3. Is an urgent mention

---

# 9. NOTIFICATION SYSTEM

## Notification Channels

### 1. Email (Resend)
**Provider:** Resend API
**Templates:**
- Welcome email
- Payment confirmation
- Payment failed
- Trial ending reminder
- Daily/Weekly digest
- Password reset

### 2. Push Notifications (Web Push)
**Standard:** VAPID (Voluntary Application Server Identification)
**Implementation:** Service Worker based

### 3. Slack DM (Optional)
Direct messages for real-time alerts

## Digest Cron Schedule
**File:** `src/app/api/digest/cron/route.ts`

- **Daily Digest:** Runs at 6 AM user's timezone
- **Weekly Digest:** Runs on Mondays at 6 AM
- **Realtime:** Immediate via webhooks

## Email Template Structure
```typescript
interface EmailTemplate {
  subject: string
  preview: string
  html: string
}
```

---

# 10. API REFERENCE

## Authentication APIs
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/callback` | GET | OAuth callback handler |

## Integration APIs
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/integrations` | GET | List all integrations |
| `/api/integrations/connect` | POST | Start OAuth flow |
| `/api/integrations/disconnect` | POST | Remove integration |
| `/api/integrations/status` | GET | Get connection status |
| `/api/integrations/slack/oauth` | GET | Slack OAuth redirect |
| `/api/integrations/slack/callback` | GET | Slack OAuth callback |
| `/api/integrations/slack/sync` | POST | Sync Slack messages |
| `/api/integrations/asana/sync` | POST | Sync Asana tasks |
| `/api/integrations/linear/sync` | POST | Sync Linear issues |

## Payment APIs
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/payments/checkout` | POST | Create checkout session |
| `/api/payments/cancel` | POST | Cancel subscription |
| `/api/payments/change-plan` | POST | Change subscription tier |
| `/api/payments/portal` | GET | Customer portal redirect |
| `/api/webhooks/dodo` | POST | Dodo webhook handler |

## Brief APIs
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/brief/generate` | GET/POST | Generate morning brief |
| `/api/brief/audio` | POST | Generate audio brief |
| `/api/brief/refresh` | POST | Force refresh brief |

## Signal APIs
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/signals` | GET | Get user's signals |
| `/api/signals` | POST | Create/update signal |

## Settings APIs
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/settings` | GET/POST | User settings |
| `/api/settings/notifications` | POST | Notification prefs |

## Notification APIs
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/notifications/subscription` | POST | Push subscription |
| `/api/digest/cron` | GET | Trigger digest (cron) |

## User APIs
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/user/data` | GET | Get user data |
| `/api/user/subscription` | GET | Get subscription status |

---

# 11. DATABASE SCHEMA

## Tables

### users (Supabase Auth)
Managed by Supabase Auth - contains user credentials

### profiles
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### subscriptions
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  customer_email TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('founder', 'solo', 'team')),
  status TEXT NOT NULL CHECK (status IN ('active', 'trial', 'cancelled', 'past_due', 'paused')),
  dodo_customer_id TEXT,
  dodo_subscription_id TEXT,
  trial_ends_at TIMESTAMPTZ,
  current_period_ends_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### integrations
```sql
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  provider TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  workspace_id TEXT,
  workspace_name TEXT,
  settings JSONB DEFAULT '{}',
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);
```

### signals
```sql
CREATE TABLE signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  source TEXT NOT NULL,
  external_id TEXT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  author TEXT,
  url TEXT,
  timestamp TIMESTAMPTZ NOT NULL,
  importance INTEGER DEFAULT 50,
  flags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### notification_settings
```sql
CREATE TABLE notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  email_enabled BOOLEAN DEFAULT TRUE,
  email_frequency TEXT DEFAULT 'daily',
  email_time TEXT DEFAULT '06:00',
  timezone TEXT DEFAULT 'UTC',
  push_enabled BOOLEAN DEFAULT FALSE,
  slack_dm_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### push_subscriptions
```sql
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  endpoint TEXT NOT NULL,
  keys JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);
```

---

# 12. ENVIRONMENT VARIABLES

## Required - Core
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# App
NEXT_PUBLIC_APP_URL=https://eagleeye.work
```

## Required - Payments (Dodo)
```env
DODO_PAYMENTS_API_KEY=xxx
DODO_PAYMENTS_ENVIRONMENT=live  # or 'test'
DODO_PAYMENTS_WEBHOOK_KEY=xxx
DODO_PAYMENTS_RETURN_URL=https://eagleeye.work/checkout/success
DODO_SOLO_PRODUCT_ID=prd_xxx
DODO_TEAM_PRODUCT_ID=prd_xxx
```

## Required - Email
```env
RESEND_API_KEY=re_xxx
```

## OAuth - Integrations
```env
# Slack
SLACK_CLIENT_ID=xxx
SLACK_CLIENT_SECRET=xxx
SLACK_REDIRECT_URI=https://eagleeye.work/api/integrations/slack/callback

# Asana
ASANA_CLIENT_ID=xxx
ASANA_CLIENT_SECRET=xxx
ASANA_REDIRECT_URI=https://eagleeye.work/api/asana/callback

# Jira
JIRA_CLIENT_ID=xxx
JIRA_CLIENT_SECRET=xxx
JIRA_REDIRECT_URI=https://eagleeye.work/api/jira/callback

# Microsoft Teams
TEAMS_CLIENT_ID=xxx
TEAMS_CLIENT_SECRET=xxx
TEAMS_REDIRECT_URI=https://eagleeye.work/api/teams/callback

# Linear
LINEAR_API_KEY=xxx
```

## AI Services
```env
OPENAI_API_KEY=sk-xxx
ELEVENLABS_API_KEY=xxx
```

## Push Notifications
```env
VAPID_PUBLIC_KEY=xxx
VAPID_PRIVATE_KEY=xxx
```

## Security
```env
CRON_SECRET=xxx  # For scheduled jobs
```

---

# 13. DEPLOYMENT

## Hosting: Vercel

## Deployment Flow
```
GitHub Push → Vercel Build → Preview/Production Deploy
```

## Build Command
```bash
npm run build
```

## Environment Setup
1. Add all env vars in Vercel dashboard
2. Configure domains
3. Set up Supabase webhook URLs
4. Configure Dodo webhook URL

## Post-Deployment Checklist
- [ ] Verify all OAuth redirects
- [ ] Test payment flow end-to-end
- [ ] Verify webhook endpoints
- [ ] Test email sending
- [ ] Check PWA installation

---

# APPENDIX A: KNOWN ISSUES

## Payment System
1. Webhook signature verification not implemented
2. Email prices incorrect ($9 instead of $29)
3. Change-plan doesn't update Dodo API

## Integrations
1. Token refresh not implemented
2. ClickUp/Notion/GitHub not implemented
3. Linear labeled as Jira in source

## UI/UX
1. Trial banner links to redirect page
2. Missing error states on dashboard
3. Inconsistent password validation

---

# APPENDIX B: CHANGE LOG

## v1.0.0 (Current)
- Initial release
- 7 integrations (4 working, 3 partial)
- Dodo Payments integration
- AI signal processing
- PWA support

---

*Document generated by EagleEye QA Audit System*
*Last updated: February 5, 2026*
