import type { Question } from '../../lib/comprehension'

/** Reading comprehension: a multiple-choice question about what was just read. */
export function QuizCard({ quiz, onAnswer }: { quiz: { q: Question; picked: number | null }; onAnswer: (i: number) => void }) {
  return (    <div className="mt-2 mb-5 w-full max-w-lg rounded-2xl border-2 border-violet-300 bg-violet-50 p-4" role="group" aria-label="Question">
      <div className="mb-3 font-kids text-lg font-bold text-violet-900 sm:text-xl">🤔 {quiz.q.prompt}</div>
      <div className="grid gap-2">
        {quiz.q.choices.map((c, i) => {
          const done = quiz.picked !== null
          const state = !done ? 'border-violet-200 bg-white hover:bg-violet-100' : i === quiz.q.answer ? 'border-emerald-400 bg-emerald-100 text-emerald-900' : i === quiz.picked ? 'border-rose-300 bg-rose-100 text-rose-900' : 'border-slate-200 bg-white opacity-50'
          return (
            <button key={i} type="button" disabled={done} onClick={() => onAnswer(i)}
              className={`rounded-2xl border-2 px-4 py-3 text-left font-kids text-base font-bold transition active:scale-[0.98] sm:text-lg ${state}`}>
              {done && i === quiz.q.answer ? '✅ ' : done && i === quiz.picked ? '❌ ' : ''}{c}
            </button>
          )
        })}
      </div>
      {quiz.picked !== null && <div className="mt-2 text-sm font-semibold text-violet-800">{quiz.picked === quiz.q.answer ? 'Yes! +1 ⭐' : 'Good try — the green one is right.'}</div>}
    </div>
  )
}
