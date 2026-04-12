create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'profile_role') then
    create type public.profile_role as enum ('admin', 'client');
  end if;

  if not exists (select 1 from pg_type where typname = 'profile_status') then
    create type public.profile_status as enum ('invited', 'active', 'disabled');
  end if;

  if not exists (select 1 from pg_type where typname = 'client_kind') then
    create type public.client_kind as enum ('new', 'legacy');
  end if;

  if not exists (select 1 from pg_type where typname = 'organization_member_role') then
    create type public.organization_member_role as enum ('owner', 'member');
  end if;

  if not exists (select 1 from pg_type where typname = 'onboarding_mode') then
    create type public.onboarding_mode as enum ('standard', 'skipped_legacy');
  end if;

  if not exists (select 1 from pg_type where typname = 'onboarding_status') then
    create type public.onboarding_status as enum (
      'not_started',
      'in_progress',
      'submitted',
      'completed',
      'reopened',
      'skipped_legacy'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'ticket_type') then
    create type public.ticket_type as enum ('request', 'issue');
  end if;

  if not exists (select 1 from pg_type where typname = 'ticket_status') then
    create type public.ticket_status as enum (
      'new',
      'open',
      'waiting_on_client',
      'in_progress',
      'resolved',
      'closed'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'ticket_message_visibility') then
    create type public.ticket_message_visibility as enum ('public', 'internal');
  end if;
end
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text,
  role public.profile_role not null default 'client',
  status public.profile_status not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  client_kind public.client_kind not null default 'new',
  primary_contact_name text,
  primary_contact_email text,
  website_url text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.organization_member_role not null default 'member',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, user_id)
);

create table if not exists public.client_onboardings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations (id) on delete cascade,
  mode public.onboarding_mode not null default 'standard',
  status public.onboarding_status not null default 'not_started',
  current_step text not null default 'account-setup',
  completed_steps text[] not null default '{}'::text[],
  review_notes text,
  started_at timestamptz,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.onboarding_step_responses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  step_key text not null,
  response jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, step_key)
);

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  created_by uuid not null references public.profiles (id) on delete restrict,
  type public.ticket_type not null default 'request',
  status public.ticket_status not null default 'new',
  title text not null,
  description text not null,
  last_activity_at timestamptz not null default timezone('utc', now()),
  resolved_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete restrict,
  visibility public.ticket_message_visibility not null default 'public',
  body text not null,
  is_system boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.ticket_attachments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  message_id uuid references public.ticket_messages (id) on delete cascade,
  uploaded_by uuid not null references public.profiles (id) on delete restrict,
  visibility public.ticket_message_visibility not null default 'public',
  bucket_id text not null default 'ticket-attachments',
  storage_path text not null unique,
  file_name text not null,
  mime_type text,
  file_size bigint not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_organization_members_user_id
  on public.organization_members (user_id);

create index if not exists idx_onboarding_step_responses_organization_id
  on public.onboarding_step_responses (organization_id);

create index if not exists idx_tickets_organization_id
  on public.tickets (organization_id);

create index if not exists idx_tickets_status
  on public.tickets (status);

create index if not exists idx_ticket_messages_ticket_id
  on public.ticket_messages (ticket_id);

create index if not exists idx_ticket_attachments_ticket_id
  on public.ticket_attachments (ticket_id);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_organizations_updated_at on public.organizations;
create trigger set_organizations_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

drop trigger if exists set_organization_members_updated_at on public.organization_members;
create trigger set_organization_members_updated_at
before update on public.organization_members
for each row execute function public.set_updated_at();

drop trigger if exists set_client_onboardings_updated_at on public.client_onboardings;
create trigger set_client_onboardings_updated_at
before update on public.client_onboardings
for each row execute function public.set_updated_at();

drop trigger if exists set_onboarding_step_responses_updated_at on public.onboarding_step_responses;
create trigger set_onboarding_step_responses_updated_at
before update on public.onboarding_step_responses
for each row execute function public.set_updated_at();

drop trigger if exists set_tickets_updated_at on public.tickets;
create trigger set_tickets_updated_at
before update on public.tickets
for each row execute function public.set_updated_at();

drop trigger if exists set_ticket_messages_updated_at on public.ticket_messages;
create trigger set_ticket_messages_updated_at
before update on public.ticket_messages
for each row execute function public.set_updated_at();

drop trigger if exists set_ticket_attachments_updated_at on public.ticket_attachments;
create trigger set_ticket_attachments_updated_at
before update on public.ticket_attachments
for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.is_organization_member(target_organization uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members
    where organization_id = target_organization
      and user_id = auth.uid()
  );
$$;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_organization_member(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.client_onboardings enable row level security;
alter table public.onboarding_step_responses enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_messages enable row level security;
alter table public.ticket_attachments enable row level security;

drop policy if exists "profiles_select_self_or_admin" on public.profiles;
create policy "profiles_select_self_or_admin"
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_admin_manage" on public.profiles;
create policy "profiles_admin_manage"
on public.profiles
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "organizations_select_member_or_admin" on public.organizations;
create policy "organizations_select_member_or_admin"
on public.organizations
for select
to authenticated
using (public.is_admin() or public.is_organization_member(id));

drop policy if exists "organizations_admin_manage" on public.organizations;
create policy "organizations_admin_manage"
on public.organizations
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "organization_members_select_member_or_admin" on public.organization_members;
create policy "organization_members_select_member_or_admin"
on public.organization_members
for select
to authenticated
using (
  public.is_admin()
  or user_id = auth.uid()
  or public.is_organization_member(organization_id)
);

drop policy if exists "organization_members_admin_manage" on public.organization_members;
create policy "organization_members_admin_manage"
on public.organization_members
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "client_onboardings_select_member_or_admin" on public.client_onboardings;
create policy "client_onboardings_select_member_or_admin"
on public.client_onboardings
for select
to authenticated
using (public.is_admin() or public.is_organization_member(organization_id));

drop policy if exists "client_onboardings_member_update_or_admin" on public.client_onboardings;
create policy "client_onboardings_member_update_or_admin"
on public.client_onboardings
for update
to authenticated
using (public.is_admin() or public.is_organization_member(organization_id))
with check (public.is_admin() or public.is_organization_member(organization_id));

drop policy if exists "client_onboardings_admin_insert" on public.client_onboardings;
create policy "client_onboardings_admin_insert"
on public.client_onboardings
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "onboarding_step_responses_select_member_or_admin" on public.onboarding_step_responses;
create policy "onboarding_step_responses_select_member_or_admin"
on public.onboarding_step_responses
for select
to authenticated
using (public.is_admin() or public.is_organization_member(organization_id));

drop policy if exists "onboarding_step_responses_member_insert_or_admin" on public.onboarding_step_responses;
create policy "onboarding_step_responses_member_insert_or_admin"
on public.onboarding_step_responses
for insert
to authenticated
with check (public.is_admin() or public.is_organization_member(organization_id));

drop policy if exists "onboarding_step_responses_member_update_or_admin" on public.onboarding_step_responses;
create policy "onboarding_step_responses_member_update_or_admin"
on public.onboarding_step_responses
for update
to authenticated
using (public.is_admin() or public.is_organization_member(organization_id))
with check (public.is_admin() or public.is_organization_member(organization_id));

drop policy if exists "tickets_select_member_or_admin" on public.tickets;
create policy "tickets_select_member_or_admin"
on public.tickets
for select
to authenticated
using (public.is_admin() or public.is_organization_member(organization_id));

drop policy if exists "tickets_member_insert_or_admin" on public.tickets;
create policy "tickets_member_insert_or_admin"
on public.tickets
for insert
to authenticated
with check (
  public.is_admin()
  or (
    public.is_organization_member(organization_id)
    and created_by = auth.uid()
  )
);

drop policy if exists "tickets_admin_update" on public.tickets;
create policy "tickets_admin_update"
on public.tickets
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "ticket_messages_select_public_member_or_admin" on public.ticket_messages;
create policy "ticket_messages_select_public_member_or_admin"
on public.ticket_messages
for select
to authenticated
using (
  public.is_admin()
  or (
    public.is_organization_member(organization_id)
    and visibility = 'public'
  )
);

drop policy if exists "ticket_messages_member_insert_public_or_admin" on public.ticket_messages;
create policy "ticket_messages_member_insert_public_or_admin"
on public.ticket_messages
for insert
to authenticated
with check (
  public.is_admin()
  or (
    public.is_organization_member(organization_id)
    and author_id = auth.uid()
    and visibility = 'public'
  )
);

drop policy if exists "ticket_attachments_select_public_member_or_admin" on public.ticket_attachments;
create policy "ticket_attachments_select_public_member_or_admin"
on public.ticket_attachments
for select
to authenticated
using (
  public.is_admin()
  or (
    public.is_organization_member(organization_id)
    and visibility = 'public'
  )
);

drop policy if exists "ticket_attachments_member_insert_public_or_admin" on public.ticket_attachments;
create policy "ticket_attachments_member_insert_public_or_admin"
on public.ticket_attachments
for insert
to authenticated
with check (
  public.is_admin()
  or (
    public.is_organization_member(organization_id)
    and uploaded_by = auth.uid()
    and visibility = 'public'
  )
);

insert into storage.buckets (id, name, public, file_size_limit)
values ('ticket-attachments', 'ticket-attachments', false, 10485760)
on conflict (id) do nothing;

drop policy if exists "ticket_attachments_storage_select" on storage.objects;
create policy "ticket_attachments_storage_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'ticket-attachments'
  and (
    public.is_admin()
    or (
      public.is_organization_member(((storage.foldername(name))[1])::uuid)
      and coalesce(metadata->>'visibility', 'public') = 'public'
    )
  )
);

drop policy if exists "ticket_attachments_storage_insert" on storage.objects;
create policy "ticket_attachments_storage_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'ticket-attachments'
  and (
    public.is_admin()
    or (
      public.is_organization_member(((storage.foldername(name))[1])::uuid)
      and coalesce(metadata->>'visibility', 'public') = 'public'
    )
  )
);

drop policy if exists "ticket_attachments_storage_update" on storage.objects;
create policy "ticket_attachments_storage_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'ticket-attachments'
  and (
    public.is_admin()
    or (
      public.is_organization_member(((storage.foldername(name))[1])::uuid)
      and coalesce(metadata->>'visibility', 'public') = 'public'
    )
  )
)
with check (
  bucket_id = 'ticket-attachments'
  and (
    public.is_admin()
    or (
      public.is_organization_member(((storage.foldername(name))[1])::uuid)
      and coalesce(metadata->>'visibility', 'public') = 'public'
    )
  )
);
