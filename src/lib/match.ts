import { HOMOPHONE_VARIANTS } from './wordBanks'

/**
 * Extra sound-alikes for the short CVC words in Reading Level 2, where speech-to-text most often
 * writes a different real word ("hen" -> "hand", "pen" -> "pin", "sun" -> "son").
 */
const SHORT_WORD_SOUNDALIKES: Record<string, string[]> = {
  bat: ['bad', 'bet', 'but', 'pat', 'bath', 'batt'],
  cat: ['cut', 'cap', 'kat', 'kit', 'cad', 'caught'],
  dog: ['dug', 'doug', 'dock', 'dawg', 'dogs'],
  sun: ['son', 'sum', 'some', 'sunny', 'sung'],
  pig: ['big', 'peg', 'pick', 'pigs'],
  hop: ['hope', 'hip', 'hot', 'hub', 'hops', 'hap'],
  map: ['mop', 'mapp', 'nap', 'mob', 'mat'],
  pen: ['pin', 'pan', 'penn', 'ben', 'pain', 'pens', 'pend'],
  cup: ['cop', 'cap', 'cub', 'cups'],
  red: ['read', 'rid', 'rad', 'wed', 'ret'],
  box: ['bucks', 'backs', 'bots', 'books', 'bok'],
  fan: ['van', 'fun', 'fin', 'phan', 'fans'],
  jet: ['jeff', 'get', 'yet', 'jett', 'jets', 'chet'],
  mug: ['mag', 'mud', 'mog', 'mugs', 'mook'],
  van: ['fan', 'von', 'vin', 'ben', 'vans'],
  fox: ['fax', 'folks', 'socks', 'fogs', 'fawks'],
  hen: ['hand', 'ken', 'then', 'when', 'ten', 'hem', 'henn', 'hin', 'hun', 'hens'],
  jam: ['jim', 'gem', 'jamb', 'jem', 'cham', 'jams'],
  bed: ['bad', 'bid', 'bet', 'bread', 'bud', 'beds'],
  top: ['stop', 'tap', 'tops', 'tub', 'tip', 'taup'],
}

/** Consonant outline of a word ("hand" -> "hnd"), used to forgive vowel slips in short words. */
function consonants(w: string): string {
  return w
    .replace(/ph/g, 'f')
    .replace(/ck|[cq]/g, 'k')
    .replace(/x/g, 'ks')
    .replace(/[aeiouy']/g, '')
    .replace(/(.)\1+/g, '$1')
}

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
  const list = variants?.length ? variants.map(fold) : [...(HOMOPHONE_VARIANTS[target] ?? [target]), ...(SHORT_WORD_SOUNDALIKES[target] ?? [])]

  if (tokens.includes(target) || joined === target || cleaned.includes(target)) return true
  for (const v of list) {
    if (tokens.includes(v) || joined === v || (v.length >= 4 && cleaned.includes(v))) return true
  }
  for (const tok of tokens) {
    if (target.length >= 3 && editDistance(tok, target) <= 1) return true
  }
  // Short single words: same consonants, any vowel ("hen" / "hin" / "hand").
  if (!variants?.length && !target.includes(' ') && target.length >= 3 && target.length <= 5) {
    const key = consonants(target)
    if (key.length >= 2 && tokens.some((tok) => tok.length <= target.length + 1 && consonants(tok).startsWith(key))) return true
  }
  if (target.includes(' ')) return isPhraseMatch(transcript, targetWord)
  return false
}

// ---------------------------------------------------------------------------------------------
// Spanish: forgive an American accent
// ---------------------------------------------------------------------------------------------

/**
 * Spanish "sound key": spells a word the way it sounds, so spellings an English speaker's accent
 * produces in the transcript still line up ("baca" / "vaca", "ola" / "hola", "sapato" / "zapato",
 * "yamo" / "llamo", "kiero" / "quiero", "hente" / "gente").
 */
export function spanishKey(s: string): string {
  return fold(s)
    .replace(/[^a-z\s]/g, ' ')
    .replace(/ch/g, 'C')
    .replace(/ph/g, 'f')
    .replace(/h/g, '')
    .replace(/ll/g, 'y')
    .replace(/qu/g, 'k')
    .replace(/gu(?=[ei])/g, 'g')
    .replace(/g(?=[ei])/g, 'H')
    .replace(/j/g, 'H')
    .replace(/c(?=[ei])/g, 's')
    .replace(/[cq]/g, 'k')
    .replace(/z/g, 's')
    .replace(/v/g, 'b')
    .replace(/w/g, 'u')
    .replace(/x/g, 'ks')
    .replace(/y\b/g, 'i')
    .replace(/(.)\1+/g, '$1')
    .replace(/\s+/g, '')
}

/** Smallest edit distance between `needle` and any stretch of `hay` (extra words around it are fine). */
function bestWindowDistance(needle: string, hay: string): number {
  const prev = new Array<number>(hay.length + 1).fill(0)
  for (let i = 1; i <= needle.length; i++) {
    let diag = prev[0]
    prev[0] = i
    for (let j = 1; j <= hay.length; j++) {
      const up = prev[j]
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (needle[i - 1] === hay[j - 1] ? 0 : 1))
      diag = up
    }
  }
  return Math.min(...prev)
}

/** How many sound slips are forgiven: none for tiny words, about one in five for long ones. */
function spanishTolerance(len: number): number {
  if (len <= 3) return 0
  if (len <= 6) return 1
  if (len <= 10) return 2
  return Math.floor(len * 0.2)
}

/**
 * True when what was heard counts as the Spanish target, forgiving an English-speaking accent:
 * exact/variant matches first, then a sound-alike comparison of the whole thing.
 */
export function isSpanishMatch(transcript: string, target: string, variants?: string[]): boolean {
  if (isWordMatch(transcript, target, variants)) return true
  const t = spanishKey(target)
  const h = spanishKey(transcript)
  if (!t || !h) return false
  if (h === t || h.includes(t)) return true
  for (const v of variants ?? []) {
    const vk = spanishKey(v)
    if (vk.length >= 3 && (h === vk || h.includes(vk))) return true
  }
  // Too short to judge by sound (sí, no, tú): needs an exact match above.
  if (t.length <= 3) return false
  // Way too little was heard for a long target.
  if (h.length < t.length * 0.7) return false
  return bestWindowDistance(t, h) <= spanishTolerance(t.length)
}
