-- Run this once in the Supabase SQL editor.
-- Tracks whether an order has actually been paid via Stripe, separate from
-- the kitchen workflow status (pending/preparing/ready/delivered/cancelled).

alter table public.orders
  add column payment_status text not null default 'unpaid'
  check (payment_status in ('unpaid','paid','failed'));
