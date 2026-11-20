# Onyx Admin Panel

React + Tailwind admin panel served at:

- `https://onyx.devenginehq.com/admin/login`
- `https://onyx.devenginehq.com/admin/dashboard` (+ `/users`, `/transactions`, `/issues`, `/feedback`, `/announcements`, `/earnings`, `/settings`)

## One-time setup

1. **Database**: open Supabase -> SQL Editor -> paste & run [`supabase/admin_setup.sql`](supabase/admin_setup.sql).
   It creates the admin allow-list, `is_admin()`, the `admin_earnings` table, admin RLS policies and the
   `admin_*` stats functions. Safe to re-run.
2. **Admin login**: the account `support.thedevhamim@gmail.com` must exist in Supabase Auth with the password you want.
   - `npm run create-admin` tries to create it from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `../.env`.
   - If it already exists (e.g. via Google sign-in) set its password in Dashboard -> Authentication -> Users,
     or run in the SQL editor:
     `update auth.users set encrypted_password = crypt('NEW_PASSWORD', gen_salt('bf')), email_confirmed_at = coalesce(email_confirmed_at, now()) where email = 'support.thedevhamim@gmail.com';`

## Develop / build

```bash
cd admin-panel
npm install
npm run dev      # http://localhost:5173/admin/login
npm run build    # writes the static site into ../admin  (commit that folder)
```

`npm run build` also creates `admin/<route>/index.html` for every route because GitHub Pages is static hosting.

## Security model

- Authentication = Supabase Auth (e-mail + password).
- Authorization = the database. `public.is_admin()` only returns true for confirmed e-mails in `public.admin_users`.
  Every admin RPC and RLS policy calls it, so reading the public JavaScript gives an attacker nothing.
- `.env` is git-ignored. `ADMIN_PASSWORD` has no `VITE_` prefix, so Vite never bundles it into the website.
- Only the Supabase **publishable** key is in the bundle (public by design). The **service-role key is never used**.
- To add another admin: `insert into public.admin_users(email) values ('someone@example.com');`

## Earnings

AdMob's reporting API needs a server-side OAuth flow, which a static site cannot do safely, so earnings are logged
manually on the **Earnings** page (date, amount, impressions, clicks) and charted next to your user growth.
