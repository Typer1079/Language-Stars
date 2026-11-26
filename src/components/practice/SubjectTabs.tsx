import { levelOf } from '../../lib/progress'
import { SUBJECTS } from '../../lib/subjects'
import type { Learner, Mode } from '../../lib/types'

/** Reading / Spanish / Spelling switch at the top of practice; each subject keeps its own level. */
export function SubjectTabs({ learner, onSwitch }: { learner: Learner; onSwitch: (m: Mode) => void }) {
  return (
    <div className="grid w-full max-w-2xl grid-cols-3 gap-1.5 rounded-2xl border border-slate-200 bg-white/90 p-1.5 shadow-sm" role="group" aria-label="What to practice today">
      {SUBJECTS.map(({ id: m, activeClass, icon, shortLabel }) => (
        <button key={m} type="button" aria-pressed={learner.mode === m} onClick={() => onSwitch(m)}
          className={`flex items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 font-kids text-sm font-bold transition sm:text-base ${learner.mode === m ? activeClass : 'text-slate-600 hover:bg-slate-100'}`}>
          <span className="text-lg">{icon}</span>{shortLabel}
          <span className={`hidden rounded-full px-1.5 text-[10px] sm:inline ${learner.mode === m ? 'bg-white/25' : 'bg-slate-100'}`}>L{levelOf(learner, m)}</span>
        </button>
      ))}
    </div>
  )
}
