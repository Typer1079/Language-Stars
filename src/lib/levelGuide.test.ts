import { maxLevel } from './progress'
import { describe, expect, it } from 'vitest'
import { gradeFor, LEVEL_GUIDE } from './levelGuide'
import { MODES } from './types'

describe('level guide', () => {
  it('covers every level of every subject, with no gaps', () => {
    for (const m of MODES) {
      const g = LEVEL_GUIDE[m]
      expect(g[0].from).toBe(1)
      expect(g[g.length - 1].to).toBe(maxLevel(m))
      for (let i = 1; i < g.length; i++) expect(g[i].from).toBe(g[i - 1].to + 1)
    }
  })
  it('names grade levels', () => {
    expect(gradeFor(1, 'reading')).toBe('Kindergarten')
    expect(gradeFor(73, 'reading')).toBe('Grade 11–12')
    expect(gradeFor(100, 'reading')).toBe('Doctorate')
    expect(gradeFor(1, 'spelling')).toBe('Grade 1')
    expect(gradeFor(100, 'spelling')).toBe('Scripps champion')
    expect(gradeFor(3, 'spanish')).toBe('Beginner (A1)')
  })
})
