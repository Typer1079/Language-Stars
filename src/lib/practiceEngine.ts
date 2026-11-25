import { isSpanishMatch, isWordMatch } from './match'
import type { PracticeItem } from './progress'
import { canFilterNoise, createRecognition, getCleanMicTrack, releaseCleanMic, speakSegments, cancelSpeech, IS_IOS, type RecognitionLike, type VoiceSegment } from './speech'
import type { Mode } from './types'
import { ENCOURAGING_NICKNAMES } from './wordBanks'
import { wordHelp } from './phonics'
import { beeRequest, extractLetters, judgeSpelling, sayLetters, wantsRestart, type BeeRequest } from './spelling'

export type Tone = 'neutral' | 'listening' | 'success' | 'coach'
/**
 * guided: young or new readers. Spoken welcome, "your turn" prompts, sound-it-out coaching.
 * brisk: adults and readers who are doing well. No chatter: listen right away, the coach just says
 *        the answer, faster voice, quicker move to the next item.
 */
export type Pace = 'guided' | 'brisk'

// iPhone/iPad can't listen while speaking, so the mic pauses for the coach there.
// Elsewhere it stays on (the coach's own voice is ignored), which makes the hand-back instant.
const IOS = IS_IOS
export type MicState = 'idle' | 'listening' | 'warming'

export interface EngineHooks {
  feedback(title: string, subtitle: string, tone: Tone): void
  mic(state: MicState, label?: string): void
  /** The reader said the word. */
  solved(heard: string, coached: boolean): void
  /** The coach gave up on this word; move to the next one. */
  advance(afterCoach: boolean): void
  revealSpanish(): void
  showPhrase(): void
  log(tag: string, detail?: string): void
  /** Spelling bee: the letters heard so far for this word. */
  spelling?(letters: string[]): void
  /** Spelling bee: the word was spelled wrong (these letters were heard). */
  spellWrong?(letters: string[]): void
  /** Spelling bee: the speller asked out loud for the definition, a sentence, etc. */
  beeAsk?(kind: BeeRequest): void
  /** The microphone (or iOS Dictation) is switched off for this site. */
  micBlocked?(reason: 'blocked' | 'dictation'): void
}

const LISTEN_MS = 5200

const pick = <T,>(list: T[]): T => list[Math.floor(Math.random() * list.length)]

/**
 * Runs one practice word: opens the microphone, listens for the word, and brings in the
 * Iris (word chunks and rhymes / Spanish example) when the reader needs help.
 * Ported from the original app's turn logic; UI updates go through `hooks`.
 */
export class PracticeEngine {
  private hooks: EngineHooks
  private item: PracticeItem | null = null
  private mode: Mode = 'reading'
  private name = ''
  private pace: Pace = 'guided'

  private solved = false
  private usedCoach = false
  private listening = false
  private coachSpeaking = false
  private coachingActive = false
  private paused = false
  private gen = 0
  private lastCoachEnd = 0

  private recognition: RecognitionLike | null = null
  private recActive = false
  /** The browser confirmed the mic is on (onstart fired) for the current session. */
  private micOn = false
  private startWatchdog: ReturnType<typeof setTimeout> | undefined
  private noStartCount = 0
  // Noise-suppressed microphone (where the browser supports it) and a count of noisy misses.
  private cleanTrack: MediaStreamTrack | null = null
  private cleanMicTried = false
  private noisyMisses: number[] = []
  private seenResults = 0
  private baseline = 0
  private cancelVoice: (() => void) | null = null
  private turnTimer: ReturnType<typeof setTimeout> | undefined
  private micTimer: ReturnType<typeof setTimeout> | undefined
  private voiceWatchdog: ReturnType<typeof setTimeout> | undefined

  constructor(hooks: EngineHooks) {
    this.hooks = hooks
  }

  /**
   * Reading mode brings in the coach automatically and moves on after a few tries.
   * Spanish mode keeps listening until the word is said correctly or Skip is pressed;
   * the coach only speaks when asked (AI Coach button / Space).
   */
  private get autoCoach(): boolean {
    return this.mode === 'reading'
  }

  /** What happens when a listening window ends without the word (reading mode only). */
  private onSilence(gen: number): (() => void) | undefined {
    if (!this.autoCoach) return undefined
    return () => gen === this.gen && !this.solved && !this.paused && this.coach()
  }

  /** How long to wait in Reading before the coach steps in: longer for longer phrases and for brisk readers. */
  private get listenMs(): number {
    const words = this.item ? this.item.target.split(' ').length : 1
    return this.pace === 'brisk' ? LISTEN_MS + 2800 + (words - 1) * 500 : LISTEN_MS + (words - 1) * 700
  }

  /** Iris spelled or said the answer for this item. */
  get usedHelp(): boolean {
    return this.usedCoach
  }

  get isCoaching(): boolean {
    return this.coachingActive || this.coachSpeaking
  }

  /** Show a new word (does not start listening). */
  load(item: PracticeItem, mode: Mode, name: string, pace: Pace = 'guided') {
    this.stopAll()
    this.item = item
    this.mode = mode
    this.name = name
    this.pace = pace
    this.solved = false
    this.usedCoach = false
  }

  setPaused(paused: boolean) {
    this.paused = paused
    if (paused) {
      this.stopAll()
      this.stopListening(true, true)
      this.dropCleanMic()
    }
  }

  /** Coming back from the sticker shop: listen again, then coach. */
  resume() {
    this.paused = false
    if (!this.solved) this.listenWindow(5000, this.onSilence(this.gen))
  }

  welcome() {
    const gen = ++this.gen
    this.stopAll()
    this.gen = gen
    const spanish = this.mode === 'spanish'
    if (this.mode === 'spelling') {
      if (this.pace === 'brisk') return this.pronounce(gen)
      this.hooks.feedback(`Hi ${this.name}! Spelling bee time`, 'Iris is your pronouncer…', 'coach')
      this.say([{ text: `Hi ${this.name}! I'm Iris, your pronouncer. I'll say a word, and you spell it out loud, one letter at a time. You can ask for the definition, a sentence, or where the word comes from.`, lang: 'en-US' }], () => {
        if (gen !== this.gen || this.solved) return
        this.pronounce(gen)
      })
      return
    }
    if (this.pace === 'brisk') {
      // No spoken welcome: straight to the first item.
      this.listenWindow(this.listenMs, this.onSilence(gen))
      return
    }
    this.hooks.feedback(spanish ? `Hi ${this.name}! Let's practice Spanish` : `Hi ${this.name}! Let's read together`, 'Iris is saying hello…', 'coach')
    const text = spanish
      ? `Hi ${this.name}! It's Iris. Say each word in Spanish, and ask me if you need help.`
      : `Hi ${this.name}! It's Iris. Let's read together! Read the word out loud.`
    this.say([{ text, lang: 'en-US' }], () => {
      if (gen !== this.gen || this.solved) return
      this.listenWindow(this.listenMs, this.onSilence(gen))
    })
  }

  begin(promptType: 'quick_listen' | 'gentle_callout' = 'quick_listen') {
    const gen = ++this.gen
    this.stopAll()
    this.gen = gen
    if (this.mode === 'spelling') return this.pronounce(gen)
    if (promptType === 'quick_listen' || this.pace === 'brisk') {
      this.listenWindow(this.listenMs, this.onSilence(gen))
      return
    }
    const callout = this.callout()
    const line =
      this.mode === 'spanish' && this.item?.spanish
        ? `How do you say ${this.item.spanish.en}, ${callout}?`
        : `Your turn, ${callout}!`
    this.say([{ text: line, lang: 'en-US' }], () => {
      if (gen !== this.gen || this.solved) return
      this.listenWindow(this.listenMs, this.onSilence(gen))
    })
  }

  /** Spelling bee: Iris says the word (twice for younger spellers), then listens. */
  private pronounce(gen: number) {
    const w = this.item?.target ?? ''
    this.hooks.spelling?.([])
    this.say([
      { text: 'Your word is:', lang: 'en-US' },
      { text: `${w}.`, lang: 'en-US', rate: 0.72 },
      { text: `${w}.`, lang: 'en-US', rate: 0.72 },
    ], () => {
      if (gen !== this.gen || this.solved) return
      this.listenWindow(this.listenMs)
    })
  }

  /** Spelling bee help (say it again, definition, sentence, origin): Iris answers, then listens again. No penalty. */
  sayInfo(text: string, slow = false) {
    if (this.solved || this.paused || !this.item) return
    const gen = ++this.gen
    this.stopListening(true)
    this.stopVoice()
    this.gen = gen
    this.say([{ text, lang: 'en-US', ...(slow ? { rate: 0.72 } : {}) }], () => {
      if (gen !== this.gen || this.solved) return
      this.listenWindow(this.listenMs)
    })
  }

  /** Iris says something without listening afterwards (e.g. the right spelling after a miss). */
  announce(text: string) {
    const gen = ++this.gen
    this.stopListening(true)
    this.stopVoice()
    this.gen = gen
    this.say([{ text, lang: 'en-US' }])
  }

  /** Spelling bee: clear the letters and spell this word again (start over, or the mic misheard). */
  retryWord() {
    if (this.paused || !this.item) return
    const gen = ++this.gen
    this.stopAll()
    this.gen = gen
    this.solved = false
    this.baseline = this.seenResults
    this.hooks.spelling?.([])
    this.listenWindow(this.listenMs)
  }

  /** Listen Now / Return key. */
  listenNow() {
    if (this.paused || this.solved) return
    this.noStartCount = 0
    this.stopVoice()
    this.coachingActive = false
    this.listenWindow(this.listenMs, this.onSilence(this.gen))
  }

  /** AI Coach / Space key. */
  coach() {
    // Asking Iris mid-greeting or mid-cheer interrupts it; asking again while she's helping does nothing.
    if (this.coachingActive || this.solved || this.paused || !this.item) return
    const gen = ++this.gen
    this.stopListening(true)
    this.stopVoice()
    this.gen = gen
    this.coachingActive = true
    this.usedCoach = true
    const callout = this.callout()
    const item = this.item

    if (this.mode === 'spanish' && item.spanish) {
      const { en, es, phraseEs, phraseEn } = item.spanish
      this.hooks.revealSpanish()
      this.hooks.showPhrase()
      this.hooks.feedback(`Iris: "${es}"`, phraseEs ? `"${phraseEs}" (${phraseEn})` : `“${en}”`, 'coach')
      const intro: VoiceSegment[] = this.pace === 'brisk'
        ? [{ text: es, lang: 'es-ES' }]
        : phraseEs
        ? [
            { text: `${en} is`, lang: 'en-US' },
            { text: es, lang: 'es-ES' },
            { text: 'Like this:', lang: 'en-US' },
            { text: phraseEs, lang: 'es-ES' },
            { text: `Now you try, ${callout}!`, lang: 'en-US' },
          ]
        : [
            // Phrases and sentences: say it, then once more for the reader to copy.
            { text: `In Spanish, you'd say:`, lang: 'en-US' },
            { text: es, lang: 'es-ES' },
            { text: `Now you try, ${callout}!`, lang: 'en-US' },
          ]
      // Say it once, then keep listening for as long as it takes (no retries, no auto-advance).
      this.say(intro, () => {
        this.coachingActive = false
        if (gen !== this.gen || this.solved) return
        this.listenWindow(this.listenMs)
      })
      return
    }

    const word = item.target
    if (this.mode === 'spelling') {
      this.hooks.revealSpanish()
      this.hooks.spelling?.([])
      this.hooks.feedback(`Iris: ${word.toUpperCase().split('').join('-')}`, 'Listen, then spell it yourself', 'coach')
      this.baseline = this.seenResults
      this.coachSequence(gen,
        [{ text: `${word}. ${sayLetters(word)} ${word}. Now you spell it, ${callout}.`, lang: 'en-US' }],
        [{ text: `Spell ${word}.`, lang: 'en-US' }],
        'Next word coming up!', word)
      return
    }
    if (this.pace === 'brisk') {
      this.hooks.feedback(`Iris: "${word}"`, 'Listen, then say it', 'coach')
      this.coachSequence(gen, [{ text: word, lang: 'en-US' }], [{ text: word, lang: 'en-US' }], 'Next one!', word)
      return
    }
    if (word.includes(' ')) {
      // Phrases and sentences: read it together instead of sounding out letters.
      this.hooks.feedback('Iris: let’s read it together', word, 'coach')
      this.coachSequence(
        gen,
        [{ text: `Let's read it together. ${word} Now you try, ${callout}!`, lang: 'en-US' }],
        [{ text: `You've got this. ${word}`, lang: 'en-US' }],
        'Next one coming up!',
        word,
      )
      return
    }
    const help = wordHelp(word, callout)
    const shown = help.kind === 'rhyme' ? `${help.chunks.join(' · ')} — rhymes with ${help.rhymes.join(', ')}` : help.chunks.join(' · ')
    this.hooks.feedback(`Iris: "${word}"`, help.kind === 'whole' ? word : `${shown} → ${word}`, 'coach')
    this.coachSequence(
      gen,
      [{ text: help.speech, lang: 'en-US' }],
      [{ text: `Almost! Say ${word}.`, lang: 'en-US' }],
      'Next word coming up!',
      `Target: "${word}"`,
    )
  }

  /** After a coached success: praise, then continue. */
  /** After a word said with Iris's help: a quick cheer, then straight on (never waits long on the voice). */
  praiseThen(next: () => void) {
    if (this.pace === 'brisk') return next()
    let done = false
    const go = () => {
      if (done) return
      done = true
      clearTimeout(cap)
      next()
    }
    const cap = setTimeout(go, 1500)
    this.say([{ text: pick(['Yes! Great job!', 'You got it!', 'Nice work!', 'That’s it!']), lang: 'en-US' }], go)
  }

  stopAll() {
    clearTimeout(this.turnTimer)
    this.stopListening(true)
    this.stopVoice()
    this.coachingActive = false
  }

  dispose() {
    this.stopAll()
    this.gen++
    this.dropCleanMic()
    if (this.recognition) {
      this.recognition.onend = null
      try {
        this.recognition.abort()
      } catch {
        // ignore
      }
    }
    this.recognition = null
  }

  // ---------------------------------------------------------------------------

  private coachSequence(gen: number, intro: VoiceSegment[], retry: VoiceSegment[], giveUpTitle: string, giveUpSub: string) {
    this.say(intro, () => {
      if (gen !== this.gen || this.solved) {
        this.coachingActive = false
        return
      }
      this.listenWindow(this.listenMs, () => {
        if (gen !== this.gen || this.solved) {
          this.coachingActive = false
          return
        }
        this.say(retry, () => {
          this.coachingActive = false
          if (gen !== this.gen || this.solved) return
          this.listenWindow(this.listenMs, () => {
            if (gen === this.gen && !this.solved) {
              this.hooks.feedback(giveUpTitle, giveUpSub, 'coach')
              this.turnTimer = setTimeout(() => this.hooks.advance(true), 800)
            }
          })
        })
      })
    })
  }

  /** How the coach addresses the reader: usually by name; kid nicknames only in Reading mode. */
  private callout(): string {
    if (this.name && (this.mode === 'spanish' || Math.random() < 0.6)) return this.name
    return ENCOURAGING_NICKNAMES[Math.floor(Math.random() * ENCOURAGING_NICKNAMES.length)]
  }

  private say(segments: VoiceSegment[], onEnd?: () => void) {
    this.stopListening(true, IOS)
    this.stopVoice()
    this.coachSpeaking = true
    this.hooks.mic('warming', 'Iris is talking…')
    let done = false
    const finish = () => {
      if (done) return
      done = true
      clearTimeout(this.voiceWatchdog)
      this.coachSpeaking = false
      this.cancelVoice = null
      this.lastCoachEnd = Date.now()
      this.hooks.mic('idle')
      if (onEnd) setTimeout(onEnd, IOS ? 60 : 0)
    }
    // Slow parts (spelling words) take longer to say, so give the watchdog more time for them.
    const words = segments.reduce((n, sgm) => n + sgm.text.split(/\s+/).length / (sgm.rate ?? 1), 0)
    const speed = this.pace === 'brisk' ? 1.12 : 1
    this.voiceWatchdog = setTimeout(finish, Math.min(12000, Math.max(2500, (words * 420) / speed + 1200)))
    this.cancelVoice = speakSegments(segments, finish, this.pace === 'brisk' ? 1.12 : 1)
  }

  private stopVoice() {
    clearTimeout(this.voiceWatchdog)
    const cancel = this.cancelVoice
    this.cancelVoice = null
    this.coachSpeaking = false
    if (cancel) cancel()
    else cancelSpeech()
  }

  private listenWindow(durationMs: number, onTimeout?: () => void) {
    if (this.solved || this.paused || !this.item) return
    this.listening = true
    this.hooks.mic('warming', 'Opening microphone...')
    if (this.mode === 'spelling') {
      this.hooks.feedback('Spell the word out loud!', 'One letter at a time • or say “definition”, “sentence”, “part of speech”, “origin” or “repeat”', 'listening')
    } else if (this.mode === 'spanish' && this.item.spanish) {
      this.hooks.feedback(`Say "${this.item.spanish.en}" in Spanish!`, 'Listening until you say it • Shift shows the word • Space asks Iris • Next to move on', 'listening')
    } else {
      this.hooks.feedback(`Say "${this.item.target}"!`, 'Listening for the word...', 'listening')
    }
    this.startRecognition()
    if (onTimeout) {
      clearTimeout(this.turnTimer)
      this.turnTimer = setTimeout(() => {
        if (this.listening && !this.solved && !this.paused) onTimeout()
      }, durationMs)
    }
  }

  /** Spelling bee: show letters as they're said; judge once the word is complete. */
  private onSpelling(results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal?: boolean }>, from: number) {
    const item = this.item!
    const tops: string[] = []
    for (let i = from; i < results.length; i++) tops.push(results[i][0]?.transcript ?? '')
    const all = tops.join(' ')
    this.hooks.log('HEARD', `"${all.trim()}" target="${item.target}"`)
    // Asking for help out loud ("definition", "use it in a sentence", "repeat"): answer it, and
    // don't count those words as letters.
    const ask = beeRequest(tops[tops.length - 1] ?? '')
    if (ask) {
      this.baseline = this.seenResults
      this.hooks.spelling?.([])
      this.hooks.beeAsk?.(ask)
      return
    }
    if (wantsRestart(all)) {
      this.baseline = this.seenResults
      this.hooks.spelling?.([])
      this.hooks.feedback('Starting over', 'Spell the word from the beginning.', 'listening')
      return
    }
    // The recognizer's other guesses for the newest part, too ("bee" vs "dee").
    const last = results[results.length - 1]
    const prefix = tops.slice(0, -1).join(' ')
    const options = [all]
    for (let a = 1; a < (last?.length ?? 0); a++) if (last[a]?.transcript) options.push(`${prefix} ${last[a].transcript}`)
    for (const o of options) {
      if (judgeSpelling(extractLetters(o, item.target), item.target) === 'correct') {
        this.solved = true
        const coached = this.usedCoach
        this.hooks.spelling?.(item.target.toLowerCase().split(''))
        this.stopAll()
        this.hooks.solved(item.target.toUpperCase().split('').join('-'), coached)
        return
      }
    }
    const letters = extractLetters(all, item.target)
    const j = judgeSpelling(letters, item.target)
    this.hooks.spelling?.(letters)
    const final = Boolean(last?.isFinal)
    if (j === 'wrong' && final) {
      this.solved = true
      this.stopAll()
      this.hooks.spellWrong?.(letters)
    } else if (j === 'empty' && final) {
      this.hooks.feedback('Spell it one letter at a time', 'Say each letter clearly, like “C… A… T…”', 'listening')
    }
  }

  private ensureRecognition(): RecognitionLike | null {
    if (this.recognition) return this.recognition
    const r = createRecognition()
    if (!r) {
      this.hooks.log('MIC_UNSUPPORTED')
      return null
    }
    r.onstart = () => {
      clearTimeout(this.micTimer)
      clearTimeout(this.startWatchdog)
      this.micOn = true
      this.noStartCount = 0
      this.recActive = true
      this.seenResults = 0
      this.baseline = 0
      if (!this.listening || this.coachSpeaking) return
      this.hooks.mic('listening', 'Listening...')
      this.hooks.log('MIC_STARTED', `lang=${r.lang}`)
    }
    r.onaudiostart = () => this.hooks.log('MIC_AUDIO')
    r.onnomatch = () => this.hooks.log('MIC_NOMATCH')
    r.onspeechstart = () => {
      if (this.listening && !this.coachSpeaking) this.hooks.mic('listening', 'Hearing voice...')
    }
    r.onresult = (event) => {
      this.seenResults = event.results.length
      if (!this.listening || this.coachSpeaking || this.solved || this.paused || !this.item) return
      if (Date.now() - this.lastCoachEnd < 450) return // the coach's own voice echoing
      // Only speech from this word's turn (the microphone stays on between words).
      const from = Math.max(event.resultIndex, this.baseline)
      const candidates: string[] = []
      let top = ''
      for (let i = from; i < event.results.length; i++) {
        const res = event.results[i]
        top += ' ' + (res[0]?.transcript ?? '')
        // The recognizer's other guesses: "son" / "sun", "pin" / "pen" for short words.
        for (let a = 0; a < res.length; a++) if (res[a]?.transcript) candidates.push(res[a].transcript)
      }
      top = top.trim()
      if (!top) return
      if (this.mode === 'spelling') {
        this.onSpelling(event.results, from)
        return
      }
      // Single words: a long run of words is background talk (TV, other people), not the reader,
      // so it can't count as a match — but a short result inside it still can.
      const words = (t: string) => t.trim().split(/\s+/).filter(Boolean).length
      const single = !this.item.target.trim().includes(' ')
      const all = [top, ...candidates.filter((c) => c.trim() !== top)].filter((c) => !single || words(c) <= 6)
      this.hooks.log('HEARD', `${all.map((c) => `"${c.trim()}"`).join(' / ')} target="${this.item.target}"`)
      const it = this.item
      const hit = all.find((c) => (this.mode === 'spanish' && it.spanish ? isSpanishMatch(c, it.target, it.spanish.variants) : isWordMatch(c, it.target)))
      if (hit) {
        this.solved = true
        const coached = this.usedCoach
        this.stopAll()
        this.hooks.solved(hit.trim(), coached)
        return
      }
      // Finished hearing something else: show what was heard, keep listening.
      if (event.results[event.results.length - 1]?.isFinal) {
        const prompt = this.mode === 'spanish' && this.item.spanish ? `Say "${this.item.spanish.en}" in Spanish!` : `Say "${this.item.target}"!`
        const now = Date.now()
        const noisy = words(top) > words(this.item.target) + 4
        if (noisy) this.noisyMisses = [...this.noisyMisses.filter((t) => now - t < 15000), now]
        if (noisy && this.noisyMisses.length >= 2) {
          this.hooks.log('NOISY', `"${top.slice(0, 60)}"`)
          this.hooks.feedback(prompt, 'It’s noisy here. Hold the device close and say it clearly.', 'listening')
        } else if (!noisy) {
          this.hooks.feedback(prompt, `Heard “${top}”. Try again, still listening…`, 'listening')
        }
      }
    }
    r.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        this.listening = false
        this.hooks.mic('idle')
        this.hooks.feedback('Microphone is off', 'Tap 🎤 Listen to see how to turn it on.', 'neutral')
        // On iPhone, "service-not-allowed" usually means Dictation is turned off in Settings.
        this.hooks.micBlocked?.(e.error === 'service-not-allowed' && IS_IOS ? 'dictation' : 'blocked')
      }
      this.hooks.log('MIC_ERR', e.error)
      // If the filtered microphone is the problem, the next restart uses the normal one.
      if (this.cleanTrack && !['no-speech', 'aborted', 'not-allowed', 'service-not-allowed'].includes(e.error)) {
        this.hooks.log('MIC_FILTER', `off (${e.error})`)
        releaseCleanMic()
        this.cleanTrack = null
      }
    }
    r.onend = () => {
      this.recActive = false
      this.micOn = false
      clearTimeout(this.startWatchdog)
      clearTimeout(this.micTimer)
      // The browser ends sessions on its own (silence, time limits); keep listening while it's our turn.
      if (this.listening && !this.coachSpeaking && !this.solved && !this.paused) {
        this.micTimer = setTimeout(() => this.startRecognition(), 150)
      } else if (!this.listening) {
        this.hooks.mic('idle')
      }
    }
    this.recognition = r
    return r
  }

  /** Starts the microphone if it isn't already running. Safe to call any number of times. */
  private startRecognition(attempt = 0) {
    const r = this.ensureRecognition()
    if (!r || this.coachSpeaking || !this.listening || this.paused || this.solved) return
    // US Spanish recognition is more forgiving of an American accent than Spain's.
    const lang = this.mode === 'spanish' ? 'es-US' : 'en-US'
    if (this.recActive) {
      if (r.lang === lang) {
        // Already listening: just ignore anything said before this turn.
        this.baseline = this.seenResults
        this.hooks.mic('listening', 'Listening...')
        return
      }
      // Language changed (Reading <-> Spanish): restart; onend starts it again.
      try {
        r.stop()
      } catch {
        // already stopping
      }
      return
    }
    // First time: get the noise-suppressed microphone, then start (falls back to the normal mic).
    if (canFilterNoise() && !this.cleanMicTried) {
      this.cleanMicTried = true
      void getCleanMicTrack().then((t) => {
        this.cleanTrack = t
        this.hooks.log('MIC_FILTER', t ? 'noise suppression on' : 'not available')
        this.startRecognition(attempt)
      })
      return
    }
    r.lang = lang
    try {
      if (this.cleanTrack?.readyState === 'live') r.start(this.cleanTrack)
      else r.start()
      this.recActive = true
      // If the browser never confirms the mic is on (iPhones sometimes need a tap), say so
      // instead of showing "Listening" while nothing is heard.
      clearTimeout(this.startWatchdog)
      this.startWatchdog = setTimeout(() => {
        if (this.micOn || !this.listening || this.solved || this.paused) return
        this.noStartCount += 1
        this.hooks.log('MIC_NO_START', `attempt=${this.noStartCount}`)
        if (this.noStartCount === 1) {
          try { r.abort() } catch { /* not running */ }
          this.recActive = false
          this.micTimer = setTimeout(() => this.startRecognition(), 200)
          return
        }
        this.listening = false
        this.hooks.mic('idle', 'Tap to listen')
        this.hooks.feedback('Tap 🎤 to turn on the microphone', 'The phone needs a tap to start listening.', 'neutral')
      }, 2500)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'InvalidStateError') {
        // The browser says it's still running from before; treat it as running.
        this.recActive = true
        this.baseline = this.seenResults
        return
      }
      if (this.cleanTrack) {
        // This browser won't take a microphone track after all: use the normal microphone.
        this.hooks.log('MIC_FILTER', `off (${err instanceof Error ? err.name : 'error'})`)
        releaseCleanMic()
        this.cleanTrack = null
      }
      clearTimeout(this.micTimer)
      if (attempt < 8) this.micTimer = setTimeout(() => this.startRecognition(attempt + 1), 300)
      else this.hooks.log('MIC_START_FAILED', String(err))
    }
  }

  private dropCleanMic() {
    releaseCleanMic()
    this.cleanTrack = null
    this.cleanMicTried = false
  }

  /** hard: also switch the microphone off (while the coach talks, or when leaving the screen). */
  private stopListening(silent: boolean, hard = false) {
    this.listening = false
    clearTimeout(this.micTimer)
    if (!silent) this.hooks.mic('idle')
    if (hard && this.recognition && this.recActive) {
      try {
        this.recognition.stop()
      } catch {
        // not running
      }
    }
  }

}
