alter table api.listings
drop constraint if exists listings_status_check;

alter table api.listings
add constraint listings_status_check
check (status in ('open', 'claimed', 'completed'));
