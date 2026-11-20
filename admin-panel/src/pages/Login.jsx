import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { AlertTriangle, Eye, EyeOff, Lock, Mail, Moon, ShieldCheck, Sun } from 'lucide-react'
import { useAuth } from '../auth/AuthContext.jsx'
import { useTheme } from '../theme/ThemeContext.jsx'
import { configured } from '../lib/supabase.js'
import { Button, FullPageSpinner, inputCls, labelCls } from '../components/ui.jsx'

export default function Login() {
  const { loading, session, isAdmin, signIn } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    document.title = 'Admin Login · Onyx'
  }, [])

  if (loading) return <FullPageSpinner />
  if (session && isAdmin) return <Navigate to="/dashboard" replace />

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await signIn(email.trim(), password)
    } catch (err) {
      const msg = err?.message || 'Login failed'
      setError(/invalid login credentials/i.test(msg) ? 'Incorrect e-mail or password.' : msg)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 dark:bg-ink-950 px-4 transition-colors">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand-500/20 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-brand-700/25 blur-[140px]" />

      {/* Theme toggle in top right */}
      <button
        onClick={toggleTheme}
        title="Toggle dark / light mode"
        className="absolute top-5 right-5 flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 transition shadow-sm dark:shadow-none"
      >
        {isDark ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-indigo-500" />}
      </button>

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <img
            src="/assets/images/onyx-app-icon.png"
            alt="Onyx"
            className="mx-auto mb-4 h-16 w-16 rounded-2xl shadow-xl shadow-brand-500/20"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
          <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">Onyx Admin</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Sign in to manage your app</p>
        </div>

        <form
          onSubmit={submit}
          className="space-y-5 rounded-3xl border border-slate-200/80 bg-white dark:border-white/10 dark:bg-ink-800/80 p-7 shadow-xl shadow-slate-200/60 dark:shadow-2xl dark:shadow-black/40 backdrop-blur transition"
        >
          {!configured && (
            <div className="flex gap-2 rounded-xl border border-amber-400/30 bg-amber-950/40 p-3 text-xs text-amber-200">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env and rebuild.
            </div>
          )}

          <div>
            <label className={labelCls}>E-mail</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                required
                autoFocus
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className={`${inputCls} pl-10`}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Password</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type={show ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`${inputCls} pl-10 pr-11`}
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200"
                tabIndex={-1}
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-400/30 bg-red-950/50 px-3.5 py-2.5 text-sm text-red-200">
              {error}
            </div>
          )}

          <Button type="submit" loading={busy} className="w-full py-3">
            <ShieldCheck className="h-4 w-4" /> Sign in
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-600">Restricted area · authorized administrators only</p>
      </div>
    </div>
  )
}
