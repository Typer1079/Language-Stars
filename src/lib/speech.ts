// Browser speech: recognition (the reader's voice) and synthesis (the coach's voice).
// Audio is handled by the browser's own speech service; this app never records or uploads it.

export interface VoiceSegment {
  text: string
  lang: 'en-US' | 'es-ES'
}

interface RecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  onstart: (() => void) | null
  onspeechstart: (() => void) | null
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}

type RecognitionCtor = new () => RecognitionLike

export function recognitionSupported(): boolean {
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor }
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition)
}

export function createRecognition(): RecognitionLike | null {
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor }
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition
  if (!Ctor) return null
  const r = new Ctor()
  r.continuous = true
  r.interimResults = true
  // Ask for several guesses: short words like "sun" often come back as "son" first.
  r.maxAlternatives = 5
  return r
}

export type { RecognitionLike }

function pickVoice(lang: string): SpeechSynthesisVoice | null {
  if (!('speechSynthesis' in window)) return null
  const voices = window.speechSynthesis.getVoices()
  const base = lang.slice(0, 2).toLowerCase()
  return (
    voices.find((v) => v.lang?.toLowerCase() === lang.toLowerCase()) ??
    voices.find((v) => v.lang?.toLowerCase().startsWith(base)) ??
    null
  )
}

export function primeVoices() {
  try {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.getVoices()
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices()
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
/** speed: 1 = normal coach pace; above 1 = brisker voice for adults and confident readers. */
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
    u.rate = (seg.lang === 'es-ES' ? 0.85 : 0.95) * speed
    u.pitch = 1.05
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
