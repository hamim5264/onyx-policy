import { useMemo, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { supabase, unwrap } from '../lib/supabase.js'
import { useAsync } from '../lib/useAsync.js'
import { useTheme } from '../theme/ThemeContext.jsx'
import { errMsg, fmtDateTime } from '../lib/format.js'
import { useToast } from '../components/Toast.jsx'
import { Button, Card, ConfirmDialog, EmptyState, ErrorBox, PageHeader, Spinner } from '../components/ui.jsx'

export default function Feedback() {
  const { isDark } = useTheme()
  const toast = useToast()
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const tooltipStyle = {
    background: isDark ? '#181133' : '#ffffff',
    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
    borderRadius: 12,
    color: isDark ? '#fff' : '#0f172a',
    boxShadow: isDark ? '0 10px 15px -3px rgba(0, 0, 0, 0.5)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  }

  const { data, loading, error, reload } = useAsync(
    () =>
      supabase
        .from('delete_feedbacks')
        .select('id,reason,comments,submitted_at')
        .order('submitted_at', { ascending: false })
        .limit(500)
        .then(unwrap),
    [],
  )

  const reasons = useMemo(() => {
    const map = {}
    ;(data || []).forEach((f) => (map[f.reason] = (map[f.reason] || 0) + 1))
    return Object.entries(map)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
  }, [data])

  const confirmDelete = async () => {
    setDeleting(true)
    try {
      await supabase.from('delete_feedbacks').delete().eq('id', toDelete.id).then(unwrap)
      toast.success('Feedback deleted')
      setToDelete(null)
      reload()
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Delete Feedback"
        subtitle="Why users deleted their accounts. Kept anonymously after deletion."
      />

      {error && <ErrorBox error={error} onRetry={reload} />}
      {loading && !data && (
        <div className="flex justify-center py-20">
          <Spinner className="h-7 w-7" />
        </div>
      )}

      {data && data.length === 0 && (
        <Card>
          <EmptyState title="No feedback yet" text="Good news - nobody has left a reason for deleting their account." />
        </Card>
      )}

      {data && data.length > 0 && (
        <div className="space-y-6">
          <Card>
            <h3 className="mb-4 font-display text-base font-semibold text-slate-900 dark:text-white">Reasons breakdown</h3>
            <div style={{ height: Math.max(160, reasons.length * 44) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reasons} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} horizontal={false} />
                  <XAxis type="number" allowDecimals={false} stroke={isDark ? '#6b6685' : '#94a3b8'} fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="reason" width={150} stroke={isDark ? '#a5a1b8' : '#64748b'} fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}
                  />
                  <Bar dataKey="count" fill="#f59e0b" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="space-y-3">
            {data.map((f) => (
              <Card key={f.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white">{f.reason}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{fmtDateTime(f.submitted_at)}</p>
                  </div>
                  <Button variant="ghost" className="shrink-0 !px-3 !py-2" onClick={() => setToDelete(f)}>
                    <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
                  </Button>
                </div>
                {f.comments && (
                  <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700 dark:text-slate-300">{f.comments}</p>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!toDelete}
        loading={deleting}
        title="Delete feedback?"
        message="This feedback entry will be permanently removed."
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </>
  )
}
