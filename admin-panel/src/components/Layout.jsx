import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  Bug,
  CircleDollarSign,
  ExternalLink,
  Globe,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Moon,
  Receipt,
  Settings,
  SlidersHorizontal,
  Sun,
  UserMinus,
  Users,
  X,
} from 'lucide-react'
import { useAuth } from '../auth/AuthContext.jsx'
import { useTheme } from '../theme/ThemeContext.jsx'

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/transactions', label: 'Transactions', icon: Receipt },
  { to: '/issues', label: 'Issue Reports', icon: Bug },
  { to: '/feedback', label: 'Delete Feedback', icon: UserMinus },
  { to: '/announcements', label: 'Announcements', icon: Megaphone },
  { to: '/earnings', label: 'Earnings', icon: CircleDollarSign },
  { to: '/website', label: 'Website CMS', icon: Globe },
  { to: '/app-controls', label: 'App Controls', icon: SlidersHorizontal },
  { to: '/settings', label: 'Settings', icon: Settings },
]

function Brand() {
  return (
    <div className="flex items-center gap-3 px-2">
      <img
        src="/assets/images/onyx-app-icon.png"
        alt=""
        className="h-9 w-9 rounded-xl shadow-sm"
        onError={(e) => (e.currentTarget.style.display = 'none')}
      />
      <div>
        <p className="font-display text-lg font-bold leading-none text-slate-900 dark:text-white">Onyx</p>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">Admin</p>
      </div>
    </div>
  )
}

function NavItems({ onNavigate }) {
  return (
    <nav className="mt-8 flex flex-1 flex-col gap-1">
      {nav.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
              isActive
                ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-500/20 dark:bg-brand-500/20 dark:text-white dark:ring-brand-400/30'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white'
            }`
          }
        >
          <Icon className="h-[18px] w-[18px]" />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}

export default function Layout() {
  const { user, signOut } = useAuth()
  const { theme, toggleTheme, isDark } = useTheme()
  const [open, setOpen] = useState(false)

  const sidebar = (onNavigate) => (
    <div className="flex h-full flex-col p-4 bg-white dark:bg-ink-900 transition-colors">
      <Brand />
      <NavItems onNavigate={onNavigate} />
      <div className="mt-6 space-y-2 border-t border-slate-200 dark:border-white/8 pt-4">
        <button
          onClick={toggleTheme}
          className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white transition"
        >
          <span className="flex items-center gap-3">
            {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-500" />}
            <span>{isDark ? 'Light mode' : 'Dark mode'}</span>
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {isDark ? 'Dark' : 'Light'}
          </span>
        </button>
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white transition"
        >
          <ExternalLink className="h-4 w-4" /> View website
        </a>
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-500/10 dark:hover:text-red-300 transition"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-ink-950 transition-colors">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 dark:border-white/8 bg-white dark:bg-ink-900 lg:block shadow-sm dark:shadow-none transition-colors">
        {sidebar()}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 border-r border-slate-200 dark:border-white/8 bg-white dark:bg-ink-900 shadow-2xl">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebar(() => setOpen(false))}
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 dark:border-white/8 bg-white/80 dark:bg-ink-950/80 px-4 py-3 backdrop-blur lg:px-8 transition-colors">
          <button
            onClick={() => setOpen(true)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden text-sm font-medium text-slate-500 dark:text-slate-400 lg:block">Onyx Control Center</div>
          <div className="flex items-center gap-3">
            {/* Quick theme toggle in header */}
            <button
              onClick={toggleTheme}
              title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 transition shadow-sm dark:shadow-none"
            >
              {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-500" />}
            </button>

            <div className="text-right">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Administrator</p>
              <p className="max-w-[200px] truncate text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 font-display text-sm font-bold text-white shadow-md shadow-brand-500/25">
              {(user?.email || 'A').charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
