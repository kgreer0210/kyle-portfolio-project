-- Admin flag for change requests that fall outside a project's agreed scope.
-- Clients see a "change request, will be quoted" badge when it is set. AI
-- triage only suggests it in the internal note; it never sets the column.
alter table public.tickets
  add column if not exists out_of_scope boolean not null default false;
