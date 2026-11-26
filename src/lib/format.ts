/**
 * Dates, times and numbers, formatted the same way everywhere, in the reader's own locale.
 * Pass an ISO string, a Date or a timestamp; missing or invalid values show "—".
 */
type When = string | number | Date | null | undefined

function toDate(v: When): Date | null {
  if (v == null || v === '') return null
  const d = v instanceof Date ? v : new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

/** "Nov 25, 2026" */
export function formatDate(v: When): string {
  const d = toDate(v)
  return d ? d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
}

/** "Nov 25, 7:42 PM" (adds the year when it isn't this year) */
export function formatDateTime(v: When): string {
  const d = toDate(v)
  if (!d) return '—'
  const sameYear = d.getFullYear() === new Date().getFullYear()
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }), hour: 'numeric', minute: '2-digit' })
}

/** "7:42 PM" */
export function formatTime(v: When): string {
  const d = toDate(v)
  return d ? d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : '—'
}

/** "Nov 25, 2026, 7:42 PM" (for copied reports, where the year always matters) */
export function formatDateTimeLong(v: When): string {
  const d = toDate(v)
  return d ? d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—'
}

/** "12,345" */
export function formatNumber(n: number | null | undefined): string {
  return n == null || Number.isNaN(n) ? '—' : n.toLocaleString()
}
