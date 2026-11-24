import { describe, expect, it } from 'vitest'
import { isSpanishMatch, spanishKey } from './match'

describe('Spanish with an American accent', () => {
  it('spells words by sound', () => {
    expect(spanishKey('vaca')).toBe(spanishKey('baca'))
    expect(spanishKey('hola')).toBe(spanishKey('ola'))
    expect(spanishKey('zapato')).toBe(spanishKey('sapato'))
    expect(spanishKey('me llamo')).toBe(spanishKey('me yamo'))
    expect(spanishKey('quiero')).toBe(spanishKey('kiero'))
    expect(spanishKey('gente')).toBe(spanishKey('jente'))
  })
  it('accepts accented attempts', () => {
    expect(isSpanishMatch('gracia', 'gracias')).toBe(true)
    expect(isSpanishMatch('la biblioteka', 'la biblioteca')).toBe(true)
    expect(isSpanishMatch('kiero un manzana', 'quiero una manzana')).toBe(true)
    expect(isSpanishMatch('um el perro', 'el perro')).toBe(true)
    expect(isSpanishMatch('buenos dias', 'buenos días')).toBe(true)
    expect(isSpanishMatch('vamos al parke', 'vamos al parque')).toBe(true)
  })
  it('still rejects wrong words', () => {
    expect(isSpanishMatch('gato', 'perro')).toBe(false)
    expect(isSpanishMatch('no', 'sí')).toBe(false)
    expect(isSpanishMatch('casa', 'cosa')).toBe(true) // one vowel slip on a 4-letter word is forgiven
    expect(isSpanishMatch('hola', 'adiós')).toBe(false)
    expect(isSpanishMatch('el', 'el perro grande')).toBe(false)
    expect(isSpanishMatch('mi hermana', 'mi hermano come pan')).toBe(false)
  })
})
