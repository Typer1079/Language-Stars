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
    expect(pickRound(l)).toHaveLength(10) // 2 new + 8 review
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

describe('full rounds and the fast lane', () => {
  it('always fills a round to 10, reviewing mastered words when few are left', () => {
    const items = levelItems(1, 'reading')
    const l: Learner = { ...base, mastered: { '1': items.slice(0, items.length - 2).map((i) => i.key) } }
    const round = pickRound(l)
    expect(round).toHaveLength(10)
    const fresh = items.slice(-2).map((i) => i.key)
    expect(round.slice(0, 2).map((i) => i.key).sort()).toEqual(fresh.sort())
  })
  it('a perfect round moves up a level and offers a challenge 3 levels up', () => {
    const l: Learner = { ...base, reading_level: 20, reading_best: 20 }
    const r = endRound(l, 10, 10)
    expect(r.movedUpTo).toBe(21)
    expect(r.learner.reading_level).toBe(21)
    expect(r.bonus).toBe(100)
    expect(r.challengeAt).toBe(23)
  })
  it('passing a challenge jumps ahead; missing it keeps the earned level', () => {
    const l: Learner = { ...base, reading_level: 21, reading_best: 21 }
    const pass = endRound(l, 4, 5, { challengeLevel: 23 })
    expect(pass.challenge).toBe('passed')
    expect(pass.learner.reading_level).toBe(23)
    expect(pass.learner.reading_best).toBe(23)
    const miss = endRound(l, 3, 5, { challengeLevel: 23 })
    expect(miss.challenge).toBe('missed')
    expect(miss.learner.reading_level).toBe(21)
    expect(miss.movedDownTo).toBeNull()
  })
  it('challenge items earn stars but never count toward mastery', () => {
    const r = solveWord({ ...base, reading_level: 21 }, levelItems(23, 'reading')[0], false, { challenge: true })
    expect(r.learner.lifetime_stars).toBe(1)
    expect(r.learner.mastered).toEqual({})
  })
  it('no challenge past level 100', () => {
    const r = endRound({ ...base, reading_level: 99, reading_best: 99 }, 10, 10)
    expect(r.movedUpTo).toBe(100)
    expect(r.challengeAt).toBeNull()
  })
})

import { pickRound as _pickRound, endRound as _endRound, solveWord as _solveWord, levelItems as _levelItems, STRETCH_STEPS as _ST } from './progress'
import type { Learner as _L } from './types'
describe('faster progress', () => {
  const base: _L = { id: 'x', display_name: 'T', kind: 'child', age_group: '7-8', sticker_style: 'any', mode: 'reading',
    reading_level: 10, spanish_level: 1, reading_best: 10, spanish_best: 1, lifetime_stars: 0, spendable_stars: 0, mastered: {}, stickers: [] }
  it('mixes 3 higher-level items into every round of 10', () => {
    const r = _pickRound(base)
    expect(r).toHaveLength(10)
    expect(r.filter((i) => i.stretchLevel).map((i) => i.stretchLevel)).toEqual(_ST.map((s) => 10 + s))
  })
  it('moves up after 8 of 10 mastered', () => {
    let l = base
    const items = _levelItems(10, 'reading')
    let up: number | null = null
    for (let i = 0; i < 8; i++) up = _solveWord(l = _solveWord(l, items[i], false).learner, items[i], false).leveledUpTo ?? up
    expect(l.reading_level === 11 || up === 11).toBe(true)
  })
  it('jumps ahead when the stretch items are easy', () => {
    expect(_endRound(base, 5, 7, { stretchCleared: [12, 14] }).learner.reading_level).toBe(12)
    expect(_endRound(base, 5, 7, { stretchCleared: [12, 14, 16] }).learner.reading_level).toBe(16)
    expect(_endRound(base, 5, 7, { stretchCleared: [12] }).learner.reading_level).toBe(10)
  })
})

describe('languages: beginners', () => {
  it('no harder bonus items until half the level is mastered', () => {
    const pt: Learner = { ...base, mode: 'portuguese' }
    expect(pickRound(pt).some((i) => i.stretchLevel)).toBe(false)
    const keys = levelItems(1, 'portuguese').slice(0, 5).map((i) => i.key)
    const ready: Learner = { ...pt, mastered: { '1_por': keys } }
    expect(pickRound(ready).some((i) => i.stretchLevel)).toBe(true)
    // Reading is unchanged: bonus items from the start.
    expect(pickRound(base).some((i) => i.stretchLevel)).toBe(true)
  })
})
