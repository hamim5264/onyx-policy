import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Bug,
  CircleDollarSign,
  Megaphone,
  PiggyBank,
  Receipt,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react'
import { supabase, unwrap } from '../lib/supabase.js'
import { useAsync } from '../lib/useAsync.js'
import { useTheme } from '../theme/ThemeContext.jsx'
import { compact, fmtDate, fmtDateTime, money, num, shortDay } from '../lib/format.js'
import { Badge, Button, Card, ErrorBox, PageHeader, Spinner, StatCard } from '../components/ui.jsx'

function ChartCard({ title, children }) {
  return (
    <Card>
      <h3 className="mb-4 font-display text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
      <div className="h-64">{children}</div>
    </Card>
  )
}

export default function Dashboard() {
  const { isDark } = useTheme()
  const [days, setDays] = useState(30)
  const gridStroke = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
  const axisStroke = isDark ? '#6b6685' : '#94a3b8'

  const tooltipStyle = {
    background: isDark ? '#181133' : '#ffffff',
    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
    borderRadius: 12,
    color: isDark ? '#fff' : '#0f172a',
    fontSize: 12,
    boxShadow: isDark ? '0 10px 15px -3px rgba(0, 0, 0, 0.5)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  }

  const { data, loading, error, reload } = useAsync(async () => {
    const [stats, series, users, issues] = await Promise.all([
      supabase.rpc('admin_dashboard_stats').then(unwrap),
      supabase.rpc('admin_daily_series', { p_days: days }).then(unwrap),
      supabase.rpc('admin_list_users', { p_search: '', p_limit: 6, p_offset: 0 }).then(unwrap),
      supabase
        .from('issue_reports')
        .select('id,title,created_at')
        .order('created_at', { ascending: false })
        .limit(5)
        .then(unwrap),
    ])
    return { stats, series, users, issues }
  }, [days])

  const s = data?.stats
  const userList = Array.isArray(data?.users) ? data.users : []
  const issueList = Array.isArray(data?.issues) ? data.issues : []
  const chartData = (Array.isArray(data?.series) ? data.series : []).map((d) => ({
    day: shortDay(d.day || d.date),
    Signups: Number(d.signups || 0),
    Transactions: Number(d.transactions || 0),
    Earnings: Number(d.earnings || 0),
  }))

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Live overview of Onyx users, activity and earnings."
        actions={
          <>
            <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-white/10 dark:bg-white/5">
              {[7, 30, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    days === d
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  {d}D
                </button>
              ))}
            </div>
            <Button variant="ghost" onClick={reload}>
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
          </>
        }
      />

      {error && <ErrorBox error={error} onRetry={reload} />}
      {loading && !data && (
        <div className="flex justify-center py-24">
          <Spinner className="h-8 w-8" />
        </div>
      )}

      {s && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={Users} label="Total users" value={num(s.users_total)} hint={`+${num(s.users_7d)} in last 7 days`} />
            <StatCard icon={UserCheck} tone="green" label="Active (30d)" value={num(s.active_30d)} hint="Signed in within 30 days" />
            <StatCard icon={UserPlus} tone="blue" label="New today" value={num(s.users_today)} hint={`${num(s.users_30d)} in last 30 days`} />
            <StatCard icon={Receipt} tone="amber" label="Transactions" value={num(s.transactions_total)} hint={`${num(s.transactions_30d)} in last 30 days`} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={CircleDollarSign} tone="green" label="Earnings this month" value={money(s.earnings_month)} hint={`${money(s.earnings_30d)} last 30 days`} />
            <StatCard icon={CircleDollarSign} label="Total earnings" value={money(s.earnings_total)} hint="Logged in Earnings page" />
            <StatCard icon={TrendingUp} tone="green" label="Income tracked" value={compact(s.volume_income)} hint="All users, all currencies" />
            <StatCard icon={TrendingDown} tone="red" label="Expenses tracked" value={compact(s.volume_expense)} hint="All users, all currencies" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard icon={Wallet} label="Wallets" value={num(s.wallets_total)} />
            <StatCard icon={PiggyBank} tone="blue" label="Budget plans" value={num(s.budgets_total)} />
            <StatCard icon={Bug} tone="red" label="Issue reports" value={num(s.issues_total)} hint={`${num(s.issues_7d)} this week`} />
            <StatCard icon={UserMinus} tone="amber" label="Delete feedback" value={num(s.feedbacks_total)} />
            <StatCard icon={Megaphone} label="Live announcements" value={num(s.announcements_active)} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title={`User signups · last ${days} days`}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="gSignups" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#9e77ed" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#9e77ed" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={gridStroke} vertical={false} />
                  <XAxis dataKey="day" stroke={axisStroke} fontSize={11} tickLine={false} axisLine={false} minTickGap={24} />
                  <YAxis stroke={axisStroke} fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} width={32} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="Signups" stroke="#9e77ed" strokeWidth={2} fill="url(#gSignups)" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title={`Transactions added · last ${days} days`}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="gTx" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={gridStroke} vertical={false} />
                  <XAxis dataKey="day" stroke={axisStroke} fontSize={11} tickLine={false} axisLine={false} minTickGap={24} />
                  <YAxis stroke={axisStroke} fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} width={32} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="Transactions" stroke="#34d399" strokeWidth={2} fill="url(#gTx)" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <ChartCard title={`Earnings · last ${days} days`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid stroke={gridStroke} vertical={false} />
                <XAxis dataKey="day" stroke={axisStroke} fontSize={11} tickLine={false} axisLine={false} minTickGap={24} />
                <YAxis stroke={axisStroke} fontSize={11} tickLine={false} axisLine={false} width={40} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => money(v)} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="Earnings" fill="#7f56d9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">Newest users</h3>
                <Link to="/users" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                  View all →
                </Link>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-white/6">
                {userList.length === 0 && <p className="py-6 text-center text-sm text-slate-500">No users yet.</p>}
                {userList.map((u) => (
                  <div key={u.user_id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{u.full_name || u.username || 'Unnamed'}</p>
                      <p className="truncate text-xs text-slate-500">{u.email}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <Badge tone={u.provider === 'google' ? 'blue' : 'gray'}>{u.provider}</Badge>
                      <p className="mt-1 text-xs text-slate-500">{fmtDate(u.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">Latest issue reports</h3>
                <Link to="/issues" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                  View all →
                </Link>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-white/6">
                {issueList.length === 0 && <p className="py-6 text-center text-sm text-slate-500">No reports. 🎉</p>}
                {issueList.map((i) => (
                  <div key={i.id} className="flex items-center justify-between gap-3 py-3">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{i.title}</p>
                    <p className="shrink-0 text-xs text-slate-500">{fmtDateTime(i.created_at)}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </>
  )
}
