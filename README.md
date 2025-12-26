# Carols Live (Next.js + Supabase)

A production-ready web app for a single carols show. Audience scans a QR and sees the currently live item (song/speech/etc) on their phones. An operator updates the live item from an admin page. Realtime updates via Supabase.

## Stack
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS (blue + gold theme via CSS variables)
- Supabase (Postgres + Auth + Realtime)
- Framer Motion (animations)
- Deployable to Vercel

## Features
- Welcome page with premium animated gradient and logo, respects reduced motion
- Audience Live page that auto-updates via Supabase Realtime (no polling), shows last updated, font size + auto-scroll
- Admin page with email magic link auth and allowlist gate, search, click-to-go-live, highlight current, next/prev buttons
- Database schema with RLS policies enforcing admin allowlist for writes
- Import script to seed items from JSON

## Setup

### 1) Install dependencies
```bash
npm install
```

### 2) Env vars
Copy `.env.example` to `.env.local` and fill the values:
- `NEXT_PUBLIC_SUPABASE_URL` – Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` – Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` – Supabase service role (server-only; used by import script)
- `ADMIN_EMAILS` – comma-separated list of exactly 3 operator emails
- `NEXT_PUBLIC_SITE_URL` – your site URL (e.g., http://localhost:3000 or prod domain)

### 3) Supabase: create project and run SQL
- Create a new Supabase project
- Open SQL editor and run the contents of `supabase/schema.sql`
- Insert your operator emails into `public.admin_emails`:
```sql
insert into public.admin_emails (email) values
  ('admin1@example.com'),
  ('admin2@example.com'),
  ('admin3@example.com');
```
- Ensure a singleton row exists in `show_state` with id=1 (the SQL seeds it):
```sql
insert into public.show_state (id) values (1) on conflict (id) do nothing;
```

### 4) Import items (optional)
- Copy `data/items.example.json` to `data/items.json` and edit entries
- Run import with service role key:
```bash
SUPABASE_SERVICE_ROLE_KEY=... NEXT_PUBLIC_SUPABASE_URL=... npm run seed:items
```

### 5) Run locally
```bash
npm run dev
```
Open http://localhost:3000

- Audience: QR to `/`
- Admin: `/login` to request magic link (UI blocks non-allowlisted emails)

### 6) Vercel deployment
- Push to a Git repository and import into Vercel
- Set environment variables in Vercel:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `ADMIN_EMAILS`
  - `NEXT_PUBLIC_SITE_URL`
  - (Optional for imports) `SUPABASE_SERVICE_ROLE_KEY`
- Deploy

### 7) Realtime
- `show_state` is in the `supabase_realtime` publication
- Client subscribes to `UPDATE` events for `id=1` and refetches the current item

## QR Generation
Generate a QR code pointing to your site root (welcome page).

Examples:
- macOS (brew installs `qrencode`):
```bash
brew install qrencode
qrencode -o qr.png "https://your-domain.example/"
```
- Online tools: any QR generator (ensure URL correctness)

## Security
- RLS enabled for all tables
- `items`: SELECT for all; write only if admin exists in `admin_emails`
- `show_state`: SELECT for all; UPDATE only if admin exists
- UI gate using `ADMIN_EMAILS`; login page refuses non-allowlisted emails

## Notes
- The public logo at `public/logo.png` is a placeholder. Replace with your PNG logo.
- The app displays `public/logo.svg` by default for crisp UI.
- Animations respect `prefers-reduced-motion`.

## Project Structure
- `app/page.tsx` – Welcome
- `app/live/page.tsx` – Audience live view
- `app/admin/page.tsx` – Admin dashboard
- `app/login/page.tsx` – Admin login
- `lib/supabaseClient.ts` – Browser Supabase
- `lib/supabaseServer.ts` – Server Supabase (cookies)
- `lib/isAllowedAdmin.ts` – Allowlist helper
- `components/*` – UI components
- `scripts/importItems.ts` – Import JSON items
- `data/items.example.json` – Example items
- `supabase/schema.sql` – Tables + RLS
