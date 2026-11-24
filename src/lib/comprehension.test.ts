import { describe, expect, it } from 'vitest'
import { questionFor } from './comprehension'
import { READING_LEVELS } from './curriculum'
import { BANDS } from './readingAdvanced'

describe('reading comprehension', () => {
  it('climbs to doctoral vocabulary with a meaning question for every advanced item', () => {
    for (const b of BANDS) {
      expect(b.entries, b.name).toHaveLength(25)
      expect(new Set(b.entries.map((e) => e[1])).size, b.name).toBe(25)
    }
    for (let l = 56; l <= 100; l++) {
      expect(READING_LEVELS[l], `L${l}`).toHaveLength(10)
      for (const s of READING_LEVELS[l]) {
        const q = questionFor(s)!
        expect(q, s).toBeTruthy()
        expect(new Set(q.choices).size).toBe(3)
        expect(s.length).toBeLessThan(160)
      }
    }
    expect(READING_LEVELS[100].join(' ')).toMatch(/epistemic humility/i)
  })
  it('has a question for every phrase and sentence from Level 31', () => {
    for (let l = 31; l <= 55; l++) for (const s of READING_LEVELS[l]) {
      const q = questionFor(s)!
      expect(q, s).toBeTruthy()
      expect(new Set(q.choices).size).toBe(3)
      expect(s.toLowerCase()).toContain(q.choices[q.answer].toLowerCase().replace(/^(my|to the|the) /, '').split(' ')[0].slice(0, 2))
    }
  })
  it('asks about the second person, not the first', () => {
    const q = questionFor('My mom likes to read, but my dad likes to swim.')!
    expect(q.prompt).toBe('What does my dad like to do?')
    expect(q.choices[q.answer]).toBe('swim')
    expect(q.choices).toContain('read')
  })
})
