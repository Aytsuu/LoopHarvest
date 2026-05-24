create or replace function api.get_or_create_chat_thread(
  p_other_user_id uuid,
  p_listing_id uuid default null
)
returns api.chat_threads
language plpgsql
security definer
set search_path = api, public
as $$
declare
  v_current_user_id uuid := auth.uid();
  v_thread api.chat_threads;
  v_current_user api.users%rowtype;
  v_other_user api.users%rowtype;
begin
  if v_current_user_id is null then
    raise exception 'Authentication is required';
  end if;

  if p_other_user_id is null or p_other_user_id = v_current_user_id then
    raise exception 'A valid other participant is required';
  end if;

  select *
  into v_thread
  from api.chat_threads
  where listing_id is not distinct from p_listing_id
    and (
      (participant_a_id = v_current_user_id and participant_b_id = p_other_user_id)
      or (participant_a_id = p_other_user_id and participant_b_id = v_current_user_id)
    )
  order by created_at desc
  limit 1;

  if found then
    return v_thread;
  end if;

  select *
  into v_current_user
  from api.users
  where id = v_current_user_id;

  select *
  into v_other_user
  from api.users
  where id = p_other_user_id;

  if v_current_user.id is null or v_other_user.id is null then
    raise exception 'Chat participants were not found';
  end if;

  insert into api.chat_threads (
    listing_id,
    participant_a_id,
    participant_a_name,
    participant_a_avatar_url,
    participant_b_id,
    participant_b_name,
    participant_b_avatar_url,
    created_by,
    participant_a_last_read_at,
    participant_b_last_read_at
  )
  values (
    p_listing_id,
    v_current_user.id,
    coalesce(v_current_user.display_name, v_current_user.email),
    v_current_user.avatar_url,
    v_other_user.id,
    coalesce(v_other_user.display_name, v_other_user.email),
    v_other_user.avatar_url,
    v_current_user.id,
    now(),
    now()
  )
  returning *
  into v_thread;

  return v_thread;
end;
$$;

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

  insert into api.chat_messages (thread_id, sender_id, body)
  values (p_thread_id, v_current_user_id, v_body)
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

create or replace function api.mark_chat_thread_read(
  p_thread_id uuid
)
returns void
language plpgsql
security definer
set search_path = api, public
as $$
declare
  v_current_user_id uuid := auth.uid();
begin
  if v_current_user_id is null then
    raise exception 'Authentication is required';
  end if;

  update api.chat_threads
  set
    participant_a_last_read_at = case
      when participant_a_id = v_current_user_id then now()
      else participant_a_last_read_at
    end,
    participant_b_last_read_at = case
      when participant_b_id = v_current_user_id then now()
      else participant_b_last_read_at
    end
  where id = p_thread_id
    and (participant_a_id = v_current_user_id or participant_b_id = v_current_user_id);
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

  insert into api.chat_messages (thread_id, sender_id, body, is_system)
  values (p_thread_id, v_current_user_id, v_body, true)
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

revoke all on function api.get_or_create_chat_thread(uuid, uuid) from public;
grant execute on function api.get_or_create_chat_thread(uuid, uuid) to authenticated, service_role;

revoke all on function api.send_chat_message(uuid, text) from public;
grant execute on function api.send_chat_message(uuid, text) to authenticated, service_role;

revoke all on function api.mark_chat_thread_read(uuid) from public;
grant execute on function api.mark_chat_thread_read(uuid) to authenticated, service_role;

revoke all on function api.append_system_chat_message(uuid, text) from public;
grant execute on function api.append_system_chat_message(uuid, text) to authenticated, service_role;
