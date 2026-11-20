import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth/AuthContext.jsx'
import { ThemeProvider } from './theme/ThemeContext.jsx'
import Layout from './components/Layout.jsx'
import { FullPageSpinner } from './components/ui.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Users from './pages/Users.jsx'
import Transactions from './pages/Transactions.jsx'
import Issues from './pages/Issues.jsx'
import Feedback from './pages/Feedback.jsx'
import Announcements from './pages/Announcements.jsx'
import Earnings from './pages/Earnings.jsx'
import WebsiteCms from './pages/WebsiteCms.jsx'
import AppControls from './pages/AppControls.jsx'
import Settings from './pages/Settings.jsx'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center p-6 bg-slate-50 dark:bg-ink-950">
          <div className="w-full max-w-lg rounded-2xl border border-red-300 bg-white p-6 shadow-xl dark:border-red-400/25 dark:bg-ink-800 text-slate-800 dark:text-slate-200">
            <h2 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">Something went wrong</h2>
            <p className="text-xs font-mono bg-slate-100 dark:bg-black/30 p-3 rounded-xl break-all mb-4 text-red-700 dark:text-red-300">
              {this.state.error?.message || String(this.state.error)}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null })
                window.location.reload()
              }}
              className="px-4 py-2.5 rounded-xl bg-brand-500 text-white font-semibold text-sm hover:bg-brand-600 transition"
            >
              Reload application
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function Guard({ children }) {
  const { loading, session, isAdmin } = useAuth()
  if (loading) return <FullPageSpinner />
  if (!session || !isAdmin) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const { loading, session, isAdmin } = useAuth()
  const home = !loading && session && isAdmin ? '/dashboard' : '/login'

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <Guard>
                <Layout />
              </Guard>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/users" element={<Users />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/issues" element={<Issues />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/announcements" element={<Announcements />} />
            <Route path="/earnings" element={<Earnings />} />
            <Route path="/website" element={<WebsiteCms />} />
            <Route path="/app-controls" element={<AppControls />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route path="*" element={loading ? <FullPageSpinner /> : <Navigate to={home} replace />} />
        </Routes>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
