-- Real menu items, replacing the in-memory mock array that used to live only
-- in Vendor.html's JS and never persisted or reached the real customer menu.

create table public.menu_items (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  category     text not null,
  price_small  double precision not null,
  price_big    double precision not null,
  prep_time    text,
  photo_url    text,
  available    boolean not null default true,
  created_at   timestamptz not null default now()
);

alter table public.menu_items enable row level security;

-- Anyone (including anonymous storefront visitors) can see the menu.
create policy "anyone can view menu items" on public.menu_items
  for select using (true);

-- Only the vendor account can add, edit, or remove items.
create policy "vendor can insert menu items" on public.menu_items
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'vendor')
  );

create policy "vendor can update menu items" on public.menu_items
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'vendor')
  );

create policy "vendor can delete menu items" on public.menu_items
  for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'vendor')
  );

-- Lets the customer menu update live if the vendor changes something while a
-- customer has the page open.
alter publication supabase_realtime add table public.menu_items;
