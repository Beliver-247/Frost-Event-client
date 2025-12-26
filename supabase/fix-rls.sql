-- Fix infinite recursion in admin_emails policies

-- Drop existing problematic policies
drop policy if exists admin_emails_select_admin on public.admin_emails;
drop policy if exists admin_emails_modify_admin on public.admin_emails;

-- Allow authenticated users to SELECT (needed for policy checks on other tables)
create policy admin_emails_select_authenticated on public.admin_emails
  for select
  using (auth.role() = 'authenticated');

-- Only service_role can modify admin_emails (use Supabase dashboard or service key)
-- No INSERT/UPDATE/DELETE policies needed; defaults to deny for regular users
