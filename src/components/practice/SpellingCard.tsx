import { useEffect, useRef } from 'react'
import type { PracticeItem } from '../../lib/progress'

export type BeeRequest = 'repeat' | 'definition' | 'pos' | 'sentence' | 'origin'

/** Spelling Bee: hear the word, ask for its definition / sentence / origin, and see the letters as they're said. */
export function SpellingCard(p: {
  item: PracticeItem
  revealed: boolean
  spelled: string[]
  spellMiss: string[] | null
  success: boolean
  beeInfo: { label: string; text: string }[]
  typing: string | null
  setTyping: (v: string | null) => void
  askBee: (kind: BeeRequest) => void
  misheard: () => void
  submitTyped: (text: string) => void
  onStartOver: () => void
  onTypeInstead: () => void
  /** False while a pop-up (shop, help) is open, so typing there doesn't land in the spelling box. */
  keyboardActive?: boolean
}) {
  const { item, revealed, spelled, spellMiss, success, beeInfo, typing, setTyping, askBee, misheard, submitTyped, onStartOver, onTypeInstead, keyboardActive = true } = p
  const box = useRef<HTMLInputElement>(null)
  const canType = !spellMiss && !success

  // Just start typing: a letter pressed anywhere (not in another box) goes into the spelling box.
  const latest = useRef({ typing, canType, keyboardActive, setTyping })
  useEffect(() => { latest.current = { typing, canType, keyboardActive, setTyping } })
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = latest.current
      if (!s.canType || !s.keyboardActive || e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return
      if (!/^[a-zA-Z]$/.test(e.key)) return
      e.preventDefault()
      // Focusing the box turns the mic off (its onFocus); then the letter goes in.
      box.current?.focus()
      s.setTyping((s.typing ?? '') + e.key)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])
  return (    <div className="my-3 flex w-full max-w-lg flex-col items-center rounded-3xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 via-lime-50 to-amber-50 p-5">
      <span className="mb-1 text-xs font-bold uppercase tracking-widest text-emerald-700">🐝 Spelling Bee • listen, then spell it</span>
      {canType && (
        <p className="mb-3 text-center text-sm font-semibold text-emerald-900">🎤 Say the letters out loud <span className="font-normal text-emerald-800/80">or</span> ⌨️ just start typing the word.</p>
      )}
      <button type="button" onClick={() => askBee('repeat')} className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-kids text-xl font-bold text-emerald-800 shadow-sm ring-1 ring-emerald-200 transition hover:bg-emerald-50 active:scale-95">
        🔊 Hear the word
      </button>
      <div className="mt-4 flex min-h-[64px] flex-wrap items-center justify-center gap-1.5" aria-live="polite" aria-label="Letters you spelled">
        {(revealed ? item.target.split('') : spelled).map((c, i) => {
          const wrongHere = spellMiss && spellMiss[i] !== undefined && spellMiss[i] !== item.target[i]?.toLowerCase()
          return (
            <span key={i} className={`animate-tile-pop flex h-14 w-11 items-center justify-center rounded-xl border-2 font-kids text-3xl font-bold uppercase shadow-sm sm:h-16 sm:w-12 sm:text-4xl ${success ? 'border-emerald-400 bg-emerald-100 text-emerald-900' : revealed ? (wrongHere ? 'border-rose-300 bg-rose-50 text-rose-900' : 'border-emerald-300 bg-white text-emerald-900') : 'border-emerald-200 bg-white text-slate-900'}`}>{c}</span>
          )
        })}
        {!revealed && spelled.length === 0 && <span className="text-sm font-semibold text-emerald-800/70">Your letters will appear here as you say them</span>}
      </div>
      {spellMiss && spellMiss.length > 0 && <p className="mt-1 text-xs font-semibold text-rose-700">You spelled: {spellMiss.join('').toUpperCase()}</p>}
      <div className="mt-4 flex flex-wrap justify-center gap-1.5">
        {([['definition', '📖 Definition'], ['sentence', '🗣️ Sentence'], ['pos', '🏷️ Part of speech'], ['origin', '🌍 Origin']] as const).map(([k, label]) => (
          <button key={k} type="button" onClick={() => askBee(k)} disabled={Boolean(spellMiss) || success}
            className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-emerald-900 shadow-sm ring-1 ring-emerald-200 transition hover:bg-emerald-50 disabled:opacity-50">{label}</button>
        ))}
      </div>
      {beeInfo.length > 0 && (
        <dl className="mt-3 w-full space-y-1.5 text-left text-sm">
          {beeInfo.map((b) => (
            <div key={b.label} className="rounded-xl bg-white/80 px-3 py-2 ring-1 ring-emerald-100">
              <dt className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">{b.label}</dt>
              <dd className="text-slate-800">{b.text}</dd>
            </div>
          ))}
        </dl>
      )}
      <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs font-bold">
        {!spellMiss && !success && spelled.length > 0 && <button type="button" className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700 hover:bg-slate-200" onClick={onStartOver}>↺ Start over</button>}
        {spellMiss && <button type="button" className="rounded-full bg-amber-100 px-3 py-1.5 text-amber-900 hover:bg-amber-200" onClick={misheard}>🎤 The mic misheard me, try again</button>}
      </div>
      {canType && (
        <form className="mt-3 w-full max-w-xs" onSubmit={(e) => { e.preventDefault(); if (typing) submitTyped(typing) }}>
          <label htmlFor="type-spelling" className="mb-1 block text-center text-xs font-bold text-emerald-800">⌨️ Or type it here</label>
          <div className="flex gap-2">
            <input ref={box} id="type-spelling" className="input flex-1 text-center font-kids text-xl uppercase tracking-widest" autoCapitalize="none" autoCorrect="off" spellCheck={false} autoComplete="off"
              enterKeyHint="done" placeholder="spell it" value={typing ?? ''}
              // Typing turns the microphone off so it doesn't hear the keyboard; 🎤 turns it back on.
              onFocus={() => { if (typing === null) onTypeInstead() }}
              onChange={(e) => setTyping(e.target.value.replace(/[^A-Za-z'-]/g, ''))} />
            <button className="btn-primary px-4" disabled={!typing}>Check</button>
          </div>
        </form>
      )}
    </div>
  )
}
