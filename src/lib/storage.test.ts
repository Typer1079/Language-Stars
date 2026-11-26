import { describe, expect, it } from 'vitest'
import { migrateLegacyStorage, STORAGE_PREFIX } from './storage'

function fakeStorage(init: Record<string, string>): Storage {
  const m = new Map(Object.entries(init))
  return {
    get length() { return m.size },
    key: (i: number) => [...m.keys()][i] ?? null,
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
    clear: () => m.clear(),
  }
}

describe('moving settings saved under the old app name', () => {
  it('moves theme, Face ID and sticker packs to the new keys', () => {
    const s = fakeStorage({ 'ras.theme': 'dark', 'read-aloud-stars.faceid-on-this-device': '1', 'ras.pack.abc': 'ocean', other: 'x' })
    migrateLegacyStorage(s)
    expect(s.getItem(`${STORAGE_PREFIX}theme`)).toBe('dark')
    expect(s.getItem(`${STORAGE_PREFIX}faceid-on-this-device`)).toBe('1')
    expect(s.getItem(`${STORAGE_PREFIX}sticker-pack.abc`)).toBe('ocean')
    expect(s.getItem('ras.theme')).toBeNull()
    expect(s.getItem('ras.pack.abc')).toBeNull()
    expect(s.getItem('other')).toBe('x')
  })
  it('never overwrites a newer setting', () => {
    const s = fakeStorage({ 'ras.theme': 'dark', [`${STORAGE_PREFIX}theme`]: 'light' })
    migrateLegacyStorage(s)
    expect(s.getItem(`${STORAGE_PREFIX}theme`)).toBe('light')
  })
})
