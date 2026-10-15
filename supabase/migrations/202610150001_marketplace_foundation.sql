-- Run once in the SQL Editor of the new Blokpakt Supabase project.
-- Foundation only: browser writes stay disabled until validated APIs are added.
begin;

create table public.services (
  id text primary key check (id ~ '^[a-z][a-z0-9_]*$'),
  name text not null check (length(trim(name)) between 1 and 100),
  active boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.customer_profiles (
  user_id uuid primary key references auth.users(id) on delete restrict,
  full_name text not null check (length(trim(full_name)) between 1 and 150),
  phone text check (phone is null or length(phone) <= 40),
  created_at timestamptz not null default now()
);

create table public.providers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete restrict,
  public_id text not null unique default
    ('BP-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))),
  display_name text not null check (length(trim(display_name)) between 1 and 100),
  business_name text not null check (length(trim(business_name)) between 1 and 200),
  approval_status text not null default 'pending'
    check (approval_status in ('pending', 'approved', 'suspended', 'rejected')),
  created_at timestamptz not null default now()
);

create table public.provider_services (
  provider_id uuid not null references public.providers(id) on delete restrict,
  service_id text not null references public.services(id) on delete restrict,
  primary key (provider_id, service_id)
);

create table public.route_blocks (
  id uuid primary key default gen_random_uuid(),
  service_id text not null references public.services(id) on delete restrict,
  service_date date not null,
  area_label text not null check (length(trim(area_label)) between 1 and 200),
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  postal_code text check (postal_code is null or length(postal_code) <= 20),
  provider_id uuid,
  status text not null default 'forming'
    check (status in ('forming', 'offered', 'accepted', 'complete', 'cancelled')),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (id, service_id, service_date),
  foreign key (provider_id, service_id)
    references public.provider_services(provider_id, service_id) on delete restrict,
  check (
    status not in ('accepted', 'complete')
    or (provider_id is not null and accepted_at is not null)
  )
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  public_code text not null unique default
    ('BLK-' || upper(replace(gen_random_uuid()::text, '-', ''))),
  customer_id uuid not null references public.customer_profiles(user_id) on delete restrict,
  service_id text not null references public.services(id) on delete restrict,
  service_date date not null,
  requested_window text check (requested_window is null or length(requested_window) <= 100),
  address text not null check (length(trim(address)) between 1 and 500),
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  postal_code text check (postal_code is null or length(postal_code) <= 20),
  property_notes text not null default '' check (length(property_notes) <= 3000),
  gate_code text check (gate_code is null or length(gate_code) <= 100),
  route_block_id uuid,
  route_position smallint check (route_position between 1 and 6),
  status text not null default 'pending'
    check (status in ('pending', 'en_route', 'arrived', 'in_progress', 'complete', 'disputed', 'cancelled')),
  quoted_total_cents integer check (quoted_total_cents >= 0),
  currency text check (currency ~ '^[A-Z]{3}$'),
  arrived_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (route_block_id, service_id, service_date)
    references public.route_blocks(id, service_id, service_date) on delete restrict,
  unique (route_block_id, route_position),
  check ((route_block_id is null) = (route_position is null)),
  check ((quoted_total_cents is null) = (currency is null)),
  check (status <> 'complete' or (arrived_at is not null and completed_at is not null)),
  check (completed_at is null or (arrived_at is not null and completed_at >= arrived_at))
);

create table public.booking_photos (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete restrict,
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  kind text not null check (kind in ('before', 'after')),
  object_path text not null unique check (
    object_path like booking_id::text || '/%'
    and object_path not like '%..%'
  ),
  content_type text not null check (content_type in ('image/jpeg', 'image/png', 'image/webp')),
  size_bytes integer not null check (size_bytes between 1 and 1000000),
  created_at timestamptz not null default now()
);

create index bookings_customer_created_idx on public.bookings(customer_id, created_at desc);
create index route_blocks_provider_date_idx on public.route_blocks(provider_id, service_date);
create index booking_photos_booking_idx on public.booking_photos(booking_id);
create index booking_photos_uploader_idx on public.booking_photos(uploaded_by);
create index bookings_service_date_idx on public.bookings(service_id, service_date);
create index provider_services_service_idx on public.provider_services(service_id);
create index route_blocks_service_date_idx on public.route_blocks(service_id, service_date);

alter table public.services enable row level security;
alter table public.customer_profiles enable row level security;
alter table public.providers enable row level security;
alter table public.provider_services enable row level security;
alter table public.route_blocks enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_photos enable row level security;

-- Remove Supabase's default API privileges before granting the specific reads.
revoke all on table public.services, public.customer_profiles, public.providers,
  public.provider_services, public.route_blocks, public.bookings, public.booking_photos
  from public, anon, authenticated;

grant select on public.services to anon, authenticated;
grant select on public.customer_profiles, public.providers, public.provider_services,
  public.route_blocks, public.bookings, public.booking_photos to authenticated;

create policy services_active_read on public.services
  for select to anon, authenticated using (active);

create policy customers_read_self on public.customer_profiles
  for select to authenticated using (user_id = (select auth.uid()));

create policy providers_read_self on public.providers
  for select to authenticated using (user_id = (select auth.uid()));

create policy provider_services_read_self on public.provider_services
  for select to authenticated using (
    exists (
      select 1 from public.providers p
      where p.id = provider_id and p.user_id = (select auth.uid())
    )
  );

create policy routes_read_assigned on public.route_blocks
  for select to authenticated using (
    exists (
      select 1 from public.providers p
      where p.id = provider_id and p.user_id = (select auth.uid())
        and p.approval_status = 'approved'
    )
  );

-- A booking code is a reference, never a credential. Providers only see exact
-- addresses after their assigned route is accepted, and never see profiles/phones.
create policy bookings_read_participant on public.bookings
  for select to authenticated using (
    customer_id = (select auth.uid())
    or exists (
      select 1 from public.route_blocks r
      join public.providers p on p.id = r.provider_id
      where r.id = route_block_id
        and r.status in ('accepted', 'complete')
        and p.user_id = (select auth.uid())
        and p.approval_status = 'approved'
    )
  );

create policy photos_read_participant on public.booking_photos
  for select to authenticated using (
    exists (select 1 from public.bookings b where b.id = booking_id)
  );

-- Catalog identifiers match the UI. No demo people, orders, prices or currency
-- are imported, and services remain inactive until the pilot is configured.
insert into public.services (id, name) values
  ('lawn', 'Lawn Care'),
  ('gutter', 'Gutter Cleaning'),
  ('pressure', 'Pressure Washing'),
  ('snow', 'Snow Removal');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'blokpakt-evidence', 'blokpakt-evidence', false, 1000000,
  array['image/jpeg', 'image/png', 'image/webp']
);

-- Lock this private bucket even if unrelated permissive policies exist.
-- A later migration must replace this lock when verified upload/read APIs exist.
create policy blokpakt_evidence_locked_until_api on storage.objects
  as restrictive for all to anon, authenticated
  using (bucket_id <> 'blokpakt-evidence')
  with check (bucket_id <> 'blokpakt-evidence');

commit;
