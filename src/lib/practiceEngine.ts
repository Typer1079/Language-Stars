import { isWordMatch } from './match'
import type { PracticeItem } from './progress'
import { createRecognition, speakSegments, cancelSpeech, IS_IOS, type RecognitionLike, type VoiceSegment } from './speech'
import type { Mode } from './types'
import { ENCOURAGING_NICKNAMES, PHONICS_SOUNDS } from './wordBanks'

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
}

// How each letter's sound is spoken by the browser voice (the screen shows the IPA symbol).
const SPOKEN_SOUNDS: Record<string, string> = {
  a: 'ah', b: 'buh', c: 'kuh', d: 'duh', e: 'eh', f: 'fuh', g: 'guh', h: 'huh', i: 'ih', j: 'juh',
  k: 'kuh', l: 'luh', m: 'muh', n: 'nuh', o: 'aw', p: 'puh', q: 'kwuh', r: 'ruh', s: 'sss', t: 'tuh',
  u: 'uh', v: 'vuh', w: 'wuh', x: 'ks', y: 'yuh', z: 'zzz',
}

const LISTEN_MS = 5200

/**
 * Runs one practice word: opens the microphone, listens for the word, and brings in the
 * AI coach (sound it out / Spanish example) when the reader needs help.
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
    return this.mode !== 'spanish'
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
    if (this.pace === 'brisk') {
      // No spoken welcome: straight to the first item.
      this.listenWindow(this.listenMs, this.onSilence(gen))
      return
    }
    this.hooks.feedback(spanish ? `Let's practice Spanish, ${this.name}!` : `Let's read together, ${this.name}!`, 'Listen to the welcome...', 'coach')
    const text = spanish
      ? `Welcome, ${this.name}! Look at the English word and say it in Spanish!`
      : `Let's read together, ${this.name}! Try the word on the screen!`
    this.say([{ text, lang: 'en-US' }], () => {
      if (gen !== this.gen || this.solved) return
      this.listenWindow(this.listenMs, this.onSilence(gen))
    })
  }

  begin(promptType: 'quick_listen' | 'gentle_callout' = 'quick_listen') {
    const gen = ++this.gen
    this.stopAll()
    this.gen = gen
    if (promptType === 'quick_listen' || this.pace === 'brisk') {
      this.listenWindow(this.listenMs, this.onSilence(gen))
      return
    }
    const callout = this.callout()
    const line =
      this.mode === 'spanish' && this.item?.spanish
        ? `"${this.item.spanish.en}" in Spanish, ${callout}!`
        : `Your turn, ${callout}!`
    this.say([{ text: line, lang: 'en-US' }], () => {
      if (gen !== this.gen || this.solved) return
      this.listenWindow(this.listenMs, this.onSilence(gen))
    })
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
    if (this.coachingActive || this.coachSpeaking || this.solved || this.paused || !this.item) return
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
      this.hooks.feedback(`Spanish Coach: "${es}"`, phraseEs ? `"${phraseEs}" (${phraseEn})` : `“${en}”`, 'coach')
      const intro: VoiceSegment[] = this.pace === 'brisk'
        ? [{ text: es, lang: 'es-ES' }]
        : phraseEs
        ? [
            { text: `In Spanish, ${en} is`, lang: 'en-US' },
            { text: es, lang: 'es-ES' },
            { text: 'For example:', lang: 'en-US' },
            { text: phraseEs, lang: 'es-ES' },
            { text: `which means: ${phraseEn} Your turn, ${callout}. Say`, lang: 'en-US' },
            { text: es, lang: 'es-ES' },
          ]
        : [
            // Phrases and sentences: say it, then once more for the reader to copy.
            { text: `In Spanish, ${en} is:`, lang: 'en-US' },
            { text: es, lang: 'es-ES' },
            { text: `Your turn, ${callout}. Listen once more:`, lang: 'en-US' },
            { text: es, lang: 'es-ES' },
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
    if (this.pace === 'brisk') {
      this.hooks.feedback(`AI Coach: "${word}"`, 'Listen, then say it', 'coach')
      this.coachSequence(gen, [{ text: word, lang: 'en-US' }], [{ text: word, lang: 'en-US' }], 'Next one!', word)
      return
    }
    if (word.includes(' ')) {
      // Phrases and sentences: read it together instead of sounding out letters.
      this.hooks.feedback('AI Coach: let’s read it together', word, 'coach')
      this.coachSequence(
        gen,
        [{ text: `Let's read it together, ${callout}. ${word} Now you try!`, lang: 'en-US' }],
        [{ text: `Try it again: ${word}`, lang: 'en-US' }],
        'Next one coming up!',
        word,
      )
      return
    }
    const letters = word.toLowerCase().split('')
    const shown = letters.map((ch) => PHONICS_SOUNDS[ch] ?? ch).join(' ')
    const spoken = letters.map((ch) => SPOKEN_SOUNDS[ch] ?? ch).join(', ')
    this.hooks.feedback(`AI Coach: "${word}"`, `${shown} → ${word}`, 'coach')
    this.coachSequence(
      gen,
      [{ text: `Let's sound it out, ${callout}: ${spoken}. The word is ${word}! Your turn: say ${word}!`, lang: 'en-US' }],
      [{ text: `Say ${word}, ${callout}!`, lang: 'en-US' }],
      'Next word coming up!',
      `Target: "${word}"`,
    )
  }

  /** After a coached success: praise, then continue. */
  praiseThen(next: () => void) {
    if (this.pace === 'brisk') return next()
    const word = this.item?.target ?? ''
    this.say(
      [
        { text: `Awesome job, ${this.callout()}! You said`, lang: 'en-US' },
        { text: word, lang: this.mode === 'spanish' ? 'es-ES' : 'en-US' },
      ],
      next,
    )
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
    this.hooks.mic('warming', 'Coach speaking...')
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
    this.voiceWatchdog = setTimeout(finish, 20000)
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
    if (this.mode === 'spanish' && this.item.spanish) {
      this.hooks.feedback(`Say "${this.item.spanish.en}" in Spanish!`, 'Listening until you say it • Shift shows the word • Space for the coach • Next to move on', 'listening')
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
      const all = [top, ...candidates.filter((c) => c.trim() !== top)]
      this.hooks.log('HEARD', `${all.map((c) => `"${c.trim()}"`).join(' / ')} target="${this.item.target}"`)
      const hit = all.find((c) => isWordMatch(c, this.item!.target, this.item!.spanish?.variants))
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
        this.hooks.feedback(prompt, `Heard “${top}”. Try again, still listening…`, 'listening')
      }
    }
    r.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        this.listening = false
        this.hooks.feedback('Microphone is blocked', 'Allow the microphone for this site in your browser settings, then tap Listen Now.', 'neutral')
      }
      this.hooks.log('MIC_ERR', e.error)
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
    const lang = this.mode === 'spanish' ? 'es-ES' : 'en-US'
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
    r.lang = lang
    try {
      r.start()
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
      clearTimeout(this.micTimer)
      if (attempt < 8) this.micTimer = setTimeout(() => this.startRecognition(attempt + 1), 300)
      else this.hooks.log('MIC_START_FAILED', String(err))
    }
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
