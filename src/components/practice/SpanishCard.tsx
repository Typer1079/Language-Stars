import type { PracticeItem } from '../../lib/progress'

/** A language (Spanish, French …): the English prompt, a Reveal button for the answer, and an example phrase once it's said. */
export function SpanishCard({ language, spanish, revealed, onReveal, phraseShown, soundHint }: {
  language: string
  /** Shown after asking Iris more than once: "kon-ni-chi-wa". */
  soundHint?: string | null
  spanish: NonNullable<PracticeItem['spanish']>
  revealed: boolean
  onReveal: () => void
  phraseShown: boolean
}) {
  return (    <div className="my-3 flex w-full max-w-lg flex-col items-center justify-center rounded-3xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 via-sky-50 to-amber-50 p-5">
      <span className="mb-1 text-xs font-bold uppercase tracking-widest text-indigo-500">Say this English word in {language}</span>
      <div className={`font-kids font-bold tracking-tight ${spanish.en.length <= 14 ? 'text-4xl sm:text-6xl' : spanish.en.length <= 30 ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'}`}>{spanish.en}</div>
      <div className="mt-2.5 flex w-full flex-col items-center gap-2 text-xs sm:text-sm">
        <span className="rounded-full border border-indigo-200 bg-white px-3 py-1 font-semibold text-indigo-700">
          {revealed ? `${language}: "${spanish.es}"${spanish.phonetic ? ` (${spanish.phonetic})` : ''}` : 'Stuck? Tap Reveal (or press Shift)'}
        </span>
        {revealed && soundHint && (
          <span className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 font-semibold text-emerald-900" aria-live="polite">
            🐢 Sounds like: <span className="font-kids text-base tracking-wide">{soundHint}</span>
          </span>
        )}
        {!revealed && (
          <button type="button" onClick={onReveal}
            className="mt-1 w-full max-w-xs rounded-2xl border-2 border-indigo-300 bg-white px-6 py-3 font-kids text-lg font-bold text-indigo-700 shadow-sm transition hover:bg-indigo-50 active:scale-95">
            👀 Reveal the {language}
          </button>
        )}
        {phraseShown && spanish.phraseEs && (
          <div className="w-full max-w-md rounded-2xl border border-amber-300 bg-amber-50/90 px-3.5 py-2 text-center text-amber-950">
            <div className="text-sm font-bold sm:text-base">💬 “{spanish.phraseEs}”</div>
            <div className="mt-0.5 text-[11px] text-amber-800">({spanish.phraseEn})</div>
          </div>
        )}
      </div>
    </div>
  )
}
