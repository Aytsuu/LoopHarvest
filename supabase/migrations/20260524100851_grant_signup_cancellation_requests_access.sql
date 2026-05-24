do $$
begin
  if to_regclass('api.signup_cancellation_requests') is null then
    return;
  end if;

  execute 'alter table api.signup_cancellation_requests enable row level security';
  execute 'revoke all on api.signup_cancellation_requests from public, anon, authenticated';
  execute 'grant select, insert, update, delete on api.signup_cancellation_requests to service_role';
end;
$$;
