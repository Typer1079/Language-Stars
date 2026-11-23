import { isWordMatch } from './match'
import type { PracticeItem } from './progress'
import { createRecognition, speakSegments, cancelSpeech, type RecognitionLike, type VoiceSegment } from './speech'
import type { Mode } from './types'
import { ENCOURAGING_NICKNAMES, PHONICS_SOUNDS } from './wordBanks'

export type Tone = 'neutral' | 'listening' | 'success' | 'coach'
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

  private solved = false
  private usedCoach = false
  private listening = false
  private coachSpeaking = false
  private coachingActive = false
  private paused = false
  private gen = 0
  private lastCoachEnd = 0

  private recognition: RecognitionLike | null = null
  private cancelVoice: (() => void) | null = null
  private turnTimer: ReturnType<typeof setTimeout> | undefined
  private micTimer: ReturnType<typeof setTimeout> | undefined
  private voiceWatchdog: ReturnType<typeof setTimeout> | undefined

  constructor(hooks: EngineHooks) {
    this.hooks = hooks
  }

  get isCoaching(): boolean {
    return this.coachingActive || this.coachSpeaking
  }

  /** Show a new word (does not start listening). */
  load(item: PracticeItem, mode: Mode, name: string) {
    this.stopAll()
    this.item = item
    this.mode = mode
    this.name = name
    this.solved = false
    this.usedCoach = false
  }

  setPaused(paused: boolean) {
    this.paused = paused
    if (paused) this.stopAll()
  }

  /** Coming back from the sticker shop: listen again, then coach. */
  resume() {
    this.paused = false
    if (!this.solved) this.listenWindow(5000, () => this.coach())
  }

  welcome() {
    const gen = ++this.gen
    this.stopAll()
    this.gen = gen
    const spanish = this.mode === 'spanish'
    this.hooks.feedback(spanish ? `Let's practice Spanish, ${this.name}!` : `Let's read together, ${this.name}!`, 'Listen to the welcome...', 'coach')
    const text = spanish
      ? `Welcome, ${this.name}! Look at the English word and say it in Spanish!`
      : `Let's read together, ${this.name}! Try the word on the screen!`
    this.say([{ text, lang: 'en-US' }], () => {
      if (gen !== this.gen || this.solved) return
      this.listenWindow(LISTEN_MS, () => gen === this.gen && this.coach())
    })
  }

  begin(promptType: 'quick_listen' | 'gentle_callout' = 'quick_listen') {
    const gen = ++this.gen
    this.stopAll()
    this.gen = gen
    if (promptType === 'quick_listen') {
      this.listenWindow(LISTEN_MS, () => gen === this.gen && !this.solved && this.coach())
      return
    }
    const callout = this.callout()
    const line =
      this.mode === 'spanish' && this.item?.spanish
        ? `"${this.item.spanish.en}" in Spanish, ${callout}!`
        : `Your turn, ${callout}!`
    this.say([{ text: line, lang: 'en-US' }], () => {
      if (gen !== this.gen || this.solved) return
      this.listenWindow(LISTEN_MS, () => gen === this.gen && !this.solved && this.coach())
    })
  }

  /** Listen Now / Return key. */
  listenNow() {
    if (this.paused || this.solved) return
    this.stopVoice()
    this.coachingActive = false
    this.listenWindow(LISTEN_MS, () => !this.solved && !this.paused && this.coach())
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
      this.hooks.feedback(`Spanish Coach: "${es}"`, `"${phraseEs}" (${phraseEn})`, 'coach')
      const intro: VoiceSegment[] = [
        { text: `In Spanish, ${en} is`, lang: 'en-US' },
        { text: es, lang: 'es-ES' },
        { text: 'For example:', lang: 'en-US' },
        { text: phraseEs, lang: 'es-ES' },
        { text: `which means: ${phraseEn} Your turn, ${callout}. Say`, lang: 'en-US' },
        { text: es, lang: 'es-ES' },
      ]
      const retry: VoiceSegment[] = [
        { text: 'Try', lang: 'en-US' },
        { text: es, lang: 'es-ES' },
        { text: `one more time, ${callout}!`, lang: 'en-US' },
      ]
      this.coachSequence(gen, intro, retry, 'Let’s move to the next word!', `"${en}" is "${es}"`)
      return
    }

    const word = item.target
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
      this.listenWindow(LISTEN_MS, () => {
        if (gen !== this.gen || this.solved) {
          this.coachingActive = false
          return
        }
        this.say(retry, () => {
          this.coachingActive = false
          if (gen !== this.gen || this.solved) return
          this.listenWindow(LISTEN_MS, () => {
            if (gen === this.gen && !this.solved) {
              this.hooks.feedback(giveUpTitle, giveUpSub, 'coach')
              this.turnTimer = setTimeout(() => this.hooks.advance(true), 800)
            }
          })
        })
      })
    })
  }

  private callout(): string {
    if (Math.random() < 0.35 && this.name) return this.name
    return ENCOURAGING_NICKNAMES[Math.floor(Math.random() * ENCOURAGING_NICKNAMES.length)]
  }

  private say(segments: VoiceSegment[], onEnd?: () => void) {
    this.stopListening(true)
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
      if (onEnd) setTimeout(onEnd, 120)
    }
    this.voiceWatchdog = setTimeout(finish, 20000)
    this.cancelVoice = speakSegments(segments, finish)
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
      this.hooks.feedback(`Say "${this.item.spanish.en}" in Spanish!`, 'Press Shift to reveal the Spanish word • Listening...', 'listening')
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
      if (!this.listening || this.coachSpeaking) return
      this.hooks.mic('listening', 'Listening...')
      this.hooks.log('MIC_STARTED', `lang=${r.lang}`)
    }
    r.onspeechstart = () => {
      if (this.listening && !this.coachSpeaking) this.hooks.mic('listening', 'Hearing voice...')
    }
    r.onresult = (event) => {
      if (!this.listening || this.coachSpeaking || this.solved || this.paused || !this.item) return
      if (Date.now() - this.lastCoachEnd < 320) return // the coach's own voice echoing
      let heard = ''
      for (let i = event.resultIndex; i < event.results.length; i++) heard += ' ' + (event.results[i][0]?.transcript ?? '')
      heard = heard.trim()
      if (!heard) return
      this.hooks.log('HEARD', `"${heard}" target="${this.item.target}"`)
      if (isWordMatch(heard, this.item.target, this.item.spanish?.variants)) {
        this.solved = true
        const coached = this.usedCoach
        this.stopAll()
        this.hooks.solved(heard, coached)
      }
    }
    r.onerror = (e) => {
      clearTimeout(this.micTimer)
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        this.listening = false
        this.hooks.feedback('Microphone is blocked', 'Allow the microphone for this site in your browser settings, then tap Listen Now.', 'neutral')
      }
      if (e.error !== 'no-speech' && e.error !== 'aborted') this.hooks.log('MIC_ERR', e.error)
    }
    r.onend = () => {
      clearTimeout(this.micTimer)
      if (this.listening && !this.coachSpeaking && !this.solved && !this.paused) {
        this.micTimer = setTimeout(() => {
          if (this.listening && !this.coachSpeaking && !this.solved && !this.paused) this.startRecognition()
        }, 220)
      } else if (!this.listening) {
        this.hooks.mic('idle')
      }
    }
    this.recognition = r
    return r
  }

  private startRecognition() {
    const r = this.ensureRecognition()
    if (!r || this.coachSpeaking) return
    r.lang = this.mode === 'spanish' ? 'es-ES' : 'en-US'
    try {
      r.start()
    } catch {
      clearTimeout(this.micTimer)
      this.micTimer = setTimeout(() => {
        if (this.listening && !this.coachSpeaking && !this.solved) {
          try {
            r.start()
          } catch {
            // already running
          }
        }
      }, 350)
    }
  }

  private stopListening(silent: boolean) {
    this.listening = false
    clearTimeout(this.micTimer)
    if (!silent) this.hooks.mic('idle')
    if (this.recognition) {
      try {
        this.recognition.stop()
      } catch {
        // not running
      }
    }
  }
}
