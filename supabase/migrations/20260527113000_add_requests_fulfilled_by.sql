alter table api.requests
  add column if not exists fulfilled_by uuid references api.users(id);

create index if not exists requests_fulfilled_by_idx
  on api.requests (fulfilled_by)
  where fulfilled_by is not null;
