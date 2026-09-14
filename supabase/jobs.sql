create table if not exists public.jobs (
  id text primary key,
  code text unique not null,
  batch_code text,
  position integer not null default 0,
  status text not null default 'pending' check (status in ('pending', 'en_route', 'arrived', 'in_progress', 'complete', 'disputed', 'cancelled')),
  service text not null,
  service_icon text not null default '🧹',
  address text not null,
  city text not null default '',
  zip text not null default '',
  gate_code text,
  property_notes text not null default '',
  scheduled_window text,
  provider_name text not null default 'Your contractor',
  customer_name text not null,
  customer_email text,
  customer_phone text,
  payout_cents integer not null default 0,
  estimated_duration text not null default '45 min',
  before_photo text,
  after_photo text,
  arrived_at timestamptz,
  completed_at timestamptz,
  payment_intent_id text,
  checkout_session_id text,
  created_at timestamptz not null default now()
);

alter table public.jobs enable row level security;

create policy "Allow job workflow access"
  on public.jobs for all
  using (true)
  with check (true);

alter publication supabase_realtime add table public.jobs;
