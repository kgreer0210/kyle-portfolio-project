create table public.github_app_installations (
  installation_id bigint primary key,
  account_login text not null,
  status text not null default 'active' check(status in ('active','suspended','removed')),
  updated_at timestamptz not null default now()
);
alter table public.github_app_installations enable row level security;
create policy github_installations_admin on public.github_app_installations for select to authenticated using(public.is_admin());
revoke all on public.github_app_installations from anon,authenticated;
grant select on public.github_app_installations to authenticated;
grant all on public.github_app_installations to service_role;
