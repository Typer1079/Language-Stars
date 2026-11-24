import { supabase } from './supabase'
import type { Learner, LearnerDraft } from './types'

const BASE_COLUMNS =
  'id, display_name, kind, age_group, sticker_style, mode, reading_level, spanish_level, reading_best, spanish_best, lifetime_stars, spendable_stars, mastered, stickers, updated_at'

// Newer columns come from later database updates. Until an update is run, the app keeps
// working without that feature instead of failing: 006 adds avatars, 008 adds the spelling bee.
const OPTIONAL: Record<string, string[]> = { avatar: ['avatar'], spelling: ['spelling_level', 'spelling_best'] }
const missing = new Set<string>()
const columns = () => [BASE_COLUMNS, ...Object.entries(OPTIONAL).filter(([g]) => !missing.has(g)).flatMap(([, c]) => c)].join(', ')

/** Which optional column group an error is complaining about, if any. */
function missingGroup(e: { message?: string } | null): string | null {
  const msg = e?.message ?? ''
  if (!/column|schema cache/i.test(msg)) return null
  for (const [g, cols] of Object.entries(OPTIONAL)) if (!missing.has(g) && cols.some((c) => msg.includes(c))) return g
  return null
}

function strip<T extends object>(row: T): T {
  const out = { ...row } as Record<string, unknown>
  for (const g of missing) for (const c of OPTIONAL[g]) delete out[c]
  // Without the spelling update the database only accepts Reading or Spanish.
  if (missing.has('spelling') && out.mode === 'spelling') out.mode = 'reading'
  return out as T
}

/** Retries a request without whichever newer column the database doesn't have yet. */
async function withFallback<R extends { error: { message?: string } | null }>(run: () => PromiseLike<R>): Promise<R> {
  let res = await run()
  for (let i = 0; i < 3; i++) {
    const g = missingGroup(res.error)
    if (!g) break
    missing.add(g)
    res = await run()
  }
  return res
}

/** True once the database can store profile avatars (update 006). */
export const avatarsAvailable = () => !missing.has('avatar')
/** True once the database has the spelling bee (update 008). */
export const spellingAvailable = () => !missing.has('spelling')

export async function listLearners(): Promise<Learner[]> {
  const { data, error } = await withFallback(() => supabase.from('learners').select(columns()).order('created_at', { ascending: true }))
  if (error) throw error
  return (data ?? []) as unknown as Learner[]
}

export async function createLearner(d: LearnerDraft): Promise<Learner> {
  const { data, error } = await withFallback(() => supabase.from('learners').insert(strip(d)).select(columns()).single())
  if (error) throw error
  return data as unknown as Learner
}

/** Saves progress and profile fields (never the id or owner). */
export async function saveLearner(l: Learner): Promise<void> {
  const { id, updated_at: _u, ...fields } = l
  void _u
  const { error } = await withFallback(() => supabase.from('learners').update(strip(fields)).eq('id', id))
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
  mode: 'reading' | 'spanish' | 'spelling'
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
  learners_spelling?: number
  active_accounts_1d: number
  active_accounts_7d: number
  active_accounts_30d: number
  active_learners_7d: number
  totals: { rounds: number; items: number; clean: number; stars: number; minutes: number; questions: number; questions_right: number }
  daily: { day: string; rounds: number; items: number; clean: number; stars: number; minutes: number; learners: number; accounts: number }[]
  levels: { band: number; reading: number; spanish: number; spelling?: number }[]
}

export async function adminKpis(days = 30): Promise<AdminKpis> {
  const { data, error } = await supabase.rpc('admin_kpis', { days })
  if (error) throw error
  return data as AdminKpis
}

// ---- worldwide rankings (names are never returned: others appear as codenames) ---------------

export type RankMetric = 'stars' | 'stars_week' | 'reading' | 'spanish' | 'spelling' | 'biggest_sticker' | 'stickers' | 'words' | 'minutes_week' | 'days30' | 'questions'

export interface MyRank { rank: number | null; total: number; value: number }
export type MyRanks = Partial<Record<RankMetric, MyRank>>

export interface Leaderboard {
  metric: RankMetric
  total: number
  me: { rank: number; value: number } | null
  top: { rank: number; value: number; name: string; icon: string; me: boolean }[]
}

export async function myRanks(learnerId: string): Promise<MyRanks> {
  const { data, error } = await supabase.rpc('my_ranks', { me: learnerId })
  if (error) throw error
  return (data ?? {}) as MyRanks
}

/** Top of one ranking. Pass a learner to also get their own rank; pass null as the super admin. */
export async function leaderboard(metric: RankMetric, learnerId: string | null, top = 10): Promise<Leaderboard> {
  const { data, error } = await supabase.rpc('leaderboard', { metric, me: learnerId, top_n: top })
  if (error) throw error
  return data as Leaderboard
}
