-- ============================================================
-- ONYX ADMIN PANEL - Supabase setup
-- Safe to re-run (idempotent).
-- ============================================================

-- 1. Admin allow-list ----------------------------------------
create table if not exists public.admin_users (
  email text primary key,
  created_at timestamptz default now()
);
alter table public.admin_users enable row level security;

insert into public.admin_users (email)
values ('support.thedevhamim@gmail.com')
on conflict (email) do nothing;

-- 2. is_admin(): true only for a confirmed allow-listed admin
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from auth.users u
    join public.admin_users a on lower(a.email) = lower(u.email)
    where u.id = auth.uid()
      and u.email_confirmed_at is not null
  );
$$;
grant execute on function public.is_admin() to authenticated;

-- 3. Earnings table (manual AdMob / other income log) --------
create table if not exists public.admin_earnings (
  id uuid default gen_random_uuid() primary key,
  earning_date date not null default current_date,
  source text not null default 'AdMob',
  amount numeric(12,2) not null default 0,
  currency text not null default 'USD',
  impressions integer default 0,
  clicks integer default 0,
  notes text,
  created_at timestamptz default now()
);
alter table public.admin_earnings enable row level security;

drop policy if exists "Admin manage earnings" on public.admin_earnings;
create policy "Admin manage earnings" on public.admin_earnings
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- 4. Admin policies on existing tables -----------------------
drop policy if exists "Admin manage announcements" on public.system_announcements;
create policy "Admin manage announcements" on public.system_announcements
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admin manage issue reports" on public.issue_reports;
create policy "Admin manage issue reports" on public.issue_reports
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admin read delete feedbacks" on public.delete_feedbacks;
create policy "Admin read delete feedbacks" on public.delete_feedbacks
  for select to authenticated using (public.is_admin());

drop policy if exists "Admin delete delete feedbacks" on public.delete_feedbacks;
create policy "Admin delete delete feedbacks" on public.delete_feedbacks
  for delete to authenticated using (public.is_admin());

drop policy if exists "Admin read expenses" on public.expenses;
create policy "Admin read expenses" on public.expenses
  for select to authenticated using (public.is_admin());

drop policy if exists "Admin read wallets" on public.wallets;
create policy "Admin read wallets" on public.wallets
  for select to authenticated using (public.is_admin());

drop policy if exists "Admin read budget plans" on public.budget_plans;
create policy "Admin read budget plans" on public.budget_plans
  for select to authenticated using (public.is_admin());

drop policy if exists "Admin read loans" on public.loans;
create policy "Admin read loans" on public.loans
  for select to authenticated using (public.is_admin());

drop policy if exists "Admin read loan repayments" on public.loan_repayments;
create policy "Admin read loan repayments" on public.loan_repayments
  for select to authenticated using (public.is_admin());

-- 5. RPC Functions for Dashboard & Pages ---------------------

-- Dashboard Overview Stats
create or replace function public.admin_dashboard_stats()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_is_admin boolean;
  v_users_total bigint := 0;
  v_users_7d bigint := 0;
  v_active_30d bigint := 0;
  v_users_today bigint := 0;
  v_users_30d bigint := 0;
  v_transactions_total bigint := 0;
  v_transactions_30d bigint := 0;
  v_earnings_month numeric := 0;
  v_earnings_30d numeric := 0;
  v_earnings_total numeric := 0;
  v_volume_income numeric := 0;
  v_volume_expense numeric := 0;
  v_wallets_total bigint := 0;
  v_budgets_total bigint := 0;
  v_issues_total bigint := 0;
  v_issues_7d bigint := 0;
  v_feedbacks_total bigint := 0;
  v_announcements_active bigint := 0;
begin
  select public.is_admin() into v_is_admin;
  if not coalesce(v_is_admin, false) then
    raise exception 'Unauthorized: Admin privileges required';
  end if;

  select count(*) into v_users_total from auth.users;
  select count(*) into v_users_7d from auth.users where created_at >= now() - interval '7 days';
  select count(*) into v_active_30d from auth.users where last_sign_in_at >= now() - interval '30 days';
  select count(*) into v_users_today from auth.users where created_at >= current_date;
  select count(*) into v_users_30d from auth.users where created_at >= now() - interval '30 days';

  select count(*) into v_transactions_total from public.expenses;
  select count(*) into v_transactions_30d from public.expenses where date >= now() - interval '30 days';

  select coalesce(sum(amount), 0) into v_earnings_month
  from public.admin_earnings
  where earning_date >= date_trunc('month', current_date)::date;

  select coalesce(sum(amount), 0) into v_earnings_30d
  from public.admin_earnings
  where earning_date >= current_date - interval '30 days';

  select coalesce(sum(amount), 0) into v_earnings_total
  from public.admin_earnings;

  select coalesce(sum(amount), 0) into v_volume_income
  from public.expenses
  where type = 'income';

  select coalesce(sum(amount), 0) into v_volume_expense
  from public.expenses
  where type = 'expense';

  select count(*) into v_wallets_total from public.wallets;
  select count(*) into v_budgets_total from public.budget_plans;

  select count(*) into v_issues_total from public.issue_reports;
  select count(*) into v_issues_7d from public.issue_reports where created_at >= now() - interval '7 days';

  select count(*) into v_feedbacks_total from public.delete_feedbacks;
  select count(*) into v_announcements_active from public.system_announcements where is_active = true;

  return jsonb_build_object(
    'users_total', v_users_total,
    'users_7d', v_users_7d,
    'active_30d', v_active_30d,
    'users_today', v_users_today,
    'users_30d', v_users_30d,
    'transactions_total', v_transactions_total,
    'transactions_30d', v_transactions_30d,
    'earnings_month', v_earnings_month,
    'earnings_30d', v_earnings_30d,
    'earnings_total', v_earnings_total,
    'volume_income', v_volume_income,
    'volume_expense', v_volume_expense,
    'wallets_total', v_wallets_total,
    'budgets_total', v_budgets_total,
    'issues_total', v_issues_total,
    'issues_7d', v_issues_7d,
    'feedbacks_total', v_feedbacks_total,
    'announcements_active', v_announcements_active
  );
end;
$$;
grant execute on function public.admin_dashboard_stats() to authenticated;

-- Daily Time Series Chart Data
create or replace function public.admin_daily_series(p_days integer default 30)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_res jsonb;
begin
  if not public.is_admin() then
    raise exception 'Unauthorized: Admin privileges required';
  end if;

  with days as (
    select generate_series(
      current_date - (p_days - 1) * interval '1 day',
      current_date,
      interval '1 day'
    )::date as d
  ),
  signups as (
    select created_at::date as d, count(*) as count
    from auth.users
    where created_at >= current_date - (p_days - 1) * interval '1 day'
    group by created_at::date
  ),
  txs as (
    select date::date as d, count(*) as count, coalesce(sum(amount), 0) as vol
    from public.expenses
    where date >= current_date - (p_days - 1) * interval '1 day'
    group by date::date
  ),
  earn as (
    select earning_date as d, coalesce(sum(amount), 0) as amt
    from public.admin_earnings
    where earning_date >= current_date - (p_days - 1) * interval '1 day'
    group by earning_date
  )
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'day', to_char(days.d, 'YYYY-MM-DD'),
      'signups', coalesce(signups.count, 0),
      'transactions', coalesce(txs.count, 0),
      'volume', coalesce(txs.vol, 0),
      'earnings', coalesce(earn.amt, 0)
    ) order by days.d
  ), '[]'::jsonb) into v_res
  from days
  left join signups on signups.d = days.d
  left join txs on txs.d = days.d
  left join earn on earn.d = days.d;

  return coalesce(v_res, '[]'::jsonb);
end;
$$;
grant execute on function public.admin_daily_series(integer) to authenticated;

-- List Users with Aggregated Metadata
create or replace function public.admin_list_users(
  p_search text default null,
  p_limit integer default 50,
  p_offset integer default 0
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_res jsonb;
  v_total bigint;
  v_term text := nullif(trim(p_search), '');
begin
  if not public.is_admin() then
    raise exception 'Unauthorized: Admin privileges required';
  end if;

  select count(*) into v_total
  from auth.users u
  left join public.profiles p on p.id = u.id
  where v_term is null
     or u.email ilike '%' || v_term || '%'
     or p.full_name ilike '%' || v_term || '%'
     or p.username ilike '%' || v_term || '%'
     or (u.raw_user_meta_data->>'name') ilike '%' || v_term || '%'
     or (u.raw_user_meta_data->>'full_name') ilike '%' || v_term || '%';

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'user_id', u.id,
      'email', coalesce(u.email, '—'),
      'full_name', coalesce(p.full_name, u.raw_user_meta_data->>'name', u.raw_user_meta_data->>'full_name', ''),
      'username', coalesce(p.username, ''),
      'provider', coalesce(u.raw_app_meta_data->>'provider', 'email'),
      'currency', coalesce(p.currency, 'USD'),
      'created_at', u.created_at,
      'last_sign_in_at', u.last_sign_in_at,
      'wallet_count', coalesce((select count(*) from public.wallets w where w.user_id = u.id), 0),
      'transaction_count', coalesce((select count(*) from public.expenses e where e.user_id = u.id), 0),
      'total_count', v_total
    ) order by u.created_at desc
  ), '[]'::jsonb) into v_res
  from (
    select u.id, u.email, u.raw_user_meta_data, u.raw_app_meta_data, u.created_at, u.last_sign_in_at
    from auth.users u
    left join public.profiles p on p.id = u.id
    where v_term is null
       or u.email ilike '%' || v_term || '%'
       or p.full_name ilike '%' || v_term || '%'
       or p.username ilike '%' || v_term || '%'
       or (u.raw_user_meta_data->>'name') ilike '%' || v_term || '%'
       or (u.raw_user_meta_data->>'full_name') ilike '%' || v_term || '%'
    order by u.created_at desc
    limit p_limit offset p_offset
  ) u
  left join public.profiles p on p.id = u.id;

  return v_res;
end;
$$;
grant execute on function public.admin_list_users(text, integer, integer) to authenticated;

-- List Transactions
create or replace function public.admin_list_transactions(
  p_search text default null,
  p_type text default null,
  p_limit integer default 50,
  p_offset integer default 0
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_res jsonb;
  v_total bigint;
  v_term text := nullif(trim(p_search), '');
begin
  if not public.is_admin() then
    raise exception 'Unauthorized: Admin privileges required';
  end if;

  select count(*) into v_total
  from public.expenses e
  left join auth.users u on u.id = e.user_id
  where (p_type is null or p_type = 'all' or e.type = p_type)
    and (v_term is null
         or e.title ilike '%' || v_term || '%'
         or e.category ilike '%' || v_term || '%'
         or u.email ilike '%' || v_term || '%');

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'tx_id', e.id,
      'title', e.title,
      'notes', e.notes,
      'user_email', coalesce(u.email, 'Unknown'),
      'category', e.category,
      'wallet_name', w.name,
      'tx_date', e.date,
      'tx_type', e.type,
      'amount', e.amount,
      'total_count', v_total
    ) order by e.date desc, e.created_at desc
  ), '[]'::jsonb) into v_res
  from (
    select e.id, e.user_id, e.title, e.notes, e.category, e.wallet_id, e.date, e.type, e.amount, e.created_at
    from public.expenses e
    left join auth.users u on u.id = e.user_id
    where (p_type is null or p_type = 'all' or e.type = p_type)
      and (v_term is null
           or e.title ilike '%' || v_term || '%'
           or e.category ilike '%' || v_term || '%'
           or u.email ilike '%' || v_term || '%')
    order by e.date desc, e.created_at desc
    limit p_limit offset p_offset
  ) e
  left join auth.users u on u.id = e.user_id
  left join public.wallets w on w.id = e.wallet_id;

  return v_res;
end;
$$;
grant execute on function public.admin_list_transactions(text, text, integer, integer) to authenticated;

-- List Issue Reports
create or replace function public.admin_list_issues()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_res jsonb;
begin
  if not public.is_admin() then
    raise exception 'Unauthorized: Admin privileges required';
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'issue_id', ir.id,
      'title', ir.title,
      'description', ir.description,
      'email', u.email,
      'full_name', coalesce(p.full_name, u.raw_user_meta_data->>'name', u.raw_user_meta_data->>'full_name', ''),
      'created_at', ir.created_at
    ) order by ir.created_at desc
  ), '[]'::jsonb) into v_res
  from public.issue_reports ir
  left join auth.users u on u.id = ir.user_id
  left join public.profiles p on p.id = u.id;

  return v_res;
end;
$$;
grant execute on function public.admin_list_issues() to authenticated;

-- Delete User Account and Cascade Data
create or replace function public.admin_delete_user(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin() then
    raise exception 'Unauthorized: Admin privileges required';
  end if;

  if exists (
    select 1
    from auth.users u
    join public.admin_users a on lower(a.email) = lower(u.email)
    where u.id = p_user_id
  ) then
    raise exception 'Cannot delete an administrator account';
  end if;

  delete from auth.users where id = p_user_id;
  return true;
end;
$$;
grant execute on function public.admin_delete_user(uuid) to authenticated;


-- 11. Remote App Configuration & Feature Flags
create table if not exists public.app_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);
alter table public.app_config enable row level security;

drop policy if exists "Public read app config" on public.app_config;
create policy "Public read app config" on public.app_config
  for select using (true);

drop policy if exists "Admin manage app config" on public.app_config;
create policy "Admin manage app config" on public.app_config
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Default seed config
insert into public.app_config (key, value)
values
  ('maintenance_mode', '{"enabled": false, "message": "Onyx is undergoing scheduled maintenance. Please check back soon."}'::jsonb),
  ('app_version', '{"latest_version": "6.0.5", "min_supported_version": "6.0.0", "force_update": false, "release_notes": "Improved stability and charts."}'::jsonb),
  ('admob_controls', '{"ads_globally_enabled": true, "banner_enabled": true, "interstitial_enabled": true, "rewarded_enabled": true}'::jsonb),
  ('ai_controls', '{"ai_enabled": true, "daily_query_limit": 15, "ai_greeting": "How can I help you save today?"}'::jsonb),
  ('website_content', '{"active_users": "100+", "community_title": "Active Users & Growing Daily", "community_desc": "Empowering everyday people with private-first expense tracking, smart SMS intake, and offline AI intelligence.", "stat_txs": "130+", "stat_volume": "৳175K+", "live_status": "Live Community Milestone", "playstore_url": "https://play.google.com/store/apps/details?id=com.thedevhamim.onyx"}'::jsonb)
on conflict (key) do nothing;
