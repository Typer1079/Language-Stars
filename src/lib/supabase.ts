import { createClient } from '@supabase/supabase-js'

const url = ((import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? '').trim()
// The publishable ("anon") key is designed to be public. Row-level security in
// supabase/migrations/001_learners.sql is what keeps each account's data private.
const key = ((import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? '').trim()

export const isConfigured = Boolean(url && key)

// A missing GitHub variable arrives as an empty string; fall back so the app can show
// its "not connected yet" screen instead of a blank page.
export const supabase = createClient(url || 'https://not-configured.supabase.co', key || 'not-configured', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
})
