import { describe, expect, it } from 'vitest'
import { endRound, levelItems, newMilestone, pickRound, solveWord, unmasteredItems } from './progress'
import type { Learner } from './types'

const base: Learner = {
  id: 'x', display_name: 'Test', kind: 'child', age_group: '5-6', sticker_style: 'any', mode: 'reading',
  reading_level: 1, spanish_level: 1, reading_best: 1, spanish_best: 1, lifetime_stars: 0, spendable_stars: 0, mastered: {}, stickers: [],
}

describe('progress', () => {
  it('gives a star and marks an uncoached word mastered', () => {
    const item = levelItems(1, 'reading')[0]
    const r = solveWord(base, item, false)
    expect(r.learner.lifetime_stars).toBe(1)
    expect(r.learner.spendable_stars).toBe(1)
    expect(r.learner.mastered['1']).toEqual([item.key])
  })
  it('coached words earn a star but are not mastered', () => {
    const r = solveWord(base, levelItems(1, 'reading')[0], true)
    expect(r.learner.lifetime_stars).toBe(1)
    expect(r.learner.mastered['1']).toBeUndefined()
  })
  it('levels up with a level x 5 bonus after the last word', () => {
    const items = levelItems(2, 'spanish')
    const l: Learner = { ...base, mode: 'spanish', spanish_level: 2, mastered: { '2_es': items.slice(1).map((i) => i.key) } }
    const r = solveWord(l, items[0], false)
    expect(r.leveledUpTo).toBe(3)
    expect(r.bonus).toBe(10)
    expect(r.learner.spanish_level).toBe(3)
    expect(r.learner.lifetime_stars).toBe(11)
  })
  it('keeps going past the original five levels', () => {
    const items = levelItems(5, 'reading')
    const l: Learner = { ...base, reading_level: 5, mastered: { '5': items.slice(1).map((i) => i.key) } }
    const r = solveWord(l, items[0], false)
    expect(r.leveledUpTo).toBe(6)
    expect(r.learner.reading_level).toBe(6)
  })
  it('rounds skip mastered words, then repeat the level when all are mastered', () => {
    const items = levelItems(1, 'reading')
    const l: Learner = { ...base, mastered: { '1': items.slice(0, items.length - 2).map((i) => i.key) } }
    expect(unmasteredItems(l)).toHaveLength(2)
    expect(pickRound(l)).toHaveLength(2)
    const all: Learner = { ...base, mastered: { '1': items.map((i) => i.key) } }
    expect(pickRound(all)).toHaveLength(10)
  })
  it('detects newly reached milestones only', () => {
    expect(newMilestone(0, 1)).toBe(1)
    expect(newMilestone(4, 6)).toBe(5)
    expect(newMilestone(111, 112)).toBeNull()
  })
})

describe('moving down after a rough round', () => {
  const at = (lvl: number): Learner => ({ ...base, reading_level: lvl, reading_best: lvl, mastered: { [String(lvl)]: ['x'], [String(lvl - 1)]: ['y'], '3_es': ['keep'] } })
  it('steps down one level when fewer than 4 of 10 were said without help', () => {
    const r = endRound(at(12), 3, 10)
    expect(r.movedDownTo).toBe(11)
    expect(r.learner.reading_level).toBe(11)
    expect(r.learner.reading_best).toBe(12)
    expect(r.learner.mastered).toEqual({ '3_es': ['keep'] })
  })
  it('stays put on a decent round, a short round, or level 1', () => {
    expect(endRound(at(12), 4, 10).movedDownTo).toBeNull()
    expect(endRound(at(12), 0, 4).movedDownTo).toBeNull()
    expect(endRound({ ...base }, 0, 10).movedDownTo).toBeNull()
  })
  it('pays the level-up bonus only for a new best level', () => {
    const items = levelItems(11, 'reading')
    const l: Learner = { ...base, reading_level: 11, reading_best: 12, mastered: { '11': items.slice(1).map((i) => i.key) } }
    const r = solveWord(l, items[0], false)
    expect(r.leveledUpTo).toBe(12)
    expect(r.bonus).toBe(0)
  })
})
