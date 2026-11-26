import { describe, expect, it } from 'vitest'
import pkg from '../../package.json'
import { RELEASE_NOTES } from './releaseNotes'

describe('release notes', () => {
  it('the newest note matches the app version', () => {
    expect(RELEASE_NOTES[0].version).toBe(pkg.version)
  })
  it('versions are unique and newest first', () => {
    const v = RELEASE_NOTES.map((n) => n.version.split('.').map(Number))
    for (let i = 1; i < v.length; i++) {
      const [a, b] = [v[i - 1], v[i]]
      expect(a[0] * 1e6 + a[1] * 1e3 + a[2]).toBeGreaterThan(b[0] * 1e6 + b[1] * 1e3 + b[2])
    }
  })
})
