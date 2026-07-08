-- Run this once in the Supabase SQL editor (after the orders/messages tables
-- already exist). Removes the requirement for customers to have a Supabase
-- Auth account at all — no login screen, no anonymous-auth toggle needed.
--
-- Each browser generates a random guest id (crypto.randomUUID()), stores it
-- in localStorage, and sends it on every request as the `x-guest-id` header
-- (see js/supabase-client.js). RLS policies below scope each guest to rows
-- whose customer_id matches that header, so one guest can't read another
-- guest's orders or messages. Vendor policies are untouched.

alter table public.orders drop constraint if exists orders_customer_id_fkey;
alter table public.messages drop constraint if exists messages_customer_id_fkey;

drop policy if exists "customers select own orders" on public.orders;
drop policy if exists "customers insert own orders" on public.orders;

create policy "guests select own orders" on public.orders
  for select using (
    customer_id::text = coalesce(current_setting('request.headers', true)::json->>'x-guest-id', '')
  );

create policy "guests insert own orders" on public.orders
  for insert with check (
    customer_id::text = coalesce(current_setting('request.headers', true)::json->>'x-guest-id', '')
  );

drop policy if exists "customers select own messages" on public.messages;
drop policy if exists "customers insert own messages" on public.messages;
drop policy if exists "customers update own messages" on public.messages;

create policy "guests select own messages" on public.messages
  for select using (
    customer_id::text = coalesce(current_setting('request.headers', true)::json->>'x-guest-id', '')
  );

create policy "guests insert own messages" on public.messages
  for insert with check (
    customer_id::text = coalesce(current_setting('request.headers', true)::json->>'x-guest-id', '')
    and sender = 'customer'
  );

create policy "guests update own messages" on public.messages
  for update using (
    customer_id::text = coalesce(current_setting('request.headers', true)::json->>'x-guest-id', '')
  );
