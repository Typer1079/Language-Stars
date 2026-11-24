import type { RoundRecord } from './learnersApi'

/** Local calendar day, YYYY-MM-DD. */
export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export interface DayStats {
  day: string
  rounds: number
  items: number
  clean: number
  stars: number
  minutes: number
  questions: number
  questionsRight: number
  /** Level at the end of the day (carried forward from earlier days), per mode. */
  reading: number | null
  spanish: number | null
}

/** One entry per day for the last `days` days (oldest first), including days with no practice. */
export function dailySeries(rounds: RoundRecord[], days: number, now = new Date()): DayStats[] {
  const byDay = new Map<string, RoundRecord[]>()
  for (const r of rounds) {
    if (!r.created_at) continue
    const k = dayKey(new Date(r.created_at))
    byDay.set(k, [...(byDay.get(k) ?? []), r])
  }
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - (days - 1))
  // Levels before the window start, so lines don't begin empty.
  let reading: number | null = null
  let spanish: number | null = null
  for (const r of rounds) {
    if (r.created_at && new Date(r.created_at) < start) {
      if (r.mode === 'reading') reading = r.level_after
      else spanish = r.level_after
    }
  }
  const out: DayStats[] = []
  for (let i = 0; i < days; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const k = dayKey(d)
    const list = byDay.get(k) ?? []
    for (const r of list) {
      if (r.mode === 'reading') reading = r.level_after
      else spanish = r.level_after
    }
    out.push({
      day: k,
      rounds: list.length,
      items: sum(list, 'items'),
      clean: sum(list, 'clean'),
      stars: sum(list, 'stars'),
      minutes: Math.round(sum(list, 'seconds') / 6) / 10,
      questions: sum(list, 'questions'),
      questionsRight: sum(list, 'questions_right'),
      reading,
      spanish,
    })
  }
  return out
}

function sum(list: RoundRecord[], k: keyof RoundRecord): number {
  return list.reduce((n, r) => n + (Number(r[k]) || 0), 0)
}

export interface Summary {
  minutes: number
  items: number
  clean: number
  /** Share of items said without help, 0-100 (null when nothing was tried). */
  accuracy: number | null
  stars: number
  daysActive: number
  /** Consecutive days with practice, ending today (or yesterday if not yet today). */
  streak: number
  questions: number
  questionsRight: number
  rounds: number
}

export function summarize(series: DayStats[]): Summary {
  const t = series.reduce(
    (a, d) => ({
      minutes: a.minutes + d.minutes, items: a.items + d.items, clean: a.clean + d.clean, stars: a.stars + d.stars,
      questions: a.questions + d.questions, questionsRight: a.questionsRight + d.questionsRight, rounds: a.rounds + d.rounds,
      daysActive: a.daysActive + (d.rounds > 0 ? 1 : 0),
    }),
    { minutes: 0, items: 0, clean: 0, stars: 0, questions: 0, questionsRight: 0, rounds: 0, daysActive: 0 },
  )
  let streak = 0
  let i = series.length - 1
  if (i >= 0 && series[i].rounds === 0) i -= 1 // today not practiced yet: count from yesterday
  for (; i >= 0 && series[i].rounds > 0; i--) streak++
  return {
    ...t,
    minutes: Math.round(t.minutes),
    accuracy: t.items ? Math.round((t.clean / t.items) * 100) : null,
    streak,
  }
}
