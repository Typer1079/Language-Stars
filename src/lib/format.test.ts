import { describe, expect, it } from 'vitest'
import { formatDate, formatDateTime, formatNumber, formatTime } from './format'

describe('formatting', () => {
  it('shows a dash for missing or bad values', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatDateTime('not a date')).toBe('—')
    expect(formatTime(undefined)).toBe('—')
    expect(formatNumber(null)).toBe('—')
  })
  it('formats real values', () => {
    expect(formatDate('2026-11-25T12:00:00Z')).toMatch(/2026/)
    expect(formatNumber(12345)).toMatch(/12.345/)
  })
})
