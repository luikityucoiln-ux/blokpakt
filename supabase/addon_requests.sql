create table if not exists public.addon_requests (
  id text primary key,
  job_id text not null,
  service_title text not null,
  description text not null default '',
  price_cents integer not null check (price_cents > 0),
  photo_data text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  created_at timestamptz not null default now()
);

alter table public.addon_requests enable row level security;

create policy "Allow add-on workflow access"
  on public.addon_requests for all
  using (true)
  with check (true);

alter publication supabase_realtime add table public.addon_requests;