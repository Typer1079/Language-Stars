/**
 * Spelling bee listening: turns what the microphone heard ("C A T", "see ay tee", "double you")
 * into letters, and judges them against the word, letter by letter.
 */

const LETTER_NAMES: Record<string, string> = {
  a: 'a', ay: 'a', eh: 'a', hey: 'a',
  b: 'b', be: 'b', bee: 'b',
  c: 'c', see: 'c', sea: 'c', si: 'c', cee: 'c',
  d: 'd', dee: 'd', di: 'd',
  e: 'e', ee: 'e',
  f: 'f', ef: 'f', eff: 'f',
  g: 'g', gee: 'g', ji: 'g', jee: 'g',
  h: 'h', aitch: 'h', haitch: 'h', ach: 'h',
  i: 'i', eye: 'i', aye: 'i',
  j: 'j', jay: 'j',
  k: 'k', kay: 'k', cay: 'k',
  l: 'l', el: 'l', ell: 'l',
  m: 'm', em: 'm',
  n: 'n', en: 'n',
  o: 'o', oh: 'o', owe: 'o',
  p: 'p', pee: 'p', pea: 'p',
  q: 'q', queue: 'q', cue: 'q', kew: 'q', kyu: 'q',
  r: 'r', are: 'r', ar: 'r', arr: 'r',
  s: 's', es: 's', ess: 's',
  t: 't', tee: 't', tea: 't', ti: 't',
  u: 'u', you: 'u', yu: 'u', yoo: 'u',
  v: 'v', vee: 'v', vi: 'v',
  w: 'w',
  x: 'x', ex: 'x', ecks: 'x',
  y: 'y', why: 'y', wye: 'y',
  z: 'z', zee: 'z', zed: 'z',
}

export type BeeRequest = 'repeat' | 'definition' | 'pos' | 'sentence' | 'origin'

/** A spoken request, as the National Spelling Bee allows: "definition", "part of speech", "sentence", "origin", "repeat". */
export function beeRequest(transcript: string): BeeRequest | null {
  const t = transcript.toLowerCase()
  if (/part of speech|what part|is it a (noun|verb)/.test(t)) return 'pos'
  if (/definition|define|what does it mean|what does that mean|meaning/.test(t)) return 'definition'
  if (/sentence|use it in/.test(t)) return 'sentence'
  if (/origin|where does it come from|what language|etymology/.test(t)) return 'origin'
  if (/repeat|say it again|say the word|one more time|pronounce|pronunciation|can you say/.test(t)) return 'repeat'
  return null
}

/** Words that mean "let me start this word again". */
export function wantsRestart(transcript: string): boolean {
  return /\b(start over|start again|restart|begin again)\b/i.test(transcript)
}

/** The letters in what was heard. The word itself (said before and after spelling) is skipped. */
export function extractLetters(transcript: string, target: string): string[] {
  const word = target.toLowerCase()
  const toks = transcript
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[.,;:!?"“”()]/g, ' ')
    .replace(/-/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
  const out: string[] = []
  for (let i = 0; i < toks.length; i++) {
    const raw = toks[i].replace(/[^A-Za-z']/g, '')
    if (!raw) continue
    const low = raw.toLowerCase().replace(/'/g, '')
    // "double you" / "double u" = w
    if (low === 'double' && i + 1 < toks.length && /^(u|you|yu|yoo)$/i.test(toks[i + 1])) { out.push('w'); i++; continue }
    if (/^(doubleu|doubleyou|dub|dubya)$/.test(low)) { out.push('w'); continue }
    // Some phones write spelled letters as one capitalized run: "CAT".
    if (raw.length >= 2 && raw === raw.toUpperCase() && /^[A-Z]+$/.test(raw)) { out.push(...low.split('')); continue }
    if (low === word && raw.length > 1) continue
    if (LETTER_NAMES[low]) { out.push(LETTER_NAMES[low]); continue }
    // Anything else (um, okay, "the word is") is ignored.
  }
  return out
}

export type SpellJudgement = 'empty' | 'partial' | 'correct' | 'wrong'

export function judgeSpelling(letters: string[], target: string): SpellJudgement {
  const t = target.toLowerCase().replace(/[^a-z]/g, '')
  const s = letters.join('')
  if (!s) return 'empty'
  if (s === t) return 'correct'
  if (t.startsWith(s)) return 'partial'
  return 'wrong'
}

/** "c-a-t" style text for showing or saying a spelling. */
export function spelledOut(word: string): string {
  return word.toUpperCase().split('').join('-')
}

/** What Iris says to spell a word aloud: each letter on its own ("C. A. T."). */
export function sayLetters(word: string): string {
  return word.toUpperCase().split('').map((c) => (c === 'A' ? 'Ay' : c)).join('. ') + '.'
}
