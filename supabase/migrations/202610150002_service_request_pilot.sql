-- Apply once after the foundation. Additive: no demo data or existing tables are removed.
begin;

create table public.pilot_settings (
  id boolean primary key default true check (id),
  intake_open boolean not null default false
);
insert into public.pilot_settings (id) values (true);

create table public.pilot_admins (
  user_id uuid primary key references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.service_requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete restrict,
  idempotency_key uuid not null,
  service_id text not null references public.services(id) on delete restrict,
  full_name text not null check (length(btrim(full_name)) between 1 and 150),
  contact_email text not null,
  phone text not null default '' check (length(phone) <= 40),
  address text not null check (length(btrim(address)) between 1 and 300),
  city text not null check (length(btrim(city)) between 1 and 100),
  state_code text not null check (state_code = any (string_to_array(
    'AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY DC', ' '))),
  postal_code text not null check (postal_code ~ '^[0-9]{5}(-[0-9]{4})?$'),
  country_code text not null default 'US' check (country_code = 'US'),
  availability text not null default '' check (length(availability) <= 300),
  details text not null default '' check (length(details) <= 3000),
  contact_consent_at timestamptz not null default now(),
  status text not null default 'received'
    check (status in ('received', 'reviewing', 'confirmed', 'completed', 'declined', 'cancelled')),
  agreed_total_cents integer check (agreed_total_cents between 1 and 100000000),
  scheduled_date date,
  customer_agreed_at timestamptz,
  customer_update text not null default '' check (length(customer_update) <= 1000),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (customer_id, idempotency_key),
  check (status not in ('confirmed', 'completed') or
    (agreed_total_cents is not null and scheduled_date is not null and customer_agreed_at is not null))
);
create index service_requests_customer_idx on public.service_requests(customer_id, created_at desc);
create index service_requests_status_idx on public.service_requests(status, created_at desc);

create table public.service_request_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.service_requests(id) on delete restrict,
  actor_id uuid not null references auth.users(id) on delete restrict,
  status text not null,
  customer_update text not null,
  created_at timestamptz not null default now()
);
create index service_request_events_request_idx on public.service_request_events(request_id, created_at);

alter table public.pilot_settings enable row level security;
alter table public.pilot_admins enable row level security;
alter table public.service_requests enable row level security;
alter table public.service_request_events enable row level security;
revoke all on public.pilot_settings, public.pilot_admins, public.service_requests,
  public.service_request_events from public, anon, authenticated;
grant select on public.pilot_settings to anon, authenticated;
grant select on public.service_requests, public.service_request_events to authenticated;
create policy pilot_settings_read on public.pilot_settings for select to anon, authenticated using (true);

create function public.is_pilot_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.pilot_admins a join auth.users u on u.id = a.user_id
    where a.user_id = auth.uid() and u.email_confirmed_at is not null
  );
$$;
revoke all on function public.is_pilot_admin() from public, anon, authenticated;
grant execute on function public.is_pilot_admin() to authenticated;

create policy service_requests_read on public.service_requests
  for select to authenticated using (customer_id = (select auth.uid()) or (select public.is_pilot_admin()));
create policy service_request_events_read on public.service_request_events
  for select to authenticated using (
    exists (select 1 from public.service_requests r where r.id = request_id)
  );

create function public.submit_service_request(
  p_key uuid, p_service_id text, p_full_name text, p_phone text, p_address text,
  p_city text, p_state_code text, p_postal_code text, p_availability text,
  p_details text, p_contact_consent boolean
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_email text;
  v_request public.service_requests;
begin
  select email into v_email from auth.users where id = v_user and email_confirmed_at is not null;
  if v_user is null or v_email is null then
    raise exception 'Verify your email before submitting a request.' using errcode = '42501';
  end if;
  if p_contact_consent is distinct from true then
    raise exception 'Permission to contact you about this request is required.' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 0));
  select * into v_request from public.service_requests
    where customer_id = v_user and idempotency_key = p_key;
  if found then
    if (v_request.service_id, v_request.full_name, v_request.phone, v_request.address,
        v_request.city, v_request.state_code, v_request.postal_code, v_request.availability, v_request.details)
      is distinct from
       (p_service_id, btrim(p_full_name), btrim(p_phone), btrim(p_address), btrim(p_city),
        p_state_code, btrim(p_postal_code), btrim(p_availability), btrim(p_details)) then
      raise exception 'A previous submission used this reference. Check My requests before submitting again.' using errcode = '22023';
    end if;
    return to_jsonb(v_request);
  end if;
  if not exists (select 1 from public.pilot_settings where id and intake_open) then
    raise exception 'New service requests are paused.' using errcode = '55000';
  end if;
  if not exists (select 1 from public.services where id = p_service_id and active) then
    raise exception 'This service is not accepting requests.' using errcode = '22023';
  end if;
  if (select count(*) from public.service_requests where customer_id = v_user
        and status in ('received', 'reviewing', 'confirmed')) >= 5
    or (select count(*) from public.service_requests where customer_id = v_user
        and created_at > now() - interval '24 hours') >= 10 then
    raise exception 'Request limit reached: at most 5 open requests and 10 new requests per 24 hours.' using errcode = '54000';
  end if;
  insert into public.service_requests (
    customer_id, idempotency_key, service_id, full_name, contact_email, phone,
    address, city, state_code, postal_code, availability, details
  ) values (
    v_user, p_key, p_service_id, btrim(p_full_name), v_email, btrim(p_phone),
    btrim(p_address), btrim(p_city), p_state_code, btrim(p_postal_code), btrim(p_availability), btrim(p_details)
  ) returning * into v_request;
  insert into public.service_request_events (request_id, actor_id, status, customer_update)
    values (v_request.id, v_user, 'received', 'Request received. Coverage, quote, and timing await manual review.');
  return to_jsonb(v_request);
end;
$$;
revoke all on function public.submit_service_request(uuid,text,text,text,text,text,text,text,text,text,boolean)
  from public, anon, authenticated;
grant execute on function public.submit_service_request(uuid,text,text,text,text,text,text,text,text,text,boolean)
  to authenticated;

create function public.update_service_request(
  p_id uuid, p_version integer, p_status text, p_update text,
  p_total_cents integer default null, p_scheduled_date date default null,
  p_customer_agreed boolean default false
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_request public.service_requests;
begin
  if not public.is_pilot_admin() then
    raise exception 'Administrator access is required.' using errcode = '42501';
  end if;
  select * into v_request from public.service_requests where id = p_id for update;
  if not found then raise exception 'Request not found.' using errcode = 'P0002'; end if;
  if p_version is distinct from v_request.version then
    raise exception 'This request changed. Refresh before updating it.' using errcode = '40001';
  end if;
  if p_status is null or not (
    (v_request.status = 'received' and p_status in ('reviewing', 'declined', 'cancelled')) or
    (v_request.status = 'reviewing' and p_status in ('confirmed', 'declined', 'cancelled')) or
    (v_request.status = 'confirmed' and p_status in ('completed', 'cancelled'))
  ) then raise exception 'This status transition is not allowed.' using errcode = '22023'; end if;
  if p_update is null or length(btrim(p_update)) not between 1 and 1000 then
    raise exception 'Add a customer-visible update of 1 to 1000 characters.' using errcode = '22023';
  end if;
  if p_status = 'confirmed' then
    if p_customer_agreed is distinct from true or p_total_cents is null
      or p_total_cents not between 1 and 100000000 or p_scheduled_date is null
      or p_scheduled_date < current_date then
      raise exception 'Confirm customer agreement, a positive USD quote, and a service date today or later (UTC).' using errcode = '22023';
    end if;
    v_request.agreed_total_cents := p_total_cents;
    v_request.scheduled_date := p_scheduled_date;
    v_request.customer_agreed_at := now();
  elsif p_total_cents is not null or p_scheduled_date is not null or p_customer_agreed is true then
    raise exception 'Quote and agreement fields apply only when confirming a request.' using errcode = '22023';
  end if;
  update public.service_requests set status = p_status, customer_update = btrim(p_update),
    agreed_total_cents = v_request.agreed_total_cents, scheduled_date = v_request.scheduled_date,
    customer_agreed_at = v_request.customer_agreed_at, version = version + 1, updated_at = now()
    where id = p_id returning * into v_request;
  insert into public.service_request_events (request_id, actor_id, status, customer_update)
    values (p_id, auth.uid(), p_status, btrim(p_update));
  return to_jsonb(v_request);
end;
$$;
revoke all on function public.update_service_request(uuid,integer,text,text,integer,date,boolean)
  from public, anon, authenticated;
grant execute on function public.update_service_request(uuid,integer,text,text,integer,date,boolean)
  to authenticated;

create function public.cancel_service_request(p_id uuid, p_version integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_request public.service_requests;
begin
  select * into v_request from public.service_requests
    where id = p_id and customer_id = auth.uid() for update;
  if not found then raise exception 'Request not found or access denied.' using errcode = '42501'; end if;
  if p_version is distinct from v_request.version then
    raise exception 'This request changed. Refresh before cancelling.' using errcode = '40001';
  end if;
  if v_request.status not in ('received', 'reviewing') then
    raise exception 'Only unconfirmed requests can be cancelled here. Contact the operator about confirmed work.' using errcode = '22023';
  end if;
  update public.service_requests set status = 'cancelled',
    customer_update = 'Cancelled by the customer.', version = version + 1, updated_at = now()
    where id = p_id returning * into v_request;
  insert into public.service_request_events (request_id, actor_id, status, customer_update)
    values (p_id, auth.uid(), 'cancelled', v_request.customer_update);
  return to_jsonb(v_request);
end;
$$;
revoke all on function public.cancel_service_request(uuid,integer) from public, anon, authenticated;
grant execute on function public.cancel_service_request(uuid,integer) to authenticated;

create function public.pilot_request_counts()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_pilot_admin() then
    raise exception 'Administrator access is required.' using errcode = '42501';
  end if;
  return (select jsonb_build_object(
    'total', count(*),
    'received', count(*) filter (where status = 'received'),
    'reviewing', count(*) filter (where status = 'reviewing'),
    'confirmed', count(*) filter (where status = 'confirmed'),
    'completed', count(*) filter (where status = 'completed'),
    'declined', count(*) filter (where status = 'declined'),
    'cancelled', count(*) filter (where status = 'cancelled')
  ) from public.service_requests);
end;
$$;
revoke all on function public.pilot_request_counts() from public, anon, authenticated;
grant execute on function public.pilot_request_counts() to authenticated;

commit;
