import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  const checkAdmin = useCallback(async () => {
    const { data, error } = await supabase.rpc('is_admin')
    if (error) throw error
    return data === true
  }, [])

  useEffect(() => {
    let alive = true

    supabase.auth.getSession().then(async ({ data }) => {
      if (!alive) return
      let ok = false
      if (data.session) {
        try {
          ok = await checkAdmin()
        } catch (e) {
          console.error('is_admin check failed', e)
        }
      }
      if (!alive) return
      setSession(ok ? data.session : null)
      setIsAdmin(ok)
      setLoading(false)
    })

    // Keep this callback synchronous - never await supabase calls inside it.
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      if (event === 'SIGNED_OUT') {
        setSession(null)
        setIsAdmin(false)
      } else if (event === 'TOKEN_REFRESHED' && next) {
        setSession(next)
      }
    })

    return () => {
      alive = false
      sub.subscription.unsubscribe()
    }
  }, [checkAdmin])

  const signIn = useCallback(
    async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      let ok = false
      try {
        ok = await checkAdmin()
      } catch (e) {
        await supabase.auth.signOut()
        throw new Error(
          `Admin setup is incomplete (${e.message}). Run supabase/admin_setup.sql in the Supabase SQL editor.`,
        )
      }
      if (!ok) {
        await supabase.auth.signOut()
        throw new Error('This account is not an administrator.')
      }
      setSession(data.session)
      setIsAdmin(true)
    },
    [checkAdmin],
  )

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setSession(null)
    setIsAdmin(false)
  }, [])

  const value = useMemo(
    () => ({ session, user: session?.user ?? null, isAdmin, loading, signIn, signOut }),
    [session, isAdmin, loading, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
