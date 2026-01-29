# Customer Integration Setup Guide

## How EagleEye Integrations Work for End Customers

### Customer Experience (One-Click OAuth)

1. **Customer clicks "Connect Slack"**
2. **Redirected to Slack authorization page:**
   - "EagleEye wants to access your workspace"
   - Shows requested permissions
3. **Customer clicks "Allow"**
4. **Redirected back to EagleEye** - Integration complete!

No tokens, no copying, no developer knowledge required.

---

## Setup for Production

### 1. Slack App Configuration

In your Slack App settings (api.slack.com/apps):

**OAuth & Permissions → Redirect URLs:**
```
https://your-domain.com/api/integrations/slack/callback
```

For local testing:
```
http://localhost:3000/api/integrations/slack/callback
```

**Required Bot Token Scopes:**
- `channels:history` - Read messages
- `channels:read` - List channels
- `users:read` - Get user info
- `users:read.email` - Get user emails
- `team:read` - Get workspace info

### 2. Environment Variables

```env
# Slack OAuth
SLACK_CLIENT_ID=your_client_id
SLACK_CLIENT_SECRET=your_client_secret

# For testing only (not needed for OAuth)
SLACK_BOT_TOKEN=xoxb-...
```

### 3. Database Setup

Run the migration to create the integrations table:
```sql
-- See supabase/migrations/002_integrations_table.sql
```

---

## OAuth Flow Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   EagleEye  │     │    Slack    │     │  Supabase   │
│   Frontend  │     │    OAuth    │     │   Database  │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │ 1. Click Connect  │                   │
       │───────────────────>                   │
       │                   │                   │
       │ 2. Redirect to    │                   │
       │    Slack OAuth    │                   │
       │<──────────────────│                   │
       │                   │                   │
       │ 3. User approves  │                   │
       │   (on Slack.com)  │                   │
       │                   │                   │
       │ 4. Callback with  │                   │
       │    auth code      │                   │
       │<──────────────────│                   │
       │                   │                   │
       │ 5. Exchange code  │                   │
       │    for token      │                   │
       │───────────────────>                   │
       │                   │                   │
       │ 6. Return token   │                   │
       │<──────────────────│                   │
       │                   │                   │
       │ 7. Store token    │                   │
       │───────────────────────────────────────>
       │                   │                   │
       │ 8. Success!       │                   │
       │<──────────────────────────────────────│
```

---

## Security Notes

1. **Tokens are stored server-side** - Never exposed to frontend
2. **State parameter** - Prevents CSRF attacks
3. **HttpOnly cookies** - OAuth state stored securely
4. **Row Level Security** - Users can only access their own integrations
5. **Encryption** - In production, encrypt tokens at rest

---

## Testing vs Production

| Feature | Testing (Current) | Production |
|---------|------------------|------------|
| Token storage | `.env.local` | Supabase `integrations` table |
| OAuth flow | Manual token | One-click OAuth |
| Multiple users | Single dev | Per-user tokens |
| Token refresh | Manual | Automatic |
