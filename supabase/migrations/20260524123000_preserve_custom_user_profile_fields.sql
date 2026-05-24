create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  next_display_name text;
  next_avatar_url text;
begin
  next_display_name := coalesce(
    nullif(new.raw_user_meta_data ->> 'display_name', ''),
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'name', ''),
    initcap(replace(replace(replace(split_part(new.email, '@', 1), '.', ' '), '_', ' '), '-', ' '))
  );

  next_avatar_url := nullif(new.raw_user_meta_data ->> 'avatar_url', '');

  insert into api.users (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    next_display_name,
    next_avatar_url
  )
  on conflict (id) do update
  set
    email = excluded.email,
    display_name = case
      when coalesce(nullif(trim(api.users.display_name), ''), '') = '' then coalesce(excluded.display_name, api.users.display_name)
      else api.users.display_name
    end,
    avatar_url = case
      when coalesce(nullif(trim(api.users.avatar_url), ''), '') = '' then coalesce(excluded.avatar_url, api.users.avatar_url)
      when api.users.avatar_url like 'https://www.gravatar.com/avatar/%'
        or api.users.avatar_url like 'https://secure.gravatar.com/avatar/%'
        or api.users.avatar_url like 'https://api.dicebear.com/%'
      then coalesce(excluded.avatar_url, api.users.avatar_url)
      else api.users.avatar_url
    end,
    updated_at = now();

  return new;
end;
$$;
