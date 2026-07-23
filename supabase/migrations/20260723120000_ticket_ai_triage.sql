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

-- Constraints are added NOT VALID then validated separately so the ADD
-- takes only a metadata lock instead of a write-blocking table scan.
alter table public.tickets
  drop constraint if exists tickets_cost_amount_check;
-- The NaN exclusion is required: numeric NaN sorts greater than all other
-- values in Postgres, so it would otherwise satisfy >= 0.
alter table public.tickets
  add constraint tickets_cost_amount_check
  check (
    cost_amount is null
    or (cost_amount >= 0 and cost_amount <> 'NaN'::numeric)
  )
  not valid;
alter table public.tickets
  validate constraint tickets_cost_amount_check;

-- How this client pays: trade agreement (price out every fix), monthly plan
-- (small fixes included, major work billable), or per-project. Text rather
-- than an enum (matching the tickets.category pattern), with a check
-- constraint so service-role or future writers can't insert invalid values.
alter table public.organizations
  add column if not exists billing_type text;

alter table public.organizations
  drop constraint if exists organizations_billing_type_check;
alter table public.organizations
  add constraint organizations_billing_type_check
  check (
    billing_type is null
    or billing_type in ('trade', 'monthly_plan', 'per_project')
  )
  not valid;
alter table public.organizations
  validate constraint organizations_billing_type_check;
