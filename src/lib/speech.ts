// Browser speech: recognition (the learner's voice) and synthesis (the coach's voice).
// Audio is handled by the browser's own speech service; this app never records or uploads it.

export interface VoiceSegment {
  text: string
  /** BCP-47 voice language: en-US, es-ES, fr-FR, ja-JP … */
  lang: string
  /** Slower or faster than normal for this part only (spelling words are said slowly). */
  rate?: number
}

interface RecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  onstart: (() => void) | null
  onspeechstart: (() => void) | null
  onaudiostart?: (() => void) | null
  onnomatch?: (() => void) | null
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal?: boolean }> }) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  /** Newer Chrome/Edge accept a microphone track, so the app can hand it a noise-suppressed one. */
  start(track?: MediaStreamTrack): void
  stop(): void
  abort(): void
}

type RecognitionCtor = new () => RecognitionLike

/** iPhone / iPad (including iPads that report as a Mac). */
export const IS_IOS =
  typeof navigator !== 'undefined' &&
  (/iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))

export function recognitionSupported(): boolean {
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor }
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition)
}

export function createRecognition(): RecognitionLike | null {
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor }
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition
  if (!Ctor) return null
  const r = new Ctor()
  // iPhone/iPad Safari is unreliable in continuous mode (it can stop returning results after the
  // first one), so there each utterance is its own short session and the app restarts it.
  r.continuous = !IS_IOS
  r.interimResults = true
  // Ask for several guesses: short words like "sun" often come back as "son" first.
  r.maxAlternatives = 5
  return r
}

export type { RecognitionLike }

// ---- noise-filtered microphone -------------------------------------------------------------
// Browsers can clean up the microphone (noise suppression, echo cancellation, steady volume)
// before speech recognition hears it. Newer Chrome and Edge let the app pass that cleaned-up
// track to the recognizer. iPhones/iPads use Apple's dictation, which filters noise on its own.

let cleanTrack: MediaStreamTrack | null = null
let pending: Promise<MediaStreamTrack | null> | null = null

/** True where the recognizer can take a microphone track (unprefixed SpeechRecognition, not iOS). */
export function canFilterNoise(): boolean {
  return !IS_IOS && typeof window !== 'undefined' && 'SpeechRecognition' in window && Boolean(navigator.mediaDevices?.getUserMedia)
}

/** A noise-suppressed microphone track, or null if the browser can't provide one. */
export function getCleanMicTrack(): Promise<MediaStreamTrack | null> {
  if (cleanTrack && cleanTrack.readyState === 'live') return Promise.resolve(cleanTrack)
  if (pending) return pending
  pending = navigator.mediaDevices
    .getUserMedia({ audio: { noiseSuppression: true, echoCancellation: true, autoGainControl: true, channelCount: 1 } })
    .then((stream) => {
      cleanTrack = stream.getAudioTracks()[0] ?? null
      return cleanTrack
    })
    .catch(() => null)
    .finally(() => { pending = null })
  return pending
}

/** Turns the filtered microphone off (leaving the screen, pop-ups, sign-out). */
export function releaseCleanMic() {
  try { cleanTrack?.stop() } catch { /* already stopped */ }
  cleanTrack = null
}

// Iris's voice: the most natural-sounding female voice the device has.
// Apple's "Premium"/"Enhanced" voices, Google's and Microsoft's "Natural" voices sound far less robotic.
const PREFERRED: Record<string, string[]> = {
  en: ['ava (premium)', 'zoe (premium)', 'ava (enhanced)', 'zoe (enhanced)', 'samantha (enhanced)', 'allison (enhanced)', 'susan (enhanced)',
    'microsoft ava online', 'microsoft aria online', 'microsoft jenny online', 'google us english', 'ava', 'samantha', 'allison', 'karen', 'moira', 'tessa', 'serena'],
  es: ['paulina (premium)', 'marisol (premium)', 'paulina (enhanced)', 'mónica (enhanced)', 'monica (enhanced)', 'microsoft elvira online', 'microsoft dalia online',
    'google español de estados unidos', 'google español', 'paulina', 'mónica', 'monica', 'marisol', 'angelica'],
}
// Novelty and robotic system voices to avoid.
const AVOID = /albert|bad news|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|fred|junior|ralph|grandpa|grandma|rocko|eddy|flo|reed|sandy|shelley/i

function voiceScore(v: SpeechSynthesisVoice, lang: string): number {
  const name = v.name.toLowerCase()
  const vl = (v.lang || '').toLowerCase().replace('_', '-')
  const base = lang.split('-')[0].toLowerCase()
  if (!vl.startsWith(base) || AVOID.test(name)) return -1
  let score = vl === lang.toLowerCase() ? 20 : 10
  const rank = (PREFERRED[base] ?? []).findIndex((p) => name.includes(p))
  if (rank >= 0) score += 100 - rank * 3
  if (/premium|enhanced|natural|neural/.test(name)) score += 40
  return score
}

const voiceCache: Record<string, SpeechSynthesisVoice | null> = {}

function pickVoice(lang: string): SpeechSynthesisVoice | null {
  if (!('speechSynthesis' in window)) return null
  if (voiceCache[lang] !== undefined) return voiceCache[lang]
  const voices = window.speechSynthesis.getVoices()
  let best: SpeechSynthesisVoice | null = null
  let bestScore = -1
  for (const v of voices) {
    const sc = voiceScore(v, lang)
    if (sc > bestScore) { best = v; bestScore = sc }
  }
  if (voices.length) voiceCache[lang] = best
  return best
}

/**
 * True when the device has a voice for this language (fil and tl both mean Tagalog). Unknown
 * (voices not loaded yet) counts as yes, so Iris tries the language voice first.
 */
export function hasVoice(lang: string): boolean {
  if (!('speechSynthesis' in window)) return false
  const voices = window.speechSynthesis.getVoices()
  if (!voices.length) return true
  const base = lang.split('-')[0].toLowerCase()
  const alt = base === 'fil' ? 'tl' : base === 'tl' ? 'fil' : base
  return voices.some((v) => { const b = (v.lang || '').toLowerCase().split(/[-_]/)[0]; return b === base || b === alt })
}

/** The voice Iris uses on this device (for the Account screen). */
export function irisVoiceName(): string {
  return pickVoice('en-US')?.name ?? 'device default'
}

export function primeVoices() {
  try {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.getVoices()
    window.speechSynthesis.onvoiceschanged = () => {
      for (const k of Object.keys(voiceCache)) delete voiceCache[k]
      window.speechSynthesis.getVoices()
    }
  } catch {
    // ignore
  }
}

export function cancelSpeech() {
  try {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
  } catch {
    // ignore
  }
}

/**
 * Speaks the segments in order (English and Spanish voices mixed), then calls done.
 * Returns a cancel function. done is called at most once, including on cancel.
 */
/** speed: 1 = normal coach pace; above 1 = brisker voice for adults and confident learners. */
export function speakSegments(segments: VoiceSegment[], done: () => void, speed = 1): () => void {
  let finished = false
  let cancelled = false
  const finish = () => {
    if (finished) return
    finished = true
    done()
  }
  if (!('speechSynthesis' in window) || segments.length === 0) {
    setTimeout(finish, 0)
    return () => {}
  }
  cancelSpeech()
  let i = 0
  const next = () => {
    if (cancelled) return
    if (i >= segments.length) return finish()
    const seg = segments[i++]
    const text = seg.text.trim()
    if (!text) return next()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = seg.lang
    const voice = pickVoice(seg.lang)
    if (voice) u.voice = voice
    // A touch brighter and closer to a normal speaking pace sounds warmer than slow and flat.
    u.rate = seg.rate ?? (seg.lang.startsWith('en') ? 1.0 : 0.9) * speed
    u.pitch = 1.1
    u.onend = next
    u.onerror = next
    window.speechSynthesis.speak(u)
  }
  next()
  return () => {
    cancelled = true
    cancelSpeech()
  }
}
