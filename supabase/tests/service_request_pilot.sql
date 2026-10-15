-- Isolated test database only. Apply both migrations first; everything here rolls back.
begin;
create function pg_temp.assert_pilot(value boolean, message text)
returns void language plpgsql as $$
begin
  if value is distinct from true then raise exception 'Assertion failed: %', message; end if;
end;
$$;
create function pg_temp.expect_pilot_error(statement text, expected_state text)
returns void language plpgsql as $$
begin
  execute statement;
  raise exception 'Expected failure: %', statement;
exception when others then
  if sqlstate <> expected_state then raise; end if;
end;
$$;

insert into auth.users (id, email, email_confirmed_at) values
  ('11000000-0000-4000-8000-000000000001', 'customer-one@example.invalid', now()),
  ('11000000-0000-4000-8000-000000000002', 'customer-two@example.invalid', now()),
  ('11000000-0000-4000-8000-000000000003', 'operator@example.invalid', now()),
  ('11000000-0000-4000-8000-000000000004', 'unverified@example.invalid', null);
insert into public.pilot_admins (user_id) values ('11000000-0000-4000-8000-000000000003');
select pg_temp.assert_pilot((select not intake_open from public.pilot_settings), 'intake starts closed');
select pg_temp.assert_pilot(
  (select count(*) = 4 and bool_and(relrowsecurity) from pg_class
   where relnamespace = 'public'::regnamespace and relname in
    ('pilot_settings','pilot_admins','service_requests','service_request_events')), 'all pilot tables have RLS'
);
set local role anon;
select pg_temp.assert_pilot(not has_table_privilege(current_user, 'public.service_requests', 'SELECT'), 'anonymous users cannot read requests');
select pg_temp.assert_pilot(not has_function_privilege(current_user, 'public.submit_service_request(uuid,text,text,text,text,text,text,text,text,text,boolean)', 'EXECUTE'), 'anonymous users cannot submit requests');
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '11000000-0000-4000-8000-000000000001', true);
select pg_temp.assert_pilot(not public.is_pilot_admin(), 'ordinary users are not admins');
select pg_temp.assert_pilot(not has_table_privilege(current_user, 'public.service_requests', 'INSERT'), 'direct inserts blocked');
select pg_temp.assert_pilot(not has_table_privilege(current_user, 'public.service_requests', 'UPDATE'), 'direct status/price updates blocked');
select pg_temp.assert_pilot(not has_table_privilege(current_user, 'public.pilot_admins', 'INSERT'), 'self-promotion blocked');
select pg_temp.assert_pilot(not has_table_privilege(current_user, 'public.pilot_settings', 'UPDATE'), 'customers cannot open intake');
select pg_temp.expect_pilot_error($q$select public.submit_service_request(
  '22000000-0000-4000-8000-000000000001', 'lawn', 'Customer One', '', '1 Example Street', 'Austin', 'TX', '78701', '', '', true)$q$, '55000');
select pg_temp.expect_pilot_error('select public.pilot_request_counts()', '42501');
reset role;
update public.pilot_settings set intake_open = true;

set local role authenticated;
select set_config('request.jwt.claim.sub', '11000000-0000-4000-8000-000000000001', true);
select pg_temp.expect_pilot_error($q$select public.submit_service_request(
  '22000000-0000-4000-8000-000000000001', 'lawn', 'Customer One', '', '1 Example Street', 'Austin', 'TX', '78701', '', '', true)$q$, '22023');
reset role;
update public.services set active = true where id = 'lawn';

set local role authenticated;
select set_config('request.jwt.claim.sub', '11000000-0000-4000-8000-000000000004', true);
select pg_temp.expect_pilot_error($q$select public.submit_service_request(
  '22000000-0000-4000-8000-000000000001', 'lawn', 'Customer One', '', '1 Example Street', 'Austin', 'TX', '78701', '', '', true)$q$, '42501');
select set_config('request.jwt.claim.sub', '11000000-0000-4000-8000-000000000001', true);
select pg_temp.expect_pilot_error($q$select public.submit_service_request(
  '22000000-0000-4000-8000-000000000001', 'lawn', 'Customer One', '', '1 Example Street', 'Austin', 'TX', '78701', '', '', false)$q$, '22023');
select pg_temp.expect_pilot_error($q$select public.submit_service_request(
  '22000000-0000-4000-8000-000000000001', 'lawn', 'Customer One', '', '1 Example Street', 'Austin', 'XX', '78701', '', '', true)$q$, '23514');
select set_config('test.request_id', public.submit_service_request(
  '22000000-0000-4000-8000-000000000001', 'lawn', ' Customer One ', '', '1 Example Street', 'Austin', 'TX', '78701', '', '', true)->>'id', true);
select pg_temp.assert_pilot(
  (public.submit_service_request('22000000-0000-4000-8000-000000000001', 'lawn', 'Customer One', '', '1 Example Street', 'Austin', 'TX', '78701', '', '', true)->>'id') = current_setting('test.request_id'),
  'unchanged retries return the same request'
);
select pg_temp.expect_pilot_error($q$select public.submit_service_request(
  '22000000-0000-4000-8000-000000000001', 'lawn', 'Changed Name', '', '1 Example Street', 'Austin', 'TX', '78701', '', '', true)$q$, '22023');
select pg_temp.assert_pilot((select count(*) = 1 from public.service_requests), 'no duplicate request');
select pg_temp.assert_pilot((select contact_email = 'customer-one@example.invalid' and full_name = 'Customer One'
  and country_code = 'US' and agreed_total_cents is null from public.service_requests), 'server-owned identity and unpriced request');
select pg_temp.expect_pilot_error($q$select public.update_service_request(current_setting('test.request_id')::uuid,1,'reviewing','Reviewing')$q$, '42501');

select set_config('request.jwt.claim.sub', '11000000-0000-4000-8000-000000000002', true);
select pg_temp.assert_pilot((select count(*) = 0 from public.service_requests), 'another customer cannot read requests even with a known ID');
select pg_temp.assert_pilot((select count(*) = 0 from public.service_request_events), 'another customer cannot read request history');
select pg_temp.expect_pilot_error($q$select public.cancel_service_request(current_setting('test.request_id')::uuid,1)$q$, '42501');

select set_config('request.jwt.claim.sub', '11000000-0000-4000-8000-000000000003', true);
select pg_temp.assert_pilot(public.is_pilot_admin(), 'allowlisted operator has access');
select pg_temp.assert_pilot((select count(*) = 1 from public.service_requests), 'operator sees requests');
select pg_temp.assert_pilot((public.pilot_request_counts()->>'received')::int = 1, 'operator counts reflect received requests');
select pg_temp.expect_pilot_error($q$select public.update_service_request(current_setting('test.request_id')::uuid,1,'confirmed','Confirmed',4500,current_date,true)$q$, '22023');
select public.update_service_request(current_setting('test.request_id')::uuid,1,'reviewing','Checking coverage.');
select pg_temp.expect_pilot_error($q$select public.update_service_request(current_setting('test.request_id')::uuid,1,'declined','Stale edit')$q$, '40001');
select pg_temp.expect_pilot_error($q$select public.update_service_request(current_setting('test.request_id')::uuid,2,'confirmed','Quote not agreed',4500,current_date,false)$q$, '22023');
select pg_temp.expect_pilot_error($q$select public.update_service_request(current_setting('test.request_id')::uuid,2,'confirmed','Invalid quote',-1,current_date,true)$q$, '22023');
select public.update_service_request(current_setting('test.request_id')::uuid,2,'confirmed','Customer agreed by phone.',4500,current_date,true);
select set_config('request.jwt.claim.sub', '11000000-0000-4000-8000-000000000001', true);
select pg_temp.assert_pilot((select status = 'confirmed' and agreed_total_cents = 4500 and version = 3
  from public.service_requests), 'customer sees persisted operator quote and status');
select pg_temp.assert_pilot((select count(*) = 3 from public.service_request_events), 'each action has one audit event');
select pg_temp.expect_pilot_error($q$select public.cancel_service_request(current_setting('test.request_id')::uuid,3)$q$, '22023');

select set_config('request.jwt.claim.sub', '11000000-0000-4000-8000-000000000003', true);
select public.update_service_request(current_setting('test.request_id')::uuid,3,'completed','Work completed; no payment processed here.');
select pg_temp.expect_pilot_error($q$select public.update_service_request(current_setting('test.request_id')::uuid,4,'reviewing','Reopen')$q$, '22023');
reset role;
delete from public.pilot_admins;
set local role authenticated;
select set_config('request.jwt.claim.sub', '11000000-0000-4000-8000-000000000003', true);
select pg_temp.assert_pilot(not public.is_pilot_admin(), 'revocation is immediate');
select pg_temp.assert_pilot((select count(*) = 0 from public.service_requests), 'revoked operator cannot read other customers');
select pg_temp.expect_pilot_error('select public.pilot_request_counts()', '42501');

select set_config('request.jwt.claim.sub', '11000000-0000-4000-8000-000000000002', true);
select set_config('test.cancel_id', public.submit_service_request(gen_random_uuid(),
  'lawn', 'Customer Two', '', '2 Example Street', 'Austin', 'TX', '78701', '', '', true)->>'id', true);
select public.cancel_service_request(current_setting('test.cancel_id')::uuid,1);
select pg_temp.assert_pilot((select status = 'cancelled' from public.service_requests), 'customer can cancel own unconfirmed request');
do $$
begin
  for i in 1..5 loop
    perform public.submit_service_request(gen_random_uuid(), 'lawn', 'Customer Two', '', '2 Example Street', 'Austin', 'TX', '78701', '', '', true);
  end loop;
end;
$$;
select pg_temp.expect_pilot_error($q$select public.submit_service_request(gen_random_uuid(),
  'lawn','Customer Two','','2 Example Street','Austin','TX','78701','','',true)$q$, '54000');
do $$
declare
  r record;
  new_id uuid;
begin
  for r in select id, version from public.service_requests where status = 'received' loop
    perform public.cancel_service_request(r.id, r.version);
  end loop;
  for i in 1..4 loop
    new_id := (public.submit_service_request(gen_random_uuid(), 'lawn', 'Customer Two', '',
      '2 Example Street', 'Austin', 'TX', '78701', '', '', true)->>'id')::uuid;
    perform public.cancel_service_request(new_id, 1);
  end loop;
end;
$$;
select pg_temp.assert_pilot((select count(*) = 10 from public.service_requests), 'ten requests per day permitted after cancellations');
select pg_temp.expect_pilot_error($q$select public.submit_service_request(gen_random_uuid(),
  'lawn','Customer Two','','2 Example Street','Austin','TX','78701','','',true)$q$, '54000');
reset role;
select pg_temp.assert_pilot(not has_table_privilege('authenticated', 'public.bookings', 'INSERT'), 'foundation writes stay locked');
select pg_temp.assert_pilot((select not public from storage.buckets where id = 'blokpakt-evidence'), 'evidence remains private');
rollback;
