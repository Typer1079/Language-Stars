import { describe, expect, it } from 'vitest'
import { editDistance, isWordMatch } from './match'

describe('isWordMatch', () => {
  it('matches the exact word inside a phrase', () => {
    expect(isWordMatch('the cat', 'cat')).toBe(true)
  })
  it('accepts sound-alike words for short targets', () => {
    expect(isWordMatch('too', 'to')).toBe(true)
    expect(isWordMatch('bye', 'by')).toBe(true)
  })
  it('accepts a one-letter slip for words of 3+ letters', () => {
    expect(isWordMatch('dob', 'dog')).toBe(true)
    expect(isWordMatch('xy', 'go')).toBe(false)
  })
  it('ignores accents and uses Spanish variants', () => {
    expect(isWordMatch('dia', 'día', ['dia', 'día'])).toBe(true)
    expect(isWordMatch('manana', 'mañana', ['manana', 'mañana'])).toBe(true)
    expect(isWordMatch('por favor', 'por favor', ['porfavor'])).toBe(true)
  })
  it('rejects unrelated speech', () => {
    expect(isWordMatch('elephant', 'cat')).toBe(false)
    expect(isWordMatch('', 'cat')).toBe(false)
  })
  it('computes edit distance', () => {
    expect(editDistance('kitten', 'sitting')).toBe(3)
  })
})

describe('short words speech-to-text gets wrong', () => {
  it('accepts common mishearings of Level 2 words', () => {
    for (const [heard, target] of [['hand', 'hen'], ['Hen.', 'hen'], ['ken', 'hen'], ['pin', 'pen'], ['son', 'sun'], ['stop', 'top'], ['big', 'pig'], ['get', 'jet']]) {
      expect(isWordMatch(heard, target), `${heard} -> ${target}`).toBe(true)
    }
  })
  it('forgives vowel slips by consonant outline', () => {
    expect(isWordMatch('hin', 'hen')).toBe(true)
    expect(isWordMatch('mog', 'mug')).toBe(true)
  })
  it('still rejects different words', () => {
    expect(isWordMatch('dog', 'hen')).toBe(false)
    expect(isWordMatch('elephant', 'pen')).toBe(false)
    expect(isWordMatch('happen', 'hen')).toBe(false)
  })
})
