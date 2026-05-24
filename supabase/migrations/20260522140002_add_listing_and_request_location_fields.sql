alter table api.listings
  add column if not exists city text,
  add column if not exists country text;

alter table api.requests
  add column if not exists city text,
  add column if not exists country text;
