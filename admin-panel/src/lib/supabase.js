import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const configured = Boolean(url && key)

export const supabase = createClient(url || 'http://localhost:54321', key || 'missing-key', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'onyx-admin-auth',
  },
})

/** Turns a `{ data, error }` supabase response into data or a thrown Error. */
export function unwrap({ data, error }) {
  if (error) throw error
  return data
}

export const SUPABASE_URL = url
