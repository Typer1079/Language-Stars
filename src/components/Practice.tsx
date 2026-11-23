import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { PracticeEngine, type MicState, type Tone } from '../lib/practiceEngine'
import { MAX_LEVEL, stageName } from '../lib/curriculum'
import { activeLevel, endRound, newMilestone, pickRound, solveWord, type PracticeItem } from '../lib/progress'
import { playChime } from '../lib/sfx'
import { moveSticker } from '../lib/stickers'
import { recognitionSupported } from '../lib/speech'
import type { Learner } from '../lib/types'
import { PHONICS_SOUNDS } from '../lib/wordBanks'
import { makeConfetti, type ConfettiPiece } from '../lib/confetti'
import { Confetti, StickerCanvas, StickerShop } from './Stickers'

export type SaveStatus = 'saved' | 'saving' | 'offline' | 'error'

interface Props {
  learner: Learner
  onChange: (l: Learner) => void
  onExit: () => void
  saveStatus: SaveStatus
  /** Something happened (a word was read); counts as activity for the idle timer. */
  onActivity: () => void
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent)

export default function Practice({ learner, onChange, onExit, saveStatus, onActivity }: Props) {
  const [round, setRound] = useState<PracticeItem[]>([])
  const [index, setIndex] = useState(0)
  const [feedback, setFeedback] = useState<{ title: string; sub: string; tone: Tone }>({ title: 'Say the word out loud!', sub: `Press ${isMac ? 'Return' : 'Enter'} or tap Listen Now`, tone: 'neutral' })
  const [mic, setMic] = useState<{ state: MicState; label: string }>({ state: 'idle', label: 'Listen Now' })
  const [revealed, setRevealed] = useState(false)
  const [phraseShown, setPhraseShown] = useState(false)
  const [success, setSuccess] = useState(false)
  const [shop, setShop] = useState<string | null>(null)
  const [roundDone, setRoundDone] = useState(false)
  const [logOpen, setLogOpen] = useState(false)
  const [logLines, setLogLines] = useState<string[]>([])
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([])
  const [roundNote, setRoundNote] = useState<{ clean: number; attempts: number; movedDownTo: number | null } | null>(null)
  // This round's results: words said without help vs. all words tried (skips and give-ups count as tried).
  const cleanRef = useRef(0)
  const attemptsRef = useRef(0)
  const levelUpPending = useRef(false)

  const learnerRef = useRef(learner)
  const roundRef = useRef<PracticeItem[]>([])
  const indexRef = useRef(0)
  const shopRef = useRef<string | null>(null)
  useLayoutEffect(() => {
    learnerRef.current = learner
    shopRef.current = shop
  })
  const solvedRef = useRef(false)
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const engineRef = useRef<PracticeEngine | null>(null)

  const log = useCallback((tag: string, detail = '') => {
    const ts = new Date().toISOString().split('T')[1].slice(0, 11)
    setLogLines((lines) => [...lines.slice(-249), `[${ts}] ${tag}${detail ? ' — ' + detail : ''}`])
  }, [])

  const item = round[index]
  const spanish = learner.mode === 'spanish'
  const level = activeLevel(learner)

  // ---- word flow ----------------------------------------------------------------------------

  const loadWord = useCallback((i: number, opts: { autoBegin: boolean; promptType?: 'quick_listen' | 'gentle_callout' }) => {
    const items = roundRef.current
    const it = items[i]
    if (!it) return
    clearTimeout(advanceTimer.current)
    indexRef.current = i
    solvedRef.current = false
    setIndex(i)
    setRevealed(false)
    setPhraseShown(false)
    setSuccess(false)
    const l = learnerRef.current
    const engine = engineRef.current!
    engine.load(it, l.mode, l.display_name)
    if (opts.autoBegin) {
      engine.setPaused(false)
      engine.begin(opts.promptType ?? 'quick_listen')
    }
    else if (l.mode === 'spanish' && it.spanish) setFeedback({ title: `Say "${it.spanish.en}" in Spanish!`, sub: 'Shift reveals the word • Space for the AI Coach • Return to listen', tone: 'neutral' })
    else setFeedback({ title: 'Say the word out loud!', sub: `Press ${isMac ? 'Return' : 'Enter'} or tap Listen Now`, tone: 'neutral' })
  }, [])

  const startRound = useCallback((opts: { autoBegin: boolean; welcome?: boolean }) => {
    setRoundDone(false)
    setRoundNote(null)
    cleanRef.current = 0
    attemptsRef.current = 0
    levelUpPending.current = false
    const items = pickRound(learnerRef.current)
    roundRef.current = items
    setRound(items)
    loadWord(0, { autoBegin: opts.autoBegin })
    if (opts.welcome) {
      engineRef.current?.setPaused(false)
      engineRef.current?.welcome()
    }
  }, [loadWord])

  const finishRound = useCallback(() => {
    engineRef.current?.stopAll()
    setRoundDone(true)
    const r = endRound(learnerRef.current, cleanRef.current, attemptsRef.current)
    if (r.movedDownTo) {
      learnerRef.current = r.learner
      onChange(r.learner)
      log('MOVED_DOWN', `to L${r.movedDownTo} clean=${cleanRef.current}/${attemptsRef.current}`)
    }
    setRoundNote({ clean: cleanRef.current, attempts: attemptsRef.current, movedDownTo: r.movedDownTo })
    const l = learnerRef.current
    if (l.spendable_stars > 0) setShop(`🎉 Round complete! Spend your ${l.spendable_stars} ⭐ or tap Keep Reading.`)
  }, [log, onChange])

  const advance = useCallback((afterCoach: boolean) => {
    if (shopRef.current) return
    // Just moved up a level: start a fresh round of the new level's words.
    if (levelUpPending.current) {
      startRound({ autoBegin: true })
      return
    }
    const next = indexRef.current + 1
    if (next < roundRef.current.length) loadWord(next, { autoBegin: true, promptType: afterCoach ? 'gentle_callout' : 'quick_listen' })
    else finishRound()
  }, [loadWord, finishRound, startRound])

  const handleSolved = useCallback((heard: string, coached: boolean) => {
    const it = roundRef.current[indexRef.current]
    if (!it || solvedRef.current) return
    solvedRef.current = true
    onActivity()
    const before = learnerRef.current
    const r = solveWord(before, it, coached)
    attemptsRef.current += 1
    if (!coached) cleanRef.current += 1
    if (r.leveledUpTo) levelUpPending.current = true
    learnerRef.current = r.learner
    onChange(r.learner)
    playChime()
    setConfetti(makeConfetti(coached ? 14 : 22))
    setSuccess(true)
    const shown = before.mode === 'spanish' && it.spanish ? `${it.spanish.en} → ${it.spanish.es}` : it.target
    const bonus = r.leveledUpTo ? ` • Level up to ${r.leveledUpTo}!${r.bonus ? ` +${r.bonus} bonus ⭐` : ''}` : ''
    setFeedback({ title: `⭐ ${shown}!`, sub: `Heard "${heard}"${bonus}`, tone: 'success' })
    log('SOLVED', `word="${shown}" coached=${coached} bonus=${r.bonus}`)

    const m = newMilestone(before.lifetime_stars, r.learner.lifetime_stars)
    if (m) {
      setShop(`🎉 Milestone! You reached ${m} lifetime ${m === 1 ? 'star' : 'stars'}! Pick a sticker!`)
      return
    }
    if (coached) engineRef.current?.praiseThen(() => { if (!shopRef.current) advanceTimer.current = setTimeout(() => advance(true), 250) })
    else advanceTimer.current = setTimeout(() => advance(false), 550)
  }, [advance, log, onActivity, onChange])

  // Latest callbacks for the engine (created once).
  const solvedCb = useRef(handleSolved)
  const advanceCb = useRef(advance)
  useLayoutEffect(() => {
    solvedCb.current = handleSolved
    advanceCb.current = advance
  })

  useEffect(() => {
    const engine = new PracticeEngine({
      feedback: (title, sub, tone) => setFeedback({ title, sub, tone }),
      mic: (state, label) => setMic({ state, label: label ?? (state === 'listening' ? 'Listening...' : 'Listen Now') }),
      solved: (heard, coached) => solvedCb.current(heard, coached),
      advance: (afterCoach) => {
        // The coach gave up on this word: it counts as tried, not said.
        attemptsRef.current += 1
        advanceCb.current(afterCoach)
      },
      revealSpanish: () => setRevealed(true),
      showPhrase: () => setPhraseShown(true),
      log,
    })
    engineRef.current = engine
    // Starts the speech engine (an external system) and the first round for this reader.
    // eslint-disable-next-line react/set-state-in-effect
    startRound({ autoBegin: false, welcome: true })
    return () => {
      clearTimeout(advanceTimer.current)
      engine.dispose()
      engineRef.current = null
    }
    // Start once per reader.
  }, [learner.id, log, startRound])

  // ---- controls ------------------------------------------------------------------------------

  const anyModal = Boolean(shop) || roundDone || logOpen

  const closeShop = useCallback(() => {
    setShop(null)
    shopRef.current = null
    if (roundDone) return
    if (solvedRef.current) advance(false)
    else engineRef.current?.resume()
  }, [advance, roundDone])

  const openShop = (reason: string) => {
    engineRef.current?.setPaused(true)
    setShop(reason)
  }

  useEffect(() => {
    engineRef.current?.setPaused(anyModal)
  }, [anyModal])

  const skip = () => {
    if (anyModal) return
    if (!solvedRef.current) attemptsRef.current += 1
    engineRef.current?.stopAll()
    advance(false)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA')) return
      if (e.key === 'Shift') {
        if (learnerRef.current.mode === 'spanish' && !anyModal) setRevealed(true)
        return
      }
      if (anyModal) return
      if (e.code === 'Space') {
        e.preventDefault()
        engineRef.current?.coach()
      } else if (e.key === 'Enter') {
        e.preventDefault()
        engineRef.current?.listenNow()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [anyModal])

  // ---- view ----------------------------------------------------------------------------------

  const toneClass: Record<Tone, string> = {
    neutral: 'bg-slate-100 border-slate-200 text-slate-800',
    listening: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    success: 'bg-amber-50 border-amber-300 text-amber-900',
    coach: 'bg-indigo-50 border-indigo-200 text-indigo-900',
  }
  const saveLabel = { saved: '✓ Saved', saving: 'Saving…', offline: 'Offline – will retry', error: 'Not saved' }[saveStatus]

  return (
    <div className="flex min-h-dvh flex-col">
      <StickerCanvas stickers={learner.stickers} onMove={(id, x, y) => onChange(moveSticker(learnerRef.current, id, x, y))} />
      <Confetti pieces={confetti} />

      <header className="relative z-30 mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-2 px-3 pt-3 pb-2 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-2xl shadow-md">⭐</div>
          <div>
            <h1 className="font-kids text-xl font-bold leading-tight sm:text-2xl">Read Aloud Stars</h1>
            <div className="flex flex-wrap items-center gap-1.5">
              <button type="button" onClick={onExit} title="Switch reader"
                className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100">
                {spanish ? '🇪🇸' : learner.sticker_style === 'girl' ? '👧' : '👦'} Reader: {learner.display_name}
              </button>
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800"
                title="Change Reading or Spanish with ✏️ Edit (Switch reader → ✏️ Edit)">
                {spanish ? '🇪🇸 Spanish' : '📖 Reading'}
              </span>
              <span className={`text-[11px] font-semibold ${saveStatus === 'saved' ? 'text-emerald-700' : saveStatus === 'saving' ? 'text-slate-500' : 'text-rose-700'}`}>{saveLabel}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1.5 rounded-2xl border-2 border-amber-300 bg-white/95 px-3 py-1.5 shadow-sm">
            <span className="text-lg">🌟</span>
            <div className="leading-none">
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Lifetime</div>
              <div className="font-kids text-base font-bold sm:text-lg">{learner.lifetime_stars}</div>
            </div>
          </div>
          <button type="button" onClick={() => openShop('Pick a sticker for your screen!')}
            className="flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-purple-600 px-3 py-1.5 font-kids text-xs font-bold text-white shadow-md hover:from-fuchsia-600 hover:to-purple-700 sm:text-sm">
            🏪 Stickers <span className="rounded-full bg-white/25 px-1.5 py-0.5 text-xs">{learner.spendable_stars} ⭐</span>
          </button>
          <button type="button" className="chip" onClick={onExit}>🚪 Switch reader</button>
          <button type="button" className="chip" onClick={() => setLogOpen(true)}>📊 Log</button>
          <button type="button" className="chip" title="Full screen" onClick={() => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()).catch(() => {})}>⛶</button>
        </div>
      </header>

      <main className="relative z-20 mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-4 px-3 py-3 sm:px-6">
        {!recognitionSupported() && (
          <p className="w-full max-w-2xl rounded-2xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900">
            This browser can’t listen to speech. Use Chrome, Edge or Safari for the microphone. The AI Coach and Skip still work.
          </p>
        )}
        <div className="flex w-full max-w-2xl flex-col gap-2 rounded-2xl border border-indigo-100 bg-white/90 p-3 shadow-sm backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2" title="Master every word in a level to move up">
              <span className="rounded-xl bg-indigo-600 px-3 py-1 font-kids text-sm font-bold text-white shadow-sm">Level {level} <span className="font-sans text-xs font-semibold opacity-80">of {MAX_LEVEL}</span></span>
              <span className="rounded-xl bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-900">{stageName(level, learner.mode)}</span>
            </div>
            <span className="text-xs font-bold text-indigo-700">Word {Math.min(index + 1, round.length || 1)} of {round.length || 10}</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-indigo-100" aria-label="This round">
            <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-400 transition-all duration-300"
              style={{ width: `${Math.round(((index + 1) / (round.length || 10)) * 100)}%` }} />
          </div>
          <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
            <span>Road to {MAX_LEVEL}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-amber-400" style={{ width: `${level}%` }} />
            </div>
            <span>{level}%</span>
          </div>
        </div>

        <section className={`relative flex w-full max-w-2xl flex-col items-center justify-center rounded-3xl border-4 bg-white/95 p-6 text-center shadow-xl backdrop-blur-md transition-all duration-300 sm:p-8 ${success ? 'border-emerald-400' : 'border-indigo-100'}`}>
          {item && !spanish && !item.target.includes(' ') && (
            <div key={`${learner.id}-${index}-${item.key}`} className="my-3 flex min-h-[120px] flex-wrap items-center justify-center gap-3 sm:min-h-[145px] sm:gap-4">
              {item.target.split('').map((ch, i) => (
                <div key={i} className="animate-tile-pop flex flex-col items-center" style={{ animationDelay: `${i * 45}ms` }}>
                  <div className="flex h-20 w-16 items-center justify-center rounded-2xl border-2 border-indigo-200 bg-gradient-to-b from-indigo-50 to-white font-kids text-4xl font-bold text-indigo-900 shadow-sm sm:h-24 sm:w-20 sm:text-5xl">{ch}</div>
                  <span className="mt-1.5 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900">{PHONICS_SOUNDS[ch.toLowerCase()] ?? ''}</span>
                </div>
              ))}
            </div>
          )}

          {item && !spanish && item.target.includes(' ') && (
            <div key={`${learner.id}-${index}-${item.key}`} className="my-3 flex min-h-[120px] flex-wrap items-center justify-center gap-2 sm:min-h-[145px] sm:gap-3" aria-label={item.target}>
              {item.target.split(' ').map((w, i, all) => (
                <span key={i} className={`animate-tile-pop rounded-2xl border-2 border-indigo-200 bg-gradient-to-b from-indigo-50 to-white px-3 py-2 font-kids font-bold text-indigo-900 shadow-sm ${all.length <= 4 ? 'text-4xl sm:text-5xl' : all.length <= 8 ? 'text-2xl sm:text-4xl' : 'text-xl sm:text-3xl'}`}
                  style={{ animationDelay: `${i * 45}ms` }}>
                  {w}
                </span>
              ))}
            </div>
          )}

          {item?.spanish && spanish && (
            <div className="my-3 flex w-full max-w-lg flex-col items-center justify-center rounded-3xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 via-sky-50 to-amber-50 p-5">
              <span className="mb-1 text-xs font-bold uppercase tracking-widest text-indigo-500">Say this English word in Spanish</span>
              <div className={`font-kids font-bold tracking-tight ${item.spanish.en.length <= 14 ? 'text-4xl sm:text-6xl' : item.spanish.en.length <= 30 ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'}`}>{item.spanish.en}</div>
              <div className="mt-2.5 flex w-full flex-col items-center gap-2 text-xs sm:text-sm">
                <span className="rounded-full border border-indigo-200 bg-white px-3 py-1 font-semibold text-indigo-700">
                  {revealed ? `Spanish: "${item.spanish.es}"${item.spanish.phonetic ? ` (${item.spanish.phonetic})` : ''}` : 'Press Shift (or tap Reveal) to see the Spanish'}
                </span>
                {!revealed && <button type="button" className="text-xs text-indigo-600 underline" onClick={() => setRevealed(true)}>Reveal</button>}
                {phraseShown && item.spanish.phraseEs && (
                  <div className="w-full max-w-md rounded-2xl border border-amber-300 bg-amber-50/90 px-3.5 py-2 text-center text-amber-950">
                    <div className="text-sm font-bold sm:text-base">💬 “{item.spanish.phraseEs}”</div>
                    <div className="mt-0.5 text-[11px] text-amber-800">({item.spanish.phraseEn})</div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div role="status" aria-live="polite" className={`mt-2 mb-5 w-full max-w-lg rounded-2xl border px-4 py-3 transition-colors ${toneClass[feedback.tone]}`}>
            <div className="font-kids text-lg font-bold sm:text-xl">{feedback.title}</div>
            <div className="mt-0.5 text-xs opacity-80 sm:text-sm">{feedback.sub}</div>
          </div>

          <div className="flex w-full flex-wrap items-center justify-center gap-3">
            <button type="button" onClick={() => engineRef.current?.listenNow()}
              className={`flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3.5 font-kids text-base font-bold text-white shadow-lg transition hover:from-emerald-600 hover:to-teal-700 active:scale-95 sm:text-lg ${mic.state === 'listening' ? 'animate-pulse-ring' : ''}`}>
              <span className={`h-3 w-3 rounded-full ${mic.state === 'listening' ? 'animate-ping bg-emerald-200' : mic.state === 'warming' ? 'bg-amber-200' : 'bg-white/90'}`} />
              <span>{mic.label}</span>
              <span className="rounded-full bg-black/15 px-2 py-0.5 font-sans text-xs">{isMac ? 'Return' : 'Enter'}</span>
            </button>
            <button type="button" onClick={() => engineRef.current?.coach()}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-600 px-5 py-3.5 font-kids text-base font-bold text-white shadow-md transition hover:from-indigo-600 hover:to-blue-700 active:scale-95 sm:text-lg">
              🎧 AI Coach <span className="rounded-full bg-black/15 px-2 py-0.5 font-sans text-xs">Space</span>
            </button>
            <button type="button" onClick={skip} className="rounded-2xl bg-slate-100 px-4 py-3.5 text-sm font-bold text-slate-700 transition hover:bg-slate-200">Skip ➡️</button>
          </div>
        </section>
      </main>

      {roundDone && !shop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-3xl border-4 border-amber-200 bg-white/95 p-6 text-center shadow-2xl">
            <div className="mb-2 text-5xl">🏆</div>
            <h2 className="font-kids text-2xl font-bold">Round Complete!</h2>
            {roundNote && roundNote.attempts > 0 && (
              <p className="mt-2 text-sm font-semibold text-slate-700">
                {roundNote.clean} of {roundNote.attempts} {spanish ? 'said' : 'read'} without help
              </p>
            )}
            {roundNote?.movedDownTo && (
              <p className="mt-2 rounded-2xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900">
                That level was tricky today, so let’s practice Level {roundNote.movedDownTo} again. Master it to climb back up! Your stars and stickers are safe.
              </p>
            )}
            <p className="mt-2 mb-5 text-sm text-slate-600">
              {learner.display_name} finished the round! Lifetime stars: {learner.lifetime_stars} ⭐ • Balance: {learner.spendable_stars} ⭐ • {spanish ? 'Spanish' : 'Reading'} level: {level}.
            </p>
            <div className="flex flex-col gap-2.5">
              <button type="button" className="btn bg-gradient-to-r from-fuchsia-500 to-purple-600 font-kids text-base text-white" onClick={() => setShop(`Spend your ${learner.spendable_stars} ⭐ in the Sticker Shop!`)}>🏪 Spend stars in the Sticker Shop</button>
              <button type="button" className="btn bg-gradient-to-r from-emerald-500 to-teal-600 font-kids text-base text-white" onClick={() => startRound({ autoBegin: true })}>Next Round ➡️</button>
              <button type="button" className="btn-danger" onClick={onExit}>🚪 Switch reader</button>
            </div>
          </div>
        </div>
      )}

      {shop && <StickerShop learner={learner} reason={shop} onChange={(l) => { learnerRef.current = l; onChange(l) }} onClose={closeShop} onSignOut={onExit} />}

      {logOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true"
          onClick={(e) => { if (e.target === e.currentTarget) setLogOpen(false) }}>
          <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-kids text-lg font-bold">📊 Speech & session log</h3>
              <div className="flex gap-2">
                <button type="button" className="rounded-xl bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700" onClick={() => navigator.clipboard?.writeText(logLines.join('\n')).catch(() => {})}>Copy</button>
                <button type="button" className="rounded-xl bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700" onClick={() => setLogOpen(false)}>Close</button>
              </div>
            </div>
            <pre className="h-64 w-full overflow-y-auto whitespace-pre-wrap rounded-2xl bg-slate-900 p-3 font-mono text-xs text-emerald-300">{logLines.join('\n') || 'Nothing yet.'}</pre>
            <p className="mt-2 text-[11px] text-slate-500">This log stays on this device and clears when you leave the page.</p>
          </div>
        </div>
      )}
    </div>
  )
}
