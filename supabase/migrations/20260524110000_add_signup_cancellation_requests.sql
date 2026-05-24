create table if not exists api.signup_cancellation_requests (
  user_id uuid primary key references api.users(id) on delete cascade,
  email text not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists signup_cancellation_requests_token_idx
  on api.signup_cancellation_requests (token_hash);

create index if not exists signup_cancellation_requests_expires_idx
  on api.signup_cancellation_requests (expires_at);

alter table api.signup_cancellation_requests enable row level security;

revoke all on api.signup_cancellation_requests from public, anon, authenticated;
grant select, insert, update, delete on api.signup_cancellation_requests to service_role;
