import { useState } from 'react'
import { KeyRound, LogOut, ShieldCheck } from 'lucide-react'
import { supabase, SUPABASE_URL } from '../lib/supabase.js'
import { useAuth } from '../auth/AuthContext.jsx'
import { errMsg, fmtDateTime } from '../lib/format.js'
import { useToast } from '../components/Toast.jsx'
import { Button, Card, PageHeader, inputCls, labelCls } from '../components/ui.jsx'

export default function Settings() {
  const { user, signOut } = useAuth()
  const toast = useToast()
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [busy, setBusy] = useState(false)

  const changePassword = async (e) => {
    e.preventDefault()
    if (pw.length < 8) return toast.error('Password must be at least 8 characters.')
    if (pw !== pw2) return toast.error('Passwords do not match.')
    setBusy(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: pw })
      if (error) throw error
      toast.success('Password updated.')
      setPw('')
      setPw2('')
    } catch (err) {
      toast.error(errMsg(err))
    } finally {
      setBusy(false)
    }
  }

  const info = [
    ['Signed in as', user?.email],
    ['Last sign-in', fmtDateTime(user?.last_sign_in_at)],
    ['Supabase project', SUPABASE_URL],
    ['Access control', 'Server-side allow-list (public.admin_users)'],
  ]

  return (
    <>
      <PageHeader title="Settings" subtitle="Your admin account and security." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">Account</h3>
          </div>
          <dl className="space-y-3">
            {info.map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{k}</dt>
                <dd className="mt-0.5 break-words text-sm text-slate-700 dark:text-slate-200">{v || '—'}</dd>
              </div>
            ))}
          </dl>
          <Button variant="ghost" className="mt-6" onClick={signOut}>
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </Card>

        <Card>
          <div className="mb-4 flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">Change password</h3>
          </div>
          <form onSubmit={changePassword} className="space-y-4">
            <div>
              <label className={labelCls}>New password</label>
              <input type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Confirm password</label>
              <input type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} className={inputCls} />
            </div>
            <Button type="submit" loading={busy}>
              Update password
            </Button>
            <p className="text-xs leading-relaxed text-slate-500">
              Tip: after you change it here, the password stored in <code>.env</code> is only a setup reference - it is never
              used by the website.
            </p>
          </form>
        </Card>
      </div>
    </>
  )
}
