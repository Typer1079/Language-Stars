import { supabase } from './supabase'
import type { Learner, LearnerDraft, Mode } from './types'
import { SUBJECTS, levelRows } from './subjects'

const BASE_COLUMNS =
  'id, display_name, kind, age_group, sticker_style, mode, reading_level, spanish_level, reading_best, spanish_best, lifetime_stars, spendable_stars, mastered, stickers, updated_at'

// Newer columns come from later database updates. Until an update is run, the app keeps
// working without that feature instead of failing: 006 adds avatars, 008 adds the Spelling Bee.
// 014 adds learner_subjects (levels as rows), read here as an embedded list.
const OPTIONAL: Record<string, string[]> = {
  avatar: ['avatar'],
  spelling: ['spelling_level', 'spelling_best'],
  levels: ['learner_subjects(subject, level, best)'],
}
const missing = new Set<string>()
// Set when saving to learner_subjects isn't possible yet (before database update 015): levels are
// then saved to the learner columns, which 014 copies into learner_subjects.
let levelRowsWritable: boolean | null = null // null until the first save tries
const columns = () => [BASE_COLUMNS, ...Object.entries(OPTIONAL).filter(([g]) => !missing.has(g)).flatMap(([, c]) => c)].join(', ')

/** Which optional column group an error is complaining about, if any. */
function missingGroup(e: { message?: string } | null): string | null {
  const msg = e?.message ?? ''
  if (!/column|schema cache/i.test(msg)) return null
  for (const [g, cols] of Object.entries(OPTIONAL)) if (!missing.has(g) && cols.some((c) => msg.includes(c))) return g
  if (!missing.has('levels') && /learner_subjects/.test(msg)) return 'levels'
  return null
}

function strip<T extends object>(row: T): T {
  const out = { ...row } as Record<string, unknown>
  delete out.levels // in-app copy of learner_subjects, not a column
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
/** True once the database has the Spelling Bee (update 008). */
export const spellingAvailable = () => !missing.has('spelling')
// Subjects listed in the database's subjects table (update 015, new languages added by 017).
// null until loaded, or when the table doesn't exist yet.
let dbSubjects: Set<string> | null = null
async function loadSubjects() {
  if (dbSubjects) return
  const { data, error } = await supabase.from('subjects').select('id')
  if (!error && Array.isArray(data)) dbSubjects = new Set((data as { id: string }[]).map((r) => r.id))
}

/**
 * Subjects this database supports: Spelling Bee needs update 008; subjects without an old learner
 * column (the newer languages) need their row in the subjects table (update 017) and level rows.
 */
export const availableSubjects = () => SUBJECTS.filter((s) => {
  if (s.id === 'spelling') return spellingAvailable()
  if (s.levelColumn) return true
  return Boolean(dbSubjects?.has(s.id)) && !missing.has('levels')
})

type LevelRow = { subject: string; level: number; best: number }

/** A learner row from the database, with its learner_subjects rows folded into `levels` (and the columns). */
function fromRow(row: Record<string, unknown>): Learner {
  const { learner_subjects: rows, ...rest } = row as { learner_subjects?: LevelRow[] } & Record<string, unknown>
  const l = rest as unknown as Learner
  if (!Array.isArray(rows) || rows.length === 0) return l
  const levels: NonNullable<Learner['levels']> = {}
  const cols: Record<string, number> = {}
  for (const r of rows) {
    savedRows.set(`${l.id}/${r.subject}`, `${r.level}/${r.best}`)
    const s = SUBJECTS.find((x) => x.id === r.subject)
    if (!s) continue
    levels[s.id] = { level: r.level, best: Math.max(r.best, r.level) }
    if (s.levelColumn) cols[s.levelColumn] = r.level
    if (s.bestColumn) cols[s.bestColumn] = Math.max(r.best, r.level)
  }
  return { ...l, ...cols, levels }
}

export async function listLearners(): Promise<Learner[]> {
  await loadSubjects()
  const { data, error } = await withFallback(() => supabase.from('learners').select(columns()).order('created_at', { ascending: true }))
  if (error) throw error
  return ((data ?? []) as unknown as Record<string, unknown>[]).map(fromRow)
}

export async function createLearner(d: LearnerDraft): Promise<Learner> {
  const { data, error } = await withFallback(() => supabase.from('learners').insert(strip(d)).select(columns()).single())
  if (error) throw error
  return fromRow(data as unknown as Record<string, unknown>)
}

// What each learner_subjects row held when last loaded or saved ("level/best"), so a save only sends
// the subjects that changed.
const savedRows = new Map<string, string>()

/**
 * Saves each subject's level to learner_subjects (only rows that changed). False if that isn't
 * possible (before update 015). Before update 019 the database refused "insert or update", so then
 * rows are added if missing and their level updated separately.
 */
async function saveLevelRows(l: Learner): Promise<boolean> {
  if (levelRowsWritable === false) return false
  const ids = availableSubjects().map((s) => s.id)
  const rows = levelRows(l, ids).filter((r) => savedRows.get(`${r.learner_id}/${r.subject}`) !== `${r.level}/${r.best}`)
  if (rows.length === 0) return true
  const table = () => supabase.from('learner_subjects')
  let { error } = await table().upsert(rows, { onConflict: 'learner_id,subject' })
  if (error && /permission denied/i.test(error.message ?? '')) {
    ;({ error } = await table().upsert(rows, { onConflict: 'learner_id,subject', ignoreDuplicates: true }))
    for (const r of rows) {
      if (error) break
      ;({ error } = await table().update({ level: r.level, best: r.best }).eq('learner_id', r.learner_id).eq('subject', r.subject))
    }
  }
  if (error) {
    levelRowsWritable = false
    return false
  }
  for (const r of rows) savedRows.set(`${r.learner_id}/${r.subject}`, `${r.level}/${r.best}`)
  levelRowsWritable = true
  return true
}

/**
 * Saves progress and profile fields (never the id or owner). Levels go to learner_subjects (one row
 * per subject, copied back to the learner columns by the database); before database update 015 they
 * go to the learner columns instead.
 */
export async function saveLearner(l: Learner): Promise<void> {
  const { id, updated_at: _u, ...fields } = l
  void _u
  const rowsSaved = await saveLevelRows(l)
  const patch = { ...fields } as Record<string, unknown>
  if (rowsSaved) for (const s of SUBJECTS) { if (s.levelColumn) delete patch[s.levelColumn]; if (s.bestColumn) delete patch[s.bestColumn] }
  const { error } = await withFallback(() => supabase.from('learners').update(strip(patch)).eq('id', id))
  if (error) throw error
}

/** True once a save on this device has gone to learner_subjects (database update 015). For the admin check. */
export const levelsSavedAsRows = () => levelRowsWritable === true && !missing.has('levels')

export async function deleteLearner(id: string): Promise<void> {
  const { error } = await supabase.from('learners').delete().eq('id', id)
  if (error) throw error
}

/**
 * Deletes the signed-in account and everything in it (learners, history, devices). Needs the
 * literal confirmation "DELETE"; accounts with children's profiles need a Face ID / two-step session.
 */
export async function deleteMyAccount(confirm: string): Promise<void> {
  const { error } = await supabase.rpc('delete_my_account', { confirm })
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
  if (/learners_owner_name_idx|duplicate key/i.test(msg)) return 'There’s already a learner with that name.'
  if (/Too many reader profiles/i.test(msg)) return 'This account already has the maximum of 12 learners.'
  if (/Lifetime stars can only go up/i.test(msg)) return 'Progress on another device is newer. Reload to get it.'
  if (/Failed to fetch|NetworkError|network/i.test(msg)) return 'No connection. Progress will save when you’re back online.'
  return msg || 'Something went wrong.'
}

// ---- practice history (graphs) ---------------------------------------------------------------

/** One finished round, as stored for progress graphs (counts and timing only). */
export interface RoundRecord {
  learner_id: string
  mode: Mode
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

/** Admin: does the per-subject table (database update 014) match the learner columns? null = not set up yet. */
export async function subjectsInSync(): Promise<{ rows: number; mismatched: number } | null> {
  const { data, error } = await supabase.rpc('subjects_in_sync')
  if (error) return null
  return data as { rows: number; mismatched: number }
}

export async function adminKpis(days = 30): Promise<AdminKpis> {
  const { data, error } = await supabase.rpc('admin_kpis', { days })
  if (error) throw error
  return data as AdminKpis
}

/** Learners per subject (current choice) and per 10-level band (database update 018); null before it. */
export interface SubjectLevels {
  modes: Record<string, number>
  bands: { subject: string; band: number; n: number }[]
  /** Practice per subject in the time range (update 019). */
  practice?: { subject: string; rounds: number; items: number; clean: number; minutes: number; stars: number; learners: number }[]
}
export async function adminSubjectLevels(days = 30): Promise<SubjectLevels | null> {
  // Update 019 takes a time range (and adds practice per subject); 018 takes none.
  let { data, error } = await supabase.rpc('admin_subject_levels', { days })
  if (error) ({ data, error } = await supabase.rpc('admin_subject_levels'))
  if (error) return null
  return data as SubjectLevels
}

// ---- worldwide rankings (names are never returned: others appear as codenames) ---------------

export type RankMetric = 'stars' | 'stars_week' | Mode | 'biggest_sticker' | 'stickers' | 'words' | 'minutes_week' | 'days30' | 'questions'

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

// ---- account status, Terms acceptance, admin user management --------------------------------

export interface AccountStatus {
  archived: boolean
  terms_version?: string | null
  /** 'inactive' = archived after 90 days without activity (can re-verify); 'admin' = archived by the admin. */
  archive_kind?: 'admin' | 'inactive' | null
  /** This sign-in is a learner's linked phone or tablet. */
  device?: boolean
  learner_id?: string | null
}

/** null = the database doesn't have update 009 yet (nothing to enforce). */
export async function myAccountStatus(): Promise<AccountStatus | null> {
  const { data, error } = await supabase.rpc('my_account_status')
  if (error) return null
  return data as AccountStatus
}

export async function acceptTerms(version: string, isAdult: boolean, isGuardian: boolean): Promise<void> {
  const { error } = await supabase.rpc('accept_terms', { version, is_adult: isAdult, is_guardian: isGuardian })
  if (error) throw error
}

export interface AdminUser {
  id: string
  email: string | null
  created_at: string
  last_sign_in_at: string | null
  archived_at: string | null
  archive_reason: string | null
  archive_kind?: 'admin' | 'inactive' | null
  devices?: number
  is_admin: boolean
  terms_version: string | null
  last_active: string | null
  /** Database update 016: paid plan and the last inactivity email. */
  paying?: boolean
  plan_status?: 'active' | 'trialing' | 'past_due' | 'canceled' | 'expired' | null
  last_notice?: 'free_60' | 'free_83' | 'paid_45' | null
  learners: { name: string; kind: string; mode: string; avatar: string | null; reading: number; spanish: number; spelling: number | null; stars: number; levels?: Record<string, number> }[]
}

export async function adminUsers(): Promise<AdminUser[]> {
  const { data, error } = await supabase.rpc('admin_users')
  if (error) throw error
  return (data ?? []) as AdminUser[]
}

export async function adminAccountAction(target: string, action: 'sign_out' | 'archive' | 'restore', reason?: string): Promise<string[]> {
  const { data, error } = await supabase.rpc('admin_account_action', { target, action, reason: reason ?? null })
  if (error) throw error
  return ((data as { notes?: string[] })?.notes ?? [])
}

/** Admin: give, change or remove a plan by hand (gifts and testing; payments will update plans themselves). */
export async function adminSetPlan(target: string, status: 'active' | 'trialing' | 'canceled' | 'none'): Promise<void> {
  const { error } = await supabase.rpc('admin_set_plan', { target, new_status: status, new_plan: 'family', period_end: null })
  if (error) throw error
}

// ---- learner devices (a child's own phone, linked by the parent) ------------------------------

export async function createPairingCode(learnerId: string): Promise<{ code: string; expires_at: string }> {
  const { data, error } = await supabase.rpc('create_pairing_code', { learner: learnerId })
  if (error) throw error
  return data as { code: string; expires_at: string }
}

export interface LinkedDevice { id: string; label: string | null; created_at: string; last_seen_at: string | null }

export async function listDevices(learnerId: string): Promise<LinkedDevice[]> {
  const { data, error } = await supabase.rpc('list_devices', { learner: learnerId })
  if (error) throw error
  return (data ?? []) as LinkedDevice[]
}

export async function unlinkDevice(deviceId: string): Promise<void> {
  const { error } = await supabase.rpc('unlink_device', { device: deviceId })
  if (error) throw error
}

/** On the learner's device, step 1: sign in without any email or password (nothing is reachable until a code is redeemed). */
export async function startDeviceSignIn(): Promise<void> {
  const { error } = await supabase.auth.signInAnonymously()
  if (error) {
    throw new Error(/anonymous/i.test(error.message)
      ? 'Learner devices aren’t turned on yet. The parent needs to turn on “Allow anonymous sign-ins” in Supabase (see README).'
      : 'Couldn’t connect. Check the internet connection and try again.')
  }
}

/** Step 2: redeem the parent's one-time code. Returns the linked learner's id. */
export async function linkThisDevice(code: string, label: string): Promise<string> {
  const { data, error } = await supabase.rpc('redeem_pairing_code', { code: code.toUpperCase().replace(/[^A-Z0-9]/g, ''), label: label || null })
  if (error) throw new Error(error.message || 'That code didn’t work. Ask for a new one.')
  return data as string
}

/** After 90 days without activity: true once this sign-in has re-verified and the account is active again. */
export async function reactivateAfterInactivity(): Promise<boolean> {
  const { data, error } = await supabase.rpc('reactivate_after_inactivity')
  return !error && data === true
}
