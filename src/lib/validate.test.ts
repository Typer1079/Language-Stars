import { describe, expect, it } from 'vitest'
import { parseSaveFile } from './validate'

const legacy = {
  version: 2,
  profiles: [
    { name: 'Ethan', gender: 'boy', ageGroup: '9+', adultModeEnabled: false, readingLevel: 2, spanishLevel: 1, lifetimeStars: 41, spendableStars: 16,
      placedStickers: [{ id: 'a', emoji: '🐼', label: 'Cuddly Panda', scale: 2.4, x: 7.6, y: 71.1, rot: 12 }],
      masteredWordsByLevel: { 1: ['to', 'we'], 2: ['pig'], 3: [] } },
    { name: 'Olivia', gender: 'girl', ageGroup: 'adult', adultModeEnabled: true, spanishLevel: 5, lifetimeStars: 111, spendableStars: 10,
      placedStickers: [{ id: 'u', emoji: '🦄', label: 'Unicorn', growCount: 10, x: 6, y: 62, rot: -8 }],
      masteredWordsByLevel: { '1_es': ['hello'] } },
  ],
}

describe('parseSaveFile', () => {
  it('reads a save from the original app', () => {
    const [e, o] = parseSaveFile(JSON.stringify(legacy))
    expect(e).toMatchObject({ display_name: 'Ethan', kind: 'child', age_group: '9+', sticker_style: 'boy', mode: 'reading', reading_level: 2, lifetime_stars: 41, spendable_stars: 16 })
    expect(e.stickers[0]).toMatchObject({ emoji: '🐼', scale: 2.4 })
    expect(e.mastered).toEqual({ '1': ['to', 'we'], '2': ['pig'] })
    expect(o).toMatchObject({ display_name: 'Olivia', kind: 'self', mode: 'spanish', spanish_level: 5, lifetime_stars: 111 })
    expect(o.stickers[0].growCount).toBe(10)
  })
  it('clamps and cleans hostile values', () => {
    const [d] = parseSaveFile(JSON.stringify({ profiles: [{ name: '<b>Eve</b>\u0000', readingLevel: 99, lifetimeStars: -5, spendableStars: 1e9,
      placedStickers: [{ emoji: '<script>', x: 9999 }], masteredWordsByLevel: { evil: ['x'], 1: ['ok', 42] } }] }))
    expect(d.display_name).toBe('bEve/b')
    expect(d.reading_level).toBe(5)
    expect(d.lifetime_stars).toBe(0)
    expect(d.spendable_stars).toBe(0)
    expect(d.stickers[0].x).toBe(100)
    expect(d.mastered).toEqual({ '1': ['ok'] })
  })
  it('rejects non-JSON and empty files', () => {
    expect(() => parseSaveFile('nope')).toThrow(/not JSON/)
    expect(() => parseSaveFile('{"profiles": []}')).toThrow(/No reader profiles/)
  })
})
