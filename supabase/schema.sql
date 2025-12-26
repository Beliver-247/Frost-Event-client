-- Enable required extensions
create extension if not exists pgcrypto;

-- Admin allowlist
create table if not exists public.admin_emails (
  email text primary key
);

-- Items table
create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  order_index int not null,
  title text not null,
  type text not null check (type in ('song','speech','reading','announcement')),
  language text not null check (language in ('si','en')),
  content text not null
);

-- Show state (singleton row id=1)
create table if not exists public.show_state (
  id int primary key,
  current_item_id uuid references public.items(id) on delete set null,
  updated_at timestamptz not null default now()
);

-- Seed singleton row
insert into public.show_state (id) values (1)
  on conflict (id) do nothing;

-- Row Level Security
alter table public.items enable row level security;
alter table public.show_state enable row level security;
alter table public.admin_emails enable row level security;

-- Policies
-- items: READ for everyone
create policy items_select_all on public.items
  for select
  using (true);

-- items: WRITE only for allowlisted admins
create policy items_write_admin on public.items
  for all
  using (exists (
    select 1 from public.admin_emails a
    where a.email = (auth.jwt() ->> 'email')
  ))
  with check (exists (
    select 1 from public.admin_emails a
    where a.email = (auth.jwt() ->> 'email')
  ));

-- show_state: READ for everyone
create policy show_state_select_all on public.show_state
  for select
  using (true);

-- show_state: UPDATE only for allowlisted admins
create policy show_state_update_admin on public.show_state
  for update
  using (exists (
    select 1 from public.admin_emails a
    where a.email = (auth.jwt() ->> 'email')
  ))
  with check (exists (
    select 1 from public.admin_emails a
    where a.email = (auth.jwt() ->> 'email')
  ));

-- admin_emails: only admins can view/modify (optional tighten)
create policy admin_emails_select_admin on public.admin_emails
  for select using (exists (select 1 from public.admin_emails a where a.email = (auth.jwt() ->> 'email')));
create policy admin_emails_modify_admin on public.admin_emails
  for all using (exists (select 1 from public.admin_emails a where a.email = (auth.jwt() ->> 'email')))
  with check (exists (select 1 from public.admin_emails a where a.email = (auth.jwt() ->> 'email')));

-- Enable Realtime on show_state
alter publication supabase_realtime add table public.show_state;
