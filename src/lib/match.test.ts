import { describe, expect, it } from 'vitest'
import { editDistance, isPhraseMatch, isWordMatch } from './match'

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

describe('forgiving long sentences', () => {
  const t = 'The meeting was ostensibly about budgets, but it was really about layoffs.'
  it('allows a couple of missed or misheard words in long sentences', () => {
    expect(isPhraseMatch('the meeting was ostensibly about budget but it was really about lay offs', t)).toBe(true)
    expect(isPhraseMatch('the meeting was ostensibly about budgets but it was really about', t)).toBe(true)
    expect(isPhraseMatch('the meeting was about', t)).toBe(false)
  })
  it('treats numbers, percent signs and apostrophes the same', () => {
    expect(isPhraseMatch('the curve shows asymptotic growth toward 100%', 'The curve shows asymptotic growth toward one hundred percent.')).toBe(true)
    expect(isPhraseMatch('its a nice day', "It's a nice day.")).toBe(true)
  })
  it('accepts two-letter slips on long words', () => {
    expect(isPhraseMatch('the residual plot revealed heteroscedasticity in the regression model', 'The residual plot revealed heteroskedasticity in the regression model.')).toBe(true)
  })
  it('still rejects a different sentence', () => {
    expect(isPhraseMatch('my dog likes to run in the park every day', 'My mom likes to read in the house every week.')).toBe(false)
  })
})

import { numbersToDigits } from './match'
describe('numbers said vs. written', () => {
  it('reads number words the way the phone writes them', () => {
    expect(numbersToDigits('five thousand people'.split(' '))).toEqual(['5000', 'people'])
    expect(numbersToDigits('two hundred and forty'.split(' '))).toEqual(['240'])
    expect(numbersToDigits('twenty one'.split(' '))).toEqual(['21'])
    expect(numbersToDigits('a hundred percent'.split(' '))).toEqual(['100', 'percent'])
    expect(numbersToDigits('one hundred percent'.split(' '))).toEqual(['100', 'percent'])
  })
  it('matches "five thousand" with 5000 and 5,000', () => {
    expect(isPhraseMatch('the stadium holds 5000 people', 'The stadium holds five thousand people.')).toBe(true)
    expect(isPhraseMatch('the stadium holds 5,000 people', 'The stadium holds five thousand people.')).toBe(true)
    expect(isPhraseMatch('a longitudinal study tracked the same children for 20 years', 'A longitudinal study tracked the same children for twenty years.')).toBe(true)
  })
})
describe('single number words', () => {
  it('accepts digits for number words', () => {
    expect(isWordMatch('6', 'six')).toBe(true)
    expect(isWordMatch('ten', 'ten')).toBe(true)
    expect(isWordMatch('16', 'six')).toBe(false)
  })
})
describe("the city's infrastructure", () => {
  const t = "The hurricane damaged the city's infrastructure."
  it('accepts the ways a phone writes it', () => {
    for (const h of ["the hurricane damaged the city's infrastructure", 'the hurricane damaged the cities infrastructure',
      'the hurricane damaged the city infrastructure', 'the hurricane damage the citys infrastructure', 'hurricane damaged the cities infrastructure']) {
      expect(isPhraseMatch(h, t), h).toBe(true)
    }
    expect(isPhraseMatch('the hurricane was big', t)).toBe(false)
  })
})

import { soundKey } from './match'
describe('long words the phone mishears', () => {
  it('matches epistemology however it comes out', () => {
    expect(soundKey('epistemology')).toBe('apstmlj')
    for (const h of ['epistemology', 'Epistemology.', 'epistemologie', 'a pistol mology', 'episte mology', 'epistomology'])
      expect(isWordMatch(h, 'epistemology'), h).toBe(true)
  })
  it('does not accept different words', () => {
    for (const h of ['epidemiology', 'is to mallory', 'ontology', 'apology'])
      expect(isWordMatch(h, 'epistemology'), h).toBe(false)
  })
})

describe('two-word terms the phone mishears', () => {
  it('accepts near-sounding spellings of the hard word', () => {
    for (const h of ['cognitive dissonance', 'cognitive dissidence', 'cognitive dissonants', 'Cognitive dissonance.'])
      expect(isWordMatch(h, 'cognitive dissonance'), h).toBe(true)
    expect(isWordMatch('smokers who no the health risks may feel cognitive dissidence', 'Smokers who know the health risks may feel cognitive dissonance.')).toBe(true)
  })
  it('still needs both words', () => {
    expect(isWordMatch('cognitive', 'cognitive dissonance')).toBe(false)
    expect(isWordMatch('cognitive design', 'cognitive dissonance')).toBe(false)
  })
})
