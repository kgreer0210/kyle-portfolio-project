-- Fence delivery finalization against the claim that owns it.
--
-- A delivery can be reclaimed after 15 minutes (or after a failure), so the
-- stable delivery id alone does not identify the worker that owns the current
-- attempt. Without a fence a stalled worker can finalize a claim that a newer
-- worker already took over -- for example flipping a freshly `sent` delivery
-- back to `failed`, which would let the next cron run send a duplicate email.
--
-- `attempts` is already incremented on every (re)claim, so it doubles as a
-- monotonic claim token. The claim RPC now returns it and both completion RPCs
-- require it, together with `status = 'processing'`, before writing.

drop function if exists public.claim_notification_delivery(text, uuid, text, timestamptz);
drop function if exists public.mark_notification_delivery_sent(uuid, timestamptz);
drop function if exists public.mark_notification_delivery_failed(uuid, text, timestamptz);

create function public.claim_notification_delivery(
  p_kind text,
  p_resource_id uuid,
  p_period_key text,
  p_now timestamptz
)
returns table (delivery_id uuid, claimed boolean, already_sent boolean, attempt integer)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  delivery public.notification_deliveries%rowtype;
  v_attempt integer;
begin
  insert into public.notification_deliveries (
    kind,
    resource_id,
    period_key,
    claimed_at,
    updated_at
  )
  values (p_kind, p_resource_id, p_period_key, p_now, p_now)
  on conflict (kind, resource_id, period_key) do nothing
  returning * into delivery;

  if found then
    return query select delivery.id, true, false, delivery.attempts;
    return;
  end if;

  select *
  into delivery
  from public.notification_deliveries
  where kind = p_kind
    and resource_id = p_resource_id
    and period_key = p_period_key
  for update;

  if delivery.status = 'sent' then
    return query select delivery.id, false, true, delivery.attempts;
    return;
  end if;

  if delivery.status = 'failed'
     or delivery.claimed_at < p_now - interval '15 minutes' then
    update public.notification_deliveries
    set status = 'processing',
        attempts = attempts + 1,
        claimed_at = p_now,
        last_error = null,
        updated_at = p_now
    where id = delivery.id
    returning attempts into v_attempt;

    return query select delivery.id, true, false, v_attempt;
    return;
  end if;

  -- Another invocation owns a fresh claim. It will send or release it.
  return query select delivery.id, false, false, delivery.attempts;
end;
$$;

-- Both finalizers report whether they actually owned the claim, so a caller
-- that lost the race can log it instead of assuming the write landed.
create function public.mark_notification_delivery_sent(
  p_delivery_id uuid,
  p_attempt integer,
  p_now timestamptz
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  updated integer;
begin
  update public.notification_deliveries
  set status = 'sent',
      sent_at = p_now,
      last_error = null,
      updated_at = p_now
  where id = p_delivery_id
    and attempts = p_attempt
    and status = 'processing';

  get diagnostics updated = row_count;
  return updated > 0;
end;
$$;

create function public.mark_notification_delivery_failed(
  p_delivery_id uuid,
  p_attempt integer,
  p_error text,
  p_now timestamptz
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  updated integer;
begin
  update public.notification_deliveries
  set status = 'failed',
      last_error = left(p_error, 1000),
      updated_at = p_now
  where id = p_delivery_id
    and attempts = p_attempt
    and status = 'processing';

  get diagnostics updated = row_count;
  return updated > 0;
end;
$$;

revoke execute on function public.claim_notification_delivery(text, uuid, text, timestamptz)
  from public, anon, authenticated;
revoke execute on function public.mark_notification_delivery_sent(uuid, integer, timestamptz)
  from public, anon, authenticated;
revoke execute on function public.mark_notification_delivery_failed(uuid, integer, text, timestamptz)
  from public, anon, authenticated;

grant execute on function public.claim_notification_delivery(text, uuid, text, timestamptz)
  to service_role;
grant execute on function public.mark_notification_delivery_sent(uuid, integer, timestamptz)
  to service_role;
grant execute on function public.mark_notification_delivery_failed(uuid, integer, text, timestamptz)
  to service_role;
