import { useEffect, useRef } from 'react'
import { stageName } from '../../lib/curriculum'
import { gradeFor } from '../../lib/levelGuide'
import { subject, type SubjectId } from '../../lib/subjects'

export interface Celebration {
  /** 'levelup': mastered the level and moving up. 'round': finished a round at the same level. */
  kind: 'round' | 'levelup'
  fromLevel: number
  toLevel: number
  clean: number
  attempts: number
  starsEarned: number
  bonus: number
  note?: string
  movedDownTo: number | null
}

/**
 * Full-screen celebration after a round or when a learner graduates to the next level: what they
 * did, stars earned, and where they're headed next. Then the Sticker Shop, the next round, or exit.
 */
export function RoundCelebration({ c, name, mode, balance, lifetime, progress, onShop, onNext, onExit, exitLabel }: {
  c: Celebration
  name: string
  mode: SubjectId
  balance: number
  lifetime: number
  progress: { done: number; needed: number }
  onShop: () => void
  onNext: () => void
  onExit: () => void
  exitLabel: string
}) {
  const s = subject(mode)
  const grad = c.kind === 'levelup' || (c.toLevel > c.fromLevel && !c.movedDownTo)
  const next = useRef<HTMLButtonElement>(null)
  useEffect(() => { next.current?.focus() }, [])
  const verb = s.language ? 'said' : mode === 'spelling' ? 'spelled' : 'read'
  const toGo = Math.max(0, progress.needed - progress.done)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-gradient-to-br from-indigo-600 via-fuchsia-600 to-amber-500 p-4"
      role="dialog" aria-modal="true" aria-labelledby="celebrate-title">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {['⭐', '🌟', '✨', '🎉', '⭐', '🎊', '🌟', '✨'].map((e, i) => (
          <span key={i} className="celebrate-float absolute text-4xl opacity-80" style={{ left: `${6 + i * 12}%`, animationDelay: `${i * 0.35}s` }}>{e}</span>
        ))}
      </div>

      <div className="relative w-full max-w-lg text-center text-white">
        <div className="celebrate-pop mx-auto mb-2 text-7xl sm:text-8xl" aria-hidden="true">{grad ? '🎓' : c.movedDownTo ? '💪' : '🏆'}</div>
        <h2 id="celebrate-title" className="font-kids text-3xl font-bold drop-shadow sm:text-4xl">
          {grad ? `${name} graduated!` : c.movedDownTo ? `Nice effort, ${name}!` : `Great round, ${name}!`}
        </h2>

        {grad && (
          <div className="celebrate-pop mx-auto mt-4 max-w-sm rounded-3xl bg-white/95 p-4 text-slate-900 shadow-2xl" style={{ animationDelay: '0.15s' }}>
            <p className="text-xs font-bold uppercase tracking-widest text-fuchsia-700">{s.icon} {s.label} · now moving up to</p>
            <p className="mt-1 font-kids text-5xl font-bold text-indigo-700">Level {c.toLevel}</p>
            <p className="mt-1 text-sm font-semibold text-slate-700">{stageName(c.toLevel, mode)} · {gradeFor(c.toLevel, mode)}</p>
            <p className="mt-1 text-xs text-slate-500">Level {c.fromLevel} mastered ✓</p>
            {c.bonus > 0 && <p className="mt-2 rounded-xl bg-amber-100 px-3 py-1 text-sm font-bold text-amber-900">🎁 +{c.bonus} ⭐ graduation bonus!</p>}
          </div>
        )}

        {!grad && !c.movedDownTo && (
          <div className="mx-auto mt-4 max-w-sm rounded-3xl bg-white/95 p-4 text-slate-900 shadow-2xl">
            <p className="text-xs font-bold uppercase tracking-widest text-fuchsia-700">{s.icon} {s.label} · Level {c.toLevel}</p>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuemin={0} aria-valuemax={progress.needed} aria-valuenow={progress.done} aria-label={`Progress to Level ${c.toLevel + 1}`}>
              <div className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-amber-400 transition-all" style={{ width: `${Math.round((progress.done / Math.max(1, progress.needed)) * 100)}%` }} />
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-700">
              {toGo === 0 ? `Ready to graduate to Level ${c.toLevel + 1}!` : `${toGo} more ${toGo === 1 ? 'word' : 'words'} on your own to graduate to Level ${c.toLevel + 1}`}
            </p>
          </div>
        )}

        {c.movedDownTo && (
          <p className="mx-auto mt-4 max-w-sm rounded-3xl bg-white/95 p-4 text-sm font-semibold text-sky-900 shadow-2xl">
            That level was tricky today, so let’s practice Level {c.movedDownTo} again. Master it to climb back up! Your stars and stickers are safe.
          </p>
        )}

        {c.note && <p className="mx-auto mt-3 max-w-sm rounded-2xl bg-white/20 px-3 py-2 text-sm font-semibold">{c.note}</p>}

        <div className="mx-auto mt-4 grid max-w-sm grid-cols-3 gap-2 text-sm">
          {c.attempts > 0 && <Stat big={`${c.clean}/${c.attempts}`} small={`${verb} on your own`} />}
          <Stat big={`+${c.starsEarned} ⭐`} small="this round" />
          <Stat big={`${balance} ⭐`} small={`to spend · ${lifetime.toLocaleString()} lifetime`} />
        </div>

        <div className="mx-auto mt-5 flex max-w-sm flex-col gap-2.5">
          <button ref={next} type="button" className="btn bg-white font-kids text-lg text-indigo-700 shadow-lg hover:bg-indigo-50" onClick={onNext}>
            {grad ? `Start Level ${c.toLevel} ➡️` : 'Next Round ➡️'}
          </button>
          {balance > 0 && (
            <button type="button" className="btn bg-gradient-to-r from-fuchsia-500 to-purple-600 font-kids text-base text-white shadow-lg" onClick={onShop}>
              🏪 Spend {balance} ⭐ in the Sticker Shop
            </button>
          )}
          <button type="button" className="btn bg-white/20 text-white hover:bg-white/30" onClick={onExit}>{exitLabel}</button>
        </div>
      </div>
    </div>
  )
}

function Stat({ big, small }: { big: string; small: string }) {
  return (
    <div className="rounded-2xl bg-white/20 px-2 py-2 backdrop-blur-sm">
      <div className="font-kids text-xl font-bold">{big}</div>
      <div className="text-[11px] leading-tight opacity-90">{small}</div>
    </div>
  )
}
