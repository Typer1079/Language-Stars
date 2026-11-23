import { describe, expect, it } from 'vitest'
import { levelItems, newMilestone, pickRound, solveWord, unmasteredItems } from './progress'
import type { Learner } from './types'

const base: Learner = {
  id: 'x', display_name: 'Test', kind: 'child', age_group: '5-6', sticker_style: 'any', mode: 'reading',
  reading_level: 1, spanish_level: 1, lifetime_stars: 0, spendable_stars: 0, mastered: {}, stickers: [],
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
  it('does not level past the top level', () => {
    const items = levelItems(5, 'reading')
    const l: Learner = { ...base, reading_level: 5, mastered: { '5': items.slice(1).map((i) => i.key) } }
    const r = solveWord(l, items[0], false)
    expect(r.leveledUpTo).toBeNull()
    expect(r.learner.reading_level).toBe(5)
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
