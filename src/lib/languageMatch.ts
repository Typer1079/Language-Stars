import { answerScore, isSpanishMatch } from './match'
import type { PracticeItem } from './progress'
import type { LanguageInfo } from './subjects'

const answers = (it: PracticeItem) => [it.target, ...(it.spanish?.variants ?? [])]

/** How well `heard` fits this item (0 = not at all). */
function score(heard: string, it: PracticeItem, lang: LanguageInfo): number {
  if (lang.name === 'Spanish') {
    // Spanish keeps its accent-forgiving sound-alike check (built for English speakers).
    return isSpanishMatch(heard, it.target, it.spanish?.variants) ? Math.max(answerScore(heard, answers(it), 'latin'), 0.25) : 0
  }
  const s = answerScore(heard, answers(it), lang.script)
  if (s || lang.script === 'latin' || !/[a-z]/i.test(heard) || !it.spanish) return s
  // Some recognizers write a short answer in English letters ("hai", "ok").
  return answerScore(heard, [it.spanish.es], 'latin')
}

/**
 * Does what was heard count as this language item? It must fit the item, and fit it at least as well
 * as any other item of the same level, so "grandfather" isn't taken for "father" and "I don't like
 * it" isn't taken for "I like it".
 */
export function isLanguageAnswer(heard: string, it: PracticeItem, rivals: PracticeItem[], lang: LanguageInfo): boolean {
  const mine = score(heard, it, lang)
  if (!mine) return false
  for (const r of rivals) {
    if (r.key === it.key || r.target === it.target) continue
    const theirs = lang.name === 'Spanish' ? answerScore(heard, answers(r), 'latin') : score(heard, r, lang)
    if (theirs > mine) return false
  }
  return true
}
