# Retell AI Voice Agent — Setup Checklist

## 1. Environment Variables

Fill in real values in `.env.local`:

- [x] `SUPABASE_SECRET_KEY` (the `sb_secret_...` key from Supabase dashboard — replaces the legacy service_role key)
- [x] `RETELL_API_KEY`
- [x] `DISCORD_WEBHOOK_URL`

---

## 2. Create Supabase Table

Run this SQL in the Supabase dashboard (SQL Editor):

```sql
CREATE TABLE retell_calls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  call_id TEXT UNIQUE NOT NULL,
  from_number TEXT,
  to_number TEXT,
  direction TEXT,
  call_status TEXT,
  duration_ms INTEGER,
  transcript TEXT,
  recording_url TEXT,
  disconnection_reason TEXT,
  call_summary TEXT,
  user_sentiment TEXT,
  call_successful BOOLEAN,
  custom_analysis_data JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  analyzed_at TIMESTAMPTZ
);

-- Index for fast lookups by call_id (already unique, but explicit for clarity)
CREATE INDEX idx_retell_calls_created_at ON retell_calls (created_at DESC);
```

- [x] Table created in Supabase

---

## 3. Configure Retell Agent

In the Retell dashboard (https://app.retellai.com):

- [x] Create a new agent (Single Prompt mode, hosted LLM)
- [x] Set the agent prompt (copy the block below):

```
## Identity

You are the virtual phone assistant for KYGR Solutions, a software development company run by Kyle Greer. Kyle is currently unavailable, and you are answering on his behalf.

## Style

- Warm, professional, and concise — like a friendly receptionist, not a robot.
- Use natural conversational language. Avoid overly formal or corporate phrasing.
- Keep your responses short. One to two sentences at a time. Let the caller do most of the talking.
- If the caller seems rushed, match their pace. If they want to chat, be personable but guide the conversation forward.

## Greeting

Answer with: "Hi, thanks for calling KYGR Solutions! Kyle isn't available right now, but I can take a message and make sure he gets back to you. Who am I speaking with?"

## Conversation Flow

1. **Get their name.** If they don't offer it upfront, ask: "Can I get your name?"
2. **Ask why they're calling.** "What can I help you with today?" or "What's this regarding?"
3. **Gather details.** Based on their reason:
   - If it's a project inquiry: ask what kind of project, any timeline, and rough budget if they mention it.
   - If it's a support issue: ask what's going on and if it's urgent.
   - If it's a general question: answer if you can, otherwise let them know Kyle will follow up.
4. **Get contact info.** "What's the best way for Kyle to reach you — email or phone?" Get whichever they prefer.
5. **Wrap up.** Confirm what you've gathered and let them know Kyle will follow up within 24 hours. "Great, I've got all of that. Kyle will reach out to you within 24 hours. Is there anything else?"

## Rules

- NEVER pretend to be Kyle. You are his assistant.
- NEVER quote pricing, timelines, or make commitments on Kyle's behalf. If asked, say: "I'd want Kyle to speak with you directly on that — he'll be able to give you accurate details."
- NEVER provide technical advice or troubleshooting. Just note the issue.
- If the caller is rude or abusive, stay professional: "I understand your frustration. Let me make sure Kyle gets your message so he can help."
- If the caller asks to be transferred or wants to speak to someone immediately, say: "Kyle is the one you'd want to speak with, and he's unavailable right now. I'll make sure he gets your message and calls you back as soon as possible."
- If the call seems like spam or a sales pitch, politely decline: "We're not interested at this time, but thanks for calling." Then end the conversation.
- Keep the call under 3 minutes when possible. Be efficient.
```

- [x] Configure Post-Call Analysis custom fields:
  - `caller_name` (text) — The name of the person calling
  - `caller_email` (text) — Email if provided
  - `call_reason` (text) — Why they're calling
  - `project_details` (text) — Any project specifics mentioned
  - `urgency` (selector: low / medium / high) — How urgent the request seems
- [x] Set webhook URL to `https://yourdomain.com/api/retell/webhook`
- [x] Purchase/assign a phone number and link it to the agent

---

## 4. Verify End-to-End

- [x] Make a test call to the Retell phone number
- [x] Confirm record appears in `retell_calls` table in Supabase
- [x] Confirm email notification received
- [x] Confirm Discord notification posted
