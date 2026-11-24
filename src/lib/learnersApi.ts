import { supabase } from './supabase'
import type { Learner, LearnerDraft } from './types'

const BASE_COLUMNS =
  'id, display_name, kind, age_group, sticker_style, mode, reading_level, spanish_level, reading_best, spanish_best, lifetime_stars, spendable_stars, mastered, stickers, updated_at'

// Profile characters need migration 006 (the `avatar` column). Until it's run, the app keeps
// working without them instead of failing.
let avatarColumn = true
const columns = () => (avatarColumn ? `${BASE_COLUMNS}, avatar` : BASE_COLUMNS)
const missingAvatar = (e: { message?: string; code?: string } | null) => Boolean(e && /avatar/i.test(e.message ?? '') && /column|schema cache/i.test(e.message ?? ''))
function withoutAvatar<T extends { avatar?: unknown }>(row: T): Omit<T, 'avatar'> | T {
  if (avatarColumn) return row
  const { avatar: _a, ...rest } = row
  void _a
  return rest
}

/** True once the database can store profile characters. */
export const avatarsAvailable = () => avatarColumn

export async function listLearners(): Promise<Learner[]> {
  let { data, error } = await supabase.from('learners').select(columns()).order('created_at', { ascending: true })
  if (missingAvatar(error)) {
    avatarColumn = false
    ;({ data, error } = await supabase.from('learners').select(columns()).order('created_at', { ascending: true }))
  }
  if (error) throw error
  return (data ?? []) as unknown as Learner[]
}

export async function createLearner(d: LearnerDraft): Promise<Learner> {
  let { data, error } = await supabase.from('learners').insert(withoutAvatar(d)).select(columns()).single()
  if (missingAvatar(error)) {
    avatarColumn = false
    ;({ data, error } = await supabase.from('learners').insert(withoutAvatar(d)).select(columns()).single())
  }
  if (error) throw error
  return data as unknown as Learner
}

/** Saves progress and profile fields (never the id or owner). */
export async function saveLearner(l: Learner): Promise<void> {
  const { id, updated_at: _u, ...fields } = l
  void _u
  let { error } = await supabase.from('learners').update(withoutAvatar(fields)).eq('id', id)
  if (missingAvatar(error)) {
    avatarColumn = false
    ;({ error } = await supabase.from('learners').update(withoutAvatar(fields)).eq('id', id))
  }
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

// ---- practice history (graphs) ---------------------------------------------------------------

/** One finished round, as stored for progress graphs (counts and timing only). */
export interface RoundRecord {
  learner_id: string
  mode: 'reading' | 'spanish'
  level: number
  level_after: number
  items: number
  clean: number
  coached: number
  skipped: number
  stars: number
  questions: number
  questions_right: number
  seconds: number
  created_at?: string
}

const clampInt = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.round(Number(n) || 0)))

/** Saves a round for the progress graphs. Best effort: practice never waits on it. */
export async function logRound(r: RoundRecord): Promise<void> {
  const items = clampInt(r.items, 0, 100)
  const clean = clampInt(r.clean, 0, items)
  const coached = clampInt(r.coached, 0, items - clean)
  const row = {
    ...r,
    level: clampInt(r.level, 1, 100),
    level_after: clampInt(r.level_after, 1, 100),
    items, clean, coached,
    skipped: clampInt(r.skipped, 0, items - clean - coached),
    stars: clampInt(r.stars, 0, 100000),
    questions: clampInt(r.questions, 0, 100),
    questions_right: clampInt(r.questions_right, 0, clampInt(r.questions, 0, 100)),
    seconds: clampInt(r.seconds, 0, 14400),
  }
  delete row.created_at
  const { error } = await supabase.from('practice_rounds').insert(row)
  if (error) throw error
}

export async function listRounds(learnerId: string, days = 90): Promise<RoundRecord[]> {
  const since = new Date(Date.now() - days * 86400000).toISOString()
  const { data, error } = await supabase
    .from('practice_rounds')
    .select('learner_id, mode, level, level_after, items, clean, coached, skipped, stars, questions, questions_right, seconds, created_at')
    .eq('learner_id', learnerId)
    .gte('created_at', since)
    .order('created_at', { ascending: true })
    .limit(5000)
  if (error) throw error
  return (data ?? []) as RoundRecord[]
}

// ---- super admin -----------------------------------------------------------------------------

export async function checkIsAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_admin')
  return !error && data === true
}

export interface AdminKpis {
  generated_at: string
  days: number
  accounts: number
  accounts_new: number
  learners: number
  learners_kids: number
  learners_reading: number
  learners_spanish: number
  active_accounts_1d: number
  active_accounts_7d: number
  active_accounts_30d: number
  active_learners_7d: number
  totals: { rounds: number; items: number; clean: number; stars: number; minutes: number; questions: number; questions_right: number }
  daily: { day: string; rounds: number; items: number; clean: number; stars: number; minutes: number; learners: number; accounts: number }[]
  levels: { band: number; reading: number; spanish: number }[]
}

export async function adminKpis(days = 30): Promise<AdminKpis> {
  const { data, error } = await supabase.rpc('admin_kpis', { days })
  if (error) throw error
  return data as AdminKpis
}
