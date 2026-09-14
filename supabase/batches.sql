create table if not exists public.batches (
  code text primary key,
  street text not null,
  service text not null,
  batch_price_cents integer not null,
  solo_price_cents integer not null,
  homes_booked integer not null default 0,
  target_homes integer not null default 5,
  created_at timestamptz not null default now()
);

alter table public.batches enable row level security;

create policy "Allow batch lookup access"
  on public.batches for all
  using (true)
  with check (true);
