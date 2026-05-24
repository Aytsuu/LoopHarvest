alter table api.listings
add column if not exists claim_type text not null default 'direct'
check (claim_type in ('direct', 'message'));
