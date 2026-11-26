import { describe, expect, it } from 'vitest'
import { beeRequest, extractLetters, judgeSpelling, wantsRestart } from './spelling'
import { SPELLING_LEVELS, stageName } from './curriculum'

describe('Spelling Bee listening', () => {
  it('reads letters however the recognizer writes them', () => {
    expect(extractLetters('C A T', 'cat')).toEqual(['c', 'a', 't'])
    expect(extractLetters('cat see ay tee cat', 'cat')).toEqual(['c', 'a', 't'])
    expect(extractLetters('CAT', 'cat')).toEqual(['c', 'a', 't'])
    expect(extractLetters('c-a-t', 'cat')).toEqual(['c', 'a', 't'])
    expect(extractLetters('double you E B', 'web')).toEqual(['w', 'e', 'b'])
    expect(extractLetters('um the word is zoo Z O O', 'zoo')).toEqual(['z', 'o', 'o'])
  })
  it('judges letter by letter', () => {
    expect(judgeSpelling(['c', 'a'], 'cat')).toBe('partial')
    expect(judgeSpelling(['c', 'a', 't'], 'cat')).toBe('correct')
    expect(judgeSpelling(['c', 'a', 'p'], 'cat')).toBe('wrong')
    expect(judgeSpelling([], 'cat')).toBe('empty')
    expect(judgeSpelling('wednesday'.split(''), 'Wednesday')).toBe('correct')
  })
  it('hears spoken requests', () => {
    expect(beeRequest('definition please')).toBe('definition')
    expect(beeRequest('can I have the part of speech')).toBe('pos')
    expect(beeRequest('use it in a sentence')).toBe('sentence')
    expect(beeRequest('language of origin')).toBe('origin')
    expect(beeRequest('can you repeat the word')).toBe('repeat')
    expect(beeRequest('C A T')).toBe(null)
  })
  it('hears "start over"', () => {
    expect(wantsRestart('oops start over')).toBe(true)
  })
  it('has 100 levels from first words to championship', () => {
    expect(SPELLING_LEVELS[1].map((e) => e.word)).toContain('cat')
    expect(SPELLING_LEVELS[100].map((e) => e.word)).toContain('abseil')
    for (let l = 1; l <= 100; l++) expect(SPELLING_LEVELS[l]).toHaveLength(10)
    expect(stageName(100, 'spelling')).toBe('Championship')
  })
})
