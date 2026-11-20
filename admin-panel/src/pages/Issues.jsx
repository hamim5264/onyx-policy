import { useMemo, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { supabase, unwrap } from '../lib/supabase.js'
import { useAsync } from '../lib/useAsync.js'
import { errMsg, fmtDateTime } from '../lib/format.js'
import { useToast } from '../components/Toast.jsx'
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorBox,
  PageHeader,
  SearchInput,
  Spinner,
} from '../components/ui.jsx'

export default function Issues() {
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const { data, loading, error, reload } = useAsync(() => supabase.rpc('admin_list_issues').then(unwrap), [])

  const items = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return data || []
    return (data || []).filter((i) =>
      [i.title, i.description, i.email, i.full_name].some((v) => (v || '').toLowerCase().includes(q)),
    )
  }, [data, search])

  const confirmDelete = async () => {
    setDeleting(true)
    try {
      await supabase.from('issue_reports').delete().eq('id', toDelete.issue_id).then(unwrap)
      toast.success('Report deleted')
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
        title="Issue Reports"
        subtitle="Bug reports and feedback sent from the app."
        actions={<SearchInput value={search} onChange={setSearch} placeholder="Search reports" />}
      />

      {error && <ErrorBox error={error} onRetry={reload} />}
      {loading && !data && (
        <div className="flex justify-center py-20">
          <Spinner className="h-7 w-7" />
        </div>
      )}
      {data && items.length === 0 && (
        <Card>
          <EmptyState title="No issue reports" text="When users report a problem it will show up here." />
        </Card>
      )}

      <div className="space-y-3">
        {items.map((i) => (
          <Card key={i.issue_id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-semibold text-slate-900 dark:text-white">{i.title}</h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  {i.full_name ? `${i.full_name} · ` : ''}
                  {i.email || 'Deleted user'} · {fmtDateTime(i.created_at)}
                </p>
              </div>
              <Button variant="ghost" className="shrink-0 !px-3 !py-2" onClick={() => setToDelete(i)}>
                <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
              </Button>
            </div>
            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700 dark:text-slate-300">{i.description}</p>
            {i.email && (
              <a
                href={`mailto:${i.email}?subject=${encodeURIComponent('Re: ' + i.title)}`}
                className="mt-3 inline-block text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
              >
                Reply by e-mail →
              </a>
            )}
          </Card>
        ))}
      </div>

      <ConfirmDialog
        open={!!toDelete}
        loading={deleting}
        title="Delete report?"
        message={`"${toDelete?.title}" will be permanently removed.`}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </>
  )
}
