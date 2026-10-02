-- Project context is private; client assistants access approved notes via the server.
create table public.project_context_sources (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  organization_id uuid not null,
  kind text not null check (kind in ('website','github','manual')),
  label text not null check (length(label) between 1 and 160),
  locator text not null default '',
  config jsonb not null default '{}',
  enabled boolean not null default true,
  active_run_id uuid,
  revision integer not null default 1,
  next_sync_at timestamptz not null default now(),
  last_success_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (project_id,organization_id) references public.projects(id,organization_id) on delete cascade,
  unique(id,project_id,organization_id)
);
create table public.project_context_sync_runs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null,
  project_id uuid not null,
  organization_id uuid not null,
  source_revision integer not null,
  trigger text not null default 'manual',
  status text not null default 'queued' check (status in ('queued','running','complete','failed')),
  attempt integer not null default 0,
  available_at timestamptz not null default now(),
  claimed_until timestamptz,
  claim_token uuid,
  cursor jsonb not null default '{}',
  source_version text,
  coverage text,
  last_error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  foreign key(source_id,project_id,organization_id) references public.project_context_sources(id,project_id,organization_id) on delete cascade,
  unique(id,source_id,project_id,organization_id)
);
alter table public.project_context_sources add constraint context_active_run_fk
  foreign key(active_run_id,id,project_id,organization_id)
  references public.project_context_sync_runs(id,source_id,project_id,organization_id);
create unique index context_one_pending_run on public.project_context_sync_runs(source_id)
  where status in ('queued','running');
create index context_pending_runs on public.project_context_sync_runs(available_at) where status in ('queued','running');
create table public.project_context_entries (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null,
  run_id uuid not null,
  project_id uuid not null,
  organization_id uuid not null,
  entry_key text not null,
  title text not null,
  content text not null check(length(content)<=16000),
  locator text not null default '',
  audience text not null default 'admin' check(audience in ('admin','client')),
  observed_at timestamptz not null default now(),
  search_text tsvector generated always as (to_tsvector('english',title || ' ' || content)) stored,
  foreign key(run_id,source_id,project_id,organization_id) references public.project_context_sync_runs(id,source_id,project_id,organization_id) on delete cascade,
  unique(run_id,entry_key)
);
create index context_entry_search on public.project_context_entries using gin(search_text);
create index context_entry_project on public.project_context_entries(project_id,organization_id,run_id,audience);

alter table public.project_context_sources enable row level security;
alter table public.project_context_sync_runs enable row level security;
alter table public.project_context_entries enable row level security;
create policy context_sources_admin on public.project_context_sources for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy context_runs_admin on public.project_context_sync_runs for select to authenticated using(public.is_admin());
create policy context_entries_admin on public.project_context_entries for select to authenticated using(public.is_admin());
revoke all on public.project_context_sources,public.project_context_sync_runs,public.project_context_entries from anon,authenticated;
grant select,insert,update,delete on public.project_context_sources to authenticated;
grant select on public.project_context_sync_runs,public.project_context_entries to authenticated;
grant all on public.project_context_sources,public.project_context_sync_runs,public.project_context_entries to service_role;
create trigger context_source_updated before update on public.project_context_sources for each row execute function public.set_updated_at();

-- Worker functions are service-role-only and use invoker permissions.
create function public.claim_project_context_run(p_run_id uuid default null)
returns setof public.project_context_sync_runs language plpgsql security invoker set search_path=public as $$
declare v_id uuid;
begin
  select r.id into v_id from project_context_sync_runs r join project_context_sources s on s.id=r.source_id
    where (p_run_id is null or r.id=p_run_id) and s.enabled and r.source_revision=s.revision
    and r.attempt<4 and r.available_at<=now()
    and (r.status='queued' or (r.status='running' and r.claimed_until<now()))
    order by r.created_at for update of r skip locked limit 1;
  if v_id is null then return; end if;
  return query update project_context_sync_runs set status='running',attempt=attempt+1,
    claimed_until=now()+interval '3 minutes',claim_token=gen_random_uuid() where id=v_id returning *;
end $$;
create function public.finish_project_context_run(p_run_id uuid,p_claim_token uuid,p_entries jsonb,p_cursor jsonb,p_version text,p_coverage text,p_done boolean)
returns boolean language plpgsql security invoker set search_path=public as $$
declare r project_context_sync_runs; s project_context_sources;
begin
  select * into r from project_context_sync_runs where id=p_run_id for update;
  if not found or r.status<>'running' or r.claim_token is distinct from p_claim_token or r.claimed_until<now() then return false; end if;
  select * into s from project_context_sources where id=r.source_id for update;
  if not s.enabled or s.revision<>r.source_revision then
    update project_context_sync_runs set status='failed',last_error='Source changed during scan' where id=r.id; return false;
  end if;
  insert into project_context_entries(source_id,run_id,project_id,organization_id,entry_key,title,content,locator,audience)
    select r.source_id,r.id,r.project_id,r.organization_id,e->>'key',e->>'title',e->>'content',coalesce(e->>'locator',''),
      case when s.kind='manual' and e->>'audience'='client' then 'client' else 'admin' end
    from jsonb_array_elements(p_entries) e
    on conflict(run_id,entry_key) do update set title=excluded.title,content=excluded.content,locator=excluded.locator,audience=excluded.audience;
  update project_context_sync_runs set status=case when p_done then 'complete' else 'queued' end,
    cursor=p_cursor,source_version=p_version,coverage=p_coverage,claim_token=null,claimed_until=null,
    attempt=case when p_done then attempt else 0 end,available_at=now(),completed_at=case when p_done then now() end where id=r.id;
  if p_done then
    update project_context_sources set active_run_id=r.id,last_success_at=now(),last_error=null,next_sync_at=now()+interval '1 day' where id=r.source_id;
    -- Keep the active and previous successful version only.
    delete from project_context_sync_runs where source_id=r.source_id and status='complete' and id not in
      (select id from project_context_sync_runs where source_id=r.source_id and status='complete' order by completed_at desc limit 2);
  end if;
  return true;
end $$;
create function public.fail_project_context_run(p_run_id uuid,p_claim_token uuid,p_error text)
returns boolean language plpgsql security invoker set search_path=public as $$
declare r project_context_sync_runs;
begin
  select * into r from project_context_sync_runs where id=p_run_id for update;
  if not found or r.status<>'running' or r.claim_token is distinct from p_claim_token then return false; end if;
  update project_context_sync_runs set status=case when attempt>=4 then 'failed' else 'queued' end,
    available_at=now()+make_interval(secs=>30*attempt*attempt),claim_token=null,claimed_until=null,last_error=left(p_error,200) where id=r.id;
  update project_context_sources set last_error=left(p_error,200) where id=r.source_id;
  return true;
end $$;
revoke all on function public.claim_project_context_run(uuid),public.finish_project_context_run(uuid,uuid,jsonb,jsonb,text,text,boolean),public.fail_project_context_run(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.claim_project_context_run(uuid),public.finish_project_context_run(uuid,uuid,jsonb,jsonb,text,text,boolean),public.fail_project_context_run(uuid,uuid,text) to service_role;
create function public.search_project_context(p_project_id uuid,p_organization_id uuid,p_query text,p_client boolean default false)
returns table(id uuid,title text,content text,locator text,observed_at timestamptz,source_version text,coverage text)
language sql stable security invoker set search_path=public as $$
  select e.id,e.title,left(e.content,2400),e.locator,e.observed_at,r.source_version,r.coverage
  from project_context_entries e join project_context_sources s on s.id=e.source_id and s.active_run_id=e.run_id
  join project_context_sync_runs r on r.id=e.run_id
  where e.project_id=p_project_id and e.organization_id=p_organization_id and s.enabled
  and (not p_client or (e.audience='client' and s.kind='manual'))
  and e.search_text @@ websearch_to_tsquery('english',left(p_query,2000))
  order by ts_rank(e.search_text,websearch_to_tsquery('english',left(p_query,2000))) desc,e.observed_at desc limit 5;
$$;
revoke all on function public.search_project_context(uuid,uuid,text,boolean) from public,anon,authenticated;
grant execute on function public.search_project_context(uuid,uuid,text,boolean) to service_role;
