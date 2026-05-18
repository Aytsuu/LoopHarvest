create schema if not exists api;

revoke all on schema api from public;
grant usage on schema api to anon, authenticated, service_role;

alter table public.users set schema api;
alter table public.categories set schema api;
alter table public.listings set schema api;
alter table public.requests set schema api;
alter table public.transactions set schema api;
alter table public.notifications set schema api;

grant select, insert, update, delete on all tables in schema api to anon, authenticated, service_role;
grant usage, select on all sequences in schema api to anon, authenticated, service_role;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into api.users (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    display_name = coalesce(excluded.display_name, api.users.display_name),
    avatar_url = coalesce(excluded.avatar_url, api.users.avatar_url),
    updated_at = now();

  return new;
end;
$$;

drop function if exists public.find_matching_requests(text, geography, numeric);
create or replace function api.find_matching_requests(
  p_category text,
  p_geo geography,
  p_quantity numeric
)
returns table (
  id uuid,
  requester_id uuid,
  title text,
  category_slug text,
  quantity_kg_min numeric,
  quantity_kg_max numeric,
  max_distance_km numeric,
  distance_m double precision,
  created_at timestamptz
)
language sql
stable
set search_path = api
as $$
  select
    r.id,
    r.requester_id,
    r.title,
    r.category_slug,
    r.quantity_kg_min,
    r.quantity_kg_max,
    r.max_distance_km,
    public.st_distance(r.pickup_geo, p_geo) as distance_m,
    r.created_at
  from api.requests r
  where r.status = 'open'
    and (
      r.category_slug = p_category
      or exists (
        select 1
        from api.categories c
        where c.slug = p_category
          and c.parent_slug = r.category_slug
      )
    )
    and (r.quantity_kg_min is null or r.quantity_kg_min <= p_quantity)
    and (r.quantity_kg_max is null or r.quantity_kg_max >= p_quantity)
    and (
      p_geo is null
      or r.pickup_geo is null
      or public.st_dwithin(r.pickup_geo, p_geo, r.max_distance_km * 1000)
    )
  order by distance_m asc nulls last, r.created_at asc
  limit 5;
$$;

revoke execute on all functions in schema api from public, anon, authenticated;
grant execute on function api.find_matching_requests(text, geography, numeric) to authenticated, service_role;
