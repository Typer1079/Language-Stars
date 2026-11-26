import { describe, expect, it } from 'vitest'
import { masteryKey } from './progress'
import { SUBJECTS, isSubjectId, subject, subjectBest, subjectLevel, withSubjectLevel } from './subjects'

describe('subject list', () => {
  it('has unique ids, columns and mastery suffixes', () => {
    for (const key of ['id', 'levelColumn', 'bestColumn', 'masterySuffix'] as const) {
      expect(new Set(SUBJECTS.map((s) => s[key])).size).toBe(SUBJECTS.length)
    }
  })
  it('falls back to Reading for unknown ids', () => {
    expect(subject('klingon').id).toBe('reading')
    expect(isSubjectId('spanish')).toBe(true)
    expect(isSubjectId('klingon')).toBe(false)
  })
  it('reads and sets levels; best only goes up', () => {
    const l = { reading_level: 5, reading_best: 9, spanish_level: 2, spanish_best: 2 }
    expect(subjectLevel(l, 'reading')).toBe(5)
    expect(subjectLevel(l, 'spelling')).toBe(1)
    expect(subjectBest(l, 'reading')).toBe(9)
    const up = withSubjectLevel(l, 'spanish', 7)
    expect([up.spanish_level, up.spanish_best]).toEqual([7, 7])
    const down = withSubjectLevel(up, 'spanish', 3)
    expect([down.spanish_level, down.spanish_best]).toEqual([3, 7])
  })
  it('keeps the mastery keys saved progress already uses', () => {
    expect([masteryKey(12, 'reading'), masteryKey(12, 'spanish'), masteryKey(12, 'spelling')]).toEqual(['12', '12_es', '12_sp'])
  })
})
