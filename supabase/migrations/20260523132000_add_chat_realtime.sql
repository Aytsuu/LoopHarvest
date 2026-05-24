create table if not exists api.chat_threads (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references api.listings(id) on delete set null,
  participant_a_id uuid not null references api.users(id) on delete cascade,
  participant_a_name text,
  participant_a_avatar_url text,
  participant_b_id uuid not null references api.users(id) on delete cascade,
  participant_b_name text,
  participant_b_avatar_url text,
  created_by uuid not null references api.users(id) on delete cascade,
  last_message_body text,
  last_message_at timestamptz,
  last_message_sender_id uuid references api.users(id) on delete set null,
  participant_a_last_read_at timestamptz not null default now(),
  participant_b_last_read_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chat_threads_distinct_participants_check check (participant_a_id <> participant_b_id)
);

create table if not exists api.chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references api.chat_threads(id) on delete cascade,
  sender_id uuid not null references api.users(id) on delete cascade,
  body text not null check (char_length(btrim(body)) > 0 and char_length(body) <= 2000),
  is_system boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists chat_threads_participant_a_idx on api.chat_threads (participant_a_id, coalesce(last_message_at, created_at) desc);
create index if not exists chat_threads_participant_b_idx on api.chat_threads (participant_b_id, coalesce(last_message_at, created_at) desc);
create index if not exists chat_threads_listing_idx on api.chat_threads (listing_id);
create index if not exists chat_messages_thread_created_idx on api.chat_messages (thread_id, created_at asc);

grant select on api.chat_threads to authenticated, service_role;
grant select on api.chat_messages to authenticated, service_role;

alter table api.chat_threads enable row level security;
alter table api.chat_messages enable row level security;

drop policy if exists "chat_threads_select_participant" on api.chat_threads;
create policy "chat_threads_select_participant" on api.chat_threads
for select to authenticated
using (auth.uid() = participant_a_id or auth.uid() = participant_b_id);

drop policy if exists "chat_messages_select_participant" on api.chat_messages;
create policy "chat_messages_select_participant" on api.chat_messages
for select to authenticated
using (
  exists (
    select 1
    from api.chat_threads t
    where t.id = chat_messages.thread_id
      and (auth.uid() = t.participant_a_id or auth.uid() = t.participant_b_id)
  )
);

drop trigger if exists chat_threads_set_updated_at on api.chat_threads;
create trigger chat_threads_set_updated_at
before update on api.chat_threads
for each row execute procedure public.set_updated_at();

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

do $$
begin
  begin
    alter publication supabase_realtime add table api.chat_threads;
  exception
    when duplicate_object then null;
  end;

  begin
    alter publication supabase_realtime add table api.chat_messages;
  exception
    when duplicate_object then null;
  end;
end;
$$;
