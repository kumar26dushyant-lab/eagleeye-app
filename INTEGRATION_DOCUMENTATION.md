# EagleEye Integration & System Documentation

> **Last Updated:** February 2026  
> **Purpose:** Complete reference for integrations, AI signals, and system architecture

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Integration Architecture](#integration-architecture)
3. [WhatsApp Business Integration](#whatsapp-business-integration)
4. [Slack Integration](#slack-integration)
5. [Asana Integration](#asana-integration)
6. [Linear Integration](#linear-integration)
7. [Signal Processing & AI](#signal-processing--ai)
8. [Deduplication Logic](#deduplication-logic)
9. [Database Schema](#database-schema)
10. [API Endpoints](#api-endpoints)
11. [Environment Variables](#environment-variables)
12. [Troubleshooting](#troubleshooting)

---

## System Overview

EagleEye is a productivity tool that connects to work applications (WhatsApp Business, Slack, Asana, Linear, etc.) and uses AI to surface actionable signals, filtering out noise and presenting users with what truly needs their attention.

### Core Flow

```
User connects integration → OAuth flow → Token stored in Supabase
                                              ↓
                              Sync triggered (manual or scheduled)
                                              ↓
                              Raw data fetched from integration API
                                              ↓
                              Signal classification (AI + rules)
                                              ↓
                              Deduplication & noise filtering
                                              ↓
                              Categorized signals returned to dashboard
                                              ↓
                              Categories: needs_attention, kudos_wins, fyi
```

### Tech Stack

- **Frontend:** Next.js 16.1.5 (Turbopack), React, Tailwind CSS, Framer Motion
- **Backend:** Next.js API Routes (serverless)
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **AI:** Google Gemini 1.5 Flash
- **Payments:** Stripe
- **Deployment:** Vercel (eagleeye.work)

---

## Integration Architecture

### File Structure

```
src/lib/integrations/
├── manager.ts          # IntegrationManager class - coordinates all integrations
├── slack.ts           # Slack-specific logic
├── asana.ts           # Asana-specific logic  
├── linear.ts          # Linear-specific logic
└── types.ts           # Shared types

src/app/api/integrations/
├── connect/route.ts           # Start OAuth flow
├── disconnect/route.ts        # Remove integration
├── status/route.ts            # Check integration status
├── slack/
│   ├── oauth/route.ts         # Initiate Slack OAuth
│   ├── callback/route.ts      # Handle Slack OAuth callback
│   ├── channels/route.ts      # List available channels
│   ├── join-channels/route.ts # Join selected channels
│   ├── sync/route.ts          # Sync Slack messages
│   └── test/route.ts          # Test Slack connection
├── asana/
│   ├── sync/route.ts          # Sync Asana tasks
│   └── test/route.ts          # Test Asana connection
└── linear/
    ├── sync/route.ts          # Sync Linear issues
    └── test/route.ts          # Test Linear connection

src/app/api/data/route.ts      # Main endpoint - fetches & processes all signals
```

### Integration Manager (`src/lib/integrations/manager.ts`)

Central coordinator for all integrations:

```typescript
class IntegrationManager {
  // Get all connected integrations for a user
  async getConnectedIntegrations(userId: string): Promise<Integration[]>
  
  // Sync all connected integrations
  async syncAll(userId: string, timeWindow: TimeWindow): Promise<SyncResult>
  
  // Individual integration sync
  async syncSlack(userId: string, timeWindow: TimeWindow): Promise<Signal[]>
  async syncAsana(userId: string, timeWindow: TimeWindow): Promise<Signal[]>
  async syncLinear(userId: string, timeWindow: TimeWindow): Promise<Signal[]>
}
```

---

## Slack Integration

### OAuth Flow

1. **User clicks "Connect Slack"** → `/api/integrations/slack/oauth`
2. **Redirect to Slack** with scopes: `channels:history`, `channels:read`, `users:read`, `reactions:read`
3. **Slack callback** → `/api/integrations/slack/callback`
4. **Token exchange** → Access token stored in `integrations` table
5. **Channel selection** → User picks which channels to monitor

### Required Scopes

```
channels:history   - Read message history
channels:read      - List public channels
users:read         - Get user info (names, emails)
reactions:read     - See emoji reactions (for kudos detection)
```

### Message Sync Process

**File:** `src/app/api/integrations/slack/sync/route.ts`

```typescript
// 1. Fetch messages from selected channels
const messages = await slack.conversations.history({
  channel: channelId,
  oldest: timeWindow.start.getTime() / 1000,
  latest: timeWindow.end.getTime() / 1000,
  limit: 100
})

// 2. Filter out noise (greetings, short messages, etc.)
const filtered = messages.filter(m => !isNoise(m.text))

// 3. Classify each message
const signals = messages.map(m => classifySlackMessage(m))
```

### Slack Signal Classification

**File:** `src/app/api/data/route.ts` (lines ~500-700)

```typescript
function classifySlackSignalType(msg: SlackMessage): SignalType {
  const text = msg.text?.toLowerCase() || ''
  
  // 1. Check for appreciation reactions (kudos)
  if (hasAppreciationReactions(msg.reactions)) {
    return 'kudos'
  }
  
  // 2. Check urgent keywords
  if (/urgent|asap|critical|blocking|emergency/i.test(text)) {
    return 'blocker'
  }
  
  // 3. Check for questions/mentions
  if (/@here|@channel/.test(text) || text.includes('?')) {
    return 'mention'
  }
  
  // 4. Default to FYI
  return 'fyi'
}
```

### Appreciation Reactions (Kudos Detection)

```typescript
const APPRECIATION_REACTIONS = [
  'tada', 'party_popper', 'partying_face', '100', 'fire', 'sparkles',
  'star', 'clap', 'raised_hands', 'pray', 'trophy', 'medal',
  'heart', 'heart_eyes', 'rocket', 'confetti_ball', 'balloon',
  'thumbsup', '+1', 'ok_hand', 'muscle', 'crown', 'gem'
]

// Requires 2+ reactions to trigger kudos
function hasAppreciationReactions(reactions) {
  return reactions?.some(r => 
    APPRECIATION_REACTIONS.includes(r.name) && r.count >= 2
  )
}
```

---

## Asana Integration

### OAuth Flow

1. **User clicks "Connect Asana"** → `/api/asana/connect`
2. **Redirect to Asana** with OAuth params
3. **Asana callback** → `/api/asana/callback`
4. **Token exchange** → Tokens stored in `integrations` table

### Token Storage

```typescript
// Stored in integrations table
{
  provider: 'asana',
  access_token: 'encrypted_token',
  refresh_token: 'encrypted_refresh',
  token_expires_at: '2026-02-15T00:00:00Z',
  config: {
    workspaces: ['workspace_gid_1', 'workspace_gid_2']
  }
}
```

### Task Sync Process

**File:** `src/app/api/integrations/asana/sync/route.ts`

```typescript
// 1. Get user's workspaces
const workspaces = await asana.workspaces.findAll()

// 2. For each workspace, get tasks assigned to user
const tasks = await asana.tasks.findAll({
  workspace: workspaceGid,
  assignee: 'me',
  modified_since: timeWindow.start.toISOString()
})

// 3. Classify tasks
const signals = tasks.map(task => classifyAsanaTask(task))
```

### Asana Signal Classification

**File:** `src/app/api/data/route.ts` (lines ~700-850)

```typescript
function classifyAsanaSignalType(task: AsanaTask): SignalType {
  const text = `${task.name} ${task.notes}`.toLowerCase()
  
  // PRIORITY 1: Check for urgent keywords FIRST
  const urgentPatterns = [
    /urgent/i, /breaking/i, /asap/i, /critical/i,
    /need\s*attention/i, /needs\s*attention/i,
    /blocker/i, /blocking/i, /emergency/i
  ]
  
  for (const pattern of urgentPatterns) {
    if (pattern.test(text)) {
      return 'blocker'  // → needs_attention category
    }
  }
  
  // PRIORITY 2: Check task properties
  if (task.due_on && new Date(task.due_on) <= new Date()) {
    return 'blocker'  // Overdue = urgent
  }
  
  if (task.completed) {
    return 'milestone'  // Completed = kudos_wins
  }
  
  // PRIORITY 3: Check for celebratory content
  if (/shipped|launched|completed|milestone|celebration/i.test(text)) {
    return 'celebration'  // → kudos_wins category
  }
  
  // Default: FYI
  return 'fyi'
}
```

---

## Linear Integration

### OAuth Flow

1. **User enters Linear API key** → `/api/integrations/connect`
2. **Token stored** in `integrations` table
3. **GraphQL queries** to fetch issues

### Issue Sync Process

**File:** `src/app/api/integrations/linear/sync/route.ts`

```typescript
// GraphQL query for issues
const query = `
  query {
    issues(
      filter: { 
        assignee: { id: { eq: "me" } }
        updatedAt: { gte: "${timeWindow.start.toISOString()}" }
      }
    ) {
      nodes {
        id
        title
        description
        priority
        state { name }
        labels { nodes { name } }
      }
    }
  }
`
```

### Linear Signal Classification

```typescript
function classifyLinearSignalType(issue: LinearIssue): SignalType {
  // Priority 1 or 2 = urgent
  if (issue.priority <= 2) {
    return 'escalation'
  }
  
  // Done/Completed = celebration
  if (issue.state?.name?.toLowerCase() === 'done') {
    return 'milestone'
  }
  
  // Has "urgent" label
  if (issue.labels?.some(l => /urgent|critical/i.test(l.name))) {
    return 'blocker'
  }
  
  return 'fyi'
}
```

---

## Signal Processing & AI

### Signal Types → Categories Mapping

```typescript
// src/types/index.ts
type SignalType = 
  | 'blocker'        // → needs_attention
  | 'escalation'     // → needs_attention
  | 'urgent'         // → needs_attention
  | 'decision_needed'// → needs_attention
  | 'mention'        // → needs_attention (if direct)
  | 'kudos'          // → kudos_wins
  | 'celebration'    // → kudos_wins
  | 'milestone'      // → kudos_wins
  | 'fyi'            // → fyi
  | 'question'       // → fyi (or needs_attention if directed)

// Categorization function
function categorizeSignals(signals: Signal[]): Categories {
  return {
    needs_attention: signals.filter(s => 
      ['blocker', 'escalation', 'urgent', 'decision_needed'].includes(s.signal_type)
    ),
    kudos_wins: signals.filter(s => 
      ['kudos', 'celebration', 'milestone'].includes(s.signal_type)
    ),
    fyi: signals.filter(s => 
      ['fyi', 'mention', 'question'].includes(s.signal_type)
    )
  }
}
```

### AI Brief Generation (Gemini)

**File:** `src/lib/ai.ts`

```typescript
async function generateBrief(signals: Signal[]): Promise<string> {
  const prompt = `
    You are EagleEye, a productivity assistant. 
    Summarize these ${signals.length} work signals into a brief.
    
    Prioritize:
    1. Urgent/blocking items
    2. Items needing decisions
    3. Team wins worth celebrating
    4. FYI items
    
    Signals: ${JSON.stringify(signals)}
  `
  
  const response = await gemini.generateContent(prompt)
  return response.text
}
```

---

## Deduplication Logic

**File:** `src/app/api/data/route.ts` (lines ~45-130)

### Purpose

1. **Remove exact duplicates** (same message ID appearing twice)
2. **Collapse thread replies** (if parent is kudos, skip "congrats" replies)
3. **Content deduplication** (same text within 5 minutes = duplicate)

### Congrats Reply Patterns

```typescript
const CONGRATS_REPLY_PATTERNS = [
  /^(congrats|congratulations|well done|amazing|awesome|great|nice|woo|yay|🎉|🙌|👏|💪|🔥|❤️|💖|👍)+[\s!.,]*$/i,
  /^(so happy for you|happy for you|proud of you|way to go|keep it up)+[\s!.,]*$/i,
  /^(you deserve it|well deserved|you earned it)+[\s!.,]*$/i,
  /^\+1[\s!.,]*$/i,
  /^(same|ditto|agreed|this|^)+[\s!.,]*$/i,
]

function isCongratsReply(text: string): boolean {
  const lower = text.toLowerCase().trim()
  if (lower.split(/\s+/).length > 8) return false  // Long = real content
  
  for (const pattern of CONGRATS_REPLY_PATTERNS) {
    if (pattern.test(lower)) return true
  }
  
  // Emoji-only replies
  if (/^[\s\p{Emoji}]+$/u.test(text)) return true
  
  return false
}
```

### Deduplication Algorithm

```typescript
function deduplicateSignals(signals: Signal[]): Signal[] {
  const uniqueById = new Map<string, Signal>()
  const contentDedup = new Map<string, Signal>()
  const threadParents = new Map<string, Signal>()
  
  // Pass 1: Identify thread parents (messages with replies)
  for (const signal of signals) {
    if (signal.raw_metadata?.reply_count > 0) {
      threadParents.set(signal.source_message_id, signal)
    }
  }
  
  // Pass 2: Filter and deduplicate
  for (const signal of signals) {
    const uniqueKey = `${signal.source}:${signal.source_message_id}`
    
    // Skip exact duplicates
    if (uniqueById.has(uniqueKey)) continue
    
    // Skip congrats replies in kudos threads
    if (signal.raw_metadata?.thread_ts) {
      const parent = threadParents.get(signal.raw_metadata.thread_ts)
      if (parent?.signal_type === 'kudos' && isCongratsReply(signal.snippet)) {
        continue
      }
    }
    
    // Skip content duplicates within 5 minutes
    const contentKey = `${signal.channel_id}:${normalize(signal.snippet)}`
    const existing = contentDedup.get(contentKey)
    if (existing && timeDiff(existing, signal) < 5 * 60 * 1000) {
      continue
    }
    
    uniqueById.set(uniqueKey, signal)
    contentDedup.set(contentKey, signal)
  }
  
  return Array.from(uniqueById.values())
}
```

---

## Database Schema

### `integrations` Table

```sql
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,  -- 'slack', 'asana', 'linear', etc.
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  config JSONB DEFAULT '{}',  -- Provider-specific config
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, provider)
);

-- Config examples:
-- Slack: { "channels": ["C123", "C456"], "team_id": "T123" }
-- Asana: { "workspaces": ["123456"], "projects": ["789"] }
-- Linear: { "team_id": "linear-team-id" }
```

### `user_settings` Table

```sql
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  default_intent_mode TEXT DEFAULT 'work',
  audio_enabled BOOLEAN DEFAULT true,
  email_digest BOOLEAN DEFAULT false,
  push_enabled BOOLEAN DEFAULT false,
  brief_time TEXT DEFAULT '06:00',
  timezone TEXT DEFAULT 'UTC',
  max_items_per_brief INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `subscriptions` Table

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  tier TEXT,  -- 'founder', 'team', 'enterprise'
  status TEXT,  -- 'active', 'canceled', 'past_due'
  trial_ends_at TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## API Endpoints

### Data & Signals

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/data` | GET | Main endpoint - fetch all signals with categories |
| `/api/signals` | GET | Raw signals without processing |
| `/api/brief/generate` | POST | Generate AI brief |
| `/api/brief/audio` | POST | Generate audio brief (Coming Soon) |

### Integrations

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/integrations` | GET | List all integrations for user |
| `/api/integrations/status` | GET | Check status of all integrations |
| `/api/integrations/connect` | POST | Start OAuth flow |
| `/api/integrations/disconnect` | POST | Remove integration |

### Slack

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/integrations/slack/oauth` | GET | Initiate Slack OAuth |
| `/api/integrations/slack/callback` | GET | Handle OAuth callback |
| `/api/integrations/slack/channels` | GET | List available channels |
| `/api/integrations/slack/join-channels` | POST | Select channels to monitor |
| `/api/integrations/slack/sync` | POST | Sync messages |
| `/api/integrations/slack/test` | GET | Test connection |

### Asana

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/asana/connect` | GET | Initiate Asana OAuth |
| `/api/asana/callback` | GET | Handle OAuth callback |
| `/api/integrations/asana/sync` | POST | Sync tasks |
| `/api/integrations/asana/test` | GET | Test connection |

### Linear

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/integrations/linear/sync` | POST | Sync issues |
| `/api/integrations/linear/test` | GET | Test connection |

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx

# Slack OAuth
SLACK_CLIENT_ID=123456.789012
SLACK_CLIENT_SECRET=xxxxx
SLACK_SIGNING_SECRET=xxxxx

# Asana OAuth
ASANA_CLIENT_ID=123456789
ASANA_CLIENT_SECRET=xxxxx

# Linear
LINEAR_CLIENT_ID=xxxxx
LINEAR_CLIENT_SECRET=xxxxx

# AI
GOOGLE_AI_API_KEY=AIzaSyXXX

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx

# App
NEXT_PUBLIC_APP_URL=https://eagleeye.work
SUPPORT_EMAIL=support@eagleeye.work
```

---

## Troubleshooting

### Common Issues

#### 1. Integration Not Syncing

```
Symptoms: Connected but no signals appearing
Fix:
1. Check token expiration in integrations table
2. Verify OAuth scopes are correct
3. Try disconnect/reconnect
4. Check API rate limits
```

#### 2. Duplicate Messages

```
Symptoms: Same message appearing twice
Fix:
1. Check deduplication logs in Vercel
2. Verify source_message_id is unique
3. Check if content dedup timeout (5min) is appropriate
```

#### 3. Wrong Signal Classification

```
Symptoms: Urgent task showing as FYI
Fix:
1. Check keyword detection order (urgent patterns first)
2. Verify text normalization
3. Add missing keywords to patterns
```

#### 4. OAuth Token Expired

```
Symptoms: 401 errors from integration API
Fix:
1. Check token_expires_at in integrations table
2. Implement refresh token flow
3. Prompt user to reconnect
```

### Debug Endpoints

```bash
# Test Slack connection
curl https://eagleeye.work/api/integrations/slack/test

# Test Asana connection  
curl https://eagleeye.work/api/integrations/asana/test

# Check integration status
curl https://eagleeye.work/api/integrations/status
```

### Logging

All integrations log to Vercel with prefixes:

```
[Slack] ...
[Asana] ...
[Linear] ...
[Dedup] Skipping duplicate: "..."
[Signal] Classified as: blocker
```

---

## Version History

| Date | Changes |
|------|---------|
| Feb 2026 | Removed mode system, added smart filtering |
| Feb 2026 | Added deduplication for thread replies |
| Jan 2026 | Fixed Asana urgent keyword detection |
| Jan 2026 | Initial Slack + Asana integration |

---

## Contact

- **Support:** support@eagleeye.work
- **Domain:** https://eagleeye.work
- **Vercel:** eagleeye-app project
