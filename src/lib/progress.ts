import type { Learner, Mode } from './types'
import { SPANISH_WORD_BANKS, WORD_BANKS, type SpanishEntry } from './wordBanks'

/** One word to practice. `target` is what the reader must say out loud. */
export interface PracticeItem {
  /** Key used for mastery (the English word in both modes). */
  key: string
  target: string
  spanish?: SpanishEntry
}

export const ROUND_SIZE = 10

export function maxLevel(mode: Mode): number {
  return mode === 'spanish' ? Math.max(...Object.keys(SPANISH_WORD_BANKS).map(Number)) : Math.max(...Object.keys(WORD_BANKS).map(Number))
}

export function activeLevel(l: Pick<Learner, 'mode' | 'reading_level' | 'spanish_level'>): number {
  return l.mode === 'spanish' ? l.spanish_level : l.reading_level
}

export function masteryKey(level: number, mode: Mode): string {
  return mode === 'spanish' ? `${level}_es` : String(level)
}

export function levelItems(level: number, mode: Mode): PracticeItem[] {
  if (mode === 'spanish') {
    return (SPANISH_WORD_BANKS[level] ?? SPANISH_WORD_BANKS[1]).map((e) => ({ key: e.en.toLowerCase(), target: e.es, spanish: e }))
  }
  return (WORD_BANKS[level] ?? WORD_BANKS[1]).map((w) => ({ key: w.toLowerCase(), target: w }))
}

export function unmasteredItems(l: Learner, level = activeLevel(l)): PracticeItem[] {
  const done = new Set((l.mastered[masteryKey(level, l.mode)] ?? []).map((w) => w.toLowerCase()))
  return levelItems(level, l.mode).filter((it) => !done.has(it.key))
}

export function shuffle<T>(arr: T[], rand: () => number = Math.random): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/** Up to 10 words the reader hasn't mastered yet; the whole level again once all are mastered. */
export function pickRound(l: Learner, rand: () => number = Math.random): PracticeItem[] {
  const level = activeLevel(l)
  let pool = unmasteredItems(l, level)
  if (pool.length === 0) pool = levelItems(level, l.mode)
  return shuffle(pool, rand).slice(0, ROUND_SIZE)
}

export function setLevel(l: Learner, level: number): Learner {
  const lvl = Math.min(Math.max(1, Math.round(level) || 1), maxLevel(l.mode))
  return l.mode === 'spanish' ? { ...l, spanish_level: lvl } : { ...l, reading_level: lvl }
}

export interface SolveResult {
  learner: Learner
  leveledUpTo: number | null
  bonus: number
}

/**
 * A word was said correctly: +1 star. Words said without the coach's help count as mastered.
 * Mastering every word in a level moves up a level with a bonus of (level x 5) stars.
 */
export function solveWord(l: Learner, item: PracticeItem, coached: boolean): SolveResult {
  let next: Learner = { ...l, lifetime_stars: l.lifetime_stars + 1, spendable_stars: l.spendable_stars + 1 }
  if (coached) return { learner: next, leveledUpTo: null, bonus: 0 }

  const level = activeLevel(l)
  const key = masteryKey(level, l.mode)
  const list = next.mastered[key] ?? []
  if (!list.includes(item.key)) next = { ...next, mastered: { ...next.mastered, [key]: [...list, item.key] } }

  if (unmasteredItems(next, level).length === 0 && level < maxLevel(l.mode)) {
    const bonus = level * 5
    next = setLevel({ ...next, lifetime_stars: next.lifetime_stars + bonus, spendable_stars: next.spendable_stars + bonus }, level + 1)
    return { learner: next, leveledUpTo: level + 1, bonus }
  }
  return { learner: next, leveledUpTo: null, bonus: 0 }
}

/** Lifetime-star milestones that open the sticker shop. */
export const MILESTONES = [1, 5, 10]

export function newMilestone(before: number, after: number): number | null {
  for (const m of MILESTONES) if (before < m && after >= m) return m
  return null
}
