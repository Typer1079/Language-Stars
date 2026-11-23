export type Mode = 'reading' | 'spanish'
export type AgeGroup = '3-4' | '5-6' | '7-8' | '9+' | 'adult'
export type StickerStyle = 'boy' | 'girl' | 'any'
export type LearnerKind = 'child' | 'self'

export const AGE_GROUPS: AgeGroup[] = ['3-4', '5-6', '7-8', '9+', 'adult']

export interface PlacedSticker {
  id: string
  emoji: string
  label: string
  /** Position as a percentage of the screen. */
  x: number
  y: number
  rot: number
  /** Starting size (older stickers); growing adds 0.25 per step on top. */
  scale?: number
  growCount?: number
}

/** A reader profile, stored in the `learners` table. */
export interface Learner {
  id: string
  display_name: string
  kind: LearnerKind
  age_group: AgeGroup
  sticker_style: StickerStyle
  mode: Mode
  reading_level: number
  spanish_level: number
  /** Highest level ever reached; level-up bonuses are only paid for new highs. */
  reading_best: number
  spanish_best: number
  lifetime_stars: number
  spendable_stars: number
  /** Mastered words per level: "1".."5" for reading, "1_es".."6_es" for Spanish. */
  mastered: Record<string, string[]>
  stickers: PlacedSticker[]
  updated_at?: string
}

export type LearnerDraft = Omit<Learner, 'id' | 'updated_at'>

export function newLearnerDraft(name: string, kind: LearnerKind, age: AgeGroup, style: StickerStyle): LearnerDraft {
  return {
    display_name: name,
    kind,
    age_group: age,
    sticker_style: style,
    mode: age === 'adult' ? 'spanish' : 'reading',
    reading_level: 1,
    spanish_level: 1,
    reading_best: 1,
    spanish_best: 1,
    lifetime_stars: 0,
    spendable_stars: 0,
    mastered: {},
    stickers: [],
  }
}

export function newId(prefix = 'stk'): string {
  const rand = crypto.getRandomValues(new Uint32Array(2))
  return `${prefix}_${Date.now().toString(36)}_${rand[0].toString(36)}${rand[1].toString(36)}`
}
