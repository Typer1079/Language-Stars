import type { RankMetric } from './learnersApi'
import { SUBJECTS } from './subjects'

export const RANK_METRICS: { id: RankMetric; label: string; icon: string; unit: (n: number) => string }[] = [
  { id: 'stars', label: 'Lifetime stars', icon: '⭐', unit: (n) => `${n.toLocaleString()} stars` },
  { id: 'stars_week', label: 'Stars this week', icon: '🌟', unit: (n) => `${n.toLocaleString()} stars` },
  ...SUBJECTS.map((s) => ({ id: s.id as RankMetric, label: `${s.shortLabel} level`, icon: s.icon, unit: (n: number) => `Level ${n}` })),
  { id: 'words', label: 'Words said', icon: '🗣️', unit: (n) => `${n.toLocaleString()} words` },
  { id: 'questions', label: 'Meanings right', icon: '🧠', unit: (n) => `${n.toLocaleString()} right` },
  { id: 'minutes_week', label: 'Minutes this week', icon: '⏱️', unit: (n) => `${n} min` },
  { id: 'days30', label: 'Days (last 30)', icon: '📅', unit: (n) => `${n} ${n === 1 ? 'day' : 'days'}` },
  { id: 'biggest_sticker', label: 'Biggest sticker', icon: '🔍', unit: (n) => `size ×${n}` },
  { id: 'stickers', label: 'Sticker count', icon: '🎨', unit: (n) => `${n} stickers` },
]

export function medal(rank: number | null | undefined): string {
  return rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : ''
}
