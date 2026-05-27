alter table api.listings
  add column if not exists location_latitude double precision,
  add column if not exists location_longitude double precision;

alter table api.requests
  add column if not exists location_latitude double precision,
  add column if not exists location_longitude double precision;
