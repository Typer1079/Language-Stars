import { ALL_AVATARS } from './avatars'
import { maxLevel } from './progress'
import { MAX_STICKERS } from './stickers'
import { AGE_GROUPS, newId, type AgeGroup, type Learner, type LearnerDraft, type LearnerKind, type Mode, type PlacedSticker, type StickerStyle } from './types'
import { isSubjectId, SUBJECTS } from './subjects'

// Input validation for anything that comes from a file or the network (NIST 800-53 SI-10).
// The database enforces the same limits; this keeps bad data from ever being sent.

const int = (v: unknown, min: number, max: number, fallback: number): number => {
  const n = Math.round(Number(v))
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback
}
const num = (v: unknown, min: number, max: number, fallback: number): number => {
  const n = Number(v)
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback
}
/** Drops control characters and angle brackets, trims, and limits length. */
const str = (v: unknown, maxLen: number): string => {
  if (typeof v !== 'string') return ''
  let out = ''
  for (const ch of v) {
    const code = ch.codePointAt(0) ?? 0
    if (code < 0x20 || code === 0x7f || ch === '<' || ch === '>') continue
    out += ch
  }
  return out.trim().slice(0, maxLen)
}

export function cleanName(v: unknown): string {
  return str(v, 40)
}

export function cleanStickers(v: unknown): PlacedSticker[] {
  if (!Array.isArray(v)) return []
  return v
    .filter((s): s is Record<string, unknown> => Boolean(s) && typeof s === 'object')
    .slice(0, MAX_STICKERS)
    .map((s) => {
      const out: PlacedSticker = {
        id: str(s.id, 60) || newId(),
        emoji: str(s.emoji, 16) || '⭐',
        label: str(s.label ?? s.name, 40) || 'Sticker',
        x: num(s.x, 0, 100, 12),
        y: num(s.y, 0, 100, 18),
        rot: num(s.rot, -45, 45, 0),
      }
      if (s.scale !== undefined) out.scale = num(s.scale, 0.5, 6, 1)
      if (s.growCount !== undefined) out.growCount = int(s.growCount, 0, 60, 0)
      if (s.spent !== undefined) out.spent = int(s.spent, 1, 1_000_000_000, 1)
      return out
    })
}

export function cleanMastered(v: unknown): Record<string, string[]> {
  const out: Record<string, string[]> = {}
  if (!v || typeof v !== 'object' || Array.isArray(v)) return out
  for (const [k, list] of Object.entries(v as Record<string, unknown>)) {
    if (!/^(100|[1-9][0-9]?)(_es|_sp)?$/.test(k) || !Array.isArray(list)) continue
    const words = [...new Set(list.map((w) => str(w, 160).toLowerCase()).filter(Boolean))].slice(0, 200)
    if (words.length) out[k] = words
  }
  return out
}

export function cleanLearnerDraft(v: Record<string, unknown>, kind: LearnerKind): LearnerDraft | null {
  const display_name = cleanName(v.display_name ?? v.name)
  if (!display_name) return null
  const age_group: AgeGroup = AGE_GROUPS.includes(v.age_group as AgeGroup)
    ? (v.age_group as AgeGroup)
    : AGE_GROUPS.includes(v.ageGroup as AgeGroup)
      ? (v.ageGroup as AgeGroup)
      : '5-6'
  const styleRaw = v.sticker_style ?? v.gender
  const sticker_style: StickerStyle = styleRaw === 'boy' || styleRaw === 'girl' ? styleRaw : 'any'
  const mode: Mode =
    isSubjectId(v.mode) ? v.mode : v.adultModeEnabled === true || age_group === 'adult' ? 'spanish' : 'reading'
  const lifetime_stars = int(v.lifetime_stars ?? v.lifetimeStars, 0, 1_000_000, 0)
  const spendable_stars = Math.min(lifetime_stars, int(v.spendable_stars ?? v.spendableStars, 0, 1_000_000, 0))
  // Each subject's level and best level (older backups used camelCase names).
  const levels: Partial<Learner> = {}
  const saved = (v.levels && typeof v.levels === 'object' ? v.levels : {}) as Record<string, { level?: unknown; best?: unknown }>
  for (const s of SUBJECTS) {
    const col = s.levelColumn ?? `${s.id}_level`
    const camel = col.replace(/_(\w)/, (_m, c: string) => c.toUpperCase())
    const lv = int(saved[s.id]?.level ?? v[col] ?? v[camel], 1, maxLevel(s.id), 1)
    const best = Math.max(lv, int(saved[s.id]?.best ?? (s.bestColumn ? v[s.bestColumn] : undefined), 1, maxLevel(s.id), 1))
    Object.assign(levels, s.levelColumn && s.bestColumn ? { [s.levelColumn]: lv, [s.bestColumn]: best } : {})
    levels.levels = { ...levels.levels, [s.id]: { level: lv, best } }
  }
  return {
    display_name,
    kind,
    age_group,
    sticker_style,
    ...(typeof v.avatar === 'string' && ALL_AVATARS.has(v.avatar) ? { avatar: v.avatar } : {}),
    mode,
    reading_level: 1,
    spanish_level: 1,
    reading_best: 1,
    spanish_best: 1,
    ...levels,
    lifetime_stars,
    spendable_stars,
    mastered: cleanMastered(v.mastered ?? v.masteredWordsByLevel),
    stickers: cleanStickers(v.stickers ?? v.placedStickers),
  }
}

/**
 * Reads a backup file: this app's export, or a save from the original single-file app.
 * Adults ("adult" age group) import as the account's own profile; everyone else as a child.
 */
export function parseSaveFile(text: string): LearnerDraft[] {
  if (text.length > 2_000_000) throw new Error('That file is too large to be a Language Stars backup.')
  let parsed: unknown
  try {
    parsed = JSON.parse(text.replace(/^﻿/, ''))
  } catch {
    throw new Error('That file isn’t a valid backup (not JSON).')
  }
  const p = parsed as Record<string, unknown>
  const list: unknown[] = Array.isArray(parsed)
    ? parsed
    : Array.isArray(p?.learners)
      ? (p.learners as unknown[])
      : Array.isArray(p?.profiles)
        ? (p.profiles as unknown[])
        : p && typeof p === 'object' && ('name' in p || 'display_name' in p)
          ? [p]
          : []
  const drafts = list
    .filter((x): x is Record<string, unknown> => Boolean(x) && typeof x === 'object')
    .slice(0, 12)
    .map((x) => {
      const adult = x.age_group === 'adult' || x.ageGroup === 'adult'
      const kind: LearnerKind = x.kind === 'self' || x.kind === 'child' ? (x.kind as LearnerKind) : adult ? 'self' : 'child'
      return cleanLearnerDraft(x, kind)
    })
    .filter((d): d is LearnerDraft => d !== null)
  if (drafts.length === 0) throw new Error('No learner profiles found in that file.')
  return drafts
}
