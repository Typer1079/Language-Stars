import { useEffect, useState } from 'react'
import { adminKpis, dbMessage, type AdminKpis } from '../lib/learnersApi'
import { BarChart, LineChart, Tile } from './Charts'
import { AdminLeaderboards } from './Ranks'
import { AdminUsers } from './AdminUsers'
import { AdminProblems } from './AdminProblems'

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

function jumpTo(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
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
    <div className="mx-auto min-h-dvh max-w-5xl px-4 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-kids text-2xl font-bold">📊 Admin dashboard</h1>
          <p className="text-xs text-slate-500">Site-wide numbers only. Each visit is recorded in the audit log.{k && ` Updated ${new Date(k.generated_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}.`}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white text-xs font-bold" role="group" aria-label="Time range">
            {RANGES.map((r) => (
              <button key={r} type="button" aria-pressed={days === r} onClick={() => setDays(r)}
                className={`px-3 py-1.5 ${days === r ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{r}d</button>
            ))}
          </div>
          <button type="button" className="btn-secondary px-3 py-1.5 text-sm" onClick={onBack}>← Back</button>
        </div>
      </div>

      {k && (
        <nav aria-label="Admin sections" className="sticky top-0 z-20 -mx-4 mb-4 bg-slate-50/90 px-4 py-2 backdrop-blur">
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

      {error && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      {!k && !error && <p className="py-10 text-center text-sm text-slate-500">Loading…</p>}

      {k && (
        <>
          <h2 id="sec-users" className="mb-2 scroll-mt-16 text-xs font-bold uppercase tracking-wider text-slate-500">Users</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Tile label="Accounts" value={k.accounts} sub={`+${k.accounts_new} in ${k.days}d`} />
            <Tile label="Learners" value={k.learners} sub={`${k.learners_kids} managed by a parent`} />
            <Tile label="Reading / Spanish / Spelling" value={`${k.learners_reading} / ${k.learners_spanish} / ${k.learners_spelling ?? 0}`} sub="current choice" />
            <Tile label="Active learners" value={k.active_learners_7d} sub="last 7 days" />
            <Tile label="Active today" value={k.active_accounts_1d} sub="accounts, last 24h" />
            <Tile label="Weekly active" value={k.active_accounts_7d} sub="accounts" />
            <Tile label="Monthly active" value={k.active_accounts_30d} sub="accounts" />
            <Tile label="Stickiness" value={pct(k.active_accounts_1d, k.active_accounts_30d)} sub="daily ÷ monthly active" />
          </div>

          <h2 id="sec-learning" className="mt-5 mb-2 scroll-mt-16 text-xs font-bold uppercase tracking-wider text-slate-500">Learning ({k.days} days)</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Tile label="Rounds" value={k.totals.rounds} />
            <Tile label="Words / items" value={k.totals.items} sub={`${pct(k.totals.clean, k.totals.items)} on their own`} />
            <Tile label="Practice time" value={`${k.totals.minutes} min`} sub={k.totals.rounds ? `${Math.round(k.totals.minutes / k.totals.rounds)} min / round` : undefined} />
            <Tile label="Stars earned" value={k.totals.stars} />
            <Tile label="Meaning questions" value={pct(k.totals.questions_right, k.totals.questions)} sub={`${k.totals.questions} answered`} />
          </div>

          <div id="sec-trends" className="mt-4 grid scroll-mt-16 gap-3 sm:grid-cols-2">
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

          <div id="sec-problems" className="scroll-mt-16"><AdminProblems /></div>

          <div id="sec-accounts" className="scroll-mt-16"><AdminUsers /></div>

          <div id="sec-ranks" className="scroll-mt-16"><AdminLeaderboards /></div>

          <div id="sec-levels" className="mt-4 scroll-mt-16 rounded-2xl border border-slate-200 bg-white p-3">
            <div className="mb-2 text-xs font-bold text-slate-700">Where learners are (current level)</div>
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wide text-slate-500">
                <tr><th className="py-1">Levels</th><th className="py-1">📖 Reading</th><th className="py-1">🇪🇸 Spanish</th><th className="py-1">🐝 Spelling</th></tr>
              </thead>
              <tbody>
                {k.levels.map((b) => {
                  const most = Math.max(1, ...k.levels.map((x) => Math.max(x.reading, x.spanish, x.spelling ?? 0)))
                  return (
                    <tr key={b.band} className="border-t border-slate-100">
                      <td className="py-1.5 pr-2 whitespace-nowrap">{b.band * 10 + 1}–{b.band * 10 + 10}</td>
                      {[b.reading, b.spanish, b.spelling ?? 0].map((n, i) => (
                        <td key={i} className="py-1.5 pr-3">
                          <div className="flex items-center gap-2">
                            <div className={`h-2.5 rounded-full ${i === 2 ? 'bg-emerald-500' : i ? 'bg-amber-400' : 'bg-indigo-500'}`} style={{ width: `${Math.max(n ? 4 : 0, (n / most) * 110)}px` }} />
                            <span>{n}</span>
                          </div>
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
