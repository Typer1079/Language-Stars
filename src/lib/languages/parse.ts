import type { SpanishEntry } from '../wordBanks'
import { CONCEPTS } from './concepts'

/**
 * Turns a language's translation list into levels. One line per item, in the same order as
 * CONCEPTS, with a "# <level>" line before each level:
 *
 *   native | romanized ; other accepted answer ; another
 *
 * "native" is what speech recognition writes (こんにちは, 你好, سلام). "romanized" is what the
 * learner sees (konnichiwa); leave it out for languages written in English letters. Anything after
 * ";" is also accepted when said (other spellings, kanji/kana forms, digits).
 */
export function parseLanguage(langName: string, data: string): Record<number, SpanishEntry[]> {
  const out: Record<number, SpanishEntry[]> = {}
  let level = 0
  let i = 0
  for (const raw of data.split('\n')) {
    const line = raw.trim()
    if (!line) continue
    const head = /^#\s*(\d+)/.exec(line)
    if (head) {
      level = Number(head[1])
      out[level] = []
      i = 0
      continue
    }
    const theme = CONCEPTS[level - 1]
    if (!theme) throw new Error(`${langName}: item before a level header: ${line}`)
    const en = theme.items[i++]
    if (en === undefined) throw new Error(`${langName} level ${level}: too many items (${line})`)
    const [main, ...variants] = line.split(';').map((s) => s.trim()).filter(Boolean)
    const [native, roman] = main.split('|').map((s) => s.trim())
    out[level].push({
      en: en.replaceAll('{lang}', langName),
      es: roman || native,
      say: roman ? native : undefined,
      phonetic: '',
      phraseEs: '',
      phraseEn: '',
      variants,
    })
  }
  return out
}
