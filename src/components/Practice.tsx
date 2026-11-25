import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { PracticeEngine, type MicState, type Pace, type Tone } from '../lib/practiceEngine'
import { MAX_LEVEL, stageName } from '../lib/curriculum'
import { activeLevel, levelOf, bestLevel, CHALLENGE_JUMP, CHALLENGE_PASS, CHALLENGE_SIZE, endRound, newMilestone, pickChallenge, pickRound, ROUND_SIZE, solveWord, STRETCH_STEPS, type PracticeItem } from '../lib/progress'
import { playChime } from '../lib/sfx'
import { moveSticker } from '../lib/stickers'
import { recognitionSupported, speakSegments } from '../lib/speech'
import { COMPREHENSION_FROM, questionFor, type Question } from '../lib/comprehension'
import { ADVANCED_FROM } from '../lib/readingAdvanced'
import { MODES, type Learner, type Mode } from '../lib/types'
import { wordHelp } from '../lib/phonics'
import { makeConfetti, type ConfettiPiece } from '../lib/confetti'
import { Confetti, StickerBoard, StickerCanvas, StickerShop } from './Stickers'
import { useWideScreen } from '../lib/useWideScreen'
import { ProgressView } from './Progress'
import { HelpGuide } from './HelpGuide'
import { MicHelp } from './MicHelp'
import { micBlocked } from '../lib/mic'
import { gradeFor } from '../lib/levelGuide'
import { setThemeChoice } from '../lib/theme'
import { logRound } from '../lib/learnersApi'
import { avatarFor } from '../lib/avatars'
import { reportProblem, type ProblemKind } from '../lib/problems'

export type SaveStatus = 'saved' | 'saving' | 'offline' | 'error'

interface Props {
  learner: Learner
  onChange: (l: Learner) => void
  onExit: () => void
  saveStatus: SaveStatus
  /** Something happened (a word was read); counts as activity for the idle timer. */
  onActivity: () => void
  /** On a learner's own linked device: no switching learners. */
  deviceMode?: boolean
}

/**
 * Coaching pace: adults and experienced or confident readers get the brisk coach (no chatter,
 * faster voice, quick hand-back to the mic). Young or new readers get the guided coach.
 * A strong last round (8+ of 10 without help) switches to brisk; a rough one switches back.
 */
function paceFor(l: Learner, lastRound: { clean: number; attempts: number } | null): Pace {
  if (l.age_group === 'adult') return 'brisk'
  if (lastRound && lastRound.attempts >= 5) return lastRound.clean / lastRound.attempts >= 0.8 ? 'brisk' : 'guided'
  if (bestLevel(l) >= 10 || l.lifetime_stars >= 150) return 'brisk'
  return 'guided'
}

const MODE_STYLE: Record<Mode, { icon: string; label: string; on: string }> = {
  reading: { icon: '📖', label: 'Reading', on: 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow' },
  spanish: { icon: '🇪🇸', label: 'Spanish', on: 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow' },
  spelling: { icon: '🐝', label: 'Spelling', on: 'bg-gradient-to-r from-emerald-500 to-lime-500 text-white shadow' },
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent)

export default function Practice({ learner, onChange, onExit, saveStatus, onActivity, deviceMode = false }: Props) {
  const [round, setRound] = useState<PracticeItem[]>([])
  const [index, setIndex] = useState(0)
  const [feedback, setFeedback] = useState<{ title: string; sub: string; tone: Tone }>({ title: 'Say the word out loud!', sub: `Press ${isMac ? 'Return' : 'Enter'} or tap Listen Now`, tone: 'neutral' })
  const [mic, setMic] = useState<{ state: MicState; label: string }>({ state: 'idle', label: 'Listen Now' })
  const [revealed, setRevealed] = useState(false)
  const [phraseShown, setPhraseShown] = useState(false)
  const [success, setSuccess] = useState(false)
  const [shop, setShop] = useState<string | null>(null)
  const wide = useWideScreen()
  const [roundDone, setRoundDone] = useState(false)
  const [logOpen, setLogOpen] = useState(false)
  const [progressOpen, setProgressOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [micHelp, setMicHelp] = useState<'blocked' | 'dictation' | null>(null)
  // Spelling bee: letters heard so far, a wrong spelling to show, help Iris gave, and typing.
  const [spelled, setSpelled] = useState<string[]>([])
  const [spellMiss, setSpellMiss] = useState<string[] | null>(null)
  const [beeInfo, setBeeInfo] = useState<{ label: string; text: string }[]>([])
  const [typing, setTyping] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [logLines, setLogLines] = useState<string[]>([])
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([])
  const [roundNote, setRoundNote] = useState<{ clean: number; attempts: number; movedDownTo: number | null; note?: string } | null>(null)
  const [challenge, setChallenge] = useState<number | null>(null)
  // Reading comprehension: a multiple-choice question after reading a phrase or sentence (Level 31+).
  const [quiz, setQuiz] = useState<{ q: Question; picked: number | null } | null>(null)
  // Stretch (higher-level) items said without help this round, by level.
  const stretchClearedRef = useRef<number[]>([])
  const challengeRef = useRef<number | null>(null)
  // This round's results: words said without help vs. all words tried (skips and give-ups count as tried).
  const cleanRef = useRef(0)
  const attemptsRef = useRef(0)
  const levelUpPending = useRef(false)
  const lastRoundRef = useRef<{ clean: number; attempts: number } | null>(null)
  // Stars earned since the last Round Complete screen; brisk readers only stop every 10.
  const starsSinceStop = useRef(0)
  const paceRef = useRef<Pace>(paceFor(learner, null))

  const learnerRef = useRef(learner)
  const roundRef = useRef<PracticeItem[]>([])
  const indexRef = useRef(0)
  const shopRef = useRef<string | null>(null)
  useLayoutEffect(() => {
    learnerRef.current = learner
    shopRef.current = shop
  })
  const solvedRef = useRef(false)
  // This round's record for the progress graphs (counts and time only).
  const roundLog = useRef({ start: 0, level: 1, mode: learner.mode, items: 0, clean: 0, coached: 0, skipped: 0, stars0: learner.lifetime_stars, questions: 0, questionsRight: 0 })
  const beginLog = useCallback(() => {
    const l = learnerRef.current
    roundLog.current = { start: Date.now(), level: activeLevel(l), mode: l.mode, items: 0, clean: 0, coached: 0, skipped: 0, stars0: l.lifetime_stars, questions: 0, questionsRight: 0 }
  }, [])
  const flushLog = useCallback(() => {
    const r = roundLog.current
    const l = learnerRef.current
    if (r.items > 0 || r.questions > 0) {
      void logRound({
        learner_id: l.id, mode: r.mode, level: r.level,
        level_after: levelOf(l, r.mode),
        items: r.items, clean: r.clean, coached: r.coached, skipped: r.skipped,
        stars: Math.max(0, l.lifetime_stars - r.stars0),
        questions: r.questions, questions_right: r.questionsRight,
        // Counted time per round is capped, so a reader who walks away doesn't inflate it.
        seconds: Math.min(Math.round((Date.now() - r.start) / 1000), 20 * 60),
      }).catch(() => { /* graphs are best effort; practice never waits on them */ })
    }
    r.items = r.clean = r.coached = r.skipped = r.questions = r.questionsRight = 0
  }, [])
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const engineRef = useRef<PracticeEngine | null>(null)

  // Problem reports: the log lines for the current item go along with a report, so the admin can
  // see what the microphone heard. See src/lib/problems.ts.
  const logBuf = useRef<string[]>([])
  const logTotal = useRef(0)
  const itemMark = useRef(0)
  const itemSecs = useRef(0)
  const stuckSent = useRef(false)
  const micSent = useRef(false)
  const problemRef = useRef<(kind: ProblemKind, detail?: string) => void>(() => {})
  /** What the microphone heard for the current item (from the HEARD log lines). */
  const itemHeard = () => {
    const n = Math.max(0, logTotal.current - itemMark.current)
    const out: string[] = []
    for (const line of logBuf.current.slice(-Math.min(n, 300))) {
      const m = /\] HEARD — (.*?) target=/.exec(line)
      if (m) out.push(...[...m[1].matchAll(/"([^"]*)"/g)].map((x) => x[1].trim()).filter(Boolean))
    }
    return [...new Set(out)].slice(-12)
  }

  const log = useCallback((tag: string, detail = '') => {
    const ts = new Date().toISOString().split('T')[1].slice(0, 11)
    const line = `[${ts}] ${tag}${detail ? ' — ' + detail : ''}`
    logBuf.current = [...logBuf.current.slice(-299), line]
    logTotal.current += 1
    setLogLines((lines) => [...lines.slice(-249), line])
    // Microphone trouble worth a report (once per screen visit).
    const micTrouble = tag === 'MIC_START_FAILED' || tag === 'MIC_UNSUPPORTED' || (tag === 'MIC_NO_START' && detail !== 'attempt=1') ||
      (tag === 'MIC_ERR' && /not-allowed|service-not-allowed|audio-capture|network/.test(detail))
    if (micTrouble && !micSent.current) {
      micSent.current = true
      problemRef.current('mic', `${tag}${detail ? ` ${detail}` : ''}`)
    }
  }, [])

  const item = round[index]
  const spanish = learner.mode === 'spanish'
  const spellingMode = learner.mode === 'spelling'
  const reading = learner.mode === 'reading'
  const level = activeLevel(learner)

  // ---- word flow ----------------------------------------------------------------------------

  const loadWord = useCallback((i: number, opts: { autoBegin: boolean; promptType?: 'quick_listen' | 'gentle_callout' }) => {
    const items = roundRef.current
    const it = items[i]
    if (!it) return
    clearTimeout(advanceTimer.current)
    indexRef.current = i
    solvedRef.current = false
    itemMark.current = logTotal.current
    itemSecs.current = 0
    stuckSent.current = false
    setIndex(i)
    setRevealed(false)
    setPhraseShown(false)
    setSuccess(false)
    setSpelled([])
    setSpellMiss(null)
    setBeeInfo([])
    setTyping(null)
    const l = learnerRef.current
    const engine = engineRef.current!
    engine.load(it, l.mode, l.display_name, paceRef.current)
    if (opts.autoBegin) {
      engine.setPaused(false)
      engine.begin(opts.promptType ?? 'quick_listen')
    }
    else if (l.mode === 'spelling') setFeedback({ title: 'Spell the word out loud!', sub: 'Tap 🎤 Listen to hear your word', tone: 'neutral' })
    else if (l.mode === 'spanish' && it.spanish) setFeedback({ title: `Say "${it.spanish.en}" in Spanish!`, sub: 'Shift shows the word • Space asks Iris • Return to listen', tone: 'neutral' })
    else setFeedback({ title: 'Say the word out loud!', sub: `Press ${isMac ? 'Return' : 'Enter'} or tap Listen Now`, tone: 'neutral' })
  }, [])

  const startRound = useCallback((opts: { autoBegin: boolean; welcome?: boolean; challengeLevel?: number | null }) => {
    paceRef.current = paceFor(learnerRef.current, lastRoundRef.current)
    flushLog()
    beginLog()
    setRoundDone(false)
    setRoundNote(null)
    cleanRef.current = 0
    attemptsRef.current = 0
    stretchClearedRef.current = []
    levelUpPending.current = false
    challengeRef.current = opts.challengeLevel ?? null
    setChallenge(challengeRef.current)
    const items = challengeRef.current ? pickChallenge(learnerRef.current, challengeRef.current) : pickRound(learnerRef.current)
    roundRef.current = items
    setRound(items)
    loadWord(0, { autoBegin: opts.autoBegin })
    if (opts.welcome) {
      engineRef.current?.setPaused(false)
      engineRef.current?.welcome()
    }
  }, [loadWord, flushLog, beginLog])

  /** Perfect round: say so, then start a short challenge a few levels up. */
  const startChallenge = useCallback((target: number, headline: string) => {
    setConfetti(makeConfetti(26))
    setFeedback({ title: headline, sub: `Challenge: ${CHALLENGE_SIZE} items from Level ${target}. Get ${CHALLENGE_PASS} to jump ahead!`, tone: 'success' })
    log('CHALLENGE', `to L${target}`)
    advanceTimer.current = setTimeout(() => startRound({ autoBegin: true, challengeLevel: target }), 1800)
  }, [log, startRound])

  const finishRound = useCallback(() => {
    engineRef.current?.stopAll()
    const clean = cleanRef.current
    const attempts = attemptsRef.current
    const wasChallenge = challengeRef.current
    const r = endRound(learnerRef.current, clean, attempts, { challengeLevel: wasChallenge, stretchCleared: stretchClearedRef.current })
    lastRoundRef.current = { clean, attempts }
    if (r.learner !== learnerRef.current) {
      learnerRef.current = r.learner
      onChange(r.learner)
      starsSinceStop.current += r.bonus ?? 0
    }
    flushLog()
    if (r.challengeAt) {
      startChallenge(r.challengeAt, `Perfect round! Up to Level ${r.movedUpTo}${r.bonus ? ` +${r.bonus} ⭐` : ''}`)
      return
    }
    let note = ''
    if (r.jumped) {
      setConfetti(makeConfetti(30))
      note = `Those harder ones were easy! Jumped to Level ${r.movedUpTo}${r.bonus ? ` +${r.bonus} ⭐` : ''}`
      log('JUMPED', `to L${r.movedUpTo} stretch=${stretchClearedRef.current.join(',')}`)
    } else if (r.challenge === 'passed') {
      setConfetti(makeConfetti(30))
      note = `Challenge passed! Jumped to Level ${r.movedUpTo}${r.bonus ? ` +${r.bonus} ⭐` : ''}`
    } else if (r.challenge === 'missed') {
      note = `Good try! ${clean} of ${attempts}. Keep going at Level ${activeLevel(learnerRef.current)}.`
    }
    if (r.movedDownTo) log('MOVED_DOWN', `to L${r.movedDownTo} clean=${clean}/${attempts}`)
    // Readers flying through: roll straight into the next round until 10 new stars are earned.
    if (paceRef.current === 'brisk' && !r.movedDownTo && starsSinceStop.current < 10) {
      setFeedback({ title: note || `Round done: ${clean} of ${attempts} ⭐`, sub: 'Next round starting…', tone: 'success' })
      log('ROUND_CONTINUE', `clean=${clean}/${attempts} starsSinceStop=${starsSinceStop.current}`)
      advanceTimer.current = setTimeout(() => startRound({ autoBegin: true }), note ? 1800 : 900)
      return
    }
    starsSinceStop.current = 0
    setRoundDone(true)
    setRoundNote({ clean, attempts, movedDownTo: r.movedDownTo, note })
    const l = learnerRef.current
    if (l.spendable_stars > 0) setShop(`🎉 Round complete! Spend your ${l.spendable_stars} ⭐ or tap Keep Reading.`)
  }, [log, onChange, startRound, startChallenge, flushLog])

  const advance = useCallback((afterCoach: boolean) => {
    if (shopRef.current) return
    // Just moved up a level by mastering it.
    if (levelUpPending.current) {
      const perfect = attemptsRef.current >= ROUND_SIZE - STRETCH_STEPS.length && cleanRef.current === attemptsRef.current
      const now = activeLevel(learnerRef.current)
      const target = Math.min(now - 1 + CHALLENGE_JUMP, MAX_LEVEL)
      lastRoundRef.current = { clean: cleanRef.current, attempts: attemptsRef.current }
      if (perfect && target > now) startChallenge(target, `Perfect round! Up to Level ${now}`)
      else startRound({ autoBegin: true })
      return
    }
    const next = indexRef.current + 1
    if (next < roundRef.current.length) loadWord(next, { autoBegin: true, promptType: afterCoach ? 'gentle_callout' : 'quick_listen' })
    else finishRound()
  }, [loadWord, finishRound, startRound, startChallenge])

  const handleSolved = useCallback((heard: string, coached: boolean) => {
    const it = roundRef.current[indexRef.current]
    if (!it || solvedRef.current) return
    solvedRef.current = true
    onActivity()
    const before = learnerRef.current
    const r = solveWord(before, it, coached, { challenge: Boolean(challengeRef.current) })
    roundLog.current.items += 1
    if (coached) roundLog.current.coached += 1
    else roundLog.current.clean += 1
    // Stretch items don't count for or against this level's round score.
    if (it.stretchLevel) {
      if (!coached) stretchClearedRef.current.push(it.stretchLevel)
    } else {
      attemptsRef.current += 1
      if (!coached) cleanRef.current += 1
    }
    starsSinceStop.current += r.learner.lifetime_stars - before.lifetime_stars
    if (r.leveledUpTo) levelUpPending.current = true
    learnerRef.current = r.learner
    onChange(r.learner)
    playChime()
    setConfetti(makeConfetti(coached ? 14 : 22))
    setSuccess(true)
    const shown = before.mode === 'spanish' && it.spanish ? `${it.spanish.en} → ${it.spanish.es}` : before.mode === 'spelling' ? it.target.toUpperCase().split('').join('-') : it.target
    const bonus = r.leveledUpTo ? ` • Level up to ${r.leveledUpTo}!${r.bonus ? ` +${r.bonus} bonus ⭐` : ''}` : ''
    setFeedback({ title: `⭐ ${shown}!`, sub: `Heard "${heard}"${bonus}`, tone: 'success' })
    log('SOLVED', `word="${shown}" coached=${coached} bonus=${r.bonus}`)

    const m = newMilestone(before.lifetime_stars, r.learner.lifetime_stars)
    if (m) {
      setShop(`🎉 Milestone! You reached ${m} lifetime ${m === 1 ? 'star' : 'stars'}! Pick a sticker!`)
      return
    }
    // Reading phrases and sentences: every other one, ask what it means (every one from Level 56).
    const itemLevel = it.stretchLevel ?? activeLevel(before)
    if (before.mode === 'reading' && itemLevel >= COMPREHENSION_FROM && (itemLevel >= ADVANCED_FROM || indexRef.current % 2 === 1)) {
      const q = questionFor(it.target)
      if (q) {
        log('QUESTION', q.prompt)
        advanceTimer.current = setTimeout(() => { if (!shopRef.current) setQuiz({ q, picked: null }) }, 700)
        return
      }
    }
    if (coached) engineRef.current?.praiseThen(() => { if (!shopRef.current) advanceTimer.current = setTimeout(() => advance(false), 150) })
    else advanceTimer.current = setTimeout(() => advance(false), before.mode === 'spelling' ? 1600 : paceRef.current === 'brisk' ? 250 : 550)
  }, [advance, log, onActivity, onChange])

  // Latest callbacks for the engine (created once).
  /** Spelling bee: the word was spelled wrong. Show the right spelling; the reader can say the mic misheard. */
  const handleSpellWrong = useCallback((letters: string[]) => {
    const it = roundRef.current[indexRef.current]
    if (!it || solvedRef.current) return
    solvedRef.current = true
    setSpellMiss(letters)
    setRevealed(true)
    setFeedback({ title: `It’s spelled ${it.target.toUpperCase().split('').join('-')}`, sub: letters.length ? `Heard ${letters.join('-').toUpperCase()}` : '', tone: 'coach' })
    log('SPELL_MISS', `heard=${letters.join('')} target=${it.target}`)
    if (!it.stretchLevel) attemptsRef.current += 1
    roundLog.current.items += 1
    roundLog.current.skipped += 1
    engineRef.current?.announce(`That's not quite it. ${it.target} is spelled ${it.target.toUpperCase().split('').join('. ')}.`)
    advanceTimer.current = setTimeout(() => advance(false), 4500)
  }, [advance, log])

  /** "The mic misheard me": undo the miss and spell the same word again. */
  const misheard = () => {
    const it = roundRef.current[indexRef.current]
    if (!it || !spellMiss) return
    clearTimeout(advanceTimer.current)
    if (!it.stretchLevel) attemptsRef.current = Math.max(0, attemptsRef.current - 1)
    roundLog.current.items = Math.max(0, roundLog.current.items - 1)
    roundLog.current.skipped = Math.max(0, roundLog.current.skipped - 1)
    solvedRef.current = false
    setSpellMiss(null)
    setRevealed(false)
    log('SPELL_RETRY', it.target)
    engineRef.current?.retryWord()
  }

  /** Spelling bee: typed instead of spoken (when the microphone struggles). */
  const submitTyped = (text: string) => {
    const it = roundRef.current[indexRef.current]
    if (!it || solvedRef.current) return
    const letters = text.toLowerCase().replace(/[^a-z]/g, '').split('')
    setTyping(null)
    setSpelled(letters)
    engineRef.current?.stopAll()
    if (letters.join('') === it.target.toLowerCase()) handleSolved(letters.join('-').toUpperCase(), Boolean(engineRef.current?.usedHelp))
    else handleSpellWrong(letters)
  }

  /** Spelling bee help, as the National Spelling Bee allows: no penalty. */
  const askBee = (kind: 'repeat' | 'definition' | 'pos' | 'sentence' | 'origin') => {
    const it = roundRef.current[indexRef.current]
    const e = it?.spell
    if (!e || solvedRef.current) return
    const info: Record<typeof kind, { label: string; text: string; say: string }> = {
      repeat: { label: '🔊 Word', text: '', say: `${e.word}. ${e.word}.` },
      definition: { label: '📖 Definition', text: e.definition, say: `Definition: ${e.definition}.` },
      pos: { label: '🏷️ Part of speech', text: e.pos, say: `It's ${/^[aeiou]/.test(e.pos) ? 'an' : 'a'} ${e.pos}.` },
      sentence: { label: '🗣️ Sentence', text: e.sentence.replace(new RegExp(e.word, 'ig'), '_____'), say: e.sentence },
      origin: { label: '🌍 Origin', text: e.origin, say: `It comes from ${e.origin}.` },
    }
    const x = info[kind]
    if (x.text) setBeeInfo((list) => [...list.filter((b) => b.label !== x.label), { label: x.label, text: x.text }])
    log('BEE_ASK', kind)
    engineRef.current?.sayInfo(x.say, kind === 'repeat')
  }

  const solvedCb = useRef(handleSolved)
  const spellWrongCb = useRef(handleSpellWrong)
  const askBeeCb = useRef(askBee)
  const advanceCb = useRef(advance)
  useLayoutEffect(() => {
    solvedCb.current = handleSolved
    advanceCb.current = advance
    spellWrongCb.current = handleSpellWrong
    askBeeCb.current = askBee
  })

  useEffect(() => {
    const engine = new PracticeEngine({
      feedback: (title, sub, tone) => setFeedback({ title, sub, tone }),
      mic: (state, label) => setMic({ state, label: label ?? (state === 'listening' ? 'Listening...' : 'Listen Now') }),
      solved: (heard, coached) => solvedCb.current(heard, coached),
      advance: (afterCoach) => {
        // The coach gave up on this word: it counts as tried, not said (stretch items don't count).
        problemRef.current('gave_up')
        if (!roundRef.current[indexRef.current]?.stretchLevel) attemptsRef.current += 1
        roundLog.current.items += 1
        roundLog.current.skipped += 1
        advanceCb.current(afterCoach)
      },
      revealSpanish: () => setRevealed(true),
      spelling: (letters) => setSpelled(letters),
      spellWrong: (letters) => spellWrongCb.current(letters),
      beeAsk: (kind) => askBeeCb.current(kind),
      micBlocked: (reason) => {
        log('MIC_BLOCKED', reason)
        setMicHelp(reason)
      },
      showPhrase: () => setPhraseShown(true),
      log,
    })
    engineRef.current = engine
    // Starts the speech engine (an external system) and the first round for this reader.
    // eslint-disable-next-line react/set-state-in-effect
    startRound({ autoBegin: false, welcome: true })
    return () => {
      clearTimeout(advanceTimer.current)
      flushLog()
      engine.dispose()
      engineRef.current = null
    }
    // Start once per reader.
  }, [learner.id, log, startRound, flushLog])

  // ---- controls ------------------------------------------------------------------------------

  const anyModal = Boolean(shop) || roundDone || logOpen || Boolean(quiz) || progressOpen || helpOpen || Boolean(micHelp)

  const answerQuiz = (i: number) => {
    if (!quiz || quiz.picked !== null) return
    const right = i === quiz.q.answer
    setQuiz({ ...quiz, picked: i })
    cancelQuizVoice.current?.()
    log('ANSWER', `${right ? 'right' : 'wrong'}: ${quiz.q.choices[i]}`)
    roundLog.current.questions += 1
    if (right) roundLog.current.questionsRight += 1
    if (right) {
      const l = learnerRef.current
      const next = { ...l, lifetime_stars: l.lifetime_stars + 1, spendable_stars: l.spendable_stars + 1 }
      learnerRef.current = next
      onChange(next)
      starsSinceStop.current += 1
      playChime()
      setConfetti(makeConfetti(18))
    } else if (paceRef.current === 'guided') {
      cancelQuizVoice.current = speakSegments([{ text: `It was ${quiz.q.choices[quiz.q.answer]}.`, lang: 'en-US' }], () => {})
    }
    advanceTimer.current = setTimeout(() => {
      setQuiz(null)
      advance(false)
    }, right ? 1000 : 2200)
  }

  const closeShop = useCallback(() => {
    setShop(null)
    shopRef.current = null
    if (roundDone) return
    if (solvedRef.current) advance(false)
    else engineRef.current?.resume()
  }, [advance, roundDone])

  // Iris reads the question and choices to younger readers.
  const cancelQuizVoice = useRef<(() => void) | null>(null)
  const quizQ = quiz?.q
  useEffect(() => {
    if (!quizQ || paceRef.current !== 'guided') return
    const t = setTimeout(() => {
      cancelQuizVoice.current = speakSegments([{ text: `${quizQ.prompt} ${quizQ.choices.join(', or ')}?`, lang: 'en-US' }], () => {})
    }, 250)
    return () => clearTimeout(t)
  }, [quizQ])

  /** Reading or Spanish today: progress in each is kept separately. */
  const switchMode = (m: Mode) => {
    if (m === learnerRef.current.mode) return
    engineRef.current?.stopAll()
    clearTimeout(advanceTimer.current)
    flushLog()
    setQuiz(null)
    const next = { ...learnerRef.current, mode: m }
    learnerRef.current = next
    onChange(next)
    log('MODE', m)
    startRound({ autoBegin: false })
  }

  const openShop = (reason: string) => {
    engineRef.current?.setPaused(true)
    setShop(reason)
  }

  useEffect(() => {
    engineRef.current?.setPaused(anyModal)
  }, [anyModal])

  // Leaving the app (home button, switching apps, locking the phone) turns the microphone off at once.
  const anyModalRef = useRef(anyModal)
  useEffect(() => { anyModalRef.current = anyModal }, [anyModal])

  // ---- problem reports -------------------------------------------------------------------------
  useEffect(() => {
    problemRef.current = (kind, detail) => {
      const it = roundRef.current[indexRef.current]
      const l = learnerRef.current
      const lines = logBuf.current.slice(-Math.min(60, Math.max(1, logTotal.current - itemMark.current)))
      reportProblem({
        kind, detail: detail ?? null,
        learner_id: l.id, mode: l.mode, level: activeLevel(l),
        item: it ? (it.spanish ? `${it.spanish.en} → ${it.target}` : it.target) + (it.stretchLevel ? ` (stretch from L${it.stretchLevel})` : '') : null,
        heard: itemHeard(), seconds: itemSecs.current,
        log: lines.join('\n'),
      })
      log('REPORTED', kind)
    }
  })
  // Time on the current item, counting only while the app is on screen and nothing is covering it.
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState !== 'visible' || anyModalRef.current || solvedRef.current || !roundRef.current[indexRef.current]) return
      itemSecs.current += 5
      const limit = learnerRef.current.mode === 'spelling' ? 150 : 90
      if (itemSecs.current >= limit && !stuckSent.current) {
        stuckSent.current = true
        problemRef.current('stuck', `No match after ${itemSecs.current}s on screen`)
      }
    }, 5000)
    return () => clearInterval(t)
  }, [])
  useEffect(() => {
    let asleep = false
    const sleep = () => {
      if (asleep) return
      asleep = true
      engineRef.current?.sleep()
      log('MIC', 'off: app in background')
    }
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') sleep()
      else if (asleep) {
        asleep = false
        engineRef.current?.wake(anyModalRef.current)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', sleep)
    document.addEventListener('freeze', sleep)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', sleep)
      document.removeEventListener('freeze', sleep)
    }
  }, [log])

  const skip = () => {
    if (anyModal) return
    if (!solvedRef.current && !roundRef.current[indexRef.current]?.stretchLevel) attemptsRef.current += 1
    if (!solvedRef.current && (itemSecs.current >= 20 || (itemSecs.current >= 5 && itemHeard().length > 0))) problemRef.current('skipped')
    if (!solvedRef.current) {
      roundLog.current.items += 1
      roundLog.current.skipped += 1
    }
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
  const moveOne = (id: string, x: number, y: number) => onChange(moveSticker(learnerRef.current, id, x, y))
  const saveLabel = { saved: '✓ Saved', saving: 'Saving…', offline: 'Offline – will retry', error: 'Not saved' }[saveStatus]

  return (
    <div className="flex min-h-dvh flex-col">
      {wide && <StickerCanvas stickers={learner.stickers} onMove={moveOne} />}
      <Confetti pieces={confetti} />
      {progressOpen && <ProgressView learner={learner} onClose={() => setProgressOpen(false)} />}
      {micHelp && <MicHelp reason={micHelp} onClose={() => setMicHelp(null)} onGranted={() => { setMicHelp(null); log('MIC', 'allowed after help'); setTimeout(() => engineRef.current?.listenNow(), 300) }} />}
      {helpOpen && <HelpGuide start={learner.mode} highlight={{ mode: learner.mode, level }} onClose={() => setHelpOpen(false)} />}

      <header className="relative z-30 mx-auto w-full max-w-5xl px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2 sm:px-6">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-xl shadow-md sm:h-11 sm:w-11 sm:text-2xl">⭐</div>
            <div className="min-w-0">
              <h1 className="hidden font-kids text-2xl font-bold leading-tight sm:block">Language Stars</h1>
              <button type="button" onClick={onExit} title="Switch learner"
                className="inline-flex max-w-full items-center gap-1.5 truncate rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-sm font-bold text-indigo-700 hover:bg-indigo-100">
                {avatarFor(learner)} {learner.display_name} <span className="text-indigo-400">▾</span>
              </button>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1 rounded-2xl border-2 border-amber-300 bg-white/95 px-2.5 py-1 shadow-sm" title="Lifetime stars">
              <span className="text-base">🌟</span>
              <span className="font-kids text-base font-bold sm:text-lg">{learner.lifetime_stars}</span>
            </div>
            <button type="button" onClick={() => openShop('Pick a sticker for your screen!')} aria-label={`Stickers, ${learner.spendable_stars} stars to spend`}
              className="flex items-center gap-1 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-purple-600 px-2.5 py-1.5 font-kids text-sm font-bold text-white shadow-md hover:from-fuchsia-600 hover:to-purple-700">
              🏪<span className="hidden sm:inline"> Stickers</span> <span className="rounded-full bg-white/25 px-1.5 text-xs">{learner.spendable_stars}⭐</span>
            </button>
            <div className="relative">
              <button type="button" className="chip h-9 w-9 justify-center px-0 text-base" aria-label="More" aria-expanded={menuOpen} onClick={() => setMenuOpen((o) => !o)}>⋯</button>
              {menuOpen && <div className="fixed inset-0 z-40" aria-hidden="true" onClick={() => setMenuOpen(false)} />}
              {menuOpen && (
                <div className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-2xl border border-slate-200 bg-white text-sm font-semibold shadow-xl" onClick={() => setMenuOpen(false)}>
                  <button type="button" className="block w-full px-4 py-3 text-left hover:bg-slate-50" onClick={() => setProgressOpen(true)}>📈 My progress</button>
                  <button type="button" className="block w-full px-4 py-3 text-left hover:bg-slate-50" onClick={() => setHelpOpen(true)}>❓ How levels work</button>
                  <button type="button" className="block w-full px-4 py-3 text-left hover:bg-slate-50"
                    onClick={() => { const dark = document.documentElement.classList.contains('dark'); setThemeChoice(dark ? 'light' : 'dark'); setMenuOpen(false) }}>
                    {typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? '☀️ Light mode' : '🌙 Dark mode'}
                  </button>
                  <button type="button" className="block w-full px-4 py-3 text-left hover:bg-slate-50" onClick={onExit}>{deviceMode ? '🏠 Home' : '🚪 Switch learner'}</button>
                  <button type="button" className="block w-full px-4 py-3 text-left hover:bg-slate-50" onClick={() => setLogOpen(true)}>📊 Speech log</button>
                  <button type="button" className="block w-full px-4 py-3 text-left hover:bg-slate-50"
                    onClick={() => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()).catch(() => {})}>⛶ Full screen</button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="mt-1.5 flex items-center gap-2 pl-[3.1rem] sm:pl-[3.4rem]">
          <span className={`text-[11px] font-semibold ${saveStatus === 'saved' ? 'text-emerald-700' : saveStatus === 'saving' ? 'text-slate-500' : 'text-rose-700'}`}>{saveLabel}</span>
        </div>
      </header>

      <main className="pointer-events-none relative z-20 mx-auto [&>*]:pointer-events-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-start gap-4 px-3 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:justify-center sm:px-6">
        {!recognitionSupported() && (
          <p className="w-full max-w-2xl rounded-2xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900">
            This browser can’t listen to speech. Use Chrome, Edge or Safari for the microphone. Ask Iris and Next still work.
          </p>
        )}
        <div className="grid w-full max-w-2xl grid-cols-3 gap-1.5 rounded-2xl border border-slate-200 bg-white/90 p-1.5 shadow-sm" role="group" aria-label="What to practice today">
          {MODES.map((m) => (
            <button key={m} type="button" aria-pressed={learner.mode === m} onClick={() => switchMode(m)}
              className={`flex items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 font-kids text-sm font-bold transition sm:text-base ${learner.mode === m ? MODE_STYLE[m].on : 'text-slate-600 hover:bg-slate-100'}`}>
              <span className="text-lg">{MODE_STYLE[m].icon}</span>{MODE_STYLE[m].label}
              <span className={`hidden rounded-full px-1.5 text-[10px] sm:inline ${learner.mode === m ? 'bg-white/25' : 'bg-slate-100'}`}>L{levelOf(learner, m)}</span>
            </button>
          ))}
        </div>
        <div className="flex w-full max-w-2xl flex-col gap-2 rounded-2xl border border-indigo-100 bg-white/90 p-3 shadow-sm backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2" title="Master every word in a level to move up">
              <span className="rounded-xl bg-indigo-600 px-3 py-1 font-kids text-sm font-bold text-white shadow-sm">Level {level} <span className="font-sans text-xs font-semibold opacity-80">of {MAX_LEVEL}</span></span>
              <button type="button" onClick={() => setHelpOpen(true)} title="What this level means"
                className="rounded-xl bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-900 hover:bg-amber-200">
                {stageName(level, learner.mode)} · {gradeFor(level, learner.mode)} <span className="opacity-60">ⓘ</span>
              </button>
              {challenge && <span className="rounded-xl bg-fuchsia-600 px-2.5 py-1 text-xs font-bold text-white">🚀 Challenge: Level {challenge}</span>}
              {!challenge && item?.stretchLevel && <span className="rounded-xl bg-fuchsia-100 px-2.5 py-1 text-xs font-bold text-fuchsia-800">🚀 Bonus: Level {item.stretchLevel}</span>}
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
          {item && reading && !item.target.includes(' ') && (
            <div key={`${learner.id}-${index}-${item.key}`} className="my-3 flex min-h-[120px] flex-wrap items-center justify-center gap-3 sm:min-h-[145px] sm:gap-4">
              {(() => {
                const help = wordHelp(item.target, '')
                return (
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3" aria-label={item.target}>
                      {help.chunks.map((chunk, i) => (
                        <div key={i} className="animate-tile-pop flex items-center" style={{ animationDelay: `${i * 60}ms` }}>
                          {i > 0 && <span className="mr-2 text-2xl font-bold text-indigo-300 sm:mr-3" aria-hidden>·</span>}
                          <div className={`flex h-20 items-center justify-center rounded-2xl border-2 px-3 font-kids font-bold shadow-sm sm:h-24 sm:px-4 ${chunk.length > 12 ? 'text-2xl sm:text-4xl' : chunk.length > 8 ? 'text-3xl sm:text-5xl' : 'text-4xl sm:text-5xl'} ${i % 2 ? 'border-amber-200 bg-gradient-to-b from-amber-50 to-white text-amber-900' : 'border-indigo-200 bg-gradient-to-b from-indigo-50 to-white text-indigo-900'}`}>{chunk}</div>
                        </div>
                      ))}
                    </div>
                    {help.rhymes.length > 0 && (
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">rhymes with {help.rhymes.join(' · ')}</span>
                    )}
                    {help.kind === 'syllables' && (
                      <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-800">👏 {help.chunks.length} claps</span>
                    )}
                  </div>
                )
              })()}
            </div>
          )}

          {item && reading && item.target.includes(' ') && (
            <div key={`${learner.id}-${index}-${item.key}`} className="my-3 flex min-h-[120px] flex-wrap items-center justify-center gap-2 sm:min-h-[145px] sm:gap-3" aria-label={item.target}>
              {item.target.split(' ').map((w, i, all) => (
                <span key={i} className={`animate-tile-pop rounded-2xl border-2 border-indigo-200 bg-gradient-to-b from-indigo-50 to-white px-3 py-2 font-kids font-bold text-indigo-900 shadow-sm ${all.length <= 4 ? 'text-4xl sm:text-5xl' : all.length <= 8 ? 'text-2xl sm:text-4xl' : 'text-xl sm:text-3xl'}`}
                  style={{ animationDelay: `${i * 45}ms` }}>
                  {w}
                </span>
              ))}
            </div>
          )}

          {item?.spell && spellingMode && (
            <div className="my-3 flex w-full max-w-lg flex-col items-center rounded-3xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 via-lime-50 to-amber-50 p-5">
              <span className="mb-2 text-xs font-bold uppercase tracking-widest text-emerald-700">🐝 Spelling bee • listen, then spell it</span>
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
                {!spellMiss && !success && spelled.length > 0 && <button type="button" className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700 hover:bg-slate-200" onClick={() => engineRef.current?.retryWord()}>↺ Start over</button>}
                {!spellMiss && !success && typing === null && <button type="button" className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700 hover:bg-slate-200" onClick={() => { engineRef.current?.stopAll(); setTyping('') }}>⌨️ Type it instead</button>}
                {spellMiss && <button type="button" className="rounded-full bg-amber-100 px-3 py-1.5 text-amber-900 hover:bg-amber-200" onClick={misheard}>🎤 The mic misheard me, try again</button>}
              </div>
              {typing !== null && (
                <form className="mt-3 flex w-full max-w-xs gap-2" onSubmit={(e) => { e.preventDefault(); submitTyped(typing) }}>
                  <input className="input flex-1 text-center font-kids text-xl uppercase tracking-widest" autoFocus autoCapitalize="none" autoCorrect="off" spellCheck={false} autoComplete="off"
                    aria-label="Type the spelling" value={typing} onChange={(e) => setTyping(e.target.value.replace(/[^A-Za-z]/g, ''))} />
                  <button className="btn-primary px-4">Check</button>
                </form>
              )}
            </div>
          )}

          {item?.spanish && spanish && (
            <div className="my-3 flex w-full max-w-lg flex-col items-center justify-center rounded-3xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 via-sky-50 to-amber-50 p-5">
              <span className="mb-1 text-xs font-bold uppercase tracking-widest text-indigo-500">Say this English word in Spanish</span>
              <div className={`font-kids font-bold tracking-tight ${item.spanish.en.length <= 14 ? 'text-4xl sm:text-6xl' : item.spanish.en.length <= 30 ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'}`}>{item.spanish.en}</div>
              <div className="mt-2.5 flex w-full flex-col items-center gap-2 text-xs sm:text-sm">
                <span className="rounded-full border border-indigo-200 bg-white px-3 py-1 font-semibold text-indigo-700">
                  {revealed ? `Spanish: "${item.spanish.es}"${item.spanish.phonetic ? ` (${item.spanish.phonetic})` : ''}` : 'Stuck? Tap Reveal (or press Shift)'}
                </span>
                {!revealed && (
                  <button type="button" onClick={() => setRevealed(true)}
                    className="mt-1 w-full max-w-xs rounded-2xl border-2 border-indigo-300 bg-white px-6 py-3 font-kids text-lg font-bold text-indigo-700 shadow-sm transition hover:bg-indigo-50 active:scale-95">
                    👀 Reveal the Spanish
                  </button>
                )}
                {phraseShown && item.spanish.phraseEs && (
                  <div className="w-full max-w-md rounded-2xl border border-amber-300 bg-amber-50/90 px-3.5 py-2 text-center text-amber-950">
                    <div className="text-sm font-bold sm:text-base">💬 “{item.spanish.phraseEs}”</div>
                    <div className="mt-0.5 text-[11px] text-amber-800">({item.spanish.phraseEn})</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {quiz && (
            <div className="mt-2 mb-5 w-full max-w-lg rounded-2xl border-2 border-violet-300 bg-violet-50 p-4" role="group" aria-label="Question">
              <div className="mb-3 font-kids text-lg font-bold text-violet-900 sm:text-xl">🤔 {quiz.q.prompt}</div>
              <div className="grid gap-2">
                {quiz.q.choices.map((c, i) => {
                  const done = quiz.picked !== null
                  const state = !done ? 'border-violet-200 bg-white hover:bg-violet-100' : i === quiz.q.answer ? 'border-emerald-400 bg-emerald-100 text-emerald-900' : i === quiz.picked ? 'border-rose-300 bg-rose-100 text-rose-900' : 'border-slate-200 bg-white opacity-50'
                  return (
                    <button key={i} type="button" disabled={done} onClick={() => answerQuiz(i)}
                      className={`rounded-2xl border-2 px-4 py-3 text-left font-kids text-base font-bold transition active:scale-[0.98] sm:text-lg ${state}`}>
                      {done && i === quiz.q.answer ? '✅ ' : done && i === quiz.picked ? '❌ ' : ''}{c}
                    </button>
                  )
                })}
              </div>
              {quiz.picked !== null && <div className="mt-2 text-sm font-semibold text-violet-800">{quiz.picked === quiz.q.answer ? 'Yes! +1 ⭐' : 'Good try — the green one is right.'}</div>}
            </div>
          )}

          <div role="status" aria-live="polite" className={`mt-2 mb-5 ${quiz ? 'hidden' : ''} w-full max-w-lg rounded-2xl border px-4 py-3 transition-colors ${toneClass[feedback.tone]}`}>
            <div className="font-kids text-lg font-bold sm:text-xl">{feedback.title}</div>
            <div className="mt-0.5 text-xs opacity-80 sm:text-sm">{feedback.sub}</div>
          </div>

          <div className={`grid w-full max-w-lg grid-cols-2 gap-2.5 sm:gap-3 ${quiz ? 'hidden' : ''}`}>
            <button type="button" onClick={async () => { if (micHelp === null && (await micBlocked())) setMicHelp('blocked'); else engineRef.current?.listenNow() }}
              className={`col-span-2 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4 font-kids text-lg font-bold text-white shadow-lg transition hover:from-emerald-600 hover:to-teal-700 active:scale-95 ${mic.state === 'listening' ? 'animate-pulse-ring' : ''}`}>
              <span className={`h-3 w-3 rounded-full ${mic.state === 'listening' ? 'animate-ping bg-emerald-200' : mic.state === 'warming' ? 'bg-amber-200' : 'bg-white/90'}`} />
              <span>{mic.label === 'Listen Now' ? '🎤 Listen' : mic.label}</span>
              <span className="hidden rounded-full bg-black/15 px-2 py-0.5 font-sans text-xs [@media(pointer:fine)]:inline">{isMac ? 'Return' : 'Enter'}</span>
            </button>
            <button type="button" onClick={() => engineRef.current?.coach()}
              className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-600 px-4 py-3.5 font-kids text-base font-bold text-white shadow-md transition hover:from-indigo-600 hover:to-blue-700 active:scale-95 sm:text-lg">
              💬 Ask Iris <span className="hidden rounded-full bg-black/15 px-2 py-0.5 font-sans text-xs [@media(pointer:fine)]:inline">Space</span>
            </button>
            <button type="button" onClick={skip} className="rounded-2xl bg-slate-100 px-4 py-3.5 font-kids text-base font-bold text-slate-700 transition hover:bg-slate-200 active:scale-95 sm:text-lg">Next ➡️</button>
          </div>
        </section>

        {!wide && learner.stickers.length > 0 && (
          <a href="#sticker-board" className="text-xs font-bold text-fuchsia-700 underline-offset-2 hover:underline">
            👇 Scroll down to see your {learner.stickers.length} sticker{learner.stickers.length === 1 ? '' : 's'}
          </a>
        )}
      </main>

      {!wide && <StickerBoard name={learner.display_name} stickers={learner.stickers} onMove={moveOne} onShop={() => openShop('Pick a sticker for your board!')} />}

      {roundDone && !shop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-3xl border-4 border-amber-200 bg-white/95 p-6 text-center shadow-2xl">
            <div className="mb-2 text-5xl">🏆</div>
            <h2 className="font-kids text-2xl font-bold">Round Complete!</h2>
            {roundNote && roundNote.attempts > 0 && (
              <p className="mt-2 text-sm font-semibold text-slate-700">
                {roundNote.clean} of {roundNote.attempts} {spanish ? 'said' : spellingMode ? 'spelled' : 'read'} without help
              </p>
            )}
            {roundNote?.note && (
              <p className="mt-2 rounded-2xl border border-fuchsia-200 bg-fuchsia-50 px-3 py-2 text-sm font-semibold text-fuchsia-900">{roundNote.note}</p>
            )}
            {roundNote?.movedDownTo && (
              <p className="mt-2 rounded-2xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900">
                That level was tricky today, so let’s practice Level {roundNote.movedDownTo} again. Master it to climb back up! Your stars and stickers are safe.
              </p>
            )}
            <p className="mt-2 mb-5 text-sm text-slate-600">
              {learner.display_name} finished the round! Lifetime stars: {learner.lifetime_stars} ⭐ • Balance: {learner.spendable_stars} ⭐ • {spanish ? 'Spanish' : spellingMode ? 'Spelling' : 'Reading'} level: {level}.
            </p>
            <div className="flex flex-col gap-2.5">
              <button type="button" className="btn bg-gradient-to-r from-fuchsia-500 to-purple-600 font-kids text-base text-white" onClick={() => setShop(`Spend your ${learner.spendable_stars} ⭐ in the Sticker Shop!`)}>🏪 Spend stars in the Sticker Shop</button>
              <button type="button" className="btn bg-gradient-to-r from-emerald-500 to-teal-600 font-kids text-base text-white" onClick={() => startRound({ autoBegin: true })}>Next Round ➡️</button>
              <button type="button" className="btn-danger" onClick={onExit}>{deviceMode ? '🏠 Home' : '🚪 Switch learner'}</button>
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
