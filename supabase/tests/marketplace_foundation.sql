-- Run in an isolated local Supabase/PostgreSQL test database after the migration.
-- Fixtures and grants are rolled back; do not run test scripts in production.
begin;

create function pg_temp.assert_true(value boolean, message text)
returns void language plpgsql as $$
begin
  if value is distinct from true then
    raise exception 'Assertion failed: %', message;
  end if;
end;
$$;

select pg_temp.assert_true(
  (select count(*) = 7 and bool_and(relrowsecurity) from pg_class
   where relnamespace = 'public'::regnamespace
     and relname in ('services', 'customer_profiles', 'providers', 'provider_services',
       'route_blocks', 'bookings', 'booking_photos')),
  'all seven marketplace tables have RLS enabled'
);
select pg_temp.assert_true(
  (select count(*) = 4 and not bool_or(active) from public.services),
  'catalog is seeded but cannot take live orders'
);
select pg_temp.assert_true(
  (select not public and file_size_limit = 1000000
   from storage.buckets where id = 'blokpakt-evidence'),
  'evidence bucket is private and limited to 1 MB'
);

insert into auth.users (id, email) values
  ('10000000-0000-0000-0000-000000000001', 'customer-one@example.invalid'),
  ('10000000-0000-0000-0000-000000000002', 'customer-two@example.invalid'),
  ('10000000-0000-0000-0000-000000000003', 'provider-one@example.invalid'),
  ('10000000-0000-0000-0000-000000000004', 'provider-two@example.invalid');
insert into public.customer_profiles (user_id, full_name, phone) values
  ('10000000-0000-0000-0000-000000000001', 'First customer', 'private-one'),
  ('10000000-0000-0000-0000-000000000002', 'Second customer', 'private-two');
insert into public.providers (id, user_id, display_name, business_name, approval_status) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'First P.', 'First business', 'approved'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000004', 'Second P.', 'Second business', 'pending');
insert into public.provider_services (provider_id, service_id) values
  ('20000000-0000-0000-0000-000000000001', 'lawn');
insert into public.route_blocks (id, service_id, service_date, area_label, country_code, provider_id, status, accepted_at)
values ('30000000-0000-0000-0000-000000000001', 'lawn', '2026-11-01', 'Example street', 'US',
  '20000000-0000-0000-0000-000000000001', 'accepted', now());
insert into public.bookings (id, customer_id, service_id, service_date, address, country_code, route_block_id, route_position) values
  ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'lawn', '2026-11-01', '1 Example Street', 'US', '30000000-0000-0000-0000-000000000001', 1),
  ('40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'lawn', '2026-11-01', '2 Example Street', 'US', null, null);
insert into public.booking_photos (booking_id, uploaded_by, kind, object_path, content_type, size_bytes) values
  ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'before',
   '40000000-0000-0000-0000-000000000001/before.png', 'image/png', 100);

set local role anon;
select pg_temp.assert_true((select count(*) = 0 from public.services), 'anonymous users cannot see inactive services');
select pg_temp.assert_true(not has_table_privilege(current_user, 'public.bookings', 'SELECT'), 'anonymous users cannot read bookings');
select pg_temp.assert_true(not has_table_privilege(current_user, 'public.customer_profiles', 'SELECT'), 'anonymous users cannot read contacts');
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
select pg_temp.assert_true((select count(*) = 1 from public.customer_profiles), 'customers can read only their own profile');
select pg_temp.assert_true((select count(*) = 1 from public.bookings), 'customers can read only their own booking');
select pg_temp.assert_true((select count(*) = 0 from public.bookings where id = '40000000-0000-0000-0000-000000000002'), 'known booking IDs do not bypass ownership');
select pg_temp.assert_true((select count(*) = 1 from public.booking_photos), 'customers can read their own photo metadata');
select pg_temp.assert_true((select count(*) = 0 from public.providers), 'customers cannot enumerate provider records');
select pg_temp.assert_true(not has_table_privilege(current_user, 'public.bookings', 'INSERT'), 'unvalidated direct booking creation is blocked');
select pg_temp.assert_true(not has_table_privilege(current_user, 'public.bookings', 'UPDATE'), 'customers cannot change price or job status');
select pg_temp.assert_true(not has_table_privilege(current_user, 'public.providers', 'UPDATE'), 'users cannot approve themselves as providers');
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', true);
select pg_temp.assert_true((select count(*) = 0 from public.booking_photos), 'other customers cannot read photo metadata');
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000003', true);
select pg_temp.assert_true((select count(*) = 1 from public.route_blocks), 'approved provider can read assigned route');
select pg_temp.assert_true((select count(*) = 1 from public.bookings), 'provider sees only accepted assigned bookings');
select pg_temp.assert_true((select count(*) = 0 from public.customer_profiles), 'provider cannot read customer phone numbers');
select pg_temp.assert_true((select count(*) = 1 from public.booking_photos), 'assigned provider can read job photo metadata');
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000004', true);
select pg_temp.assert_true((select count(*) = 0 from public.route_blocks), 'pending provider cannot read routes');
select pg_temp.assert_true((select count(*) = 0 from public.bookings), 'unassigned provider cannot read addresses');
reset role;

update public.route_blocks set status = 'offered', accepted_at = null;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000003', true);
select pg_temp.assert_true((select count(*) = 0 from public.bookings), 'offered route does not reveal exact addresses before acceptance');
select pg_temp.assert_true((select count(*) = 0 from public.booking_photos), 'offered route does not reveal evidence');
reset role;
update public.route_blocks set status = 'accepted', accepted_at = now();
update public.providers set approval_status = 'suspended' where id = '20000000-0000-0000-0000-000000000001';
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000003', true);
select pg_temp.assert_true((select count(*) = 0 from public.bookings), 'suspension revokes provider access');
reset role;

do $$
begin
  begin
    update public.bookings set quoted_total_cents = -1, currency = 'USD';
    raise exception 'Negative quote unexpectedly accepted';
  exception when check_violation then null;
  end;
  begin
    update public.bookings set service_date = '2026-11-02'
      where id = '40000000-0000-0000-0000-000000000001';
    raise exception 'Mismatched route date unexpectedly accepted';
  exception when foreign_key_violation then null;
  end;
  begin
    update public.bookings set route_position = 7
      where id = '40000000-0000-0000-0000-000000000001';
    raise exception 'Seventh route stop unexpectedly accepted';
  exception when check_violation then null;
  end;
  begin
    update public.bookings set route_block_id = '30000000-0000-0000-0000-000000000001', route_position = 1
      where id = '40000000-0000-0000-0000-000000000002';
    raise exception 'Duplicate route position unexpectedly accepted';
  exception when unique_violation then null;
  end;
  begin
    update public.route_blocks set provider_id = '20000000-0000-0000-0000-000000000002';
    raise exception 'Unsupported provider service unexpectedly accepted';
  exception when foreign_key_violation then null;
  end;
end;
$$;

-- A permissive policy for another feature must not unlock this private bucket.
grant select, insert on storage.objects to authenticated;
create policy foundation_test_permissive on storage.objects for all to authenticated using (true) with check (true);
set local role authenticated;
do $$
begin
  begin
    insert into storage.objects (bucket_id, name) values ('blokpakt-evidence', 'unverified.png');
    raise exception 'Evidence upload unexpectedly allowed';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;

rollback;
