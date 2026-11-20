import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CircleDollarSign, Download, ExternalLink, Eye, Pencil, Plus, Trash2, TrendingUp } from 'lucide-react'
import { supabase, unwrap } from '../lib/supabase.js'
import { useAsync } from '../lib/useAsync.js'
import { useTheme } from '../theme/ThemeContext.jsx'
import { downloadCsv } from '../lib/csv.js'
import { errMsg, fmtDate, money, num } from '../lib/format.js'
import { useToast } from '../components/Toast.jsx'
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorBox,
  Modal,
  PageHeader,
  Spinner,
  StatCard,
  TableWrap,
  inputCls,
  labelCls,
  tdCls,
  thCls,
} from '../components/ui.jsx'

const today = () => new Date().toISOString().slice(0, 10)
const blank = () => ({
  earning_date: today(),
  source: 'AdMob',
  amount: '',
  currency: 'USD',
  impressions: '',
  clicks: '',
  notes: '',
})

export default function Earnings() {
  const { isDark } = useTheme()
  const toast = useToast()
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const tooltipStyle = {
    background: isDark ? '#181133' : '#ffffff',
    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
    borderRadius: 12,
    color: isDark ? '#fff' : '#0f172a',
    fontSize: 12,
    boxShadow: isDark ? '0 10px 15px -3px rgba(0, 0, 0, 0.5)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  }

  const { data, loading, error, reload } = useAsync(
    () =>
      supabase
        .from('admin_earnings')
        .select('*')
        .order('earning_date', { ascending: false })
        .limit(1000)
        .then(unwrap),
    [],
  )

  const stats = useMemo(() => {
    const rows = data || []
    const now = new Date()
    const monthKey = now.toISOString().slice(0, 7)
    const d30 = new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10)
    const sum = (list, k = 'amount') => list.reduce((a, r) => a + Number(r[k] || 0), 0)

    const total = sum(rows)
    const month = sum(rows.filter((r) => r.earning_date.startsWith(monthKey)))
    const last30 = sum(rows.filter((r) => r.earning_date >= d30))
    const impressions = sum(rows, 'impressions')
    const clicks = sum(rows, 'clicks')

    const byMonth = {}
    rows.forEach((r) => {
      const k = r.earning_date.slice(0, 7)
      byMonth[k] = (byMonth[k] || 0) + Number(r.amount)
    })
    const chart = Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([k, v]) => ({
        month: new Date(k + '-01T00:00:00').toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
        Earnings: Number(v.toFixed(2)),
      }))

    return { total, month, last30, impressions, clicks, ecpm: impressions ? (total / impressions) * 1000 : 0, chart }
  }, [data])

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        earning_date: editing.earning_date,
        source: editing.source.trim() || 'AdMob',
        amount: Number(editing.amount || 0),
        currency: (editing.currency || 'USD').toUpperCase(),
        impressions: Number(editing.impressions || 0),
        clicks: Number(editing.clicks || 0),
        notes: editing.notes?.trim() || null,
      }
      if (editing.id) {
        await supabase.from('admin_earnings').update(payload).eq('id', editing.id).then(unwrap)
      } else {
        await supabase.from('admin_earnings').insert(payload).then(unwrap)
      }
      toast.success(editing.id ? 'Entry updated' : 'Earnings added')
      setEditing(null)
      reload()
    } catch (err) {
      toast.error(errMsg(err))
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    setDeleting(true)
    try {
      await supabase.from('admin_earnings').delete().eq('id', toDelete.id).then(unwrap)
      toast.success('Entry deleted')
      setToDelete(null)
      reload()
    } catch (err) {
      toast.error(errMsg(err))
    } finally {
      setDeleting(false)
    }
  }

  const set = (k) => (e) => setEditing((s) => ({ ...s, [k]: e.target.value }))

  const exportEarnings = () => {
    if (!data?.length) return
    const exportData = data.map((r) => ({
      Date: r.earning_date,
      Source: r.source,
      Amount: r.amount,
      Currency: r.currency,
      Impressions: r.impressions,
      Clicks: r.clicks,
      Notes: r.notes || '',
    }))
    downloadCsv(`onyx-earnings-${new Date().toISOString().slice(0, 10)}`, exportData)
  }

  return (
    <>
      <PageHeader
        title="Earnings"
        subtitle="Log your daily AdMob (or other) income here to track it next to your user growth."
        actions={
          <>
            <Button variant="ghost" type="button" onClick={exportEarnings} disabled={!data?.length}>
              <Download className="h-4 w-4" /> Export CSV
            </Button>
            <a href="https://admob.google.com/home/" target="_blank" rel="noreferrer">
              <Button variant="ghost" type="button">
                <ExternalLink className="h-4 w-4" /> Open AdMob
              </Button>
            </a>
            <Button onClick={() => setEditing(blank())}>
              <Plus className="h-4 w-4" /> Add earnings
            </Button>
          </>
        }
      />

      {error && <ErrorBox error={error} onRetry={reload} />}
      {loading && !data && (
        <div className="flex justify-center py-20">
          <Spinner className="h-7 w-7" />
        </div>
      )}

      {data && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={CircleDollarSign} tone="green" label="This month" value={money(stats.month)} />
            <StatCard icon={TrendingUp} label="Last 30 days" value={money(stats.last30)} />
            <StatCard icon={CircleDollarSign} tone="blue" label="All time" value={money(stats.total)} />
            <StatCard icon={Eye} tone="amber" label="Avg eCPM" value={money(stats.ecpm)} hint={`${num(stats.impressions)} impressions · ${num(stats.clicks)} clicks`} />
          </div>

          {stats.chart.length > 0 && (
            <Card>
              <h3 className="mb-4 font-display text-base font-semibold text-slate-900 dark:text-white">Monthly earnings</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.chart}>
                    <CartesianGrid stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} vertical={false} />
                    <XAxis dataKey="month" stroke={isDark ? '#6b6685' : '#94a3b8'} fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke={isDark ? '#6b6685' : '#94a3b8'} fontSize={11} tickLine={false} axisLine={false} width={44} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v) => money(v)}
                      cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}
                    />
                    <Bar dataKey="Earnings" fill="#34d399" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {data.length === 0 ? (
            <Card>
              <EmptyState title="No earnings logged yet" text="Click 'Add earnings' and enter the numbers from your AdMob reports." />
            </Card>
          ) : (
            <TableWrap>
              <table className="w-full min-w-[720px]">
                <thead className="border-b border-slate-200 dark:border-white/8 bg-slate-50/75 dark:bg-white/[0.03]">
                  <tr>
                    <th className={thCls}>Date</th>
                    <th className={thCls}>Source</th>
                    <th className={`${thCls} text-right`}>Amount</th>
                    <th className={`${thCls} text-right`}>Impressions</th>
                    <th className={`${thCls} text-right`}>Clicks</th>
                    <th className={thCls}>Notes</th>
                    <th className={thCls} />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/6">
                  {data.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.04] transition">
                      <td className={`${tdCls} whitespace-nowrap text-slate-700 dark:text-slate-200`}>{fmtDate(r.earning_date)}</td>
                      <td className={`${tdCls} font-medium text-slate-800 dark:text-slate-200`}>{r.source}</td>
                      <td className={`${tdCls} text-right font-semibold text-emerald-600 dark:text-emerald-400`}>{money(r.amount, r.currency)}</td>
                      <td className={`${tdCls} text-right text-slate-700 dark:text-slate-300`}>{num(r.impressions)}</td>
                      <td className={`${tdCls} text-right text-slate-700 dark:text-slate-300`}>{num(r.clicks)}</td>
                      <td className={`${tdCls} max-w-[200px] truncate text-slate-500 dark:text-slate-400`}>{r.notes || '—'}</td>
                      <td className={`${tdCls} whitespace-nowrap text-right`}>
                        <button
                          onClick={() => setEditing({ ...r, notes: r.notes || '' })}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => setToDelete(r)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          )}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Edit earnings' : 'Add earnings'}>
        {editing && (
          <form onSubmit={save} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Date</label>
                <input type="date" required value={editing.earning_date} onChange={set('earning_date')} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Source</label>
                <input required value={editing.source} onChange={set('source')} className={inputCls} placeholder="AdMob" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Amount</label>
                <input type="number" step="0.01" min="0" required value={editing.amount} onChange={set('amount')} className={inputCls} placeholder="0.00" />
              </div>
              <div>
                <label className={labelCls}>Currency</label>
                <input required maxLength={3} value={editing.currency} onChange={set('currency')} className={`${inputCls} uppercase`} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Impressions</label>
                <input type="number" min="0" value={editing.impressions} onChange={set('impressions')} className={inputCls} placeholder="0" />
              </div>
              <div>
                <label className={labelCls}>Clicks</label>
                <input type="number" min="0" value={editing.clicks} onChange={set('clicks')} className={inputCls} placeholder="0" />
              </div>
            </div>
            <div>
              <label className={labelCls}>Notes</label>
              <input value={editing.notes} onChange={set('notes')} className={inputCls} placeholder="Optional" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="submit" loading={saving}>
                {editing.id ? 'Save changes' : 'Add entry'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        loading={deleting}
        title="Delete entry?"
        message={`The ${toDelete ? fmtDate(toDelete.earning_date) : ''} earnings entry will be removed.`}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </>
  )
}
