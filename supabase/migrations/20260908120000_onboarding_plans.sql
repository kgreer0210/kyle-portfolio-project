-- Onboarding plans: admin-prepared, project-specific onboarding flow (v2).
-- Additive and idempotent. Existing rows stay on flow_version 'v1' (legacy questionnaire).

alter table public.client_onboardings
  add column if not exists flow_version text not null default 'v1',
  add column if not exists project_type text,
  add column if not exists project_summary text,
  add column if not exists plan jsonb,
  add column if not exists plan_updated_at timestamptz,
  add column if not exists plan_sent_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'client_onboardings_flow_version_check'
  ) then
    alter table public.client_onboardings
      add constraint client_onboardings_flow_version_check
      check (flow_version in ('v1', 'v2'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'client_onboardings_project_type_check'
  ) then
    alter table public.client_onboardings
      add constraint client_onboardings_project_type_check
      check (
        project_type is null
        or project_type in ('new_website', 'existing_website', 'new_app', 'existing_app')
      );
  end if;
end
$$;

-- Org members may UPDATE their own onboarding row through RLS. Admin-owned
-- columns (the plan, status, flow version, send timestamps) must not be
-- editable that way. Service-role writes have auth.uid() = null and pass.
create or replace function public.protect_onboarding_admin_columns()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.plan is distinct from old.plan
      or new.project_type is distinct from old.project_type
      or new.project_summary is distinct from old.project_summary
      or new.flow_version is distinct from old.flow_version
      or new.plan_sent_at is distinct from old.plan_sent_at
      or new.plan_updated_at is distinct from old.plan_updated_at
      or new.status is distinct from old.status
      or new.mode is distinct from old.mode
      or new.reviewed_at is distinct from old.reviewed_at
    then
      raise exception 'Onboarding plan and status fields can only be changed by an admin.'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_onboarding_admin_columns on public.client_onboardings;
create trigger protect_onboarding_admin_columns
  before update on public.client_onboardings
  for each row
  execute function public.protect_onboarding_admin_columns();
