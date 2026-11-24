import { describe, expect, it } from 'vitest'
import { onsetRime, rhymesFor, syllables, wordHelp } from './phonics'
import { READING_LEVELS } from './curriculum'

describe('word-based phonics', () => {
  it('splits beginning and rhyme part', () => {
    expect(onsetRime('ship')).toEqual(['sh', 'ip'])
    expect(onsetRime('queen')).toEqual(['qu', 'een'])
    expect(onsetRime('train')).toEqual(['tr', 'ain'])
    expect(onsetRime('at')).toEqual(['', 'at'])
  })
  it('finds rhymes for short words', () => {
    expect(rhymesFor('hen')).toEqual(['pen', 'ten'])
    expect(rhymesFor('cup')).toEqual(['pup'])
    expect(rhymesFor('bat')).toEqual(['cat', 'hat'])
    expect(rhymesFor('bread')).toEqual(['head', 'spread'])
  })
  it('claps syllables', () => {
    expect(syllables('rabbit')).toEqual(['rab', 'bit'])
    expect(syllables('elephant')).toEqual(['el', 'e', 'phant'])
    expect(syllables('cake')).toEqual(['cake'])
    expect(syllables('sunlight')).toEqual(['sun', 'light'])
  })
  it('never spells letters out loud', () => {
    const words = new Set<string>()
    for (const l of Object.values(READING_LEVELS)) for (const w of l) if (!w.includes(' ')) words.add(w)
    for (const w of words) {
      const h = wordHelp(w, 'Superstar')
      expect(h.chunks.join('').toLowerCase()).toBe(w.toLowerCase())
      expect(h.speech).not.toMatch(/\b(buh|kuh|duh|tuh|puh|sss)\b,/)
      // every multi-syllable word in the course has a hand-checked split
      if (h.kind === 'syllables') expect(h.chunks.length).toBeGreaterThan(1)
    }
  })
})
