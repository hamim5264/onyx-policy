import { useState } from 'react'
import { ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react'
import { supabase, unwrap } from '../lib/supabase.js'
import { useAsync } from '../lib/useAsync.js'
import { errMsg, fmtDateTime } from '../lib/format.js'
import { useToast } from '../components/Toast.jsx'
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorBox,
  Modal,
  PageHeader,
  Select,
  Spinner,
  inputCls,
  labelCls,
} from '../components/ui.jsx'

const TYPES = [
  { value: 'info', label: 'Info', tone: 'blue' },
  { value: 'update', label: 'App update', tone: 'brand' },
  { value: 'success', label: 'Success / new feature', tone: 'green' },
  { value: 'warning', label: 'Warning', tone: 'amber' },
]
const toneOf = (t) => TYPES.find((x) => x.value === t)?.tone || 'gray'
const blank = { title: '', message: '', type: 'info', link_url: '', is_active: true }

export default function Announcements() {
  const toast = useToast()
  const [editing, setEditing] = useState(null) // null | {id?, ...fields}
  const [saving, setSaving] = useState(false)
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const { data, loading, error, reload } = useAsync(
    () =>
      supabase
        .from('system_announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .then(unwrap),
    [],
  )

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        title: editing.title.trim(),
        message: editing.message.trim(),
        type: editing.type,
        link_url: editing.link_url?.trim() || null,
        is_active: editing.is_active,
      }
      if (editing.id) {
        await supabase.from('system_announcements').update(payload).eq('id', editing.id).then(unwrap)
      } else {
        await supabase.from('system_announcements').insert(payload).then(unwrap)
      }
      toast.success(editing.id ? 'Announcement updated' : 'Announcement published')
      setEditing(null)
      reload()
    } catch (err) {
      toast.error(errMsg(err))
    } finally {
      setSaving(false)
    }
  }

  const toggle = async (a) => {
    try {
      await supabase.from('system_announcements').update({ is_active: !a.is_active }).eq('id', a.id).then(unwrap)
      reload()
    } catch (err) {
      toast.error(errMsg(err))
    }
  }

  const confirmDelete = async () => {
    setDeleting(true)
    try {
      await supabase.from('system_announcements').delete().eq('id', toDelete.id).then(unwrap)
      toast.success('Announcement deleted')
      setToDelete(null)
      reload()
    } catch (err) {
      toast.error(errMsg(err))
    } finally {
      setDeleting(false)
    }
  }

  const set = (k) => (e) => setEditing((s) => ({ ...s, [k]: e.target.value }))

  return (
    <>
      <PageHeader
        title="Announcements"
        subtitle="Shown inside the app's notification bell for all users. Only active ones are visible."
        actions={
          <Button onClick={() => setEditing({ ...blank })}>
            <Plus className="h-4 w-4" /> New announcement
          </Button>
        }
      />

      {error && <ErrorBox error={error} onRetry={reload} />}
      {loading && !data && (
        <div className="flex justify-center py-20">
          <Spinner className="h-7 w-7" />
        </div>
      )}
      {data && data.length === 0 && (
        <Card>
          <EmptyState title="No announcements" text="Create one to notify every Onyx user inside the app." />
        </Card>
      )}

      <div className="space-y-3">
        {(data || []).map((a) => (
          <Card key={a.id} className={a.is_active ? '' : 'opacity-60'}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-slate-900 dark:text-white">{a.title}</h3>
                  <Badge tone={toneOf(a.type)}>{a.type}</Badge>
                  <Badge tone={a.is_active ? 'green' : 'gray'}>{a.is_active ? 'Live' : 'Hidden'}</Badge>
                </div>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700 dark:text-slate-300">{a.message}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span>{fmtDateTime(a.created_at)}</span>
                  {a.link_url && (
                    <a href={a.link_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-brand-600 dark:text-brand-400 hover:underline">
                      <ExternalLink className="h-3 w-3" /> {a.link_url}
                    </a>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button variant="ghost" className="!px-3 !py-2 text-xs" onClick={() => toggle(a)}>
                  {a.is_active ? 'Hide' : 'Publish'}
                </Button>
                <Button
                  variant="ghost"
                  className="!px-3 !py-2"
                  onClick={() => setEditing({ ...a, link_url: a.link_url || '' })}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" className="!px-3 !py-2" onClick={() => setToDelete(a)}>
                  <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Edit announcement' : 'New announcement'}>
        {editing && (
          <form onSubmit={save} className="space-y-4">
            <div>
              <label className={labelCls}>Title</label>
              <input required maxLength={120} value={editing.title} onChange={set('title')} className={inputCls} placeholder="Onyx 6.0.5 is live 🚀" />
            </div>
            <div>
              <label className={labelCls}>Message</label>
              <textarea required rows={4} value={editing.message} onChange={set('message')} className={inputCls} placeholder="What's new..." />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Type</label>
                <Select value={editing.type} onChange={set('type')}>
                  {TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className={labelCls}>Link (optional)</label>
                <input type="url" value={editing.link_url} onChange={set('link_url')} className={inputCls} placeholder="https://play.google.com/..." />
              </div>
            </div>
            <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={editing.is_active}
                onChange={(e) => setEditing((s) => ({ ...s, is_active: e.target.checked }))}
                className="h-4 w-4 accent-brand-500"
              />
              Active (visible to users)
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="submit" loading={saving}>
                {editing.id ? 'Save changes' : 'Publish'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        loading={deleting}
        title="Delete announcement?"
        message={`"${toDelete?.title}" will be removed for everyone.`}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </>
  )
}
