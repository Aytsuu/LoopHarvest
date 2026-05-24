create table if not exists api.user_surveys (
  user_id uuid primary key references api.users(id) on delete cascade,
  answers jsonb not null default '{}'::jsonb check (jsonb_typeof(answers) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists user_surveys_set_updated_at on api.user_surveys;
create trigger user_surveys_set_updated_at
before update on api.user_surveys
for each row execute procedure public.set_updated_at();

alter table api.user_surveys enable row level security;

drop policy if exists "user_surveys_select_owner" on api.user_surveys;
create policy "user_surveys_select_owner" on api.user_surveys
for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "user_surveys_insert_owner" on api.user_surveys;
create policy "user_surveys_insert_owner" on api.user_surveys
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "user_surveys_update_owner" on api.user_surveys;
create policy "user_surveys_update_owner" on api.user_surveys
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

grant select, insert, update, delete on table api.user_surveys to authenticated, service_role;
