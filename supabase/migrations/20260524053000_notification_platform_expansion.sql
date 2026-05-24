alter table api.users
  drop constraint if exists users_role_check;

alter table api.users
  add constraint users_role_check
  check (role in ('donor', 'recipient', 'both', 'org', 'admin'));

alter table api.notification_preferences
  add column if not exists quiet_hours_enabled boolean not null default false,
  add column if not exists quiet_hours_start time not null default '22:00',
  add column if not exists quiet_hours_end time not null default '08:00',
  add column if not exists preferences jsonb not null default '{}'::jsonb;

alter table api.notification_preferences
  alter column email_digest set default 'daily';

alter table api.notification_preferences
  drop constraint if exists notification_preferences_email_digest_check;

alter table api.notification_preferences
  add constraint notification_preferences_email_digest_check
  check (email_digest in ('realtime', 'daily', 'weekly', 'never'));

create table if not exists api.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references api.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

create index if not exists push_subscriptions_user_idx
  on api.push_subscriptions (user_id, created_at desc);

alter table api.push_subscriptions enable row level security;

drop policy if exists "push_subscriptions_select_owner" on api.push_subscriptions;
create policy "push_subscriptions_select_owner" on api.push_subscriptions
for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "push_subscriptions_insert_owner" on api.push_subscriptions;
create policy "push_subscriptions_insert_owner" on api.push_subscriptions
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "push_subscriptions_update_owner" on api.push_subscriptions;
create policy "push_subscriptions_update_owner" on api.push_subscriptions
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "push_subscriptions_delete_owner" on api.push_subscriptions;
create policy "push_subscriptions_delete_owner" on api.push_subscriptions
for delete to authenticated
using (auth.uid() = user_id);

create table if not exists api.delivery_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references api.users(id) on delete cascade,
  notification_id uuid references api.notifications(id) on delete cascade,
  channel text not null check (channel in ('in_app', 'push', 'email')),
  type text not null,
  reference_id text,
  status text not null check (status in ('sent', 'failed', 'skipped', 'queued')),
  skip_reason text,
  sent_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists delivery_log_user_sent_idx
  on api.delivery_log (user_id, sent_at desc);

create index if not exists delivery_log_type_reference_idx
  on api.delivery_log (type, reference_id, channel, sent_at desc);

alter table api.delivery_log enable row level security;

drop policy if exists "delivery_log_select_owner" on api.delivery_log;
create policy "delivery_log_select_owner" on api.delivery_log
for select to authenticated
using (auth.uid() = user_id);

create table if not exists api.release_notifications (
  id uuid primary key default gen_random_uuid(),
  version text not null,
  type text not null check (type in ('minor', 'patch', 'major', 'breaking')),
  title text not null,
  body text not null,
  changelog_url text,
  action_required boolean not null default false,
  action_label text,
  action_type text not null default 'none' check (action_type in ('reload', 'navigate', 'accept_terms', 'none')),
  action_url text,
  target text not null default 'all' check (target in ('all', 'role')),
  target_filter jsonb not null default '{}'::jsonb,
  published_at timestamptz not null,
  expires_at timestamptz,
  created_by uuid references api.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists release_notifications_published_idx
  on api.release_notifications (published_at desc);

alter table api.release_notifications enable row level security;

drop policy if exists "release_notifications_select_authenticated" on api.release_notifications;
create policy "release_notifications_select_authenticated" on api.release_notifications
for select to authenticated
using (
  published_at <= now()
  and (expires_at is null or expires_at > now())
  and (
    target = 'all'
    or (
      target = 'role'
      and exists (
        select 1
        from api.users u
        where u.id = auth.uid()
          and coalesce(target_filter ->> 'role', '') = u.role
      )
    )
  )
);

drop policy if exists "release_notifications_admin_manage" on api.release_notifications;
create policy "release_notifications_admin_manage" on api.release_notifications
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

create table if not exists api.release_acknowledgments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references api.users(id) on delete cascade,
  release_id uuid not null references api.release_notifications(id) on delete cascade,
  seen_at timestamptz,
  acknowledged_at timestamptz,
  action_taken text,
  created_at timestamptz not null default now(),
  unique(user_id, release_id)
);

create index if not exists release_acknowledgments_release_idx
  on api.release_acknowledgments (release_id, acknowledged_at desc);

alter table api.release_acknowledgments enable row level security;

drop policy if exists "release_acknowledgments_select_owner" on api.release_acknowledgments;
create policy "release_acknowledgments_select_owner" on api.release_acknowledgments
for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "release_acknowledgments_insert_owner" on api.release_acknowledgments;
create policy "release_acknowledgments_insert_owner" on api.release_acknowledgments
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "release_acknowledgments_update_owner" on api.release_acknowledgments;
create policy "release_acknowledgments_update_owner" on api.release_acknowledgments
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
