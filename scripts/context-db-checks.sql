\set ON_ERROR_STOP on
begin;
set local role service_role;
do $$
declare s uuid; r uuid; token uuid; newer uuid; reclaimed uuid; duplicate uuid; result boolean; org uuid='10000000-0000-4000-8000-000000000001'; project uuid='20000000-0000-4000-8000-000000000001';
begin
  insert into project_context_sources(project_id,organization_id,kind,label,locator) values(project,org,'website','Transaction test','https://example.com') returning id into s;
  insert into project_context_sync_runs(source_id,project_id,organization_id,source_revision) values(s,project,org,1) returning id into r;
  select claim_token into token from claim_project_context_run(r);
  select finish_project_context_run(r,gen_random_uuid(),'[]','{}','v1','test',true) into result;
  if result then raise exception 'Wrong claim published'; end if;
  select finish_project_context_run(r,token,'[{"key":"booking","title":"Booking","content":"private website booking","locator":"https://example.com","audience":"client"}]','{}','v1','test',true) into result;
  if not result then raise exception 'Valid claim failed to publish'; end if;
  if exists(select 1 from project_context_entries where run_id=r and audience='client') then raise exception 'Website content exposed to client'; end if;
  insert into project_context_sync_runs(source_id,project_id,organization_id,source_revision) values(s,project,org,1) returning id into newer;
  select claim_token into token from claim_project_context_run(newer);
  perform fail_project_context_run(newer,token,'Test failure');
  if (select active_run_id from project_context_sources where id=s) is distinct from r then raise exception 'Failure removed active snapshot'; end if;
  update project_context_sync_runs set available_at=now() where id=newer;
  select claim_token into token from claim_project_context_run(newer);
  update project_context_sync_runs set claimed_until=now()-interval '1 second' where id=newer;
  select claim_token into reclaimed from claim_project_context_run(newer);
  if finish_project_context_run(newer,token,'[]','{}','v2','test',true) then raise exception 'Expired worker published'; end if;
  update project_context_sources set requested_at=now()+interval '1 second' where id=s;
  if not finish_project_context_run(newer,reclaimed,'[]','{}','v2','test',true) then raise exception 'Reclaimed worker failed'; end if;
  if (select next_sync_at from project_context_sources where id=s)>now()+interval '1 minute' then raise exception 'Follow-up refresh was lost'; end if;
  select request_project_context_refresh(s,'webhook','test-delivery') into duplicate;
  if duplicate is null then raise exception 'Webhook did not queue'; end if;
  if request_project_context_refresh(s,'webhook','test-delivery') is not null then raise exception 'Duplicate webhook queued'; end if;
  update project_context_sources set enabled=false where id=s;
  if exists(select 1 from search_project_context(project,org,'private website',false) where locator='https://example.com') then raise exception 'Disabled source still retrieved'; end if;
  -- token from the old lease cannot complete the reclaimed run.
  if exists(select 1 from project_context_sync_runs where source_id=s and status='running' and claim_token=token) then raise exception 'Expired claim reused token'; end if;
  begin
    insert into project_context_sources(project_id,organization_id,kind,label) values(project,'10000000-0000-4000-8000-000000000002','manual','Cross-org');
    raise exception 'Cross-org source accepted';
  exception when foreign_key_violation then null; end;
end $$;
rollback;
