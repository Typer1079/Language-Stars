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
  return false
}
