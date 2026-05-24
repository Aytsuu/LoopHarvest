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
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      initcap(replace(replace(replace(split_part(new.email, '@', 1), '.', ' '), '_', ' '), '-', ' '))
    ),
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

update api.users
set display_name = initcap(replace(replace(replace(split_part(email, '@', 1), '.', ' '), '_', ' '), '-', ' '))
where coalesce(nullif(trim(display_name), ''), '') = ''
  and coalesce(nullif(trim(email), ''), '') <> '';
