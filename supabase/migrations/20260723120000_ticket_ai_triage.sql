-- AI ticket triage: allow system/AI-authored ticket messages with no human
-- author, and track when triage last ran on a ticket.
--
-- Client-side inserts still require author_id = auth.uid() via the existing
-- insert policy, so null-author rows can only be written by the service role.

alter table public.ticket_messages
  alter column author_id drop not null;

alter table public.tickets
  add column if not exists ai_triaged_at timestamptz;

-- Optional cost for the fix/update on a ticket. Set by admins; visible to
-- the client in the portal once set (used for trade-agreement leverage
-- sheets and plan-overage billing).
alter table public.tickets
  add column if not exists cost_amount numeric(10, 2);

-- How this client pays: trade agreement (price out every fix), monthly plan
-- (small fixes included, major work billable), or per-project. Plain text
-- validated app-side, matching the tickets.category pattern.
alter table public.organizations
  add column if not exists billing_type text;
