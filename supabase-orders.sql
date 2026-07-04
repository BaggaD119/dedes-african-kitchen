-- Run this once in the Supabase SQL editor (same place you ran the profiles SQL).
-- Adds a real orders table so checkout actually persists an order, and the
-- Vendor Orders page reads/updates real data instead of hardcoded rows.

create table public.orders (
  id             uuid primary key default gen_random_uuid(),
  customer_id    uuid not null references auth.users(id) on delete cascade,
  customer_name  text,
  customer_email text,
  items          jsonb not null,
  total          double precision not null,
  status         text not null default 'pending' check (status in ('pending','preparing','ready','delivered','cancelled')),
  created_at     timestamptz not null default now()
);

alter table public.orders enable row level security;

-- Customers can see and create only their own orders.
create policy "customers select own orders" on public.orders
  for select using (auth.uid() = customer_id);

create policy "customers insert own orders" on public.orders
  for insert with check (auth.uid() = customer_id);

-- The vendor account (role='vendor' in profiles) can see and update every order.
create policy "vendors select all orders" on public.orders
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'vendor')
  );

create policy "vendors update orders" on public.orders
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'vendor')
  );

-- Lets Vendor.html get a live push the instant a new order comes in.
alter publication supabase_realtime add table public.orders;
