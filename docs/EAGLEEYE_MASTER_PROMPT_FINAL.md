# 🦅 EAGLEEYE HQ - MASTER BUILD PROMPT

## Copy this ENTIRE document into Claude Opus 4.5 in VS Code

---

# PROJECT: EagleEye HQ

**Tagline:** See what matters before it becomes a problem.  
**Build:** Production-grade, zero bugs, elite UI/UX  
**Timeline:** 2-3 days

---

# WHAT TO BUILD

A decision-intelligence SaaS that:
1. Connects to Asana (sync tasks)
2. Connects to Slack (read channels, send brief)
3. Detects risk signals (not summaries)
4. Surfaces ONLY items that meet strict criteria
5. Shows daily brief with audio playback
6. Supports 4 intent modes
7. Mobile-first, dark theme, premium design

**CRITICAL RULES:**
- Read-only integrations (never write to Asana)
- No message content storage (metadata only)
- Fail-silent (if unsure → ignore)
- Predictable > clever behavior

---

# TECH STACK (LOCKED)

```
Next.js 14 (App Router) + TypeScript (strict)
Tailwind CSS + shadcn/ui + Framer Motion
Supabase (PostgreSQL + Auth)
OpenAI GPT-4o-mini (brief text)
ElevenLabs API (audio brief)
SWR (data fetching)
Vercel (deployment)
```

---

# DATABASE SCHEMA (Run in Supabase)

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  company_name TEXT,
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.integrations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('asana', 'slack')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  workspace_id TEXT,
  workspace_name TEXT,
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

CREATE TABLE public.supervised_channels (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  channel_id TEXT NOT NULL,
  channel_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, channel_id)
);

CREATE TABLE public.work_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  provider TEXT DEFAULT 'asana',
  external_id TEXT NOT NULL,
  external_url TEXT,
  title TEXT NOT NULL,
  owner_name TEXT,
  owner_email TEXT,
  due_date DATE,
  status TEXT,
  project_name TEXT,
  last_activity_at TIMESTAMPTZ,
  has_commitment BOOLEAN DEFAULT false,
  has_time_pressure BOOLEAN DEFAULT false,
  has_movement_gap BOOLEAN DEFAULT false,
  has_dependency BOOLEAN DEFAULT false,
  has_escalation BOOLEAN DEFAULT false,
  importance_score INTEGER DEFAULT 0,
  confidence_score FLOAT DEFAULT 0.0,
  should_surface BOOLEAN DEFAULT false,
  surface_reason TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, external_id)
);

CREATE TABLE public.slack_signals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  channel_id TEXT NOT NULL,
  channel_name TEXT NOT NULL,
  signal_type TEXT NOT NULL,
  signal_summary TEXT NOT NULL,
  confidence_score FLOAT DEFAULT 0.0,
  should_surface BOOLEAN DEFAULT false,
  message_timestamp TIMESTAMPTZ NOT NULL,
  detected_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.daily_briefs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  brief_date DATE NOT NULL,
  intent_mode TEXT DEFAULT 'work',
  needs_attention JSONB DEFAULT '[]',
  fyi_items JSONB DEFAULT '[]',
  handled_items JSONB DEFAULT '[]',
  total_watched INTEGER DEFAULT 0,
  total_surfaced INTEGER DEFAULT 0,
  coverage_percent INTEGER DEFAULT 0,
  summary_text TEXT,
  audio_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, brief_date)
);

CREATE TABLE public.settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  intent_mode TEXT DEFAULT 'work',
  brief_enabled BOOLEAN DEFAULT true,
  brief_time TIME DEFAULT '08:00:00',
  audio_enabled BOOLEAN DEFAULT true,
  voice_id TEXT DEFAULT 'Rachel',
  threshold_calm INTEGER DEFAULT 80,
  threshold_on_the_go INTEGER DEFAULT 60,
  threshold_work INTEGER DEFAULT 40,
  threshold_focus INTEGER DEFAULT 20,
  weekend_silence BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supervised_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slack_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_data" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "own_data" ON public.integrations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_data" ON public.supervised_channels FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_data" ON public.work_items FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_data" ON public.slack_signals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_data" ON public.daily_briefs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_data" ON public.settings FOR ALL USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name) VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  INSERT INTO public.settings (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE INDEX idx_work_items_surface ON public.work_items(user_id, should_surface);
CREATE INDEX idx_work_items_importance ON public.work_items(importance_score DESC);
```

---

# ENV VARIABLES

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ASANA_CLIENT_ID=
ASANA_CLIENT_SECRET=
ASANA_REDIRECT_URI=http://localhost:3000/api/asana/callback
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
SLACK_REDIRECT_URI=http://localhost:3000/api/slack/callback
OPENAI_API_KEY=
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=Rachel
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=your_secret
```

---

# FILE STRUCTURE

```
eagleeye-hq/
├── app/
│   ├── (auth)/login/page.tsx
│   ├── (auth)/signup/page.tsx
│   ├── (auth)/layout.tsx
│   ├── (dashboard)/layout.tsx
│   ├── (dashboard)/page.tsx              # Main brief
│   ├── (dashboard)/channels/page.tsx
│   ├── (dashboard)/integrations/page.tsx
│   ├── (dashboard)/settings/page.tsx
│   ├── api/auth/callback/route.ts
│   ├── api/asana/connect/route.ts
│   ├── api/asana/callback/route.ts
│   ├── api/asana/sync/route.ts
│   ├── api/slack/connect/route.ts
│   ├── api/slack/callback/route.ts
│   ├── api/slack/channels/route.ts
│   ├── api/brief/generate/route.ts
│   ├── api/brief/audio/route.ts
│   ├── api/brief/refresh/route.ts
│   ├── api/settings/route.ts
│   ├── api/cron/daily/route.ts
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ui/ (shadcn)
│   ├── dashboard/
│   │   ├── BriefCard.tsx
│   │   ├── AudioPlayer.tsx
│   │   ├── NeedsAttention.tsx
│   │   ├── FYISection.tsx
│   │   ├── HandledSection.tsx
│   │   ├── CoverageIndicator.tsx
│   │   ├── ModeSelector.tsx
│   │   └── RefreshButton.tsx
│   ├── channels/ChannelSelector.tsx
│   ├── integrations/AsanaConnect.tsx
│   ├── integrations/SlackConnect.tsx
│   └── layout/Sidebar.tsx
├── lib/
│   ├── supabase/client.ts
│   ├── supabase/server.ts
│   ├── asana.ts
│   ├── slack.ts
│   ├── elevenlabs.ts
│   ├── signals.ts
│   ├── importance.ts
│   ├── ai.ts
│   └── utils.ts
├── types/index.ts
└── middleware.ts
```

---

# SIGNAL DETECTION (CORE LOGIC)

```typescript
// lib/signals.ts

const BLOCKING_KEYWORDS = ['blocked', 'waiting', 'pending', 'on hold', 'depends', 'stuck']
const ESCALATION_KEYWORDS = ['urgent', 'asap', 'critical', 'escalat', 'emergency', 'blocker', 'p0', 'p1']

export function detectSignals(item: {
  title: string
  owner_name: string | null
  due_date: string | null
  status: string | null
  last_activity_at: string | null
}) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const titleLower = item.title.toLowerCase()
  const statusLower = item.status?.toLowerCase() || ''

  // 1. Commitment: Has owner + due date
  const hasCommitment = !!(item.owner_name && item.due_date)

  // 2. Time Pressure: Due within 3 days
  let hasTimePressure = false
  if (item.due_date) {
    const due = new Date(item.due_date)
    const daysUntilDue = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    hasTimePressure = daysUntilDue <= 3
  }

  // 3. Movement Gap: No activity 3+ days when due within 7 days
  let hasMovementGap = false
  if (item.last_activity_at && item.due_date) {
    const daysSinceActivity = Math.floor((now.getTime() - new Date(item.last_activity_at).getTime()) / (1000 * 60 * 60 * 24))
    const daysUntilDue = Math.ceil((new Date(item.due_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    hasMovementGap = daysSinceActivity >= 3 && daysUntilDue <= 7
  }

  // 4. Dependency
  const hasDependency = BLOCKING_KEYWORDS.some(kw => statusLower.includes(kw) || titleLower.includes(kw))

  // 5. Escalation
  const hasEscalation = ESCALATION_KEYWORDS.some(kw => titleLower.includes(kw))

  return { hasCommitment, hasTimePressure, hasMovementGap, hasDependency, hasEscalation }
}

/**
 * CORE RULE:
 * Surface ONLY IF: (commitment AND time_pressure AND (movement_gap OR dependency)) OR escalation
 */
export function shouldSurface(flags: ReturnType<typeof detectSignals>) {
  if (flags.hasEscalation) return { surface: true, reason: 'Escalation detected', confidence: 0.95 }
  
  if (flags.hasCommitment && flags.hasTimePressure) {
    if (flags.hasMovementGap) return { surface: true, reason: 'Deadline approaching with no activity', confidence: 0.85 }
    if (flags.hasDependency) return { surface: true, reason: 'Deadline approaching with dependency', confidence: 0.85 }
  }
  
  return { surface: false, reason: null, confidence: 0 }
}
```

---

# IMPORTANCE SCORING

```typescript
// lib/importance.ts

export function calculateImportance(item: {
  due_date: string | null
  last_activity_at: string | null
  has_dependency: boolean
  has_escalation: boolean
}): number {
  let score = 0
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  if (item.due_date) {
    const daysUntilDue = Math.ceil((new Date(item.due_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (daysUntilDue < 0) score += Math.min(40 + Math.abs(daysUntilDue) * 2, 60)
    else if (daysUntilDue === 0) score += 35
    else if (daysUntilDue === 1) score += 28
    else if (daysUntilDue <= 3) score += 15
  }

  if (item.last_activity_at) {
    const daysSince = Math.floor((now.getTime() - new Date(item.last_activity_at).getTime()) / (1000 * 60 * 60 * 24))
    if (daysSince >= 7) score += 25
    else if (daysSince >= 5) score += 20
    else if (daysSince >= 3) score += 15
  }

  if (item.has_dependency) score += 15
  if (item.has_escalation) score += 20

  return Math.min(score, 100)
}

export function getThreshold(mode: string): number {
  switch (mode) {
    case 'calm': return 80
    case 'on_the_go': return 60
    case 'work': return 40
    case 'focus': return 20
    default: return 40
  }
}
```

---

# ELEVENLABS AUDIO

```typescript
// lib/elevenlabs.ts

export async function generateAudio(text: string): Promise<ArrayBuffer> {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}`,
    {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 }
      }),
    }
  )
  if (!response.ok) throw new Error(`ElevenLabs error: ${response.status}`)
  return response.arrayBuffer()
}
```

---

# INTENT MODES

| Mode | Threshold | Description |
|------|-----------|-------------|
| 🏖️ Calm | 80 | Critical only (vacation) |
| 🚗 On-the-Go | 60 | Critical + high (commute) |
| 💼 Work | 40 | Standard (default) |
| 🎯 Focus | 20 | Full snapshot (pre-meeting) |

---

# UI DESIGN (ELITE TIER)

## Color Palette (Dark Theme)
```css
--background: #0A0A0B;
--surface: #141416;
--surface-elevated: #1C1C1F;
--border: #27272A;
--text-primary: #FAFAFA;
--text-secondary: #A1A1AA;
--accent-red: #EF4444;
--accent-amber: #F59E0B;
--accent-green: #22C55E;
--accent-blue: #3B82F6;
```

## Requirements
- Dark mode default
- Mobile-first responsive
- Subtle micro-interactions (Framer Motion)
- Inter font family
- Touch-friendly (44px min targets)
- No clutter - information hierarchy
- Coverage % always visible

---

# DAILY BRIEF FORMAT

```
🦅 EAGLEEYE HQ
Monday, Jan 27 • Work Mode • Coverage: 91%

[🔊 Play Audio Brief  1:23  ▶️]

Good morning! Two items need your attention...

🚨 NEEDS ATTENTION (2)
┌────────────────────────────────┐
│ Client ABC Proposal      92pts │
│ Sarah Chen • Due Today         │
│ → No recent activity           │
└────────────────────────────────┘

🧠 FYI (1)
Support backlog trending up

✅ HANDLED WITHOUT YOU (6)
6 items resolved automatically

─────────────────────────────────
Watched: 47 • Surfaced: 2
EagleEye does NOT watch: private DMs, verbal decisions

[Refresh Snapshot Now]
```

---

# API ROUTES TO BUILD

1. `/api/auth/callback` - Supabase auth
2. `/api/asana/connect` - Initiate OAuth
3. `/api/asana/callback` - Complete OAuth
4. `/api/asana/sync` - Sync tasks
5. `/api/slack/connect` - Initiate OAuth
6. `/api/slack/callback` - Complete OAuth
7. `/api/slack/channels` - List channels
8. `/api/brief/generate` - Generate text brief
9. `/api/brief/audio` - Generate audio (ElevenLabs)
10. `/api/brief/refresh` - On-demand snapshot
11. `/api/settings` - Update settings
12. `/api/cron/daily` - Daily cron job

---

# ASANA API

- Authorize: `https://app.asana.com/-/oauth_authorize?client_id=X&redirect_uri=Y&response_type=code`
- Token: `POST https://app.asana.com/-/oauth_token`
- Workspaces: `GET /workspaces`
- Projects: `GET /workspaces/{gid}/projects`
- Tasks: `GET /projects/{gid}/tasks?opt_fields=name,assignee,assignee.name,assignee.email,due_on,completed,modified_at`

---

# SLACK API

- Authorize: `https://slack.com/oauth/v2/authorize?client_id=X&scope=channels:read,channels:history,users:read,users:read.email,chat:write,im:write`
- Token: `POST https://slack.com/api/oauth.v2.access`
- Channels: `conversations.list`
- History: `conversations.history` (for signal detection, NOT stored)
- Send: `chat.postMessage`

---

# FAILURE HANDLING

| Scenario | Action |
|----------|--------|
| API down | Do nothing, show last brief |
| Partial data | Lower coverage %, add disclaimer |
| Ambiguous | IGNORE completely |
| Low confidence | Don't surface |
| OAuth revoked | Show reconnect banner |

**GOLDEN RULE: If unsure → stay silent**

---

# BUILD ORDER

## Day 1
1. `npx create-next-app@latest eagleeye-hq --typescript --tailwind --eslint --app`
2. `npm i @supabase/ssr @supabase/supabase-js openai lucide-react clsx tailwind-merge framer-motion swr`
3. `npx shadcn@latest init && npx shadcn@latest add button card badge checkbox select switch slider toast skeleton`
4. Deploy SQL schema to Supabase
5. Create lib files (supabase, asana, slack, signals, importance)
6. Create auth pages
7. Create Asana OAuth flow
8. Create Slack OAuth flow

## Day 2
1. Create channel selection page
2. Implement task sync with signal detection
3. Implement importance scoring
4. Create brief generation (OpenAI)
5. Create audio generation (ElevenLabs)
6. Create dashboard UI

## Day 3
1. Create mode selector
2. Create refresh snapshot
3. Create settings page
4. Mobile responsive polish
5. Dark theme styling
6. Error handling
7. Deploy to Vercel
8. End-to-end testing

---

# SUCCESS CRITERIA

- [ ] User signup/login works
- [ ] Asana OAuth works
- [ ] Slack OAuth works
- [ ] Channel selection works
- [ ] Tasks sync with signals
- [ ] Only qualifying items surface
- [ ] Brief shows needs attention, FYI, handled
- [ ] Coverage % displayed
- [ ] Audio brief plays
- [ ] Mode selector works (4 modes)
- [ ] Refresh snapshot works
- [ ] Mobile responsive
- [ ] Dark theme
- [ ] Zero console errors
- [ ] Deployed to Vercel

---

# START NOW

Build the complete application with all features. Make it production-ready, zero bugs, elite UI/UX. 

Key reminders:
1. **Read-only** - never write to Asana
2. **No content storage** - metadata only for Slack
3. **Fail-silent** - if unsure, ignore
4. **Signal > Noise** - silence is success
5. **Premium design** - dark theme, mobile-first, Inter font

Create each file with complete, working code. Start building now.
