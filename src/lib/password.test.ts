import { describe, expect, it } from 'vitest'
import { checkPassword, missingSentence, passwordErrorText } from './password'

describe('password rules', () => {
  it('accepts a password with every required element', () => {
    expect(checkPassword('Blue-Kite-2026').ok).toBe(true)
  })
  it('names exactly what is missing', () => {
    const r = checkPassword('bluekite')
    expect(r.ok).toBe(false)
    expect(r.missing.map((m) => m.id)).toEqual(['length', 'upper', 'digit', 'symbol'])
    expect(missingSentence('bluekite')).toMatch(/at least 12 characters; an uppercase letter/)
  })
  it('rejects spaces at the ends but allows them inside', () => {
    expect(checkPassword(' Blue Kite 2026!').missing.map((m) => m.id)).toEqual(['spaces'])
    expect(checkPassword('Blue Kite 2026!').ok).toBe(true)
  })
  it('explains server password errors', () => {
    expect(passwordErrorText({ code: 'weak_password', message: 'Password should contain at least one character of each: ...' })).toMatch(/doesn’t meet the requirements/)
    expect(passwordErrorText({ code: 'weak_password', reasons: ['pwned'], message: 'weak' })).toMatch(/data breach/)
    expect(passwordErrorText({ code: 'same_password', message: 'x' })).toMatch(/haven’t used/)
    expect(passwordErrorText({ message: 'Invalid login credentials' })).toBeNull()
  })
})
