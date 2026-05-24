create schema if not exists private;

revoke all on schema private from public, anon, authenticated;
grant usage on schema private to postgres, service_role;

alter table api.notifications
  add column if not exists category text,
  add column if not exists priority text not null default 'medium',
  add column if not exists action_url text,
  add column if not exists reference_id text,
  add column if not exists reference_type text,
  add column if not exists actor_id uuid references api.users(id) on delete set null,
  add column if not exists dismissed_at timestamptz;

create index if not exists notifications_user_unread_idx
  on api.notifications (user_id, created_at desc)
  where read_at is null;

create or replace function private.create_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_body text,
  p_category text,
  p_priority text,
  p_action_url text,
  p_reference_id text,
  p_reference_type text,
  p_actor_id uuid default null,
  p_listing_id uuid default null,
  p_request_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_user_id is null then
    return;
  end if;

  if exists (
    select 1
    from api.notifications n
    where n.user_id = p_user_id
      and n.type = p_type
      and coalesce(n.reference_id, '') = coalesce(p_reference_id, '')
      and coalesce(n.action_url, '') = coalesce(p_action_url, '')
      and n.created_at >= now() - interval '10 minutes'
  ) then
    return;
  end if;

  insert into api.notifications (
    user_id,
    type,
    title,
    body,
    category,
    priority,
    action_url,
    reference_id,
    reference_type,
    actor_id,
    listing_id,
    request_id
  )
  values (
    p_user_id,
    p_type,
    p_title,
    p_body,
    p_category,
    p_priority,
    p_action_url,
    p_reference_id,
    p_reference_type,
    p_actor_id,
    p_listing_id,
    p_request_id
  );
end;
$$;

create or replace function private.handle_listing_notification_events()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_match record;
  v_claimer_name text;
begin
  if tg_op = 'INSERT' then
    for v_match in
      select *
      from api.find_matching_requests(new.category_slug, new.pickup_geo, new.quantity_kg)
    loop
      if v_match.requester_id = new.donor_id then
        continue;
      end if;

      perform private.create_notification(
        p_user_id => v_match.requester_id,
        p_type => 'match_found',
        p_title => 'New match found',
        p_body => format('"%s" matches your request "%s".', new.title, v_match.title),
        p_category => 'matching',
        p_priority => 'high',
        p_action_url => format('/listings/%s', new.id),
        p_reference_id => format('%s:%s', new.id, v_match.id),
        p_reference_type => 'listing_match',
        p_actor_id => new.donor_id,
        p_listing_id => new.id,
        p_request_id => v_match.id
      );
    end loop;

    return new;
  end if;

  if tg_op = 'UPDATE'
    and old.status = 'open'
    and new.status = 'claimed'
    and new.claimed_by is not null
    and new.claimed_by <> new.donor_id
  then
    select coalesce(u.display_name, u.email)
    into v_claimer_name
    from api.users u
    where u.id = new.claimed_by;

    perform private.create_notification(
      p_user_id => new.donor_id,
      p_type => 'listing_claimed',
      p_title => 'Listing claimed',
      p_body => format('%s claimed your listing "%s".', coalesce(v_claimer_name, 'A LoopHarvest member'), new.title),
      p_category => 'transactional',
      p_priority => 'high',
      p_action_url => format('/listings/%s', new.id),
      p_reference_id => new.id::text,
      p_reference_type => 'listing',
      p_actor_id => new.claimed_by,
      p_listing_id => new.id
    );
  end if;

  return new;
end;
$$;

create or replace function private.handle_request_notification_events()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE'
    and old.status = 'open'
    and new.status = 'fulfilled'
  then
    perform private.create_notification(
      p_user_id => new.requester_id,
      p_type => 'request_fulfilled',
      p_title => 'Request fulfilled',
      p_body => format('Your request "%s" has been marked fulfilled.', new.title),
      p_category => 'transactional',
      p_priority => 'high',
      p_action_url => format('/requests/%s', new.id),
      p_reference_id => new.id::text,
      p_reference_type => 'request',
      p_actor_id => null,
      p_request_id => new.id
    );
  end if;

  return new;
end;
$$;

create or replace function private.handle_chat_message_notification_events()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_thread api.chat_threads%rowtype;
  v_recipient_id uuid;
  v_sender_name text;
  v_preview text;
begin
  if new.is_system then
    return new;
  end if;

  select *
  into v_thread
  from api.chat_threads
  where id = new.thread_id;

  if v_thread.id is null then
    return new;
  end if;

  v_recipient_id := case
    when v_thread.participant_a_id = new.sender_id then v_thread.participant_b_id
    else v_thread.participant_a_id
  end;

  select coalesce(u.display_name, u.email)
  into v_sender_name
  from api.users u
  where u.id = new.sender_id;

  v_preview := case
    when char_length(new.body) > 120 then left(new.body, 117) || '...'
    else new.body
  end;

  perform private.create_notification(
    p_user_id => v_recipient_id,
    p_type => 'message_received',
    p_title => 'New message received',
    p_body => format('%s: %s', coalesce(v_sender_name, 'A LoopHarvest member'), v_preview),
    p_category => 'transactional',
    p_priority => 'high',
    p_action_url => format('/chat?threadId=%s', new.thread_id),
    p_reference_id => new.thread_id::text,
    p_reference_type => 'chat_thread',
    p_actor_id => new.sender_id,
    p_listing_id => v_thread.listing_id
  );

  return new;
end;
$$;

drop trigger if exists listings_notification_events on api.listings;
create trigger listings_notification_events
after insert or update on api.listings
for each row execute procedure private.handle_listing_notification_events();

drop trigger if exists requests_notification_events on api.requests;
create trigger requests_notification_events
after update on api.requests
for each row execute procedure private.handle_request_notification_events();

drop trigger if exists chat_messages_notification_events on api.chat_messages;
create trigger chat_messages_notification_events
after insert on api.chat_messages
for each row execute procedure private.handle_chat_message_notification_events();

do $$
begin
  begin
    alter publication supabase_realtime add table api.notifications;
  exception
    when duplicate_object then null;
  end;
end;
$$;
