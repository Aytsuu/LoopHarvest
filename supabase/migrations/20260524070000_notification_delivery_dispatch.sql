create extension if not exists pg_net;

create table if not exists api.system_config (
  key text primary key,
  value text not null,
  description text,
  updated_at timestamptz not null default now()
);

drop trigger if exists system_config_set_updated_at on api.system_config;
create trigger system_config_set_updated_at
before update on api.system_config
for each row execute procedure public.set_updated_at();

alter table api.system_config enable row level security;

drop policy if exists "system_config_admin_select" on api.system_config;
create policy "system_config_admin_select" on api.system_config
for select to authenticated
using (
  exists (
    select 1 from api.users u where u.id = auth.uid() and u.role = 'admin'
  )
);

drop policy if exists "system_config_admin_manage" on api.system_config;
create policy "system_config_admin_manage" on api.system_config
for all to authenticated
using (
  exists (
    select 1 from api.users u where u.id = auth.uid() and u.role = 'admin'
  )
)
with check (
  exists (
    select 1 from api.users u where u.id = auth.uid() and u.role = 'admin'
  )
);

create or replace function private.get_system_config_value(p_key text)
returns text
language sql
security definer
set search_path = ''
as $$
  select c.value
  from api.system_config c
  where c.key = p_key
  limit 1;
$$;

create or replace function private.dispatch_notification_delivery()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_base_url text;
  v_publishable_key text;
begin
  v_base_url := private.get_system_config_value('edge_function_base_url');
  v_publishable_key := private.get_system_config_value('publishable_key');

  if coalesce(v_base_url, '') = '' or coalesce(v_publishable_key, '') = '' then
    return new;
  end if;

  perform net.http_post(
    url := rtrim(v_base_url, '/') || '/notification-delivery',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', v_publishable_key,
      'Authorization', 'Bearer ' || v_publishable_key
    ),
    body := jsonb_build_object('notificationId', new.id),
    timeout_milliseconds := 2000
  );

  return new;
end;
$$;

drop trigger if exists notifications_delivery_dispatch on api.notifications;
create trigger notifications_delivery_dispatch
after insert on api.notifications
for each row execute procedure private.dispatch_notification_delivery();

insert into api.system_config (key, value, description)
values
  (
    'edge_function_base_url',
    '',
    'Base URL for deployed Edge Functions, for example https://<project-ref>.supabase.co/functions/v1'
  ),
  (
    'publishable_key',
    '',
    'Supabase publishable key used by pg_net when invoking public Edge Functions'
  )
on conflict (key) do nothing;
