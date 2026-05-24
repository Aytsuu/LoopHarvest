do $$
begin
  if to_regclass('api.user_surveys') is null or to_regclass('api.users') is null then
    return;
  end if;

  alter table api.user_surveys
    drop constraint if exists user_surveys_user_id_fkey;

  alter table api.user_surveys
    add constraint user_surveys_user_id_fkey
    foreign key (user_id)
    references api.users(id)
    on delete cascade;
end;
$$;
