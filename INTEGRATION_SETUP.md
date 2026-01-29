# EagleEye Integration Setup Guide

## 🚀 Quick Start - Get Real Data Flowing in 10 Minutes

This guide helps you connect EagleEye to your actual Slack workspace, Asana tasks, or Linear issues. All of these have **free tiers** that work perfectly for testing.

---

### 1. Slack Integration (Communication)

#### Why Slack?
- Monitor channels for @mentions of you
- Detect urgent messages and escalations
- Never miss important conversations

#### Step 1: Create a Slack App
1. Go to https://api.slack.com/apps
2. Click "Create New App" → "From scratch"
3. Name: `EagleEye` → Select your workspace
4. Click "Create App"

#### Step 2: Configure Bot Permissions
1. Go to "OAuth & Permissions" in sidebar
2. Under "Scopes" → "Bot Token Scopes", add:
   - `channels:history` - Read messages in public channels
   - `channels:read` - View basic channel info
   - `groups:history` - Read messages in private channels (optional)
   - `groups:read` - View basic private channel info (optional)
   - `users:read` - View user profiles
   - `users:read.email` - View user email addresses

#### Step 3: Install to Workspace
1. Go to "Install App" in sidebar
2. Click "Install to Workspace"
3. Authorize the permissions
4. Copy the "Bot User OAuth Token" (starts with `xoxb-`)

#### Step 4: Connect in EagleEye
1. Go to `/dashboard/integrations`
2. Click "Connect Slack"
3. Paste your Bot Token
4. Click "Test & Connect"

---

### 2. Asana Integration (Task Management)

#### Why Asana?
- Sync your tasks and their due dates
- Auto-detect overdue and high-priority items
- Surface blocked tasks that need attention

#### Step 1: Get Personal Access Token
1. Go to https://app.asana.com/0/developer-console
2. Click "+ Create new token"
3. Name: `EagleEye`
4. Copy the token (shown only once!)

#### Step 2: Connect in EagleEye
1. Go to `/dashboard/integrations`
2. Click "Connect Asana"
3. Paste your Personal Access Token
4. Click "Test & Connect"

---

### 3. Linear Integration (Issue Tracking - Free Jira Alternative)

#### Why Linear?
- Modern issue tracking with great API
- Free for small teams
- Syncs issues, priorities, and due dates

#### Step 1: Create API Key
1. Go to https://linear.app (sign up free if needed)
2. Go to Settings → API → Personal API keys
3. Click "Create key"
4. Name: `EagleEye`
5. Copy the key (starts with `lin_api_`)

#### Step 2: Connect in EagleEye
1. Go to `/dashboard/integrations`
2. Click "Connect Linear"
3. Paste your API Key
4. Click "Test & Connect"

---

## How It Works

Once connected, EagleEye will:

### For Slack:
- Scan channels for @mentions of you
- Detect urgent keywords (ASAP, urgent, help, etc.)
- Calculate priority based on reactions and thread activity
- Create clickable links to reply directly in Slack

### For Asana:
- Fetch all tasks assigned to you
- Calculate urgency based on due dates:
  - Overdue → 🔴 High urgency
  - Due today/tomorrow → 🔴 High urgency  
  - Due within a week → 🟡 Medium urgency
- Detect blocked tasks and escalations

### For Linear:
- Fetch all issues assigned to you
- Use Linear's native priority (Urgent, High, Normal, Low)
- Factor in due dates and labels
- Surface blocked or critical issues

---

## Optional: Environment Variables

If you prefer to set tokens as environment variables instead of entering them in the UI:

```env
# Add to .env.local

# Slack
SLACK_BOT_TOKEN=xoxb-...

# Asana  
ASANA_ACCESS_TOKEN=...

# Linear
LINEAR_API_KEY=lin_api_...
```

---

## Testing Your Connection

### Via the UI:
1. Go to `/dashboard/integrations`
2. Click "Connect" on any integration
3. Enter your token and click "Test & Connect"
4. You'll see your user info and workspaces if successful

### Via API (for debugging):
```bash
# Test Slack
curl -X POST http://localhost:3000/api/integrations/slack/test \
  -H "Content-Type: application/json" \
  -d '{"token": "xoxb-your-token"}'

# Test Asana
curl -X POST http://localhost:3000/api/integrations/asana/test \
  -H "Content-Type: application/json" \
  -d '{"token": "your-pat"}'

# Test Linear
curl -X POST http://localhost:3000/api/integrations/linear/test \
  -H "Content-Type: application/json" \
  -d '{"token": "lin_api_your-key"}'
```

---

## Troubleshooting

### "invalid_auth" Error (Slack)
- Make sure you copied the **Bot User OAuth Token**, not the signing secret
- Token should start with `xoxb-`

### "401 Unauthorized" (Asana)
- Personal Access Tokens expire - try creating a new one
- Make sure you copied the full token

### "invalid_api_key" (Linear)
- API keys should start with `lin_api_`
- Try creating a new key

### No Data Showing
- Make sure you have tasks assigned to you in Asana/Linear
- For Slack, make sure the bot is added to channels you want to monitor

---

## Security Notes

- Tokens are stored in your browser session only (not persisted)
- EagleEye only reads data - never writes to your tools
- Message content is used for signal detection but not stored
- You can revoke tokens anytime from each service's settings
2. Pull your Asana tasks and projects
3. Generate real briefs from your actual work data!
