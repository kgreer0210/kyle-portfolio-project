-- Waiting-on-client automation: when a ticket enters waiting_on_client we
-- record when, so a daily job can nudge the client and later auto-resolve.
alter table public.tickets
  add column if not exists waiting_since timestamptz;

alter table public.tickets
  add column if not exists nudged_at timestamptz;

create index if not exists idx_tickets_waiting_since
  on public.tickets (waiting_since)
  where waiting_since is not null;

-- Existing waiting tickets start their clock now rather than being resolved
-- the first time the job runs.
update public.tickets
set waiting_since = timezone('utc', now())
where status = 'waiting_on_client' and waiting_since is null;

-- Project updates sent to the client. Rows exist only once sent; drafts live
-- in the admin composer.
create table if not exists public.project_updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  organization_id uuid not null,
  body text not null,
  created_by uuid references public.profiles (id) on delete set null,
  sent_at timestamptz not null default timezone('utc', now()),
  foreign key (project_id, organization_id)
    references public.projects (id, organization_id) on delete cascade
);

create index if not exists idx_project_updates_project
  on public.project_updates (project_id, sent_at desc);

alter table public.project_updates enable row level security;

drop policy if exists "project_updates_admin_manage" on public.project_updates;
create policy "project_updates_admin_manage"
on public.project_updates for all to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "project_updates_member_select" on public.project_updates;
create policy "project_updates_member_select"
on public.project_updates for select to authenticated
using (public.is_organization_member(organization_id));
