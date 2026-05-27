insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chat-images',
  'chat-images',
  true,
  6291456,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "chat_images_insert_own" on storage.objects;
create policy "chat_images_insert_own" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'chat-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "chat_images_update_own" on storage.objects;
create policy "chat_images_update_own" on storage.objects
for update to authenticated
using (
  bucket_id = 'chat-images'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'chat-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "chat_images_delete_own" on storage.objects;
create policy "chat_images_delete_own" on storage.objects
for delete to authenticated
using (
  bucket_id = 'chat-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

alter table api.chat_messages
drop constraint if exists chat_messages_message_type_check;

alter table api.chat_messages
add constraint chat_messages_message_type_check
check (message_type in ('text', 'image', 'system', 'claim_request', 'handoff_request'));

drop function if exists api.send_chat_message(uuid, text);

create or replace function api.send_chat_message(
  p_thread_id uuid,
  p_body text default null,
  p_message_type text default 'text',
  p_message_metadata jsonb default '{}'::jsonb
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
  v_body text := nullif(btrim(coalesce(p_body, '')), '');
  v_message_type text := coalesce(nullif(btrim(p_message_type), ''), 'text');
  v_message_metadata jsonb := coalesce(p_message_metadata, '{}'::jsonb);
  v_image_url text := nullif(btrim(coalesce(v_message_metadata ->> 'image_url', '')), '');
  v_stored_body text;
  v_thread_preview text;
begin
  if v_current_user_id is null then
    raise exception 'Authentication is required';
  end if;

  if v_message_type not in ('text', 'image') then
    raise exception 'Unsupported chat message type';
  end if;

  if v_message_type = 'text' and v_body is null then
    raise exception 'Message body is required';
  end if;

  if v_message_type = 'image' and v_image_url is null then
    raise exception 'Image URL is required for image messages';
  end if;

  select *
  into v_thread
  from api.chat_threads
  where id = p_thread_id
    and (participant_a_id = v_current_user_id or participant_b_id = v_current_user_id);

  if not found then
    raise exception 'Chat thread was not found';
  end if;

  v_stored_body := case
    when v_message_type = 'image' then coalesce(v_body, 'Sent an image.')
    else v_body
  end;

  v_thread_preview := case
    when v_message_type = 'image' then coalesce(v_body, 'Sent an image.')
    else v_stored_body
  end;

  insert into api.chat_messages (thread_id, sender_id, body, message_type, message_metadata)
  values (
    p_thread_id,
    v_current_user_id,
    v_stored_body,
    v_message_type,
    case
      when v_message_type = 'image' then jsonb_strip_nulls(v_message_metadata || jsonb_build_object('caption', v_body))
      else v_message_metadata
    end
  )
  returning *
  into v_message;

  update api.chat_threads
  set
    last_message_body = v_thread_preview,
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

revoke all on function api.send_chat_message(uuid, text, text, jsonb) from public;
grant execute on function api.send_chat_message(uuid, text, text, jsonb) to authenticated, service_role;
