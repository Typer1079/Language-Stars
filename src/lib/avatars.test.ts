import { describe, expect, it } from 'vitest'
import { ALL_AVATARS, AVATAR_GROUPS, avatarFor, toneOf, withTone } from './avatars'

describe('profile characters', () => {
  it('puts skin tones in the right place, including multi-part emoji', () => {
    expect(withTone('👧', '\u{1F3FD}')).toBe('👧🏽')
    expect(withTone('👩‍🚀', '\u{1F3FF}')).toBe('👩🏿‍🚀')
    expect(withTone('🕵️‍♀️', '\u{1F3FB}')).toBe('🕵🏻‍♀️')
    expect(toneOf('👩🏿‍🚀')).toBe('\u{1F3FF}')
  })
  it('offers a large, varied set', () => {
    expect(ALL_AVATARS.size).toBeGreaterThan(800)
    expect(AVATAR_GROUPS.length).toBeGreaterThanOrEqual(6)
    for (const a of ALL_AVATARS) expect([...a].length).toBeLessThanOrEqual(16)
  })
  it('falls back to a default from the profile', () => {
    expect(avatarFor({ avatar: null, sticker_style: 'girl', age_group: '5-6' })).toBe('👧')
    expect(avatarFor({ avatar: '🦄', sticker_style: 'girl', age_group: '5-6' })).toBe('🦄')
    expect(avatarFor({ avatar: '<script>', sticker_style: 'boy', age_group: 'adult' })).toBe('👨')
  })
})
