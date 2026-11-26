import { useEffect, useState } from 'react'
import { adminKpis, adminSubjectLevels, dbMessage, type SubjectLevels, levelsSavedAsRows, subjectsInSync, type AdminKpis } from '../lib/learnersApi'
import { BarChart, LineChart, Tile } from './Charts'
import { AdminLeaderboards } from './Ranks'
import { AdminUsers } from './AdminUsers'
import { AdminProblems } from './AdminProblems'
import { Notice } from './ui/Notice'
import { PageHeader } from './ui/PageHeader'
import { formatTime } from '../lib/format'
import { SUBJECTS, subject } from '../lib/subjects'

/** "🇪🇸 1 · 🇵🇹 1": learners on each language right now. */
function languageMix(modes: Record<string, number>): string {
  return SUBJECTS.filter((s) => s.language && modes[s.id]).map((s) => `${s.icon} ${modes[s.id]}`).join(' · ')
}

const RANGES = [7, 30, 90, 365] as const

// Shortcut chips under the title: jump straight to a section.
const SECTIONS = [
  { id: 'sec-users', label: '👤 Users' },
  { id: 'sec-learning', label: '📚 Learning' },
  { id: 'sec-trends', label: '📈 Trends' },
  { id: 'sec-problems', label: '🛠️ Problems' },
  { id: 'sec-accounts', label: '👥 Accounts' },
  { id: 'sec-ranks', label: '🏆 Leaderboards' },
  { id: 'sec-levels', label: '🎚️ Levels' },
] as const

/** Scroll so the section starts just below the pinned header. */
function jumpTo(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  const header = document.getElementById('admin-header')?.getBoundingClientRect().height ?? 0
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - header - 8, behavior: reduce ? 'auto' : 'smooth' })
}

/**
 * Super-admin dashboard: site-wide totals and trends. Only aggregated numbers come back from the
 * database (no names or emails), every view is written to the audit log, and it requires an
 * admin account with a two-step or Face ID session.
 */
export default function Admin({ onBack }: { onBack: () => void }) {
  const [days, setDays] = useState<(typeof RANGES)[number]>(30)
  const [k, setK] = useState<AdminKpis | null>(null)
  const [error, setError] = useState('')
  const [sync, setSync] = useState<{ rows: number; mismatched: number } | null | undefined>(undefined)
  useEffect(() => { void subjectsInSync().then(setSync) }, [])
  const [subj, setSubj] = useState<SubjectLevels | null>(null)
  useEffect(() => { void adminSubjectLevels().then(setSubj) }, [])

  useEffect(() => {
    let live = true
    adminKpis(days)
      .then((r) => { if (live) { setK(r); setError('') } })
      .catch((e) => { if (live) setError(/not authorized/i.test(String(e?.message)) ? 'This account isn’t an admin, or this sign-in wasn’t two-step / Face ID.' : dbMessage(e)) })
    return () => { live = false }
  }, [days])

  const labels = k?.daily.map((d) => d.day) ?? []
  const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : '–')

  return (
    <div className="mx-auto min-h-dvh max-w-5xl px-4 pb-6">
      {/* Title, range and section chips stay pinned at the top while scrolling. */}
      <div id="admin-header" className="sticky top-0 z-20 -mx-4 mb-4 border-b border-slate-200/70 bg-slate-50/95 px-4 pt-3 pb-2 backdrop-blur">
      <PageHeader
        title="📊 Admin dashboard"
        subtitle={<>Site-wide numbers only. Each visit is recorded in the audit log.{k && ` Updated ${formatTime(k.generated_at)}.`}</>}
        actions={<>
          <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white text-xs font-bold" role="group" aria-label="Time range">
            {RANGES.map((r) => (
              <button key={r} type="button" aria-pressed={days === r} onClick={() => setDays(r)}
                className={`px-3 py-1.5 ${days === r ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{r}d</button>
            ))}
          </div>
          <button type="button" className="btn-secondary btn-sm" onClick={onBack}>← Back</button>
        </>}
      />

      {k && (
        <nav aria-label="Admin sections" className="mt-2">
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none]">
            {SECTIONS.map((x) => (
              <button key={x.id} type="button" onClick={() => jumpTo(x.id)}
                className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-800">
                {x.label}
              </button>
            ))}
          </div>
        </nav>
      )}
      </div>

      {error && <Notice tone="error">{error}</Notice>}
      {!k && !error && <p className="py-10 text-center text-sm text-slate-500">Loading…</p>}

      {k && (
        <>
          <h2 id="sec-users" className="section-label">Users</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Tile label="Accounts" value={k.accounts} sub={`+${k.accounts_new} in ${k.days}d`} />
            <Tile label="Learners" value={k.learners} sub={`${k.learners_kids} managed by a parent`} />
            {subj ? (
              <Tile label="Reading / Spelling / Languages" sub={languageMix(subj.modes) || 'current choice'}
                value={`${subj.modes.reading ?? 0} / ${subj.modes.spelling ?? 0} / ${Object.entries(subj.modes).filter(([m]) => subject(m).language).reduce((n, [, c]) => n + c, 0)}`} />
            ) : (
              <Tile label="Reading / Spanish / Spelling" value={`${k.learners_reading} / ${k.learners_spanish} / ${k.learners_spelling ?? 0}`} sub="current choice" />
            )}
            <Tile label="Active learners" value={k.active_learners_7d} sub="last 7 days" />
            <Tile label="Active today" value={k.active_accounts_1d} sub="accounts, last 24h" />
            <Tile label="Weekly active" value={k.active_accounts_7d} sub="accounts" />
            <Tile label="Monthly active" value={k.active_accounts_30d} sub="accounts" />
            <Tile label="Stickiness" value={pct(k.active_accounts_1d, k.active_accounts_30d)} sub="daily ÷ monthly active" />
          </div>

          <h2 id="sec-learning" className="mt-5 section-label">Learning ({k.days} days)</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Tile label="Rounds" value={k.totals.rounds} />
            <Tile label="Words / items" value={k.totals.items} sub={`${pct(k.totals.clean, k.totals.items)} on their own`} />
            <Tile label="Practice time" value={`${k.totals.minutes} min`} sub={k.totals.rounds ? `${Math.round(k.totals.minutes / k.totals.rounds)} min / round` : undefined} />
            <Tile label="Stars earned" value={k.totals.stars} />
            <Tile label="Meaning questions" value={pct(k.totals.questions_right, k.totals.questions)} sub={`${k.totals.questions} answered`} />
          </div>

          <div id="sec-trends" className="mt-4 grid gap-3 sm:grid-cols-2">
            <LineChart title="Active accounts per day" days={labels}
              series={[
                { name: 'accounts', values: k.daily.map((d) => d.accounts), className: 'stroke-indigo-500', dot: 'bg-indigo-500', fill: 'fill-indigo-500' },
                { name: 'learners', values: k.daily.map((d) => d.learners), className: 'stroke-amber-500', dot: 'bg-amber-500', fill: 'fill-amber-500' },
              ]} />
            <BarChart title="Practice minutes per day" days={labels} values={k.daily.map((d) => d.minutes)} unit=" min" />
            <BarChart title="Words per day" days={labels} values={k.daily.map((d) => d.items)} inner={k.daily.map((d) => d.clean)} legend={['tried', 'on their own']} />
            <LineChart title="Said on their own (%)" days={labels} max={100} unit="%"
              series={[{ name: 'accuracy', values: k.daily.map((d) => (d.items ? Math.round((d.clean / d.items) * 100) : null)), className: 'stroke-emerald-500', dot: 'bg-emerald-500', fill: 'fill-emerald-500' }]} />
            <BarChart title="Rounds per day" days={labels} values={k.daily.map((d) => d.rounds)} />
            <BarChart title="Stars per day" days={labels} values={k.daily.map((d) => d.stars)} />
          </div>

          <div id="sec-problems"><AdminProblems /></div>

          <div id="sec-accounts"><AdminUsers /></div>

          <div id="sec-ranks"><AdminLeaderboards /></div>

          <div id="sec-levels" className="mt-4 panel">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-700">Where learners are (current level)</span>
              {sync !== undefined && (
                <span className={`text-[11px] font-semibold ${sync === null ? 'text-slate-400' : sync.mismatched ? 'text-rose-700' : 'text-emerald-700'}`}
                  title="Levels are also kept in one row per learner per subject (database update 014). This checks both copies match.">
                  {sync === null ? 'Per-subject table: run database update 014' : sync.mismatched ? `Per-subject table: ${sync.mismatched} differences ✗` : `Per-subject table: ${sync.rows} rows, in sync ✓${levelsSavedAsRows() ? ' · levels saved here' : ''}`}
                </span>
              )}
            </div>
            <LevelTable rows={levelRows(k, subj)} />
          </div>
        </>
      )}
    </div>
  )
}

type LevelRow = { band: number; counts: Record<string, number> }

/** Learners per 10-level band in each subject: from learner_subjects (update 018), else the older three columns. */
function levelRows(k: AdminKpis, subj: SubjectLevels | null): LevelRow[] {
  if (!subj) return k.levels.map((b) => ({ band: b.band, counts: { reading: b.reading, spanish: b.spanish, spelling: b.spelling ?? 0 } }))
  const top = Math.max(9, ...subj.bands.map((b) => b.band))
  return Array.from({ length: top + 1 }, (_, band) => ({
    band, counts: Object.fromEntries(subj.bands.filter((b) => b.band === band).map((b) => [b.subject, b.n])),
  }))
}

function LevelTable({ rows }: { rows: LevelRow[] }) {
  // Only subjects someone is learning get a column (all ten would not fit).
  const cols = SUBJECTS.filter((s) => !s.language || s.id === 'spanish' || rows.some((r) => r.counts[s.id]))
  const most = Math.max(1, ...rows.flatMap((r) => cols.map((c) => r.counts[c.id] ?? 0)))
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="text-[11px] uppercase tracking-wide text-slate-500">
          <tr><th className="py-1">Levels</th>{cols.map((s) => <th key={s.id} className="py-1">{s.icon} {s.shortLabel}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.band} className="border-t border-slate-100">
              <td className="py-1.5 pr-2 whitespace-nowrap">{r.band * 10 + 1}–{r.band * 10 + 10}</td>
              {cols.map((c) => {
                const n = r.counts[c.id] ?? 0
                return (
                  <td key={c.id} className="py-1.5 pr-3">
                    <div className="flex items-center gap-2">
                      <div className={`h-2.5 rounded-full ${c.chart.dot}`} style={{ width: `${Math.max(n ? 4 : 0, (n / most) * 110)}px` }} />
                      <span>{n}</span>
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
