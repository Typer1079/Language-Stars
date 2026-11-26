import { describe, expect, it } from 'vitest'
import { buySticker, growCost, growSticker, makeCatalog, sellSticker, sellValue, stickerPoolFor, stickerScale } from './stickers'
import type { Learner } from './types'

const l: Learner = {
  id: 'x', display_name: 'T', kind: 'child', age_group: '9+', sticker_style: 'boy', mode: 'reading',
  reading_level: 1, spanish_level: 1, reading_best: 1, spanish_best: 1, lifetime_stars: 20, spendable_stars: 10, mastered: {}, stickers: [],
}

describe('stickers', () => {
  it('grow costs follow Fibonacci; older stickers keep their old sell value', () => {
    expect([0, 1, 2, 3, 4, 5, 6].map(growCost)).toEqual([1, 2, 3, 5, 8, 13, 21])
    expect(sellValue({ growCount: 0 })).toBe(1)
    expect(sellValue({ growCount: 3 })).toBe(7)
    expect(sellValue({ growCount: 3, spent: 13 })).toBe(13)
  })
  it('tracks stars spent so selling refunds exactly that', () => {
    const rich = { ...l, lifetime_stars: 100, spendable_stars: 50 }
    let x = buySticker(rich, { ...makeCatalog(rich)[0], cost: 2 })!
    const id = x.stickers[0].id
    for (let i = 0; i < 4; i++) x = growSticker(x, id)!
    // 2 to buy + 1 + 2 + 3 + 5 to grow
    expect(x.spendable_stars).toBe(50 - 13)
    expect(x.stickers[0].spent).toBe(13)
    expect(sellSticker(x, id)!.spendable_stars).toBe(50)
  })
  it('builds a shop from the chosen themed pack', () => {
    const cat = makeCatalog(l, Math.random, 'sports')
    expect(cat).toHaveLength(8)
    expect(cat.every((c) => c.themes.includes('pack:sports'))).toBe(true)
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
  it('sizes keep growing along the Fibonacci sequence', () => {
    const sizes = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((growCount) => stickerScale({ growCount }))
    expect(sizes).toEqual([1, 1.25, 1.5, 2, 2.75, 4, 6, 9.25, 14.5])
    // every step is bigger than the step before it
    for (let i = 2; i < sizes.length; i++) expect(sizes[i] - sizes[i - 1]).toBeGreaterThan(sizes[i - 1] - sizes[i - 2] - 1e-9)
    expect(stickerScale({ growCount: 3, scale: 1.5 })).toBe(2.5)
  })
})
