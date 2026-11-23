import { describe, expect, it } from 'vitest'
import { ITEMS_PER_LEVEL, MAX_LEVEL, READING_LEVELS, SPANISH_LEVELS, stageName } from './curriculum'
import { isPhraseMatch, isWordMatch } from './match'
import { levelItems, solveWord } from './progress'
import type { Learner } from './types'

describe('curriculum', () => {
  it('has every level from 1 to 100 in both modes', () => {
    for (let l = 1; l <= MAX_LEVEL; l++) {
      expect(READING_LEVELS[l].length, `reading ${l}`).toBeGreaterThanOrEqual(ITEMS_PER_LEVEL)
      expect(SPANISH_LEVELS[l].length, `spanish ${l}`).toBeGreaterThanOrEqual(l === 6 ? 5 : ITEMS_PER_LEVEL)
    }
  })
  it('never repeats an item within a mode', () => {
    const r = Object.values(READING_LEVELS).flat().map((s) => s.toLowerCase())
    const s = Object.values(SPANISH_LEVELS).flat().map((e) => e.en.toLowerCase())
    expect(new Set(r).size).toBe(r.length)
    expect(new Set(s).size).toBe(s.length)
  })
  it('gets longer as levels rise', () => {
    const avgWords = (from: number, to: number) => {
      const items = Array.from({ length: to - from + 1 }, (_, i) => READING_LEVELS[from + i]).flat()
      return items.reduce((n, s) => n + s.split(' ').length, 0) / items.length
    }
    expect(avgWords(1, 15)).toBe(1)
    expect(avgWords(16, 40)).toBeGreaterThan(2)
    expect(avgWords(91, 100)).toBeGreaterThan(avgWords(41, 50))
    expect(stageName(10, 'reading')).toBe('Words')
    expect(stageName(30, 'reading')).toBe('Phrases')
    expect(stageName(80, 'spanish')).toBe('Sentences')
  })
  it('builds grammatical Spanish (agreement, al / a la, plurals, punctuation)', () => {
    const all = Object.values(SPANISH_LEVELS).flat()
    for (const e of all) {
      expect(e.es).not.toMatch(/\ba el\b/) // must contract to "al"
      expect(e.es).not.toMatch(/\bla \S+o\b(?! )/) // no "la" + masculine -o noun at the end
      if (e.en.endsWith('?')) expect(e.es).toMatch(/^¿.*\?$/)
    }
    const text = all.map((e) => e.es).join('\n')
    expect(text).toMatch(/\bal (parque|mercado|museo|banco|hotel)/)
    expect(text).toMatch(/\ba la (playa|tienda|escuela|estación|biblioteca)/)
  })
})

describe('phrase matching', () => {
  it('accepts a sentence read with small speech-to-text differences', () => {
    expect(isPhraseMatch('the happy fox runs on the rock', 'The happy fox runs on the rock.')).toBe(true)
    expect(isPhraseMatch('the happy fox run on the rock', 'The happy fox runs on the rock.')).toBe(true)
    expect(isPhraseMatch('the fox', 'The happy fox runs on the rock.')).toBe(false)
  })
  it('requires every word of short phrases', () => {
    expect(isPhraseMatch('big dog', 'big dog')).toBe(true)
    expect(isPhraseMatch('dog', 'big dog')).toBe(false)
  })
  it('accepts Spanish with or without the subject pronoun, and without accents', () => {
    expect(isWordMatch('ella quiere un coche rojo', 'Ella quiere un coche rojo.')).toBe(true)
    expect(isWordMatch('quiere un coche rojo', 'Ella quiere un coche rojo.')).toBe(true)
    expect(isWordMatch('cuanto cuesta la camisa verde', '¿Cuánto cuesta la camisa verde?')).toBe(true)
    expect(isWordMatch('el coche', 'el coche rojo')).toBe(false)
  })
})

describe('climbing levels', () => {
  it('moves up, pays the bonus, and clears the finished level’s list', () => {
    const items = levelItems(57, 'spanish')
    const l: Learner = {
      id: 'x', display_name: 'T', kind: 'self', age_group: 'adult', sticker_style: 'any', mode: 'spanish',
      reading_level: 3, spanish_level: 57, reading_best: 3, spanish_best: 57, lifetime_stars: 500, spendable_stars: 0, stickers: [],
      mastered: { '57_es': items.slice(1).map((i) => i.key), '2': ['am'] },
    }
    const r = solveWord(l, items[0], false)
    expect(r.leveledUpTo).toBe(58)
    expect(r.bonus).toBe(285)
    expect(r.learner.mastered['57_es']).toBeUndefined()
    expect(r.learner.mastered['2']).toEqual(['am'])
  })
  it('stops at level 100', () => {
    const items = levelItems(100, 'reading')
    const l: Learner = {
      id: 'x', display_name: 'T', kind: 'child', age_group: '9+', sticker_style: 'any', mode: 'reading',
      reading_level: 100, spanish_level: 1, reading_best: 100, spanish_best: 1, lifetime_stars: 0, spendable_stars: 0, stickers: [],
      mastered: { '100': items.slice(1).map((i) => i.key) },
    }
    expect(solveWord(l, items[0], false).leveledUpTo).toBeNull()
  })
})
