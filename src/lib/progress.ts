import type { Learner, Mode } from './types'
import { MAX_LEVEL, READING_LEVELS, SPANISH_LEVELS } from './curriculum'
import type { SpanishEntry } from './wordBanks'

/** One word to practice. `target` is what the reader must say out loud. */
export interface PracticeItem {
  /** Key used for mastery (the English word in both modes). */
  key: string
  target: string
  spanish?: SpanishEntry
}

export const ROUND_SIZE = 10

export function maxLevel(_mode?: Mode): number {
  return MAX_LEVEL
}

export function activeLevel(l: Pick<Learner, 'mode' | 'reading_level' | 'spanish_level'>): number {
  return l.mode === 'spanish' ? l.spanish_level : l.reading_level
}

export function masteryKey(level: number, mode: Mode): string {
  return mode === 'spanish' ? `${level}_es` : String(level)
}

export function levelItems(level: number, mode: Mode): PracticeItem[] {
  if (mode === 'spanish') {
    return (SPANISH_LEVELS[level] ?? SPANISH_LEVELS[1]).map((e) => ({ key: e.en.toLowerCase(), target: e.es, spanish: e }))
  }
  return (READING_LEVELS[level] ?? READING_LEVELS[1]).map((w) => ({ key: w.toLowerCase(), target: w }))
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
/**
 * A round is always 10 items when the level has them: words not yet mastered first,
 * topped up with already-mastered words from the same level as review.
 */
export function pickRound(l: Learner, rand: () => number = Math.random): PracticeItem[] {
  const level = activeLevel(l)
  const fresh = shuffle(unmasteredItems(l, level), rand)
  const freshKeys = new Set(fresh.map((i) => i.key))
  const review = shuffle(levelItems(level, l.mode).filter((i) => !freshKeys.has(i.key)), rand)
  return [...fresh, ...review].slice(0, ROUND_SIZE)
}

/** Challenge rounds: a short test a few levels up, offered after a perfect round. */
export const CHALLENGE_JUMP = 3
export const CHALLENGE_SIZE = 5
export const CHALLENGE_PASS = 4

export function pickChallenge(l: Learner, level: number, rand: () => number = Math.random): PracticeItem[] {
  return shuffle(levelItems(level, l.mode), rand).slice(0, CHALLENGE_SIZE)
}

export function setLevel(l: Learner, level: number): Learner {
  const lvl = Math.min(Math.max(1, Math.round(level) || 1), maxLevel(l.mode))
  return l.mode === 'spanish'
    ? { ...l, spanish_level: lvl, spanish_best: Math.max(l.spanish_best ?? 1, lvl) }
    : { ...l, reading_level: lvl, reading_best: Math.max(l.reading_best ?? 1, lvl) }
}

export function bestLevel(l: Pick<Learner, 'mode' | 'reading_best' | 'spanish_best' | 'reading_level' | 'spanish_level'>): number {
  return l.mode === 'spanish' ? Math.max(l.spanish_best ?? 1, l.spanish_level) : Math.max(l.reading_best ?? 1, l.reading_level)
}

/** Removes this mode's mastered lists for levels at or above `fromLevel` (or at or below, with `below`). */
function clearMastered(l: Learner, level: number, below: boolean): Record<string, string[]> {
  const spanish = l.mode === 'spanish'
  return Object.fromEntries(
    Object.entries(l.mastered).filter(([k]) => {
      if (k.endsWith('_es') !== spanish) return true
      const n = parseInt(k, 10)
      return below ? n > level : n < level
    }),
  )
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
export function solveWord(l: Learner, item: PracticeItem, coached: boolean, opts: { challenge?: boolean } = {}): SolveResult {
  let next: Learner = { ...l, lifetime_stars: l.lifetime_stars + 1, spendable_stars: l.spendable_stars + 1 }
  // Challenge items belong to a higher level: they earn a star but don't count toward this level.
  if (coached || opts.challenge) return { learner: next, leveledUpTo: null, bonus: 0 }

  const level = activeLevel(l)
  const key = masteryKey(level, l.mode)
  const list = next.mastered[key] ?? []
  if (!list.includes(item.key)) next = { ...next, mastered: { ...next.mastered, [key]: [...list, item.key] } }

  if (unmasteredItems(next, level).length === 0 && level < maxLevel(l.mode)) {
    // Bonus only for reaching a new high, so dropping back and re-climbing doesn't pay twice.
    const bonus = level + 1 > bestLevel(l) ? level * 5 : 0
    // Finished levels don't need their word lists any more; keep the record small.
    const mastered = clearMastered(next, level, true)
    next = setLevel({ ...next, mastered, lifetime_stars: next.lifetime_stars + bonus, spendable_stars: next.spendable_stars + bonus }, level + 1)
    return { learner: next, leveledUpTo: level + 1, bonus }
  }
  return { learner: next, leveledUpTo: null, bonus: 0 }
}

/** A round with fewer than 40% of its words said without help (coach or Skip) moves down a level. */
export const MOVE_DOWN_BELOW = 0.4
/** Rounds shorter than this don't count (e.g. only two words were left in a level). */
export const MIN_ROUND_FOR_MOVE_DOWN = 5

export interface RoundResult {
  learner: Learner
  movedDownTo: number | null
  /** Moved up a level (perfect round) or jumped ahead (challenge passed). */
  movedUpTo?: number | null
  bonus?: number
  /** After a perfect round: try a short challenge at this level next. */
  challengeAt?: number | null
  challenge?: 'passed' | 'missed' | null
}

function withBonus(l: Learner, bonus: number): Learner {
  return bonus ? { ...l, lifetime_stars: l.lifetime_stars + bonus, spendable_stars: l.spendable_stars + bonus } : l
}

/** Moves up to `to` (clearing finished levels' lists); bonus only when it's a new best level. */
function moveUp(l: Learner, to: number): { learner: Learner; bonus: number } {
  const from = activeLevel(l)
  const bonus = to > bestLevel(l) ? (to - 1) * 5 : 0
  const mastered = clearMastered(l, to - 1, true)
  return { learner: withBonus(setLevel({ ...l, mastered }, to), bonus), bonus: from === to ? 0 : bonus }
}

/**
 * End of a round: a rough round (lots of skips or coach help) means some of this level hasn't
 * stuck yet, so step back one level to practice it again. The reader climbs back up the same
 * way as before, by mastering every item in that level. Stars are never taken away.
 */
export function endRound(l: Learner, clean: number, attempts: number, opts: { challengeLevel?: number | null } = {}): RoundResult {
  const level = activeLevel(l)
  const top = maxLevel(l.mode)

  // Result of a challenge round.
  if (opts.challengeLevel) {
    if (clean >= CHALLENGE_PASS && opts.challengeLevel > level) {
      const up = moveUp(l, opts.challengeLevel)
      return { learner: up.learner, movedDownTo: null, movedUpTo: opts.challengeLevel, bonus: up.bonus, challenge: 'passed' }
    }
    return { learner: l, movedDownTo: null, challenge: 'missed' }
  }

  // Perfect full round with no coach help: move up now, then offer a challenge a few levels higher.
  if (attempts >= ROUND_SIZE && clean === attempts && level < top) {
    const up = moveUp(l, level + 1)
    const target = Math.min(level + CHALLENGE_JUMP, top)
    return { learner: up.learner, movedDownTo: null, movedUpTo: level + 1, bonus: up.bonus, challengeAt: target > level + 1 ? target : null }
  }

  if (attempts < MIN_ROUND_FOR_MOVE_DOWN || level <= 1 || clean / attempts >= MOVE_DOWN_BELOW) return { learner: l, movedDownTo: null }
  const lower = level - 1
  const mastered = clearMastered(l, lower, false)
  return { learner: setLevel({ ...l, mastered }, lower), movedDownTo: lower }
}

/** Lifetime-star milestones that open the sticker shop. */
export const MILESTONES = [1, 5, 10]

export function newMilestone(before: number, after: number): number | null {
  for (const m of MILESTONES) if (before < m && after >= m) return m
  return null
}
