import type { SpanishEntry } from '../wordBanks'
import { FARSI_LEVELS } from './farsi'
import { FRENCH_LEVELS } from './french'
import { JAPANESE_LEVELS } from './japanese'
import { KOREAN_LEVELS } from './korean'
import { MANDARIN_LEVELS } from './mandarin'
import { PORTUGUESE_LEVELS } from './portuguese'
import { TAGALOG_LEVELS } from './tagalog'

/** Levels for each language path added in 1.8 (Spanish has its own, in curriculum.ts). */
export const LANGUAGE_LEVELS: Record<string, Record<number, SpanishEntry[]>> = {
  french: FRENCH_LEVELS,
  tagalog: TAGALOG_LEVELS,
  japanese: JAPANESE_LEVELS,
  korean: KOREAN_LEVELS,
  mandarin: MANDARIN_LEVELS,
  farsi: FARSI_LEVELS,
  portuguese: PORTUGUESE_LEVELS,
}
