create table if not exists api.notification_preferences (
  user_id uuid primary key references api.users(id) on delete cascade,
  push_enabled boolean not null default false,
  email_enabled boolean not null default true,
  email_digest text not null default 'weekly' check (email_digest in ('daily', 'weekly', 'never')),
  matching_radius_miles integer not null default 15 check (matching_radius_miles between 1 and 50),
  eco_reports_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

drop trigger if exists notification_preferences_set_updated_at on api.notification_preferences;
create trigger notification_preferences_set_updated_at
before update on api.notification_preferences
for each row execute procedure public.set_updated_at();

alter table api.notification_preferences enable row level security;

drop policy if exists "notification_preferences_select_owner" on api.notification_preferences;
create policy "notification_preferences_select_owner" on api.notification_preferences
for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "notification_preferences_insert_owner" on api.notification_preferences;
create policy "notification_preferences_insert_owner" on api.notification_preferences
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "notification_preferences_update_owner" on api.notification_preferences;
create policy "notification_preferences_update_owner" on api.notification_preferences
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "notifications_delete_owner" on api.notifications;
create policy "notifications_delete_owner" on api.notifications
for delete to authenticated
using (auth.uid() = user_id);
