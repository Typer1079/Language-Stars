import { useEffect, useState } from 'react'
import { leaderboard, myRanks, type Leaderboard, type MyRanks, type RankMetric } from '../lib/learnersApi'
import { medal, RANK_METRICS } from '../lib/ranks'
import { subject } from '../lib/subjects'

/** The top of one ranking. Everyone else appears under a codename; your own row shows your name. */
export function LeaderboardList({ metric, learnerId, myName, top = 10 }: { metric: RankMetric; learnerId: string | null; myName?: string; top?: number }) {
  const [board, setBoard] = useState<Leaderboard | null>(null)
  const [error, setError] = useState<string | false>(false)
  const m = RANK_METRICS.find((x) => x.id === metric)!

  useEffect(() => {
    let live = true
    leaderboard(metric, learnerId, top)
      .then((b) => { if (live) { setBoard(b); setError(false) } })
      .catch((e) => { if (live) setError(/unknown ranking/i.test(String(e?.message)) ? 'This ranking needs database update 018.' : 'Couldn’t load this ranking.') })
    return () => { live = false }
  }, [metric, learnerId, top])

  if (error) return <p className="text-xs text-rose-700">{error}</p>
  if (!board) return <p className="py-3 text-center text-xs text-slate-500">Loading…</p>
  if (board.top.length === 0) return <p className="py-3 text-center text-xs text-slate-500">Nobody is ranked here yet. Be the first!</p>
  const meShown = board.top.some((t) => t.me)
  return (
    <ol className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white text-sm">
      {board.top.map((t, i) => (
        <li key={i} className={`flex items-center gap-3 px-3 py-2 ${t.me ? 'bg-amber-50 font-bold' : ''}`}>
          <span className="w-9 text-center font-kids text-base font-bold text-slate-700">{medal(t.rank) || `#${t.rank}`}</span>
          <span className="text-xl" aria-hidden="true">{t.me ? '⭐' : t.icon}</span>
          <span className="min-w-0 flex-1 truncate">{t.me ? `You${myName ? ` (${myName})` : ''}` : t.name}</span>
          <span className="shrink-0 text-xs font-bold text-slate-600">{m.unit(t.value)}</span>
        </li>
      ))}
      {board.me && !meShown && (
        <li className="flex items-center gap-3 bg-amber-50 px-3 py-2 font-bold">
          <span className="w-9 text-center font-kids text-base">#{board.me.rank}</span>
          <span className="text-xl" aria-hidden="true">⭐</span>
          <span className="min-w-0 flex-1 truncate">You{myName ? ` (${myName})` : ''}</span>
          <span className="shrink-0 text-xs font-bold text-slate-600">{m.unit(board.me.value)}</span>
        </li>
      )}
      <li className="px-3 py-1.5 text-center text-[11px] text-slate-500">{board.total.toLocaleString()} ranked worldwide • others use secret codenames</li>
    </ol>
  )
}

/** A learner's worldwide rank in every category; tap one to see the leaderboard. */
export function RanksSection({ learnerId, name }: { learnerId: string; name: string }) {
  const [ranks, setRanks] = useState<MyRanks | null>(null)
  const [error, setError] = useState(false)
  const [open, setOpen] = useState<RankMetric | null>(null)

  useEffect(() => {
    let live = true
    myRanks(learnerId)
      .then((r) => { if (live) setRanks(r) })
      .catch(() => { if (live) setError(true) })
    return () => { live = false }
  }, [learnerId])

  if (error) return null
  return (
    <section className="mt-4" aria-labelledby="ranks-title">
      <div className="mb-2 flex items-end justify-between gap-2">
        <h3 id="ranks-title" className="font-kids text-xl font-bold">🏆 World ranks</h3>
        <span className="text-[11px] text-slate-500">Can you be #1 in something?</span>
      </div>
      {!ranks && <p className="py-4 text-center text-sm text-slate-500">Loading…</p>}
      {ranks && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {/* Language ranks only for languages this learner has started (all ten would crowd the page). */}
          {RANK_METRICS.filter((m) => !subject(m.id).language || m.id === 'spanish' || (ranks[m.id]?.value ?? 0) > 0).map((m) => {
            const r = ranks[m.id]
            const ranked = r && r.rank
            const first = r?.rank === 1
            return (
              <button key={m.id} type="button" aria-expanded={open === m.id} onClick={() => setOpen(open === m.id ? null : m.id)}
                className={`relative rounded-2xl border-2 p-3 text-left transition hover:-translate-y-0.5 ${open === m.id ? 'border-indigo-500 bg-indigo-50' : first ? 'border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-100' : 'border-slate-200 bg-white'}`}>
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  <span className="text-base">{m.icon}</span><span className="truncate">{m.label}</span>
                </div>
                {ranked ? (
                  <div className="mt-1 font-kids text-2xl font-bold text-slate-900">
                    {medal(r.rank)} #{r.rank} <span className="font-sans text-xs font-semibold text-slate-500">of {r.total.toLocaleString()}</span>
                  </div>
                ) : (
                  <div className="mt-1 font-kids text-base font-bold text-slate-400">Not ranked yet</div>
                )}
                <div className="text-[11px] font-semibold text-slate-500">{r && r.value > 0 ? m.unit(r.value) : 'Keep going!'}</div>
                {first && <span className="absolute right-2 top-2 text-lg" aria-label="Number one">👑</span>}
              </button>
            )
          })}
        </div>
      )}
      {open && (
        <div className="mt-3">
          <div className="mb-1 text-xs font-bold text-slate-700">{RANK_METRICS.find((m) => m.id === open)?.icon} {RANK_METRICS.find((m) => m.id === open)?.label}: top 10</div>
          <LeaderboardList metric={open} learnerId={learnerId} myName={name} />
        </div>
      )}
    </section>
  )
}

/** Super admin: every ranking, top 25 (codenames only). */
export function AdminLeaderboards() {
  const [metric, setMetric] = useState<RankMetric>('stars')
  return (
    <div className="mt-4 panel">
      <div className="mb-2 text-xs font-bold text-slate-700">🏆 World rankings (codenames only)</div>
      <div className="-mx-1 mb-3 flex gap-1.5 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Ranking">
        {RANK_METRICS.map((m) => (
          <button key={m.id} type="button" role="tab" aria-selected={metric === m.id} onClick={() => setMetric(m.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${metric === m.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
            {m.icon} {m.label}
          </button>
        ))}
      </div>
      <LeaderboardList metric={metric} learnerId={null} top={25} />
    </div>
  )
}
