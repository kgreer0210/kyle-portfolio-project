-- Chat contact capture and Turnstile gate state.
--
-- visitor_phone: E.164 US number parsed from the visitor's messages
--   (e.g. +14787771266). visitor_email already exists.
-- turnstile_state: set server-side only. 'verified' means a Cloudflare
--   Turnstile token was verified on the first message. null means the gate has
--   not been passed (or Turnstile was not configured at the time).
--
-- RLS is already enabled on this table with no policies, so only the service
-- role used by the chat routes can read or write these columns.

alter table public.chat_conversations
  add column if not exists visitor_phone text
    check (visitor_phone is null or char_length(visitor_phone) <= 32),
  add column if not exists turnstile_state text
    check (turnstile_state is null or turnstile_state = 'verified');
