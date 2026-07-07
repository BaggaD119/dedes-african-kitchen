-- Real customer <-> vendor messaging, replacing the localStorage-based "sync"
-- that only ever worked between two tabs of the same browser and never
-- actually reached a different device.

create table public.messages (
  id             uuid primary key default gen_random_uuid(),
  customer_id    uuid not null references auth.users(id) on delete cascade,
  customer_name  text,
  customer_email text,
  sender         text not null check (sender in ('customer','vendor')),
  text           text not null,
  read           boolean not null default false,
  created_at     timestamptz not null default now()
);

alter table public.messages enable row level security;

-- Customers can see and send messages in their own conversation thread.
create policy "customers select own messages" on public.messages
  for select using (auth.uid() = customer_id);

create policy "customers insert own messages" on public.messages
  for insert with check (auth.uid() = customer_id and sender = 'customer');

create policy "customers update own messages" on public.messages
  for update using (auth.uid() = customer_id);

-- The vendor account can see and reply to every conversation.
create policy "vendor select all messages" on public.messages
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'vendor')
  );

create policy "vendor insert messages" on public.messages
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'vendor')
    and sender = 'vendor'
  );

create policy "vendor update messages" on public.messages
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'vendor')
  );

-- Lets both sides get new messages live without refreshing.
alter publication supabase_realtime add table public.messages;
