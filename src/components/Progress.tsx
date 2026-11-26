import { useEffect, useMemo, useState } from 'react'
import { dbMessage, listRounds, type RoundRecord } from '../lib/learnersApi'
import { dailySeries, summarize } from '../lib/stats'
import { levelOf } from '../lib/progress'
import { gradeFor } from '../lib/levelGuide'
import type { Learner } from '../lib/types'
import { BarChart, LineChart, Tile } from './Charts'
import { RanksSection } from './Ranks'
import { Notice } from './ui/Notice'
import { formatDateTime } from '../lib/format'
import { SUBJECTS, isLanguage, subject, subjectBest, subjectLevel, subjectName } from '../lib/subjects'

const RANGES = [7, 30, 90] as const

/**
 * A learner's activity and performance: practice time, words, accuracy, stars, levels and questions,
 * plus a list of recent rounds. Learners see it from the practice menu; parents from the learner list.
 */
export function ProgressView({ learner, onClose, parentView = false }: { learner: Learner; onClose: () => void; parentView?: boolean }) {
  const [days, setDays] = useState<(typeof RANGES)[number]>(30)
  const [rounds, setRounds] = useState<RoundRecord[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let live = true
    listRounds(learner.id, 90)
      .then((r) => { if (live) setRounds(r) })
      .catch((e) => { if (live) setError(dbMessage(e)) })
    return () => { live = false }
  }, [learner.id])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const series = useMemo(() => dailySeries(rounds ?? [], days), [rounds, days])
  const s = useMemo(() => summarize(series), [series])
  const labels = series.map((d) => d.day)
  const recent = useMemo(() => [...(rounds ?? [])].reverse().slice(0, parentView ? 25 : 10), [rounds, parentView])
  const accuracy = series.map((d) => (d.items ? Math.round((d.clean / d.items) * 100) : null))
  const qPct = s.questions ? Math.round((s.questionsRight / s.questions) * 100) : null
  // Subjects this learner has used (current subject, a level above 1, or any rounds); Reading if none.
  const usedIds = SUBJECTS.filter((x) => x.id === learner.mode || subjectLevel(learner, x.id) > 1 || (rounds ?? []).some((r) => r.mode === x.id)).map((x) => x.id)
  const used = usedIds.length ? usedIds : (['reading'] as const)
  const usesReading = used.includes('reading')

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 p-3 backdrop-blur-[2px] sm:p-6" role="dialog" aria-modal="true" aria-labelledby="progress-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="mx-auto w-full max-w-3xl rounded-3xl border-4 border-indigo-100 bg-slate-50 p-4 shadow-2xl sm:p-6">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 id="progress-title" className="font-kids text-2xl font-bold">📈 {learner.display_name}’s progress</h2>
            <p className="text-xs text-slate-500">
              {used.map((id) => {
                const lv = subjectLevel(learner, id)
                const best = subjectBest(learner, id)
                return `${subjectName(id)} Level ${lv} (${gradeFor(lv, id)}${best > lv ? `, best ${best}` : ''}) • `
              }).join('')}{learner.lifetime_stars} ⭐ lifetime • {learner.stickers.length} stickers
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white text-xs font-bold" role="group" aria-label="Time range">
              {RANGES.map((r) => (
                <button key={r} type="button" aria-pressed={days === r} onClick={() => setDays(r)}
                  className={`px-3 py-1.5 ${days === r ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{r}d</button>
              ))}
            </div>
            <button type="button" className="btn-secondary btn-sm" onClick={onClose}>Close</button>
          </div>
        </div>

        {error && <Notice tone="error" className="mb-3">{error}</Notice>}
        {!rounds && !error && <p className="py-10 text-center text-sm text-slate-500">Loading…</p>}

        {rounds && (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Tile label="Practice time" value={`${s.minutes} min`} sub={`${s.rounds} rounds`} />
              <Tile label={learner.mode === 'spelling' ? 'Words tried' : isLanguage(learner.mode) && !usesReading ? 'Words said' : 'Words read'} value={s.items} sub={`${s.clean} on their own`} />
              <Tile label="On their own" value={s.accuracy === null ? '–' : `${s.accuracy}%`} sub="without Iris or Next" />
              <Tile label="Stars earned" value={s.stars} />
              <Tile label="Days practiced" value={`${s.daysActive} / ${days}`} />
              <Tile label="Streak" value={`${s.streak} ${s.streak === 1 ? 'day' : 'days'}`} />
              <Tile label="Meaning questions" value={qPct === null ? '–' : `${qPct}%`} sub={s.questions ? `${s.questionsRight} of ${s.questions} right` : 'from Reading Level 31'} />
              <Tile label="Now at" value={`L${levelOf(learner, learner.mode)}`} sub={subject(learner.mode).label} />
            </div>

            <RanksSection learnerId={learner.id} name={learner.display_name} />

            {rounds.length === 0 ? (
              <p className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
                No practice recorded yet. Graphs fill in after the first finished round.
              </p>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <BarChart title="Minutes practiced" days={labels} values={series.map((d) => d.minutes)} unit=" min" />
                <BarChart title="Words per day" days={labels} values={series.map((d) => d.items)} inner={series.map((d) => d.clean)} legend={['tried', 'on their own']} />
                <LineChart title="Said on their own (%)" days={labels} max={100} unit="%"
                  series={[{ name: 'accuracy', values: accuracy, className: 'stroke-emerald-500', dot: 'bg-emerald-500', fill: 'fill-emerald-500' }]} />
                <LineChart title="Level" days={labels} max={100}
                  series={used.map((id) => ({ name: subject(id).shortLabel, values: series.map((d) => d.levels[id] ?? null), ...subject(id).chart }))} />
                <BarChart title="Stars earned" days={labels} values={series.map((d) => d.stars)} />
                {s.questions > 0 && (
                  <LineChart title="Meaning questions right (%)" days={labels} max={100} unit="%"
                    series={[{ name: 'questions', values: series.map((d) => (d.questions ? Math.round((d.questionsRight / d.questions) * 100) : null)), className: 'stroke-violet-500', dot: 'bg-violet-500', fill: 'fill-violet-500' }]} />
                )}
              </div>
            )}

            {recent.length > 0 && (
              <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                <table className="w-full min-w-[560px] text-left text-xs">
                  <caption className="px-3 pt-3 text-left text-xs font-bold text-slate-700">Recent rounds</caption>
                  <thead className="text-[11px] uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-2">When</th><th className="px-2 py-2">Practice</th><th className="px-2 py-2">Level</th>
                      <th className="px-2 py-2">Words</th><th className="px-2 py-2">On own</th><th className="px-2 py-2">With Iris</th>
                      <th className="px-2 py-2">Next</th><th className="px-2 py-2">Questions</th><th className="px-2 py-2">Stars</th><th className="px-2 py-2">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((r, i) => (
                      <tr key={i} className="border-t border-slate-100">
                        <td className="px-3 py-1.5 whitespace-nowrap">{r.created_at ? formatDateTime(r.created_at) : ''}</td>
                        <td className="px-2 py-1.5">{subjectName(r.mode)}</td>
                        <td className="px-2 py-1.5 whitespace-nowrap">{r.level}{r.level_after !== r.level ? ` → ${r.level_after}` : ''}</td>
                        <td className="px-2 py-1.5">{r.items}</td>
                        <td className="px-2 py-1.5">{r.clean}</td>
                        <td className="px-2 py-1.5">{r.coached}</td>
                        <td className="px-2 py-1.5">{r.skipped}</td>
                        <td className="px-2 py-1.5">{r.questions ? `${r.questions_right}/${r.questions}` : '–'}</td>
                        <td className="px-2 py-1.5">{r.stars}</td>
                        <td className="px-2 py-1.5">{Math.max(1, Math.round(r.seconds / 60))} min</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
