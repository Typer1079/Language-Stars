import { useEffect, useId, useRef, useState } from 'react'
import { levelOf } from '../../lib/progress'
import { type Subject } from '../../lib/subjects'
import type { Learner, Mode } from '../../lib/types'

/**
 * Reading, Spelling Bee and a Languages tile. The Languages tile shows the language being
 * practiced (or the one furthest along); tapping it opens a list of every language to choose from.
 */
export function SubjectSwitch({ learner, subjects, onSwitch, variant, label }: {
  learner: Learner
  subjects: readonly Subject[]
  onSwitch: (m: Mode) => void
  variant: 'tabs' | 'card'
  label: string
}) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const wrap = useRef<HTMLDivElement>(null)
  const others = subjects.filter((s) => !s.language)
  const langs = subjects.filter((s) => s.language)
  const current = langs.find((s) => s.id === learner.mode)
    ?? [...langs].sort((a, b) => levelOf(learner, b.id) - levelOf(learner, a.id))[0]
  const tabs = variant === 'tabs'
  const onLang = Boolean(current && learner.mode === current.id)

  // Close the list with Escape or a tap anywhere else.
  useEffect(() => {
    if (!open) return
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); setOpen(false) } }
    const click = (e: PointerEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('keydown', key, true)
    document.addEventListener('pointerdown', click)
    return () => { document.removeEventListener('keydown', key, true); document.removeEventListener('pointerdown', click) }
  }, [open])

  const choose = (m: Mode) => {
    setOpen(false)
    if (m !== learner.mode) onSwitch(m)
  }
  const tile = (on: boolean, activeClass: string) => tabs
    ? `flex items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 font-kids text-sm font-bold transition sm:text-base ${on ? activeClass : 'text-slate-600 hover:bg-slate-100'}`
    : `flex flex-col items-center rounded-xl px-1 py-1.5 text-[11px] font-bold leading-tight transition ${on ? 'bg-white text-slate-900 shadow' : 'text-slate-500 hover:bg-white/60'}`
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
    <div ref={wrap} className={tabs ? 'w-full max-w-2xl' : 'mt-3'}>
      <div role="group" aria-label={label}
        className={tabs ? 'grid grid-cols-3 gap-1.5 rounded-2xl border border-slate-200 bg-white/90 p-1.5 shadow-sm' : 'grid grid-cols-3 gap-1 rounded-2xl bg-slate-100 p-1'}>
        {others.map((s) => (
          <button key={s.id} type="button" aria-pressed={learner.mode === s.id} onClick={() => choose(s.id)} className={tile(learner.mode === s.id, s.activeClass)}>{body(s)}</button>
        ))}
        {current && (
          <button type="button" aria-expanded={open} aria-controls={panelId} aria-pressed={onLang}
            aria-label={`Languages: ${current.label}${onLang ? ' (practicing now)' : ''}. Choose a language`}
            onClick={() => setOpen((o) => !o)} className={tile(onLang || open, current.activeClass)}>
            {tabs ? (
              <>
                <span className="text-lg">{current.icon}</span>{current.shortLabel}
                <span className={`rounded-full px-1.5 text-[10px] ${onLang ? 'bg-white/25' : 'bg-slate-100'}`}>🌍 {open ? '▴' : '▾'}</span>
              </>
            ) : (
              <>
                <span className="text-base">{current.icon}</span>
                <span>{current.shortLabel} <span className="font-semibold opacity-70">L{levelOf(learner, current.id)}</span></span>
                <span className="mt-0.5 rounded-full bg-indigo-100 px-1.5 text-[9px] font-bold text-indigo-700">🌍 {langs.length > 1 ? `${langs.length} languages ${open ? '▴' : '▾'}` : 'Language'}</span>
              </>
            )}
          </button>
        )}
      </div>
      {open && (
        <div id={panelId} role="group" aria-label="Choose a language"
          className="mt-1.5 rounded-2xl border border-indigo-200 bg-white p-2 shadow-lg">
          <div className="mb-1.5 flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-700">🌍 Choose a language to practice</span>
            <button type="button" className="rounded-lg px-2 text-xs font-bold text-slate-500 hover:bg-slate-100" onClick={() => setOpen(false)} aria-label="Close the language list">✕</button>
          </div>
          <div className={`grid gap-1.5 ${tabs ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2'}`}>
            {langs.map((s) => {
              const on = learner.mode === s.id
              return (
                <button key={s.id} type="button" aria-pressed={on} onClick={() => choose(s.id)}
                  className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition ${on ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' : 'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/60'}`}>
                  <span className="text-xl" aria-hidden="true">{s.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-slate-900">{s.label}{on ? ' ✓' : ''}</span>
                    <span className="block text-[11px] font-semibold text-slate-500">Level {levelOf(learner, s.id)}{s.language?.beta ? ' · Beta' : ''}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
