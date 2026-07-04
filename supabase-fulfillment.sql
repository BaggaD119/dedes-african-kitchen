-- Run this after supabase-profiles.sql and supabase-orders.sql.
-- Adds Pickup vs Delivery to each order.

alter table public.orders
  add column fulfillment text not null default 'delivery'
  check (fulfillment in ('pickup','delivery'));
