# WhatsApp Business Integration Setup Guide

Complete step-by-step guide to enable WhatsApp Business integration for EagleEye.

---

## Overview

**Integration Type**: Webhook-based (similar to Slack)  
**Flow**: User provides Meta credentials → WhatsApp sends webhooks → EagleEye detects signals

---

## Part 1: Database Setup (Run in Supabase)

### Step 1: Run the Migration

Go to **Supabase Dashboard → SQL Editor** and run this SQL:

```sql
-- Add WhatsApp to the integrations provider constraint
ALTER TABLE integrations DROP CONSTRAINT IF EXISTS integrations_provider_check;
ALTER TABLE integrations ADD CONSTRAINT integrations_provider_check 
  CHECK (provider IN ('slack', 'asana', 'linear', 'github', 'notion', 'whatsapp'));

-- Add WhatsApp to the communication_signals source constraint
ALTER TABLE public.communication_signals DROP CONSTRAINT IF EXISTS communication_signals_source_check;
ALTER TABLE public.communication_signals ADD CONSTRAINT communication_signals_source_check 
  CHECK (source IN ('slack', 'teams', 'whatsapp'));

-- Add new signal types for business context
ALTER TABLE public.communication_signals DROP CONSTRAINT IF EXISTS communication_signals_signal_type_check;
ALTER TABLE public.communication_signals ADD CONSTRAINT communication_signals_signal_type_check 
  CHECK (signal_type IN (
    'mention', 'urgent', 'question', 'escalation', 'fyi',
    'order', 'complaint', 'positive_feedback', 'payment', 'delivery'
  ));
```

### Step 2: Verify Changes

Run this to confirm:

```sql
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_schema = 'public' 
AND (constraint_name LIKE '%integrations%' OR constraint_name LIKE '%communication%');
```

---

## Part 2: Vercel Environment Variables

### Step 1: Add to Vercel Dashboard

Go to **Vercel → Project → Settings → Environment Variables** and add:

| Variable | Description | Example |
|----------|-------------|---------|
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | Token you create for webhook verification | `eagleeye_whatsapp_verify_2024` |

> **Note**: Generate a random string for the verify token. It's used to verify that webhook requests come from Meta.

---

## Part 3: Meta Business Setup (One-time for testing)

### Step 1: Create Meta Developer Account

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Create a Developer Account (if not already)
3. Click **Create App** → Choose **Business** type

### Step 2: Add WhatsApp Product

1. In your app, click **Add Product**
2. Select **WhatsApp** → Click **Set up**
3. You'll get a **Test Phone Number** for development

### Step 3: Get Credentials

In the WhatsApp product dashboard:

1. **Phone Number ID**: Copy from the API Setup section
2. **Access Token**: Generate a permanent token (System User method recommended for production)
3. **Business Account ID**: Found in Business Settings

### Step 4: Configure Webhook

1. Go to **WhatsApp → Configuration → Webhook**
2. Click **Edit** and enter:
   - **Callback URL**: `https://eagleeye.work/api/whatsapp/webhook`
   - **Verify Token**: Same as `WHATSAPP_WEBHOOK_VERIFY_TOKEN` in Vercel
3. Click **Verify and Save**
4. Subscribe to: `messages` (required)

---

## Part 4: Test the Integration

### Test 1: Webhook Verification

```bash
curl "https://eagleeye.work/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=YOUR_VERIFY_TOKEN&hub.challenge=test123"
```

Expected response: `test123`

### Test 2: Check Connection Status

```bash
curl https://eagleeye.work/api/whatsapp/connect \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

### Test 3: Connect WhatsApp (requires auth)

From the Integrations page in the app:
1. Login to EagleEye
2. Go to **Dashboard → Integrations**
3. Click **Connect** on WhatsApp
4. Enter your Meta credentials

### Test 4: Send a Test Message

1. In Meta Developer Dashboard, go to **WhatsApp → API Setup**
2. Use the **Send Message** test tool
3. Send a message like: "URGENT: Customer order #1234 payment failed!"
4. Check EagleEye dashboard for the detected signal

---

## Part 5: Build the Connect UI

Currently the connect flow is API-only. Here's how to add UI (similar to Slack):

### Option A: Simple Form (MVP)

Create a dialog where user enters:
- Access Token (from Meta)
- Phone Number ID
- Business Account ID

### Option B: OAuth Flow (Production)

Implement Facebook Login with WhatsApp permissions. More complex but better UX.

---

## Signal Detection Rules

EagleEye detects these signals from WhatsApp messages:

| Signal Type | Keywords |
|-------------|----------|
| 🔴 **Urgent** | urgent, asap, emergency, immediately, jaldi, turant, abhi |
| 📦 **Order** | order, purchase, payment, delivery, shipping, refund, COD, UPI |
| ⚠️ **Complaint** | complaint, problem, issue, not working, disappointed, scam |
| ✅ **Positive** | thank you, great, excellent, amazing, recommend, love it |

---

## Troubleshooting

### "Webhook verification failed"

- Check `WHATSAPP_WEBHOOK_VERIFY_TOKEN` matches in both Vercel and Meta
- Ensure the webhook URL is exactly `https://eagleeye.work/api/whatsapp/webhook`

### "No signals detected"

- Verify message contains signal keywords
- Check Supabase logs for any errors
- Ensure user has WhatsApp integration connected

### "Database constraint error"

- Run the SQL migration from Part 1
- The `provider` and `source` columns need 'whatsapp' added

---

## Architecture Comparison

| Feature | Slack | WhatsApp |
|---------|-------|----------|
| Auth Method | OAuth 2.0 | API Key (Meta credentials) |
| Message Delivery | Webhooks (Events API) | Webhooks (Cloud API) |
| Channels | Slack Channels | Phone Numbers |
| Rate Limits | Generous | Strict (Meta policies) |
| Testing | Slack sandbox app | Meta test phone number |

---

## Next Steps After Setup

1. ✅ Run database migration
2. ✅ Add Vercel environment variable
3. ⏳ Create Meta Developer App
4. ⏳ Configure webhook in Meta
5. ⏳ Test with a message
6. ⏳ Build connect UI for users

---

## Files Reference

| File | Purpose |
|------|---------|
| `src/lib/integrations/adapters/whatsapp.ts` | Core adapter with signal detection |
| `src/app/api/whatsapp/webhook/route.ts` | Receives messages from Meta |
| `src/app/api/whatsapp/connect/route.ts` | Connect/disconnect/status API |
| `supabase/migrations/005_add_whatsapp_provider.sql` | Database migration |
