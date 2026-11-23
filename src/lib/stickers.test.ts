import { describe, expect, it } from 'vitest'
import { buySticker, growCost, growSticker, makeCatalog, sellSticker, sellValue, stickerPoolFor, stickerScale } from './stickers'
import type { Learner } from './types'

const l: Learner = {
  id: 'x', display_name: 'T', kind: 'child', age_group: '9+', sticker_style: 'boy', mode: 'reading',
  reading_level: 1, spanish_level: 1, reading_best: 1, spanish_best: 1, lifetime_stars: 20, spendable_stars: 10, mastered: {}, stickers: [],
}

describe('stickers', () => {
  it('grow costs escalate and sell refunds everything spent', () => {
    expect([0, 1, 2].map(growCost)).toEqual([1, 2, 3])
    expect(sellValue({ growCount: 0 })).toBe(1)
    expect(sellValue({ growCount: 3 })).toBe(7)
    expect(sellValue({ growCount: 10 })).toBe(56)
  })
  it('buys, grows and sells with correct balances', () => {
    const item = { ...makeCatalog(l)[0], cost: 1 }
    const a = buySticker(l, item)!
    expect(a.spendable_stars).toBe(9)
    const id = a.stickers[0].id
    const b = growSticker(a, id)!
    expect(b.spendable_stars).toBe(8)
    expect(stickerScale(b.stickers[0])).toBe(1.25)
    const c = sellSticker(b, id)!
    expect(c.spendable_stars).toBe(10)
    expect(c.stickers).toHaveLength(0)
  })
  it('refuses purchases it cannot afford', () => {
    const item = { ...makeCatalog(l)[0], cost: 99 }
    expect(buySticker(l, item)).toBeNull()
  })
  it('never refunds past lifetime stars', () => {
    const odd: Learner = { ...l, lifetime_stars: 5, spendable_stars: 5, stickers: [{ id: 's', emoji: '🐼', label: 'P', x: 1, y: 1, rot: 0, growCount: 4 }] }
    expect(sellSticker(odd, 's')!.spendable_stars).toBe(5)
  })
  it('filters packs by style and age', () => {
    const pool = stickerPoolFor({ sticker_style: 'boy', age_group: '9+' })
    expect(pool.some((s) => s.id === 'panda')).toBe(true)
    expect(pool.every((s) => s.themes.includes('boy') || s.themes.includes('9+'))).toBe(true)
  })
})
