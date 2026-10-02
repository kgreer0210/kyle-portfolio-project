-- Preserve refresh requests that arrive while a pinned snapshot is being scanned.
alter table public.project_context_sources add column requested_at timestamptz not null default now();
alter table public.project_context_sync_runs add column delivery_ids text[] not null default '{}';
create index context_delivery_ids on public.project_context_sync_runs using gin(delivery_ids);
create function public.request_project_context_refresh(p_source_id uuid,p_trigger text default 'manual',p_delivery_id text default null)
returns uuid language plpgsql security invoker set search_path=public as $$
declare s project_context_sources; r project_context_sync_runs; result uuid;
begin
  -- Consistent run-before-source lock order with publication.
  select * into r from project_context_sync_runs where source_id=p_source_id and status in ('queued','running') for update;
  select * into s from project_context_sources where id=p_source_id for update;
  if not found or not s.enabled then return null; end if;
  if p_delivery_id is not null and exists(select 1 from project_context_sync_runs where source_id=s.id and delivery_ids @> array[p_delivery_id]) then return null; end if;
  if r.id is not null then
    if p_trigger<>'scheduled' then update project_context_sources set requested_at=now() where id=s.id; end if;
    if p_delivery_id is not null then update project_context_sync_runs set delivery_ids=array_append(delivery_ids,p_delivery_id) where id=r.id; end if;
    return r.id;
  end if;
  insert into project_context_sync_runs(source_id,project_id,organization_id,source_revision,trigger,delivery_ids)
    values(s.id,s.project_id,s.organization_id,s.revision,p_trigger,case when p_delivery_id is null then '{}'::text[] else array[p_delivery_id] end) returning id into result;
  return result;
exception when unique_violation then return null;
end $$;
revoke all on function public.request_project_context_refresh(uuid,text,text) from public,anon,authenticated;
grant execute on function public.request_project_context_refresh(uuid,text,text) to service_role;
create or replace function public.finish_project_context_run(p_run_id uuid,p_claim_token uuid,p_entries jsonb,p_cursor jsonb,p_version text,p_coverage text,p_done boolean)
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
    update project_context_sources set active_run_id=r.id,last_success_at=now(),last_error=null,next_sync_at=case when requested_at>r.created_at then now() else now()+interval '1 day' end where id=r.source_id;
    -- Keep the active and previous successful version only.
    delete from project_context_sync_runs where source_id=r.source_id and status='complete' and id not in
      (select id from project_context_sync_runs where source_id=r.source_id and status='complete' order by completed_at desc limit 2);
  end if;
  return true;
end $$;
