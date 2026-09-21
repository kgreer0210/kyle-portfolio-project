-- Durable delivery state for cron-generated email. The unique business key
-- prevents overlapping cron invocations from claiming the same notification,
-- while the stable row id is also used as Resend's idempotency key.
create table public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('waiting_ticket_nudge', 'project_request_reminder')),
  resource_id uuid not null,
  period_key text not null,
  status text not null default 'processing'
    check (status in ('processing', 'sent', 'failed')),
  attempts integer not null default 1 check (attempts > 0),
  claimed_at timestamptz not null default timezone('utc', now()),
  sent_at timestamptz,
  last_error text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (kind, resource_id, period_key)
);

alter table public.notification_deliveries enable row level security;

-- This is an internal service-role outbox. Browser roles should not be able to
-- inspect recipients/delivery timing or mutate delivery state.
revoke all on table public.notification_deliveries from anon, authenticated;
grant select, insert, update on table public.notification_deliveries to service_role;

create or replace function public.claim_notification_delivery(
  p_kind text,
  p_resource_id uuid,
  p_period_key text,
  p_now timestamptz
)
returns table (delivery_id uuid, claimed boolean, already_sent boolean)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  delivery public.notification_deliveries%rowtype;
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
    return query select delivery.id, true, false;
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
    return query select delivery.id, false, true;
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
    where id = delivery.id;

    return query select delivery.id, true, false;
    return;
  end if;

  -- Another invocation owns a fresh claim. It will send or release it.
  return query select delivery.id, false, false;
end;
$$;

create or replace function public.mark_notification_delivery_sent(
  p_delivery_id uuid,
  p_now timestamptz
)
returns void
language sql
security invoker
set search_path = ''
as $$
  update public.notification_deliveries
  set status = 'sent',
      sent_at = p_now,
      last_error = null,
      updated_at = p_now
  where id = p_delivery_id;
$$;

create or replace function public.mark_notification_delivery_failed(
  p_delivery_id uuid,
  p_error text,
  p_now timestamptz
)
returns void
language sql
security invoker
set search_path = ''
as $$
  update public.notification_deliveries
  set status = 'failed',
      last_error = left(p_error, 1000),
      updated_at = p_now
  where id = p_delivery_id;
$$;

revoke execute on function public.claim_notification_delivery(text, uuid, text, timestamptz)
  from public, anon, authenticated;
revoke execute on function public.mark_notification_delivery_sent(uuid, timestamptz)
  from public, anon, authenticated;
revoke execute on function public.mark_notification_delivery_failed(uuid, text, timestamptz)
  from public, anon, authenticated;

grant execute on function public.claim_notification_delivery(text, uuid, text, timestamptz)
  to service_role;
grant execute on function public.mark_notification_delivery_sent(uuid, timestamptz)
  to service_role;
grant execute on function public.mark_notification_delivery_failed(uuid, text, timestamptz)
  to service_role;
