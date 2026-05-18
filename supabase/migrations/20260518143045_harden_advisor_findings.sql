create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    display_name = coalesce(excluded.display_name, public.users.display_name),
    avatar_url = coalesce(excluded.avatar_url, public.users.avatar_url),
    updated_at = now();

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create or replace function public.find_matching_requests(
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
set search_path = public
as $$
  select
    r.id,
    r.requester_id,
    r.title,
    r.category_slug,
    r.quantity_kg_min,
    r.quantity_kg_max,
    r.max_distance_km,
    st_distance(r.pickup_geo, p_geo) as distance_m,
    r.created_at
  from public.requests r
  where r.status = 'open'
    and (
      r.category_slug = p_category
      or exists (
        select 1
        from public.categories c
        where c.slug = p_category
          and c.parent_slug = r.category_slug
      )
    )
    and (r.quantity_kg_min is null or r.quantity_kg_min <= p_quantity)
    and (r.quantity_kg_max is null or r.quantity_kg_max >= p_quantity)
    and (
      p_geo is null
      or r.pickup_geo is null
      or st_dwithin(r.pickup_geo, p_geo, r.max_distance_km * 1000)
    )
  order by distance_m asc nulls last, r.created_at asc
  limit 5;
$$;

create index if not exists categories_parent_slug_idx on public.categories (parent_slug);
create index if not exists listings_donor_id_idx on public.listings (donor_id);
create index if not exists listings_claimed_by_idx on public.listings (claimed_by);
create index if not exists requests_requester_id_idx on public.requests (requester_id);
create index if not exists transactions_listing_id_idx on public.transactions (listing_id);
create index if not exists transactions_request_id_idx on public.transactions (request_id);
create index if not exists transactions_donor_id_idx on public.transactions (donor_id);
create index if not exists transactions_recipient_id_idx on public.transactions (recipient_id);
create index if not exists notifications_listing_id_idx on public.notifications (listing_id);
create index if not exists notifications_request_id_idx on public.notifications (request_id);

drop policy if exists "users_select_self" on public.users;
create policy "users_select_self" on public.users
for select to authenticated
using ((select auth.uid()) = id);

drop policy if exists "users_update_self" on public.users;
create policy "users_update_self" on public.users
for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "listings_insert_self" on public.listings;
create policy "listings_insert_self" on public.listings
for insert to authenticated
with check ((select auth.uid()) = donor_id);

drop policy if exists "listings_update_owner" on public.listings;
create policy "listings_update_owner" on public.listings
for update to authenticated
using ((select auth.uid()) = donor_id)
with check ((select auth.uid()) = donor_id);

drop policy if exists "requests_insert_self" on public.requests;
create policy "requests_insert_self" on public.requests
for insert to authenticated
with check ((select auth.uid()) = requester_id);

drop policy if exists "requests_update_owner" on public.requests;
create policy "requests_update_owner" on public.requests
for update to authenticated
using ((select auth.uid()) = requester_id)
with check ((select auth.uid()) = requester_id);

drop policy if exists "transactions_select_participant" on public.transactions;
create policy "transactions_select_participant" on public.transactions
for select to authenticated
using ((select auth.uid()) = donor_id or (select auth.uid()) = recipient_id);

drop policy if exists "notifications_select_owner" on public.notifications;
create policy "notifications_select_owner" on public.notifications
for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "notifications_update_owner" on public.notifications;
create policy "notifications_update_owner" on public.notifications
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
