grant select, insert, update, delete on table api.notification_preferences to authenticated, service_role;
grant select, insert, update, delete on table api.push_subscriptions to authenticated, service_role;
grant select, insert, update, delete on table api.delivery_log to authenticated, service_role;
grant select, insert, update, delete on table api.release_notifications to authenticated, service_role;
grant select, insert, update, delete on table api.release_acknowledgments to authenticated, service_role;
grant select, insert, update, delete on table api.system_config to authenticated, service_role;

grant usage, select on all sequences in schema api to authenticated, service_role;
