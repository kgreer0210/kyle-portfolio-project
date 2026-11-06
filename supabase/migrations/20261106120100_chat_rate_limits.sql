-- Atomic rate limiting for the visitor chat endpoint.
--
-- Counters live in a private schema that PostgREST does not expose and that
-- anon/authenticated cannot touch. The only entry point is
-- public.chat_rate_limit_hit, executable by the service role alone. Bucket
-- keys are keyed HMAC hashes computed by the application (RATE_LIMIT_SECRET);
-- no raw IP address or conversation id is stored here.

create schema if not exists chat_private;
revoke all on schema chat_private from public, anon, authenticated;

create table if not exists chat_private.chat_rate_limits (
  bucket text not null check (char_length(bucket) between 1 and 128),
  window_start timestamptz not null,
  hits integer not null default 0,
  primary key (bucket, window_start)
);

create index if not exists chat_rate_limits_window_start_idx
  on chat_private.chat_rate_limits (window_start);

alter table chat_private.chat_rate_limits enable row level security;
revoke all on table chat_private.chat_rate_limits from public, anon, authenticated;

-- Counts one request against each check in p_checks and reports, per check,
-- whether it is still within its limit. p_checks is a JSON array of
-- { "key": text, "limit": int, "window_seconds": int }.
--
-- Each check is a single INSERT ... ON CONFLICT DO UPDATE, so concurrent
-- requests serialize on the row and cannot both read the same count. Checks
-- are applied in key order so two requests touching the same buckets cannot
-- deadlock. Windows are fixed and aligned to the epoch.
--
-- Retention: about 2% of calls delete up to 1000 counter rows older than two
-- days, so the table stays bounded by traffic without needing pg_cron.
create or replace function public.chat_rate_limit_hit(p_checks jsonb)
returns table (ord integer, allowed boolean, retry_after_seconds integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_check record;
  v_now timestamptz := now();
  v_key text;
  v_limit integer;
  v_window integer;
  v_start timestamptz;
  v_hits integer;
begin
  if jsonb_typeof(p_checks) <> 'array'
     or jsonb_array_length(p_checks) not between 1 and 10 then
    raise exception 'p_checks must be an array of 1 to 10 checks';
  end if;

  if random() < 0.02 then
    delete from chat_private.chat_rate_limits
    where ctid = any (
      array(
        select ctid
        from chat_private.chat_rate_limits
        where window_start < v_now - interval '2 days'
        limit 1000
      )
    );
  end if;

  for v_check in
    select e.item, e.idx::integer as idx
    from jsonb_array_elements(p_checks) with ordinality as e(item, idx)
    order by e.item ->> 'key'
  loop
    v_key := v_check.item ->> 'key';
    v_limit := (v_check.item ->> 'limit')::integer;
    v_window := (v_check.item ->> 'window_seconds')::integer;

    if v_key is null or char_length(v_key) not between 1 and 128
       or v_limit is null or v_limit not between 1 and 10000
       or v_window is null or v_window not between 1 and 86400 then
      raise exception 'invalid rate limit check';
    end if;

    v_start := to_timestamp(floor(extract(epoch from v_now) / v_window) * v_window);

    insert into chat_private.chat_rate_limits as r (bucket, window_start, hits)
    values (v_key, v_start, 1)
    on conflict (bucket, window_start)
      do update set hits = least(r.hits + 1, 1000000)
    returning r.hits into v_hits;

    ord := v_check.idx;
    allowed := v_hits <= v_limit;
    retry_after_seconds := greatest(
      1,
      ceil(extract(epoch from (v_start + make_interval(secs => v_window) - v_now)))::integer
    );
    return next;
  end loop;
end;
$$;

revoke execute on function public.chat_rate_limit_hit(jsonb)
  from public, anon, authenticated;
grant execute on function public.chat_rate_limit_hit(jsonb) to service_role;
