import { useEffect, useState } from 'react'

export const fmtDate = (v) =>
  v ? new Date(v).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

export const fmtDateTime = (v) =>
  v
    ? new Date(v).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—'

export const num = (n) => Number(n || 0).toLocaleString('en-US')

export const compact = (n) =>
  new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(n || 0))

export const money = (n, currency = 'USD') => {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(n || 0))
  } catch {
    return `${currency} ${Number(n || 0).toFixed(2)}`
  }
}

export const decimal = (n) =>
  Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const shortDay = (v) =>
  new Date(v + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })

export function useDebounced(value, delay = 350) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return v
}

export function errMsg(e) {
  return e?.message || e?.error_description || String(e)
}
