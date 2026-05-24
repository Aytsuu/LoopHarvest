alter table api.chat_messages
add column if not exists message_type text not null default 'text',
add column if not exists message_metadata jsonb not null default '{}'::jsonb;

alter table api.chat_messages
drop constraint if exists chat_messages_message_type_check;

alter table api.chat_messages
add constraint chat_messages_message_type_check
check (message_type in ('text', 'system', 'claim_request', 'handoff_request'));

create or replace function api.send_chat_message(
  p_thread_id uuid,
  p_body text
)
returns api.chat_messages
language plpgsql
security definer
set search_path = api, public
as $$
declare
  v_current_user_id uuid := auth.uid();
  v_thread api.chat_threads;
  v_message api.chat_messages;
  v_body text := btrim(p_body);
begin
  if v_current_user_id is null then
    raise exception 'Authentication is required';
  end if;

  if v_body is null or char_length(v_body) = 0 then
    raise exception 'Message body is required';
  end if;

  select *
  into v_thread
  from api.chat_threads
  where id = p_thread_id
    and (participant_a_id = v_current_user_id or participant_b_id = v_current_user_id);

  if not found then
    raise exception 'Chat thread was not found';
  end if;

  insert into api.chat_messages (thread_id, sender_id, body, message_type, message_metadata)
  values (p_thread_id, v_current_user_id, v_body, 'text', '{}'::jsonb)
  returning *
  into v_message;

  update api.chat_threads
  set
    last_message_body = v_message.body,
    last_message_at = v_message.created_at,
    last_message_sender_id = v_current_user_id,
    participant_a_last_read_at = case
      when participant_a_id = v_current_user_id then v_message.created_at
      else participant_a_last_read_at
    end,
    participant_b_last_read_at = case
      when participant_b_id = v_current_user_id then v_message.created_at
      else participant_b_last_read_at
    end
  where id = p_thread_id;

  return v_message;
end;
$$;

create or replace function api.append_system_chat_message(
  p_thread_id uuid,
  p_body text
)
returns api.chat_messages
language plpgsql
security definer
set search_path = api, public
as $$
declare
  v_current_user_id uuid := auth.uid();
  v_thread api.chat_threads;
  v_message api.chat_messages;
  v_body text := btrim(p_body);
begin
  if v_current_user_id is null then
    raise exception 'Authentication is required';
  end if;

  if v_body is null or char_length(v_body) = 0 then
    raise exception 'Message body is required';
  end if;

  select *
  into v_thread
  from api.chat_threads
  where id = p_thread_id
    and (participant_a_id = v_current_user_id or participant_b_id = v_current_user_id);

  if not found then
    raise exception 'Chat thread was not found';
  end if;

  insert into api.chat_messages (thread_id, sender_id, body, is_system, message_type, message_metadata)
  values (p_thread_id, v_current_user_id, v_body, true, 'system', '{}'::jsonb)
  returning *
  into v_message;

  update api.chat_threads
  set
    last_message_body = v_message.body,
    last_message_at = v_message.created_at,
    last_message_sender_id = v_current_user_id
  where id = p_thread_id;

  return v_message;
end;
$$;

create or replace function api.send_handoff_request_message(
  p_thread_id uuid
)
returns api.chat_messages
language plpgsql
security definer
set search_path = api, public
as $$
declare
  v_current_user_id uuid := auth.uid();
  v_thread api.chat_threads;
  v_listing api.listings%rowtype;
  v_existing api.chat_messages;
  v_message api.chat_messages;
  v_recipient_user_id uuid;
begin
  if v_current_user_id is null then
    raise exception 'Authentication is required';
  end if;

  select *
  into v_thread
  from api.chat_threads
  where id = p_thread_id
    and (participant_a_id = v_current_user_id or participant_b_id = v_current_user_id);

  if not found then
    raise exception 'Chat thread was not found';
  end if;

  if v_thread.listing_id is null then
    raise exception 'A listing-linked thread is required';
  end if;

  select *
  into v_listing
  from api.listings
  where id = v_thread.listing_id;

  if not found then
    raise exception 'Listing was not found';
  end if;

  if v_listing.donor_id <> v_current_user_id then
    raise exception 'Only the donor can request handoff confirmation';
  end if;

  if coalesce(v_listing.claim_type, 'direct') <> 'message' then
    raise exception 'This listing does not require message-based handoff confirmation';
  end if;

  if v_listing.status = 'completed' then
    raise exception 'This handoff has already been completed';
  end if;

  if v_listing.status <> 'claimed' then
    raise exception 'The listing must be claimed before requesting handoff confirmation';
  end if;

  v_recipient_user_id := case
    when v_thread.participant_a_id = v_current_user_id then v_thread.participant_b_id
    else v_thread.participant_a_id
  end;

  select *
  into v_existing
  from api.chat_messages
  where thread_id = p_thread_id
    and message_type = 'handoff_request'
    and coalesce(message_metadata ->> 'status', 'pending') = 'pending'
  order by created_at desc
  limit 1;

  if found then
    return v_existing;
  end if;

  insert into api.chat_messages (
    thread_id,
    sender_id,
    body,
    is_system,
    message_type,
    message_metadata
  )
  values (
    p_thread_id,
    v_current_user_id,
    'Handoff ready for confirmation.',
    true,
    'handoff_request',
    jsonb_build_object(
      'listing_id', v_thread.listing_id,
      'requested_by_user_id', v_current_user_id,
      'recipient_user_id', v_recipient_user_id,
      'status', 'pending'
    )
  )
  returning *
  into v_message;

  update api.chat_threads
  set
    last_message_body = 'Sent a handoff confirmation request.',
    last_message_at = v_message.created_at,
    last_message_sender_id = v_current_user_id
  where id = p_thread_id;

  return v_message;
end;
$$;

revoke all on function api.send_handoff_request_message(uuid) from public;
grant execute on function api.send_handoff_request_message(uuid) to authenticated, service_role;

create or replace function api.send_claim_request_message(
  p_thread_id uuid
)
returns api.chat_messages
language plpgsql
security definer
set search_path = api, public
as $$
declare
  v_current_user_id uuid := auth.uid();
  v_thread api.chat_threads;
  v_listing api.listings%rowtype;
  v_existing api.chat_messages;
  v_message api.chat_messages;
  v_recipient_user_id uuid;
begin
  if v_current_user_id is null then
    raise exception 'Authentication is required';
  end if;

  select *
  into v_thread
  from api.chat_threads
  where id = p_thread_id
    and (participant_a_id = v_current_user_id or participant_b_id = v_current_user_id);

  if not found then
    raise exception 'Chat thread was not found';
  end if;

  if v_thread.listing_id is null then
    raise exception 'A listing-linked thread is required';
  end if;

  select *
  into v_listing
  from api.listings
  where id = v_thread.listing_id;

  if not found then
    raise exception 'Listing was not found';
  end if;

  if v_listing.donor_id <> v_current_user_id then
    raise exception 'Only the donor can send a claim confirmation request';
  end if;

  if coalesce(v_listing.claim_type, 'direct') <> 'message' then
    raise exception 'This listing does not require message-based claiming';
  end if;

  if v_listing.status <> 'open' then
    raise exception 'Only open listings can send a claim confirmation request';
  end if;

  v_recipient_user_id := case
    when v_thread.participant_a_id = v_current_user_id then v_thread.participant_b_id
    else v_thread.participant_a_id
  end;

  select *
  into v_existing
  from api.chat_messages
  where thread_id = p_thread_id
    and message_type = 'claim_request'
    and coalesce(message_metadata ->> 'status', 'pending') = 'pending'
  order by created_at desc
  limit 1;

  if found then
    return v_existing;
  end if;

  insert into api.chat_messages (
    thread_id,
    sender_id,
    body,
    is_system,
    message_type,
    message_metadata
  )
  values (
    p_thread_id,
    v_current_user_id,
    'Claim approval ready for confirmation.',
    true,
    'claim_request',
    jsonb_build_object(
      'listing_id', v_thread.listing_id,
      'requested_by_user_id', v_current_user_id,
      'recipient_user_id', v_recipient_user_id,
      'status', 'pending'
    )
  )
  returning *
  into v_message;

  update api.chat_threads
  set
    last_message_body = 'Sent a claim confirmation request.',
    last_message_at = v_message.created_at,
    last_message_sender_id = v_current_user_id
  where id = p_thread_id;

  return v_message;
end;
$$;

revoke all on function api.send_claim_request_message(uuid) from public;
grant execute on function api.send_claim_request_message(uuid) to authenticated, service_role;
