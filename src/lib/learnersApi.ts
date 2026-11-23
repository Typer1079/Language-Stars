import { supabase } from './supabase'
import type { Learner, LearnerDraft } from './types'

const COLUMNS =
  'id, display_name, kind, age_group, sticker_style, mode, reading_level, spanish_level, lifetime_stars, spendable_stars, mastered, stickers, updated_at'

export async function listLearners(): Promise<Learner[]> {
  const { data, error } = await supabase.from('learners').select(COLUMNS).order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as Learner[]
}

export async function createLearner(d: LearnerDraft): Promise<Learner> {
  const { data, error } = await supabase.from('learners').insert(d).select(COLUMNS).single()
  if (error) throw error
  return data as Learner
}

/** Saves progress and profile fields (never the id or owner). */
export async function saveLearner(l: Learner): Promise<void> {
  const { id, updated_at: _u, ...fields } = l
  void _u
  const { error } = await supabase.from('learners').update(fields).eq('id', id)
  if (error) throw error
}

export async function deleteLearner(id: string): Promise<void> {
  const { error } = await supabase.from('learners').delete().eq('id', id)
  if (error) throw error
}

export interface AuditEntry {
  id: number
  at: string
  learner_id: string | null
  action: string
  aal: string | null
  detail: Record<string, unknown>
}

export async function listAudit(limit = 100): Promise<AuditEntry[]> {
  const { data, error } = await supabase
    .from('audit_log')
    .select('id, at, learner_id, action, aal, detail')
    .order('at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as AuditEntry[]
}

/** Friendly text for database errors (the database enforces the same rules as the app). */
export function dbMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : typeof err === 'object' && err && 'message' in err ? String((err as { message: unknown }).message) : String(err)
  if (/row-level security/i.test(msg)) return 'Kids’ profiles need two-step sign-in. Verify with your authenticator code first.'
  if (/learners_owner_name_idx|duplicate key/i.test(msg)) return 'There’s already a reader with that name.'
  if (/Too many reader profiles/i.test(msg)) return 'This account already has the maximum of 12 readers.'
  if (/Lifetime stars can only go up/i.test(msg)) return 'Progress on another device is newer. Reload to get it.'
  if (/Failed to fetch|NetworkError|network/i.test(msg)) return 'No connection. Progress will save when you’re back online.'
  return msg || 'Something went wrong.'
}
