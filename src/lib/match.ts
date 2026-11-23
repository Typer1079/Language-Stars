import { HOMOPHONE_VARIANTS } from './wordBanks'

function fold(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

export function editDistance(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...new Array<number>(b.length).fill(0)])
  for (let j = 0; j <= b.length; j++) dp[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
    }
  }
  return dp[a.length][b.length]
}

function tokens(s: string): string[] {
  return fold(s)
    .replace(/[^a-z0-9'\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

/** Two words count as the same if equal, or one letter off for longer words (speech-to-text slips). */
function sameWord(a: string, b: string): boolean {
  if (a === b) return true
  if (a.length >= 4 && b.length >= 4) return editDistance(a, b) <= 1
  return false
}

/** Fraction of the target's words that were heard, in order (longest common subsequence). */
export function phraseScore(heard: string, target: string): number {
  const h = tokens(heard)
  const t = tokens(target)
  if (t.length === 0 || h.length === 0) return 0
  const dp = Array.from({ length: h.length + 1 }, () => new Array<number>(t.length + 1).fill(0))
  for (let i = 1; i <= h.length; i++) {
    for (let j = 1; j <= t.length; j++) {
      dp[i][j] = sameWord(h[i - 1], t[j - 1]) ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1])
    }
  }
  return dp[h.length][t.length] / t.length
}

// Spanish drops subject pronouns freely ("Ella quiere..." / "Quiere..."), so a leading one is optional.
const OPTIONAL_LEAD = new Set(['yo', 'el', 'ella', 'nosotros', 'ellos', 'ellas', 'usted'])

/**
 * True when a multi-word phrase or sentence was read / said well enough: every word for short
 * phrases (one small slip allowed), at least 85% of the words in order for longer sentences.
 */
export function isPhraseMatch(heard: string, target: string): boolean {
  const t = tokens(target)
  const need = t.length <= 3 ? 1 : 0.85
  if (phraseScore(heard, target) >= need) return true
  if (t.length > 1 && OPTIONAL_LEAD.has(t[0])) return phraseScore(heard, t.slice(1).join(' ')) >= need
  return false
}

/**
 * True when what the microphone heard counts as the target word.
 * Accepts accents left off, sound-alike words, and one-letter slips for words of 3+ letters.
 * `variants` (Spanish mode) replaces the built-in English sound-alike list.
 */
export function isWordMatch(transcript: string, targetWord: string, variants?: string[]): boolean {
  if (!transcript || !targetWord) return false
  const target = fold(targetWord).trim()
  const cleaned = fold(transcript).replace(/[^a-z'\s]/g, ' ').trim()
  if (!cleaned) return false

  const tokens = cleaned.split(/\s+/)
  const joined = tokens.join('')
  const list = variants?.length ? variants.map(fold) : HOMOPHONE_VARIANTS[target] ?? [target]

  if (tokens.includes(target) || joined === target || cleaned.includes(target)) return true
  for (const v of list) {
    if (tokens.includes(v) || joined === v || cleaned.includes(v)) return true
  }
  for (const tok of tokens) {
    if (target.length >= 3 && editDistance(tok, target) <= 1) return true
  }
  if (target.includes(' ')) return isPhraseMatch(transcript, targetWord)
  return false
}
