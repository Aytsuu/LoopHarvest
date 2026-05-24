alter table api.users
  drop constraint if exists users_role_check;

update api.users
set role = 'customer'
where role is distinct from 'admin';

alter table api.users
  add constraint users_role_check
  check (role in ('customer', 'admin'));

alter table api.users
  alter column role set default 'customer';

update api.release_notifications
set target_filter = jsonb_set(target_filter, '{role}', '"customer"', true)
where target = 'role'
  and coalesce(target_filter ->> 'role', '') not in ('customer', 'admin');
