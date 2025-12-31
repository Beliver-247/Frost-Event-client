-- Analytics table for tracking page views
create table if not exists public.page_views (
  id uuid primary key default gen_random_uuid(),
  page_path text not null,
  visitor_id text,
  user_agent text,
  created_at timestamptz not null default now()
);

-- Index for faster queries
create index if not exists page_views_created_at_idx on public.page_views(created_at desc);
create index if not exists page_views_page_path_idx on public.page_views(page_path);

-- Enable RLS
alter table public.page_views enable row level security;

-- Allow anyone to insert page views
create policy page_views_insert_all on public.page_views
  for insert
  with check (true);

-- Only admins can read analytics
create policy page_views_select_admin on public.page_views
  for select
  using (exists (
    select 1 from public.admin_emails a
    where a.email = (auth.jwt() ->> 'email')
  ));
