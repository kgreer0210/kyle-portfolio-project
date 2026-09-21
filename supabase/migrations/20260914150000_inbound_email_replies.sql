-- Email replies to ticket notifications. The Message-ID of the inbound email
-- is stored so webhook retries can't post the same reply twice.
alter table public.ticket_messages
  add column if not exists external_message_id text;

create unique index if not exists idx_ticket_messages_external_message_id
  on public.ticket_messages (external_message_id)
  where external_message_id is not null;
