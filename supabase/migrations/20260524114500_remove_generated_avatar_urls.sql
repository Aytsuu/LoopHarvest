update auth.users
set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) - 'avatar_url'
where coalesce(raw_user_meta_data ->> 'avatar_url', '') like 'https://www.gravatar.com/avatar/%'
   or coalesce(raw_user_meta_data ->> 'avatar_url', '') like 'https://secure.gravatar.com/avatar/%'
   or coalesce(raw_user_meta_data ->> 'avatar_url', '') like 'https://api.dicebear.com/%';

update api.users
set avatar_url = null
where coalesce(avatar_url, '') like 'https://www.gravatar.com/avatar/%'
   or coalesce(avatar_url, '') like 'https://secure.gravatar.com/avatar/%'
   or coalesce(avatar_url, '') like 'https://api.dicebear.com/%';
