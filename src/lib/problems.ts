import { supabase } from './supabase'
import { formatDateTimeLong } from './format'

/**
 * Problem reports: short technical notes sent when something breaks or a learner seems stuck, so
 * the admin can see a list, copy it and fix things. Never names, emails or audio. Best effort:
 * a report that can't be sent is dropped and never gets in the learner's way.
 */
export type ProblemKind = 'error' | 'stuck' | 'skipped' | 'gave_up' | 'mic'

export interface ProblemDraft {
  kind: ProblemKind
  learner_id?: string | null
  mode?: string | null
  level?: number | null
  item?: string | null
  heard?: string[]
  seconds?: number | null
  detail?: string | null
  log?: string | null
}

export interface ProblemReport extends Required<Omit<ProblemDraft, 'learner_id'>> {
  id: string
  device: string | null
  app_version: string | null
  created_at: string
  resolved_at: string | null
  learner: string | null
  learner_kind: string | null
  reporter: string | null
}

const MAX_PER_SESSION = 25
let sent = 0
const recent = new Map<string, number>()

/** "iPhone · iOS 18.1 · Safari · Home Screen app": enough to reproduce, nothing that identifies anyone. */
export function deviceSummary(ua = navigator.userAgent): string {
  const ios = /iPhone|iPad|iPod/.exec(ua)?.[0] ?? (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1 ? 'iPad' : null)
  const iosVer = /OS (\d+)[_.](\d+)/.exec(ua)
  const android = /Android (\d+(?:\.\d+)?)/.exec(ua)
  let os = 'Other'
  if (ios) os = `${ios}${iosVer ? ` · iOS ${iosVer[1]}.${iosVer[2]}` : ''}`
  else if (android) os = `Android ${android[1]}`
  else if (/Windows/.test(ua)) os = 'Windows'
  else if (/Mac OS X/.test(ua)) os = 'Mac'
  else if (/CrOS/.test(ua)) os = 'Chromebook'
  else if (/Linux/.test(ua)) os = 'Linux'
  const browser = /CriOS|Chrome\//.test(ua) && !/Edg/.test(ua) ? 'Chrome' : /Edg/.test(ua) ? 'Edge' : /FxiOS|Firefox/.test(ua) ? 'Firefox' : /Safari/.test(ua) ? 'Safari' : 'Browser'
  const standalone = window.matchMedia?.('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone
  return `${os} · ${browser}${standalone ? ' · Home Screen app' : ''}`.slice(0, 120)
}

export function reportProblem(p: ProblemDraft): void {
  // Same problem on the same item: once a minute is plenty.
  const key = `${p.kind}|${p.item ?? ''}|${(p.detail ?? '').slice(0, 80)}`
  const now = Date.now()
  if ((recent.get(key) ?? 0) > now - 60_000 || sent >= MAX_PER_SESSION) return
  recent.set(key, now)
  sent += 1
  const body = {
    ...p,
    heard: (p.heard ?? []).slice(-12).map((h) => h.slice(0, 300)),
    seconds: p.seconds == null ? null : Math.max(0, Math.round(p.seconds)),
    detail: p.detail?.slice(0, 2000) ?? null,
    log: p.log?.slice(-8000) ?? null,
    device: deviceSummary(),
    app_version: typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : null,
  }
  void supabase.auth.getSession().then(({ data }) => {
    if (!data.session) return
    return supabase.rpc('report_problem', { r: body })
  }).catch(() => { /* best effort */ })
}

/** App errors anywhere (not just on the practice screen). */
export function watchForErrors() {
  const send = (msg: string, stack?: string) => {
    // Ignore noise from browser extensions and cancelled loads.
    if (/ResizeObserver loop|extension:\/\/|AbortError|Load failed$/.test(msg + (stack ?? ''))) return
    reportProblem({ kind: 'error', item: location.hash || location.pathname, detail: `${msg}${stack ? `\n${stack}` : ''}` })
  }
  window.addEventListener('error', (e) => send(e.message || String(e.error), e.error instanceof Error ? e.error.stack : `${e.filename}:${e.lineno}:${e.colno}`))
  window.addEventListener('unhandledrejection', (e) => {
    const r = e.reason as unknown
    send(r instanceof Error ? r.message : String(r), r instanceof Error ? r.stack : undefined)
  })
}

// ---- admin ---------------------------------------------------------------------------------

export async function fetchProblems(days: number, includeResolved: boolean): Promise<ProblemReport[]> {
  const { data, error } = await supabase.rpc('admin_problems', { days, include_resolved: includeResolved })
  if (error) throw error
  return (data ?? []) as ProblemReport[]
}

export async function resolveProblems(ids: string[], resolved = true): Promise<number> {
  const { data, error } = await supabase.rpc('admin_resolve_problems', { ids, resolved })
  if (error) throw error
  return (data as number) ?? 0
}

const KIND_LABEL: Record<ProblemKind, string> = {
  error: 'App error',
  stuck: 'Stuck (long time on one item)',
  skipped: 'Skipped after trying',
  gave_up: 'Coach gave up',
  mic: 'Microphone problem',
}
export const kindLabel = (k: string) => KIND_LABEL[k as ProblemKind] ?? k

/** Plain text that pastes cleanly into a chat for analysis. */
export function problemsToText(list: ProblemReport[], heading: string): string {
  const fmt = (iso: string) => formatDateTimeLong(iso)
  const lines = [`Language Stars problem reports — ${heading} — ${list.length} report${list.length === 1 ? '' : 's'} (copied ${fmt(new Date().toISOString())})`]
  list.forEach((p, i) => {
    lines.push('', `#${i + 1} ${kindLabel(p.kind).toUpperCase()} · ${fmt(p.created_at)}${p.resolved_at ? ' · marked fixed' : ''}`)
    const where = [p.mode, p.level ? `L${p.level}` : null].filter(Boolean).join(' ')
    if (where || p.learner) lines.push(`Where: ${where || '—'}${p.learner ? ` · learner ${p.learner}${p.learner_kind ? ` (${p.learner_kind})` : ''}` : ''}${p.seconds != null ? ` · ${p.seconds}s on item` : ''}`)
    if (p.item) lines.push(`${p.kind === 'error' ? 'Screen' : 'Target'}: ${p.item}`)
    if (p.heard?.length) lines.push(`Heard: ${p.heard.map((h) => `"${h}"`).join(' | ')}`)
    if (p.detail) lines.push(`Detail: ${p.detail}`)
    lines.push(`Device: ${p.device ?? '—'} · app ${p.app_version ?? '—'}`)
    if (p.log) lines.push('Log:', ...p.log.split('\n').map((l) => `  ${l}`))
  })
  return lines.join('\n')
}
