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
  scheduled_date date,
  time_window text check (time_window in ('morning', 'afternoon', 'flexible')),
  flexible_slot boolean not null default false,
  estimated_duration text not null default '45 min',
  before_photo text,
  after_photo text,
  arrived_at timestamptz,
  completed_at timestamptz,
  payment_intent_id text,
  checkout_session_id text,
  created_at timestamptz not null default now()
);

alter table public.jobs add column if not exists scheduled_date date;
alter table public.jobs add column if not exists time_window text;
alter table public.jobs add column if not exists flexible_slot boolean not null default false;

alter table public.jobs drop constraint if exists jobs_time_window_check;
alter table public.jobs add constraint jobs_time_window_check
  check (time_window is null or time_window in ('morning', 'afternoon', 'flexible'));

create index if not exists idx_jobs_batch_schedule
  on public.jobs (batch_code, scheduled_date);

alter table public.jobs enable row level security;

create policy "Allow job workflow access"
  on public.jobs for all
  using (true)
  with check (true);

alter publication supabase_realtime add table public.jobs;
