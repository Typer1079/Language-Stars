/**
 * Pronunciation help for the language paths: an easy "sounds like" with syllables marked, and the
 * small pieces Iris says one at a time when a learner keeps asking for help with a word.
 */
import type { SpanishEntry } from './wordBanks'

const VOWEL = /[aeiouàáâãäåāăǎèéêëēěìíîïīǐòóôõöōǒùúûüūǔǖǘǚǜ]/i
// Letter pairs that are one sound and start a syllable together.
const ONSETS = new Set(['ch', 'sh', 'th', 'ph', 'kh', 'gh', 'ng', 'ts', 'zh', 'ny', 'ly', 'lh', 'nh', 'gu', 'qu', 'tr', 'pr', 'br', 'gr', 'cr', 'dr', 'fr', 'pl', 'bl', 'cl', 'gl', 'fl', 'kr', 'kl', 'ky', 'gy', 'hy', 'my', 'ry', 'py', 'by', 'ss', 'jj', 'kk', 'pp', 'tt'])

/** "konnichiwa" → ["kon", "ni", "chi", "wa"]. Works on English-letter spellings of any language. */
export function syllables(word: string): string[] {
  const w = [...word]
  const nuclei: [number, number][] = []
  for (let i = 0; i < w.length; ) {
    if (VOWEL.test(w[i])) {
      let j = i
      while (j + 1 < w.length && VOWEL.test(w[j + 1])) j++
      nuclei.push([i, j])
      i = j + 1
    } else i++
  }
  if (nuclei.length <= 1) return [word]
  const cuts: number[] = []
  for (let k = 0; k + 1 < nuclei.length; k++) {
    const from = nuclei[k][1] + 1
    const to = nuclei[k + 1][0] // consonants are w[from .. to-1]
    const cons = w.slice(from, to).join('').toLowerCase()
    if (cons.length === 0) cuts.push(to)
    else if (cons.length === 1) cuts.push(from)
    // "ng" ends a syllable before another consonant (annyeong-ha, ting-ting).
    else if (cons.length > 2 && cons.startsWith('ng')) cuts.push(from + 2)
    else if (ONSETS.has(cons.slice(-2))) cuts.push(to - 2 >= from ? to - 2 : from)
    else cuts.push(to - 1)
  }
  const out: string[] = []
  let start = 0
  for (const c of cuts) {
    if (c > start) out.push(w.slice(start, c).join(''))
    start = c
  }
  out.push(w.slice(start).join(''))
  return out.filter(Boolean)
}

/** "kon-ni-chi-wa", "bom di-a": each word with its syllables joined by hyphens. */
export function soundsLike(text: string): string {
  return text.split(/\s+/).filter(Boolean).map((part) => {
    const lead = part.match(/^[^\p{L}]*/u)?.[0] ?? ''
    const tail = part.match(/[^\p{L}]*$/u)?.[0] ?? ''
    const core = part.slice(lead.length, part.length - tail.length)
    if (!core) return part
    return lead + core.split(/(['-])/).map((x) => (/^['-]$/.test(x) ? x : syllables(x).join('-'))).join('') + tail
  }).join(' ')
}

const KANA = /^[぀-ヿー\s、。？！?!]+$/
const SMALL = /[ゃゅょぁぃぅぇぉゎャュョァィゥェォヮー]/

/** Japanese kana split into beats: きょう → [きょ, う]; っ joins the next beat. */
function morae(kana: string): string[] {
  const out: string[] = []
  let carry = ''
  for (const ch of kana.replace(/[\s、。？！?!]/g, '')) {
    if (SMALL.test(ch) && out.length) out[out.length - 1] += ch
    else if (ch === 'っ' || ch === 'ッ') carry += ch
    else { out.push(carry + ch); carry = '' }
  }
  if (carry && out.length) out[out.length - 1] += carry
  return out
}

/**
 * The pieces Iris says one at a time, in the language's own voice: syllable blocks for Korean,
 * characters for Mandarin, kana beats for Japanese, words for everything else. Empty when the
 * answer is one short piece already.
 */
export function soundPieces(e: SpanishEntry, langName: string): string[] {
  const native = e.say ?? e.es
  const clean = (s: string) => s.replace(/[?!¿¡.,…、。？！؟]/g, ' ').trim()
  let pieces: string[]
  if (langName === 'Korean') pieces = [...clean(native)].filter((c) => /[가-힯]/.test(c))
  else if (langName === 'Mandarin') pieces = [...clean(native)].filter((c) => /[一-鿿]/.test(c))
  else if (langName === 'Japanese') {
    const kana = [native, ...e.variants].find((v) => KANA.test(v))
    pieces = kana ? morae(kana) : []
  } else pieces = clean(native).split(/\s+/).filter(Boolean)
  return pieces.length > 1 ? pieces.slice(0, 12) : []
}
