import { useEffect } from 'react'
import {
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Loader2,
  Search,
  X,
} from 'lucide-react'

export const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 placeholder-slate-400 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder-slate-500 dark:focus:border-brand-400 dark:focus:ring-brand-500/30'

export const labelCls =
  'mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300'

export function Select({ value, onChange, className = '', children, ...props }) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={onChange}
        {...props}
        className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-10 text-sm font-medium text-slate-800 outline-none transition hover:border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50 dark:border-white/10 dark:bg-ink-800/90 dark:text-white dark:hover:border-white/20 dark:focus:border-brand-400 cursor-pointer shadow-sm dark:shadow-none"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition" />
    </div>
  )
}

export function Spinner({ className = 'h-5 w-5' }) {
  return <Loader2 className={`animate-spin text-brand-500 dark:text-brand-400 ${className}`} />
}

export function FullPageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-ink-950">
      <Spinner className="h-8 w-8" />
    </div>
  )
}

export function Button({ variant = 'primary', className = '', loading = false, children, ...props }) {
  const styles = {
    primary:
      'bg-brand-500 text-white hover:bg-brand-600 shadow-md shadow-brand-500/25 active:scale-[0.98]',
    ghost:
      'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white shadow-sm dark:shadow-none',
    secondary:
      'border border-slate-200 bg-slate-100 text-slate-800 hover:bg-slate-200 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15',
    danger: 'bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-500/20 active:scale-[0.98]',
  }
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}

export function Card({ className = '', children }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/60 dark:border-white/8 dark:bg-ink-800/80 dark:shadow-xl dark:shadow-black/20 transition ${className}`}
    >
      {children}
    </div>
  )
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function StatCard({ icon: Icon, label, value, hint, tone = 'brand' }) {
  const tones = {
    brand:
      'bg-brand-50 text-brand-600 ring-1 ring-brand-500/20 dark:bg-brand-500/15 dark:text-brand-300 dark:ring-0',
    green:
      'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-0',
    amber:
      'bg-amber-50 text-amber-600 ring-1 ring-amber-500/20 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-0',
    red:
      'bg-red-50 text-red-600 ring-1 ring-red-500/20 dark:bg-red-500/15 dark:text-red-300 dark:ring-0',
    blue:
      'bg-sky-50 text-sky-600 ring-1 ring-sky-500/20 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-0',
  }
  return (
    <Card className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-2 truncate font-display text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
        {hint && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
      </div>
      {Icon && (
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      )}
    </Card>
  )
}

export function Badge({ children, tone = 'gray' }) {
  const tones = {
    gray: 'bg-slate-100 text-slate-700 dark:bg-white/8 dark:text-slate-300',
    green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    red: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    blue: 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
    brand: 'bg-brand-50 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300',
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ring-black/5 dark:ring-0 ${tones[tone]}`}
    >
      {children}
    </span>
  )
}

export function EmptyState({ title = 'Nothing here yet', text }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
      <Inbox className="h-9 w-9 text-slate-400 dark:text-slate-600" />
      <p className="font-semibold text-slate-700 dark:text-slate-300">{title}</p>
      {text && <p className="max-w-sm text-sm text-slate-500">{text}</p>}
    </div>
  )
}

export function ErrorBox({ error, onRetry }) {
  const message = error?.message || String(error)
  const needsSetup = /could not find the function|does not exist|not authorized|permission denied/i.test(message)
  return (
    <div className="rounded-2xl border border-red-300 bg-red-50 p-5 text-sm text-red-900 dark:border-red-400/25 dark:bg-red-950/40 dark:text-red-100">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500 dark:text-red-400" />
        <div className="flex-1">
          <p className="font-semibold">Something went wrong</p>
          <p className="mt-1 break-words text-red-800 dark:text-red-200/80">{message}</p>
          {needsSetup && (
            <p className="mt-2 text-red-800/90 dark:text-red-200/80">
              This usually means <code className="rounded bg-black/10 dark:bg-black/30 px-1">supabase/admin_setup.sql</code> has not been
              run yet in the Supabase SQL editor.
            </p>
          )}
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 rounded-lg bg-red-100 dark:bg-white/10 px-3 py-1.5 font-semibold text-red-900 dark:text-white hover:bg-red-200 dark:hover:bg-white/15"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export function SearchInput({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div className="relative w-full sm:w-72">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${inputCls} pl-10`}
      />
    </div>
  )
}

export function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative flex max-h-[92vh] w-full ${maxWidth} flex-col rounded-t-3xl border border-slate-200 bg-white text-slate-900 shadow-2xl dark:border-white/10 dark:bg-ink-800 dark:text-white sm:rounded-3xl`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/8 px-5 py-4">
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>
  )
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', loading, onConfirm, onClose }) {
  return (
    <Modal open={open} onClose={loading ? () => {} : onClose} title={title} maxWidth="max-w-md">
      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}

export function Pagination({ page, pageSize, total, onChange }) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : page * pageSize + 1
  const to = Math.min(total, (page + 1) * pageSize)
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 dark:border-white/8 px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
      <span>
        {from}-{to} of {total.toLocaleString('en-US')}
      </span>
      <div className="flex items-center gap-1">
        <button
          disabled={page <= 0}
          onClick={() => onChange(page - 1)}
          className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="px-2">
          Page {page + 1} / {pages}
        </span>
        <button
          disabled={page >= pages - 1}
          onClick={() => onChange(page + 1)}
          className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

/** Simple responsive table wrapper */
export function TableWrap({ children }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/8 dark:bg-ink-800/80 dark:shadow-xl dark:shadow-black/20">
      <div className="overflow-x-auto">{children}</div>
    </div>
  )
}

export const thCls =
  'whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/8 bg-slate-50/75 dark:bg-white/[0.03]'
export const tdCls = 'px-4 py-3 text-sm text-slate-700 dark:text-slate-200'
