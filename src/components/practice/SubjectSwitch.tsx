import { levelOf } from '../../lib/progress'
import { type Subject } from '../../lib/subjects'
import type { Learner, Mode } from '../../lib/types'

/**
 * Reading, Spelling Bee and one language tile. The language tile shows the language being
 * practiced (or the one furthest along); its menu switches to any other language.
 */
export function SubjectSwitch({ learner, subjects, onSwitch, variant, label }: {
  learner: Learner
  subjects: readonly Subject[]
  onSwitch: (m: Mode) => void
  variant: 'tabs' | 'card'
  label: string
}) {
  const others = subjects.filter((s) => !s.language)
  const langs = subjects.filter((s) => s.language)
  const current = langs.find((s) => s.id === learner.mode)
    ?? [...langs].sort((a, b) => levelOf(learner, b.id) - levelOf(learner, a.id))[0]
  const tabs = variant === 'tabs'
  const btn = (s: Subject) => {
    const on = learner.mode === s.id
    return tabs
      ? `flex items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 font-kids text-sm font-bold transition sm:text-base ${on ? s.activeClass : 'text-slate-600 hover:bg-slate-100'}`
      : `flex flex-col items-center rounded-xl px-1 py-1.5 text-[11px] font-bold leading-tight transition ${on ? 'bg-white text-slate-900 shadow' : 'text-slate-500 hover:bg-white/60'}`
  }
  const body = (s: Subject) => tabs ? (
    <>
      <span className="text-lg">{s.icon}</span>{s.shortLabel}
      <span className={`hidden rounded-full px-1.5 text-[10px] sm:inline ${learner.mode === s.id ? 'bg-white/25' : 'bg-slate-100'}`}>L{levelOf(learner, s.id)}</span>
    </>
  ) : (
    <>
      <span className="text-base">{s.icon}</span>
      <span>{s.shortLabel} <span className="font-semibold opacity-70">L{levelOf(learner, s.id)}</span></span>
    </>
  )
  return (
    <div role="group" aria-label={label}
      className={tabs ? 'grid w-full max-w-2xl grid-cols-3 gap-1.5 rounded-2xl border border-slate-200 bg-white/90 p-1.5 shadow-sm' : 'mt-3 grid grid-cols-3 gap-1 rounded-2xl bg-slate-100 p-1'}>
      {others.map((s) => (
        <button key={s.id} type="button" aria-pressed={learner.mode === s.id} onClick={() => learner.mode !== s.id && onSwitch(s.id)} className={btn(s)}>{body(s)}</button>
      ))}
      {current && (
        <div className="relative flex">
          <button type="button" aria-pressed={learner.mode === current.id} onClick={() => learner.mode !== current.id && onSwitch(current.id)} className={`${btn(current)} w-full pr-6`}>
            {body(current)}
          </button>
          {langs.length > 1 && (
            <label className={`absolute inset-y-0 right-0 flex w-6 cursor-pointer items-center justify-center rounded-r-xl text-xs font-bold ${learner.mode === current.id && tabs ? 'text-white' : 'text-slate-500'} hover:bg-black/5`} title="Choose a language">
              ▾
              <select aria-label="Choose a language" className="absolute inset-0 cursor-pointer opacity-0" value={current.id}
                onChange={(e) => onSwitch(e.target.value as Mode)}>
                {langs.map((s) => <option key={s.id} value={s.id}>{s.icon} {s.label}{s.language?.beta ? ' (Beta)' : ''} · L{levelOf(learner, s.id)}</option>)}
              </select>
            </label>
          )}
        </div>
      )}
    </div>
  )
}
