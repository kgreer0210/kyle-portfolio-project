-- Chat assistant tables: stores diagnostic conversations between site visitors
-- and the AI chat widget, plus the per-turn message log used to render the
-- transcript in the email digest sent to Kyle.

create extension if not exists "pgcrypto";

create table if not exists public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  visitor_name text,
  visitor_email text,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  status text not null default 'active'
    check (status in ('active', 'completed', 'abandoned')),
  summary text,
  intent text
    check (intent in ('exploring', 'ready_to_book', 'tire_kicker', 'support', 'spam', 'unknown')),
  lead_score int check (lead_score is null or (lead_score >= 0 and lead_score <= 100)),
  score_tier text
    check (score_tier is null or score_tier in ('high', 'medium', 'low')),
  follow_up_status text not null default 'pending'
    check (follow_up_status in ('pending', 'in_progress', 'completed', 'no_action'))
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null
    references public.chat_conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_conversation_id_created_at_idx
  on public.chat_messages (conversation_id, created_at);

create index if not exists chat_conversations_started_at_idx
  on public.chat_conversations (started_at desc);

create index if not exists chat_conversations_follow_up_status_idx
  on public.chat_conversations (follow_up_status)
  where follow_up_status = 'pending';

-- Lock everything down. The chat endpoint runs server-side with the service
-- role key, so it bypasses RLS. No client-side writes, no public reads.
alter table public.chat_conversations enable row level security;
alter table public.chat_messages enable row level security;
