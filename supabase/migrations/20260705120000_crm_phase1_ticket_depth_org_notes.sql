do $$
begin
  if not exists (select 1 from pg_type where typname = 'ticket_priority') then
    create type public.ticket_priority as enum ('low', 'normal', 'high', 'urgent');
  end if;
end
$$;

alter table public.tickets
  add column if not exists priority public.ticket_priority not null default 'normal';

alter table public.tickets
  add column if not exists category text;

create table if not exists public.organization_notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete restrict,
  body text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_tickets_status_priority_activity
  on public.tickets (status, priority, last_activity_at desc);

create index if not exists idx_ticket_messages_created_at
  on public.ticket_messages (created_at desc);

create index if not exists idx_organization_notes_org
  on public.organization_notes (organization_id, created_at desc);

drop trigger if exists set_organization_notes_updated_at on public.organization_notes;
create trigger set_organization_notes_updated_at
before update on public.organization_notes
for each row execute function public.set_updated_at();

alter table public.organization_notes enable row level security;

drop policy if exists "organization_notes_admin_manage" on public.organization_notes;
create policy "organization_notes_admin_manage"
on public.organization_notes
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
