# 🦅 EAGLEEYE HQ - ULTIMATE MVP SPECIFICATION

## Elite-Tier Build for Claude Opus 4.5 (2-3 Days)

---

# PRODUCT IDENTITY

**Name:** EagleEye HQ  
**Tagline:** See what matters before it becomes a problem.  
**Anchor:** EagleEye is not responsible for outcomes. EagleEye is responsible for visibility.

**What it IS:**
- Decision-support visibility layer
- Leadership risk detector
- Quiet observer that surfaces only what matters

**What it is NOT:**
- ❌ Slack summary tool
- ❌ Reminder/scheduler
- ❌ AI employee
- ❌ Monitoring/surveillance
- ❌ "All clear" system

**Golden Rule:** Silence is success.

---

# CORE PHILOSOPHY (NON-NEGOTIABLE)

```
1. Under-alert, never over-alert
2. Confidence > Completeness
3. Explain limits clearly
4. Founder always in control
5. Predictable behavior beats smart behavior
```

**If EagleEye ever feels "clever", trust drops.**

---

# TECH STACK (LOCKED - PRODUCTION-GRADE)

```
Framework:        Next.js 14 (App Router)
Language:         TypeScript (strict mode)
Styling:          Tailwind CSS + shadcn/ui + Framer Motion
State:            React Context + SWR for data fetching
Database:         Supabase PostgreSQL
Auth:             Supabase Auth
Queue:            Supabase Edge Functions + pg_cron
AI:               OpenAI GPT-4o-mini (summaries)
Voice:            ElevenLabs API (audio briefs)
Integrations:     Asana API, Slack API (read-only)
Deployment:       Vercel (Edge runtime)
Error Tracking:   Built-in error boundaries
```

---

# UI/UX DESIGN PRINCIPLES (ELITE TIER)

## Based on Research: What Founders/Executives Want

| Principle | Implementation |
|-----------|----------------|
| **Dark Mode First** | Dark theme default, light optional |
| **Minimal Clutter** | Only essential info above fold |
| **Information Hierarchy** | Critical → FYI → Handled |
| **Micro-interactions** | Subtle animations on state changes |
| **Premium Typography** | Inter font, clear hierarchy |
| **Confidence Visible** | Always show coverage % |
| **Mobile-First** | Touch-friendly, swipe gestures |
| **No Dashboards** | Narrative format, not charts |
| **Professional Aesthetic** | Muted colors, gradients subtle |

## Color Palette (Dark Theme)

```css
--background: #0A0A0B;
--surface: #141416;
--surface-elevated: #1C1C1F;
--border: #27272A;
--text-primary: #FAFAFA;
--text-secondary: #A1A1AA;
--text-muted: #71717A;
--accent-red: #EF4444;      /* Needs Attention */
--accent-amber: #F59E0B;    /* FYI */
--accent-green: #22C55E;    /* Handled */
--accent-blue: #3B82F6;     /* Interactive */
--gradient-start: #18181B;
--gradient-end: #09090B;
```

## Typography

```css
--font-sans: 'Inter', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', monospace;

/* Hierarchy */
--text-hero: 2rem;      /* Brief title */
--text-heading: 1.25rem; /* Section headers */
--text-body: 0.9375rem;  /* Default */
--text-small: 0.8125rem; /* Secondary */
--text-micro: 0.75rem;   /* Timestamps */
```

---

# INTENT MODES (INCLUDED IN MVP)

| Mode | Description | Alert Level | Frequency |
|------|-------------|-------------|-----------|
| **🏖️ Calm** | Vacation/Weekend | Critical only | Max 2/day |
| **🚗 On-the-Go** | Commute/Travel | Critical + High | 3-4/day |
| **💼 Work** | Default | Standard | Daily + Escalations |
| **🎯 Focus** | Pre-meeting | Full snapshot | On-demand pull |

**Implementation:**
- Mode selector in header (always visible)
- Mode shown in every brief
- Stored in user settings
- Affects alert thresholds

---

# AUDIO BRIEF (INCLUDED IN MVP)

## Implementation with ElevenLabs

**Voice:** `Rachel` (professional, clear, female) or `Adam` (professional male)  
**Model:** `eleven_multilingual_v2` (natural, low latency)  
**Duration:** Max 90 seconds

**Flow:**
```
1. User opens dashboard or clicks "Play Brief"
2. API generates brief text (same as written)
3. Text sent to ElevenLabs TTS
4. Audio streamed to player
5. Player appears with play/pause, speed control
```

**Audio Player UI:**
```
┌────────────────────────────────────────┐
│  🔊 Audio Brief           1:23 / 1:45  │
│  ▶️ ━━━━━━━━━━━●━━━━━    1x ▾         │
│                         [Regenerate]   │
└────────────────────────────────────────┘
```

**Cost:** ~$0.02-0.05 per brief (500-1000 chars)

---

# REFRESH SNAPSHOT (ON-DEMAND)

**Purpose:** Pull-based update before meetings

**Button:** "Get Latest Brief Now"

**Rules:**
- Does NOT change future alerting
- Pull-only, not push
- Shows: active risks, open dependencies, what changed today
- Prevents panic-scrolling

---

# DATABASE SCHEMA (PRODUCTION-GRADE)

```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For text search

-- =====================
-- PROFILES
-- =====================
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  company_name TEXT,
  timezone TEXT DEFAULT 'UTC',
  onboarding_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- INTEGRATIONS
-- =====================
CREATE TABLE public.integrations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('asana', 'slack', 'clickup', 'jira')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  workspace_id TEXT,
  workspace_name TEXT,
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  sync_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- =====================
-- SUPERVISED CHANNELS
-- =====================
CREATE TABLE public.supervised_channels (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  integration_id UUID REFERENCES public.integrations(id) ON DELETE CASCADE,
  channel_id TEXT NOT NULL,
  channel_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, channel_id)
);

-- =====================
-- WORK ITEMS (Normalized)
-- =====================
CREATE TABLE public.work_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Source
  provider TEXT NOT NULL,
  external_id TEXT NOT NULL,
  external_url TEXT,
  
  -- Normalized fields
  title TEXT NOT NULL,
  owner_name TEXT,
  owner_email TEXT,
  due_date DATE,
  status TEXT,
  project_name TEXT,
  last_activity_at TIMESTAMPTZ,
  
  -- Signal flags (computed)
  has_commitment BOOLEAN DEFAULT false,
  has_time_pressure BOOLEAN DEFAULT false,
  has_movement_gap BOOLEAN DEFAULT false,
  has_dependency BOOLEAN DEFAULT false,
  has_escalation BOOLEAN DEFAULT false,
  
  -- Scoring
  importance_score INTEGER DEFAULT 0 CHECK (importance_score >= 0 AND importance_score <= 100),
  confidence_score FLOAT DEFAULT 0.0 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  
  -- Surfacing
  should_surface BOOLEAN DEFAULT false,
  surface_reason TEXT,
  
  -- Metadata
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, provider, external_id)
);

-- =====================
-- SLACK SIGNALS (Metadata only, NO content)
-- =====================
CREATE TABLE public.slack_signals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  channel_id TEXT NOT NULL,
  channel_name TEXT NOT NULL,
  
  -- Signal metadata
  signal_type TEXT NOT NULL CHECK (signal_type IN ('commitment', 'time_pressure', 'dependency', 'escalation')),
  signal_summary TEXT NOT NULL,
  confidence_score FLOAT DEFAULT 0.0,
  
  -- Surfacing
  should_surface BOOLEAN DEFAULT false,
  
  -- Timestamp (not content)
  message_timestamp TIMESTAMPTZ NOT NULL,
  detected_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- DAILY BRIEFS
-- =====================
CREATE TABLE public.daily_briefs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  brief_date DATE NOT NULL,
  intent_mode TEXT DEFAULT 'work' CHECK (intent_mode IN ('calm', 'on_the_go', 'work', 'focus')),
  
  -- Content
  needs_attention JSONB DEFAULT '[]',
  fyi_items JSONB DEFAULT '[]',
  handled_items JSONB DEFAULT '[]',
  
  -- Stats
  total_watched INTEGER DEFAULT 0,
  total_surfaced INTEGER DEFAULT 0,
  coverage_percent INTEGER DEFAULT 0,
  
  -- AI-generated
  summary_text TEXT,
  
  -- Audio
  audio_url TEXT,
  audio_generated_at TIMESTAMPTZ,
  
  -- Delivery
  delivered_via TEXT,
  delivered_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, brief_date)
);

-- =====================
-- SETTINGS
-- =====================
CREATE TABLE public.settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Intent mode
  intent_mode TEXT DEFAULT 'work' CHECK (intent_mode IN ('calm', 'on_the_go', 'work', 'focus')),
  
  -- Brief settings
  brief_enabled BOOLEAN DEFAULT true,
  brief_time TIME DEFAULT '08:00:00',
  brief_timezone TEXT DEFAULT 'UTC',
  brief_delivery TEXT DEFAULT 'app' CHECK (brief_delivery IN ('app', 'slack', 'email')),
  
  -- Audio settings
  audio_enabled BOOLEAN DEFAULT true,
  voice_id TEXT DEFAULT 'Rachel',
  
  -- Thresholds (by mode)
  threshold_calm INTEGER DEFAULT 80,
  threshold_on_the_go INTEGER DEFAULT 60,
  threshold_work INTEGER DEFAULT 40,
  threshold_focus INTEGER DEFAULT 20,
  
  -- Preferences
  weekend_silence BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- MISSED EVENTS LOG (For transparency)
-- =====================
CREATE TABLE public.missed_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  work_item_id UUID REFERENCES public.work_items(id) ON DELETE SET NULL,
  
  -- What happened
  event_description TEXT NOT NULL,
  why_missed TEXT NOT NULL,
  what_signal_missing TEXT NOT NULL,
  how_to_prevent TEXT,
  
  -- Tracking
  acknowledged BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- ROW LEVEL SECURITY
-- =====================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supervised_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slack_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missed_events ENABLE ROW LEVEL SECURITY;

-- Policies (all tables)
CREATE POLICY "Users own data" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users own data" ON public.integrations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own data" ON public.supervised_channels FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own data" ON public.work_items FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own data" ON public.slack_signals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own data" ON public.daily_briefs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own data" ON public.settings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own data" ON public.missed_events FOR ALL USING (auth.uid() = user_id);

-- =====================
-- AUTO-CREATE ON SIGNUP
-- =====================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  
  INSERT INTO public.settings (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================
-- INDEXES (Performance)
-- =====================
CREATE INDEX idx_work_items_user_surface ON public.work_items(user_id, should_surface);
CREATE INDEX idx_work_items_importance ON public.work_items(importance_score DESC);
CREATE INDEX idx_work_items_due_date ON public.work_items(due_date);
CREATE INDEX idx_slack_signals_user_surface ON public.slack_signals(user_id, should_surface);
CREATE INDEX idx_daily_briefs_user_date ON public.daily_briefs(user_id, brief_date DESC);
CREATE INDEX idx_supervised_channels_user ON public.supervised_channels(user_id, is_active);

-- =====================
-- FUNCTIONS
-- =====================

-- Get threshold for current mode
CREATE OR REPLACE FUNCTION get_user_threshold(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_mode TEXT;
  v_threshold INTEGER;
BEGIN
  SELECT intent_mode INTO v_mode FROM public.settings WHERE user_id = p_user_id;
  
  SELECT 
    CASE v_mode
      WHEN 'calm' THEN threshold_calm
      WHEN 'on_the_go' THEN threshold_on_the_go
      WHEN 'work' THEN threshold_work
      WHEN 'focus' THEN threshold_focus
      ELSE 40
    END INTO v_threshold
  FROM public.settings WHERE user_id = p_user_id;
  
  RETURN COALESCE(v_threshold, 40);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

# FILE STRUCTURE (PRODUCTION-GRADE)

```
eagleeye-hq/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx                      # Main brief view
│   │   ├── channels/page.tsx             # Channel selection
│   │   ├── integrations/page.tsx
│   │   └── settings/page.tsx
│   ├── api/
│   │   ├── auth/callback/route.ts
│   │   ├── asana/
│   │   │   ├── connect/route.ts
│   │   │   ├── callback/route.ts
│   │   │   └── sync/route.ts
│   │   ├── slack/
│   │   │   ├── connect/route.ts
│   │   │   ├── callback/route.ts
│   │   │   ├── channels/route.ts
│   │   │   └── scan/route.ts
│   │   ├── brief/
│   │   │   ├── generate/route.ts
│   │   │   ├── audio/route.ts            # ElevenLabs TTS
│   │   │   └── refresh/route.ts          # On-demand snapshot
│   │   ├── signals/
│   │   │   └── analyze/route.ts
│   │   ├── settings/
│   │   │   └── route.ts
│   │   └── cron/
│   │       └── daily/route.ts
│   ├── layout.tsx
│   ├── page.tsx                          # Landing page
│   └── globals.css
├── components/
│   ├── ui/                               # shadcn components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── checkbox.tsx
│   │   ├── select.tsx
│   │   ├── switch.tsx
│   │   ├── slider.tsx
│   │   ├── toast.tsx
│   │   ├── skeleton.tsx
│   │   └── ...
│   ├── dashboard/
│   │   ├── BriefCard.tsx                 # Main AI brief
│   │   ├── AudioPlayer.tsx               # Audio brief player
│   │   ├── NeedsAttention.tsx            # Critical items
│   │   ├── FYISection.tsx                # Low urgency
│   │   ├── HandledSection.tsx            # Auto-resolved
│   │   ├── CoverageIndicator.tsx         # Confidence display
│   │   ├── ModeSelector.tsx              # Intent mode picker
│   │   └── RefreshButton.tsx             # On-demand snapshot
│   ├── channels/
│   │   └── ChannelSelector.tsx
│   ├── integrations/
│   │   ├── AsanaConnect.tsx
│   │   └── SlackConnect.tsx
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   ├── MobileNav.tsx
│   │   └── ThemeProvider.tsx
│   └── shared/
│       ├── Logo.tsx
│       ├── LoadingSpinner.tsx
│       ├── ErrorBoundary.tsx
│       └── EmptyState.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── admin.ts
│   ├── asana/
│   │   ├── client.ts
│   │   └── sync.ts
│   ├── slack/
│   │   ├── client.ts
│   │   └── signals.ts
│   ├── elevenlabs/
│   │   └── client.ts                     # TTS generation
│   ├── signals/
│   │   ├── detector.ts                   # Signal detection
│   │   ├── importance.ts                 # Scoring
│   │   └── thresholds.ts                 # Mode-based thresholds
│   ├── ai/
│   │   └── summarize.ts                  # OpenAI brief generation
│   ├── hooks/
│   │   ├── useUser.ts
│   │   ├── useBrief.ts
│   │   ├── useSettings.ts
│   │   └── useAudio.ts
│   ├── utils/
│   │   ├── cn.ts                         # classnames utility
│   │   ├── dates.ts                      # Date formatting
│   │   └── validation.ts                 # Input validation
│   └── constants.ts
├── types/
│   ├── database.ts                       # Supabase types
│   ├── api.ts                            # API response types
│   └── index.ts
├── styles/
│   └── theme.css                         # Custom CSS variables
├── middleware.ts
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

# ENVIRONMENT VARIABLES

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Asana OAuth
ASANA_CLIENT_ID=
ASANA_CLIENT_SECRET=
ASANA_REDIRECT_URI=http://localhost:3000/api/asana/callback

# Slack OAuth
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
SLACK_REDIRECT_URI=http://localhost:3000/api/slack/callback

# OpenAI
OPENAI_API_KEY=

# ElevenLabs (Audio)
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=Rachel

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=your_secret_here
```

---

# CORE LOGIC: SIGNAL DETECTION (BULLETPROOF)

## lib/signals/detector.ts

```typescript
/**
 * EagleEye Signal Detection Engine
 * 
 * A signal is surfaced ONLY if:
 *   (Commitment exists AND Deadline pressure exists AND (Movement missing OR Dependency unresolved))
 *   OR (Explicit escalation detected)
 * 
 * Everything else is IGNORED.
 */

export interface SignalFlags {
  hasCommitment: boolean
  hasTimePressure: boolean
  hasMovementGap: boolean
  hasDependency: boolean
  hasEscalation: boolean
}

export interface WorkItemInput {
  title: string
  owner_name: string | null
  due_date: string | null
  status: string | null
  last_activity_at: string | null
}

export interface SurfaceDecision {
  shouldSurface: boolean
  reason: string | null
  confidence: number
}

// Blocking keywords (lowercase)
const BLOCKING_KEYWORDS = ['blocked', 'waiting', 'pending', 'on hold', 'depends', 'stuck', 'need approval']

// Escalation keywords (lowercase)
const ESCALATION_KEYWORDS = ['urgent', 'asap', 'critical', 'escalat', 'emergency', 'blocker', 'p0', 'p1', 'fire']

/**
 * Detect signals in a work item
 */
export function detectSignals(item: WorkItemInput): SignalFlags {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const titleLower = item.title.toLowerCase()
  const statusLower = item.status?.toLowerCase() || ''

  // 1. Commitment: Has owner + due date
  const hasCommitment = !!(item.owner_name && item.due_date)

  // 2. Time Pressure: Due within 3 days OR overdue
  let hasTimePressure = false
  if (item.due_date) {
    const dueDate = new Date(item.due_date)
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    hasTimePressure = daysUntilDue <= 3
  }

  // 3. Movement Gap: No activity in 3+ days when due within 7 days
  let hasMovementGap = false
  if (item.last_activity_at && item.due_date) {
    const lastActivity = new Date(item.last_activity_at)
    const daysSinceActivity = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
    const dueDate = new Date(item.due_date)
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    hasMovementGap = daysSinceActivity >= 3 && daysUntilDue <= 7
  }

  // 4. Dependency: Blocking keywords in status or title
  const hasDependency = BLOCKING_KEYWORDS.some(kw => 
    statusLower.includes(kw) || titleLower.includes(kw)
  )

  // 5. Escalation: Urgent keywords in title
  const hasEscalation = ESCALATION_KEYWORDS.some(kw => titleLower.includes(kw))

  return {
    hasCommitment,
    hasTimePressure,
    hasMovementGap,
    hasDependency,
    hasEscalation
  }
}

/**
 * Determine if item should surface to leader
 * 
 * CORE RULE:
 *   (commitment AND time_pressure AND (movement_gap OR dependency))
 *   OR escalation
 */
export function shouldSurface(flags: SignalFlags): SurfaceDecision {
  // Explicit escalation ALWAYS surfaces (highest confidence)
  if (flags.hasEscalation) {
    return {
      shouldSurface: true,
      reason: 'Escalation detected in title',
      confidence: 0.95
    }
  }

  // Core formula
  if (flags.hasCommitment && flags.hasTimePressure) {
    if (flags.hasMovementGap && flags.hasDependency) {
      return {
        shouldSurface: true,
        reason: 'Deadline approaching with stalled progress and dependency',
        confidence: 0.9
      }
    }
    if (flags.hasMovementGap) {
      return {
        shouldSurface: true,
        reason: 'Deadline approaching with no recent activity',
        confidence: 0.85
      }
    }
    if (flags.hasDependency) {
      return {
        shouldSurface: true,
        reason: 'Deadline approaching with unresolved dependency',
        confidence: 0.85
      }
    }
  }

  // Default: DO NOT surface
  return {
    shouldSurface: false,
    reason: null,
    confidence: 0
  }
}

/**
 * Dual-signal rule for silence
 * EagleEye stays silent ONLY if: no time pressure AND recent movement exists
 */
export function canStaySilent(flags: SignalFlags, item: WorkItemInput): boolean {
  if (flags.hasTimePressure) return false
  if (flags.hasEscalation) return false
  
  // Check for recent movement
  if (item.last_activity_at) {
    const daysSinceActivity = Math.floor(
      (Date.now() - new Date(item.last_activity_at).getTime()) / (1000 * 60 * 60 * 24)
    )
    return daysSinceActivity < 3  // Recent movement = can stay silent
  }
  
  return false  // No activity data = don't stay silent
}
```

---

# CORE LOGIC: IMPORTANCE SCORING

## lib/signals/importance.ts

```typescript
/**
 * Importance Score Calculator
 * 
 * Formula:
 *   Importance = Deadline_Proximity × Inactivity_Duration × Dependency_Factor × Escalation_Factor
 * 
 * Score: 0-100
 * Only items above threshold (based on mode) surface.
 */

export interface ImportanceInput {
  due_date: string | null
  last_activity_at: string | null
  has_dependency: boolean
  has_escalation: boolean
  has_client_impact?: boolean
}

export function calculateImportance(item: ImportanceInput): number {
  let score = 0
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  // 1. DEADLINE PROXIMITY (0-40 points)
  if (item.due_date) {
    const dueDate = new Date(item.due_date)
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntilDue < 0) {
      // Overdue: 40 base + 2 per day (max 60)
      score += Math.min(40 + Math.abs(daysUntilDue) * 2, 60)
    } else if (daysUntilDue === 0) {
      score += 35  // Due today
    } else if (daysUntilDue === 1) {
      score += 28  // Due tomorrow
    } else if (daysUntilDue === 2) {
      score += 20  // Due in 2 days
    } else if (daysUntilDue <= 3) {
      score += 15  // Due in 3 days
    } else if (daysUntilDue <= 7) {
      score += 8   // Due this week
    }
  }

  // 2. INACTIVITY DURATION (0-25 points)
  if (item.last_activity_at) {
    const lastActivity = new Date(item.last_activity_at)
    const daysSinceActivity = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))

    if (daysSinceActivity >= 7) {
      score += 25
    } else if (daysSinceActivity >= 5) {
      score += 20
    } else if (daysSinceActivity >= 3) {
      score += 15
    } else if (daysSinceActivity >= 2) {
      score += 8
    }
  } else {
    // No activity data = assume some concern
    score += 10
  }

  // 3. DEPENDENCY FACTOR (+15 points)
  if (item.has_dependency) {
    score += 15
  }

  // 4. ESCALATION FACTOR (+20 points)
  if (item.has_escalation) {
    score += 20
  }

  // 5. CLIENT IMPACT FACTOR (+10 points)
  if (item.has_client_impact) {
    score += 10
  }

  return Math.min(score, 100)
}

/**
 * Get threshold based on intent mode
 */
export function getThresholdForMode(mode: string): number {
  switch (mode) {
    case 'calm':
      return 80    // Only critical
    case 'on_the_go':
      return 60    // Critical + high
    case 'work':
      return 40    // Standard
    case 'focus':
      return 20    // Everything
    default:
      return 40
  }
}
```

---

# ELEVENLABS INTEGRATION

## lib/elevenlabs/client.ts

```typescript
const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io/v1'

interface TTSOptions {
  text: string
  voiceId?: string
  modelId?: string
}

/**
 * Generate audio from text using ElevenLabs TTS
 * Returns audio as ArrayBuffer
 */
export async function generateAudio(options: TTSOptions): Promise<ArrayBuffer> {
  const {
    text,
    voiceId = process.env.ELEVENLABS_VOICE_ID || 'Rachel',
    modelId = 'eleven_multilingual_v2'
  } = options

  const response = await fetch(
    `${ELEVENLABS_API_BASE}/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.5,
          use_speaker_boost: true
        }
      }),
    }
  )

  if (!response.ok) {
    throw new Error(`ElevenLabs API error: ${response.status}`)
  }

  return response.arrayBuffer()
}

/**
 * Get available voices
 */
export async function getVoices() {
  const response = await fetch(`${ELEVENLABS_API_BASE}/voices`, {
    headers: {
      'xi-api-key': process.env.ELEVENLABS_API_KEY!,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch voices: ${response.status}`)
  }

  const data = await response.json()
  return data.voices
}
```

---

# DAILY BRIEF FORMAT

## What Users See

```
┌─────────────────────────────────────────────────────────────┐
│ 🦅 EAGLEEYE HQ                                              │
│ Monday, January 27 • Work Mode                              │
│ Coverage: 91% (High)                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🔊 Play Audio Brief                    1:23   ▶️        │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Good morning! Two items need your attention today. The      │
│ client proposal deadline is at risk — Sarah hasn't updated  │
│ it in 3 days. Also watching a potential SLA concern in      │
│ support. Everything else looks good across 8 channels.      │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ 🚨 NEEDS ATTENTION (2)                                      │
│                                                             │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ Client ABC Proposal                           92 pts   │   │
│ │ Sarah Chen • Due Today                                 │   │
│ │ → Deadline approaching with no recent activity         │   │
│ │                                      Confidence: High  │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ Support SLA - Tier 2                          78 pts   │   │
│ │ Unassigned • 4 tickets pending                         │   │
│ │ → Dependency unresolved                                │   │
│ │                                    Confidence: Medium  │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ 🧠 FYI (Low Urgency) (1)                                    │
│                                                             │
│ Support backlog trending up (no SLA breach yet)             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ ✅ HANDLED WITHOUT YOU (6)                                  │
│                                                             │
│ 6 items resolved, 4 follow-ups completed                    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ 📊 Watched: 47 • Surfaced: 2 • Coverage: High (91%)         │
│                                                             │
│ EagleEye does NOT watch: private DMs, verbal decisions,     │
│ tools not connected.                                        │
│                                                             │
│                                    [Refresh Snapshot Now]   │
└─────────────────────────────────────────────────────────────┘
```

---

# TRUST MECHANISMS (CRITICAL)

## 1. Confidence Indicator (Always Visible)

```typescript
interface CoverageIndicator {
  percent: number        // 0-100
  level: 'High' | 'Partial' | 'Low'
  explanation: string
}

function calculateCoverage(stats: {
  totalItems: number
  syncedRecently: number
  integrationErrors: number
}): CoverageIndicator {
  const syncRate = stats.syncedRecently / stats.totalItems
  const errorRate = stats.integrationErrors / stats.totalItems

  if (syncRate > 0.9 && errorRate < 0.05) {
    return {
      percent: Math.round(syncRate * 100),
      level: 'High',
      explanation: 'Based on observed signals from selected tools'
    }
  } else if (syncRate > 0.7) {
    return {
      percent: Math.round(syncRate * 100),
      level: 'Partial',
      explanation: 'Some tools had sync issues'
    }
  } else {
    return {
      percent: Math.round(syncRate * 100),
      level: 'Low',
      explanation: 'Limited data available'
    }
  }
}
```

## 2. Explicit Scope Declaration

Every brief ends with:
```
EagleEye does NOT watch:
• Private DMs
• Undocumented verbal decisions
• Tools not connected
```

## 3. Missed Event Transparency

If something slips through, show:
```typescript
interface MissedEvent {
  whatHappened: string
  whyMissed: string
  whatSignalMissing: string
  howToPrevent: string
}

// Example:
{
  whatHappened: "Client deadline was missed",
  whyMissed: "Task had no due date in Asana",
  whatSignalMissing: "Due date",
  howToPrevent: "Ensure all client tasks have due dates set"
}
```

---

# FAILURE HANDLING (BULLETPROOF)

| Scenario | Action | User Message |
|----------|--------|--------------|
| API down | Do nothing | "Unable to generate brief. Will retry later." |
| Partial data | Lower confidence | "Coverage: Partial (X%)" |
| Ambiguous signal | IGNORE | (Nothing shown) |
| Confidence < threshold | Don't surface | (Nothing shown) |
| OAuth revoked | Notify once | "Reconnect required: [Tool]" |
| Sync error | Log, don't break | Show last successful brief |

**GOLDEN RULE: If unsure → stay silent.**

---

# API ROUTES

## POST /api/brief/audio

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateAudio } from '@/lib/elevenlabs/client'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { text } = await request.json()
    
    if (!text || text.length > 2000) {
      return NextResponse.json({ error: 'Invalid text' }, { status: 400 })
    }

    const audioBuffer = await generateAudio({ text })
    
    // Return audio as base64 or upload to storage
    const base64Audio = Buffer.from(audioBuffer).toString('base64')
    
    return NextResponse.json({
      success: true,
      audio: `data:audio/mpeg;base64,${base64Audio}`
    })
  } catch (error) {
    console.error('Audio generation error:', error)
    return NextResponse.json({ error: 'Audio generation failed' }, { status: 500 })
  }
}
```

---

# MOBILE-FIRST RESPONSIVE DESIGN

```css
/* Mobile breakpoints */
@media (max-width: 640px) {
  .brief-card {
    padding: 1rem;
    margin: 0.5rem;
  }
  
  .audio-player {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: var(--surface);
    padding: 1rem;
    border-top: 1px solid var(--border);
  }
  
  .mode-selector {
    display: flex;
    overflow-x: auto;
    gap: 0.5rem;
    padding-bottom: 0.5rem;
  }
  
  .attention-item {
    padding: 0.75rem;
  }
}

/* Touch-friendly */
.touch-target {
  min-height: 44px;
  min-width: 44px;
}

/* Safe area for notch devices */
.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}
```

---

# PACKAGE.JSON

```json
{
  "name": "eagleeye-hq",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@radix-ui/react-checkbox": "^1.0.4",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-slider": "^1.1.2",
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-switch": "^1.0.3",
    "@radix-ui/react-toast": "^1.1.5",
    "@supabase/ssr": "^0.5.2",
    "@supabase/supabase-js": "^2.47.10",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "framer-motion": "^11.0.0",
    "lucide-react": "^0.454.0",
    "next": "14.2.21",
    "openai": "^4.77.0",
    "react": "^18",
    "react-dom": "^18",
    "swr": "^2.2.5",
    "tailwind-merge": "^2.2.0",
    "tailwindcss-animate": "^1.0.7"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10.0.1",
    "eslint": "^8",
    "eslint-config-next": "14.2.21",
    "postcss": "^8",
    "tailwindcss": "^3.4.1",
    "typescript": "^5"
  }
}
```

---

# VERCEL CRON

```json
{
  "crons": [
    {
      "path": "/api/cron/daily",
      "schedule": "0 8 * * 1-5"
    }
  ]
}
```

---

# SUCCESS METRICS

| Metric | Target | Why |
|--------|--------|-----|
| Brief accuracy | >90% | Surfaced items are legitimate |
| False positive rate | <10% | Don't cry wolf |
| Correctly ignored | >90% | Silence when appropriate |
| Audio play rate | >50% | Users use audio feature |
| Mode usage | >30% use non-default | Modes are valuable |
| Coverage shown | 100% | Always transparent |

---

# BUILD CHECKLIST (2-3 DAYS)

## Day 1: Foundation + Auth + Integrations
- [ ] Next.js 14 project setup
- [ ] Supabase configuration
- [ ] Database schema deployment
- [ ] shadcn/ui components
- [ ] Auth pages (login/signup)
- [ ] Asana OAuth flow
- [ ] Slack OAuth flow
- [ ] Channel selection UI

## Day 2: Core Logic + Brief Generation
- [ ] Signal detection engine
- [ ] Importance scoring
- [ ] Work item sync from Asana
- [ ] Slack signal detection
- [ ] AI brief generation (OpenAI)
- [ ] Audio brief generation (ElevenLabs)
- [ ] Dashboard UI (brief card, attention items)

## Day 3: Polish + Modes + Deploy
- [ ] Intent mode selector
- [ ] Refresh snapshot feature
- [ ] Mobile responsive design
- [ ] Dark theme styling
- [ ] Coverage indicator
- [ ] Settings page
- [ ] Error handling
- [ ] Vercel deployment
- [ ] End-to-end testing

---

# SUCCESS CRITERIA (MVP COMPLETE WHEN)

- [ ] User can sign up/login
- [ ] User can connect Asana
- [ ] User can connect Slack
- [ ] User can select supervised channels
- [ ] Tasks sync with signal detection
- [ ] Only items meeting criteria surface
- [ ] Brief shows needs attention, FYI, handled
- [ ] Coverage % always visible
- [ ] Audio brief plays correctly
- [ ] Intent modes work (calm, on-the-go, work, focus)
- [ ] Refresh snapshot works
- [ ] Mobile-responsive
- [ ] Dark theme
- [ ] Zero console errors
- [ ] Deployed to Vercel

---

**END OF SPECIFICATION**
