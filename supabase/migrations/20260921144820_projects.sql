-- Projects replace the onboarding questionnaire. A project is created from a
-- signed SOW (or by hand) and carries milestones, tasks, and the list of
-- things the client still needs to provide.
--
-- Access model: admins manage everything. Organization members may only
-- SELECT; every client write goes through a server route that checks
-- membership and uses the service role. Child tables carry organization_id
-- and a composite FK to projects(id, organization_id) so a row can never
-- point at another organization's project.

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  title text not null,
  summary text,
  status text not null default 'active',
  start_date date,
  target_date date,
  contract_amount numeric(10, 2),
  deposit_percent numeric(5, 2),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (id, organization_id)
);

alter table public.projects
  drop constraint if exists projects_status_check;
alter table public.projects
  add constraint projects_status_check
  check (status in ('active', 'paused', 'done'))
  not valid;
alter table public.projects
  validate constraint projects_status_check;

alter table public.projects
  drop constraint if exists projects_amounts_check;
alter table public.projects
  add constraint projects_amounts_check
  check (
    (contract_amount is null or (contract_amount >= 0 and contract_amount <> 'NaN'::numeric))
    and (deposit_percent is null or (deposit_percent >= 0 and deposit_percent <= 100))
  )
  not valid;
alter table public.projects
  validate constraint projects_amounts_check;

create table if not exists public.project_milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  organization_id uuid not null,
  title text not null,
  description text,
  position integer not null default 0,
  due_date date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  foreign key (project_id, organization_id)
    references public.projects (id, organization_id) on delete cascade,
  unique (id, project_id)
);

create table if not exists public.project_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  organization_id uuid not null,
  milestone_id uuid,
  title text not null,
  position integer not null default 0,
  client_visible boolean not null default true,
  done_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  foreign key (project_id, organization_id)
    references public.projects (id, organization_id) on delete cascade,
  -- A task's milestone must belong to the same project. Deleting the
  -- milestone deletes its tasks.
  foreign key (milestone_id, project_id)
    references public.project_milestones (id, project_id) on delete cascade
);

create table if not exists public.project_requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  organization_id uuid not null,
  kind text not null default 'material',
  title text not null,
  instructions text,
  status text not null default 'open',
  client_note text,
  due_date date,
  last_reminded_at timestamptz,
  ticket_id uuid references public.tickets (id) on delete set null,
  position integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  foreign key (project_id, organization_id)
    references public.projects (id, organization_id) on delete cascade
);

alter table public.project_requests
  drop constraint if exists project_requests_kind_check;
alter table public.project_requests
  add constraint project_requests_kind_check
  check (kind in ('material', 'access', 'decision', 'info'))
  not valid;
alter table public.project_requests
  validate constraint project_requests_kind_check;

alter table public.project_requests
  drop constraint if exists project_requests_status_check;
alter table public.project_requests
  add constraint project_requests_status_check
  check (status in ('open', 'later', 'done'))
  not valid;
alter table public.project_requests
  validate constraint project_requests_status_check;

-- The source SOW and the raw AI extraction. Admin-only: extraction notes and
-- out-of-scope lists are internal and must never reach the client. The file
-- columns are null for hand-made projects that only record scope notes.
create table if not exists public.project_sow (
  project_id uuid primary key,
  organization_id uuid not null,
  storage_path text,
  file_name text,
  extraction jsonb not null default '{}'::jsonb,
  model text,
  created_at timestamptz not null default timezone('utc', now()),
  foreign key (project_id, organization_id)
    references public.projects (id, organization_id) on delete cascade
);

alter table public.tickets
  add column if not exists project_id uuid references public.projects (id) on delete set null;

create index if not exists idx_projects_organization_id
  on public.projects (organization_id, status);
create index if not exists idx_project_milestones_project
  on public.project_milestones (project_id, position);
create index if not exists idx_project_tasks_project
  on public.project_tasks (project_id, position);
create index if not exists idx_project_tasks_milestone
  on public.project_tasks (milestone_id);
create index if not exists idx_project_requests_project
  on public.project_requests (project_id, position);
create index if not exists idx_project_requests_ticket
  on public.project_requests (ticket_id);
create index if not exists idx_tickets_project_id
  on public.tickets (project_id);

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

drop trigger if exists set_project_milestones_updated_at on public.project_milestones;
create trigger set_project_milestones_updated_at
before update on public.project_milestones
for each row execute function public.set_updated_at();

drop trigger if exists set_project_tasks_updated_at on public.project_tasks;
create trigger set_project_tasks_updated_at
before update on public.project_tasks
for each row execute function public.set_updated_at();

drop trigger if exists set_project_requests_updated_at on public.project_requests;
create trigger set_project_requests_updated_at
before update on public.project_requests
for each row execute function public.set_updated_at();

alter table public.projects enable row level security;
alter table public.project_milestones enable row level security;
alter table public.project_tasks enable row level security;
alter table public.project_requests enable row level security;
alter table public.project_sow enable row level security;

drop policy if exists "projects_admin_manage" on public.projects;
create policy "projects_admin_manage"
on public.projects for all to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "projects_member_select" on public.projects;
create policy "projects_member_select"
on public.projects for select to authenticated
using (public.is_organization_member(organization_id));

drop policy if exists "project_milestones_admin_manage" on public.project_milestones;
create policy "project_milestones_admin_manage"
on public.project_milestones for all to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "project_milestones_member_select" on public.project_milestones;
create policy "project_milestones_member_select"
on public.project_milestones for select to authenticated
using (public.is_organization_member(organization_id));

drop policy if exists "project_tasks_admin_manage" on public.project_tasks;
create policy "project_tasks_admin_manage"
on public.project_tasks for all to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "project_tasks_member_select" on public.project_tasks;
create policy "project_tasks_member_select"
on public.project_tasks for select to authenticated
using (public.is_organization_member(organization_id) and client_visible);

drop policy if exists "project_requests_admin_manage" on public.project_requests;
create policy "project_requests_admin_manage"
on public.project_requests for all to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "project_requests_member_select" on public.project_requests;
create policy "project_requests_member_select"
on public.project_requests for select to authenticated
using (public.is_organization_member(organization_id));

drop policy if exists "project_sow_admin_manage" on public.project_sow;
create policy "project_sow_admin_manage"
on public.project_sow for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- SOW files: private bucket, admin-only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('sow-documents', 'sow-documents', false, 20971520, array['application/pdf'])
on conflict (id) do nothing;

drop policy if exists "sow_documents_admin_manage" on storage.objects;
create policy "sow_documents_admin_manage"
on storage.objects for all to authenticated
using (bucket_id = 'sow-documents' and public.is_admin())
with check (bucket_id = 'sow-documents' and public.is_admin());

-- Onboarding is retired. Existing answers stay readable, but clients can no
-- longer write to onboarding tables directly.
drop policy if exists "client_onboardings_member_update_or_admin" on public.client_onboardings;
drop policy if exists "client_onboardings_admin_update" on public.client_onboardings;
create policy "client_onboardings_admin_update"
on public.client_onboardings for update to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "onboarding_step_responses_member_insert_or_admin" on public.onboarding_step_responses;
drop policy if exists "onboarding_step_responses_member_update_or_admin" on public.onboarding_step_responses;
