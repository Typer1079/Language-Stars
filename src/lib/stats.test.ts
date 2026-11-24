import { describe, expect, it } from 'vitest'
import { dailySeries, summarize } from './stats'
import type { RoundRecord } from './learnersApi'
import { SPANISH_LEVELS, stageName } from './curriculum'

const at = (daysAgo: number, h = 10) => { const d = new Date(2026, 10, 23, h); d.setDate(d.getDate() - daysAgo); return d.toISOString() }
const round = (daysAgo: number, over: Partial<RoundRecord> = {}): RoundRecord => ({
  learner_id: 'x', mode: 'reading', level: 5, level_after: 5, items: 10, clean: 8, coached: 1, skipped: 1, stars: 9,
  questions: 0, questions_right: 0, seconds: 300, created_at: at(daysAgo), ...over,
})

describe('progress stats', () => {
  const now = new Date(2026, 10, 23, 20)
  it('builds one entry per day with levels carried forward', () => {
    const s = dailySeries([round(40, { level_after: 3 }), round(2, { level_after: 6 }), round(0, { mode: 'spanish', level_after: 2 })], 7, now)
    expect(s).toHaveLength(7)
    expect(s[0].reading).toBe(3)
    expect(s[4].reading).toBe(6)
    expect(s[6].spanish).toBe(2)
    expect(s[6].minutes).toBe(5)
  })
  it('summarizes time, accuracy and streak', () => {
    const s = summarize(dailySeries([round(2), round(1), round(1), round(0)], 7, now))
    expect(s.rounds).toBe(4)
    expect(s.items).toBe(40)
    expect(s.accuracy).toBe(80)
    expect(s.minutes).toBe(20)
    expect(s.streak).toBe(3)
    expect(s.daysActive).toBe(3)
  })
  it('starts Spanish with travel basics', () => {
    expect(SPANISH_LEVELS[1].map((e) => e.es)).toContain('hola')
    expect(SPANISH_LEVELS[1].map((e) => e.es)).toContain('gracias')
    expect(SPANISH_LEVELS[2].map((e) => e.es)).toContain('¿dónde está?')
    expect(stageName(3, 'spanish')).toBe('Travel basics')
    for (let l = 1; l <= 6; l++) expect(SPANISH_LEVELS[l]).toHaveLength(10)
  })
})
