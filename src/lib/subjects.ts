import type { Learner, Mode } from './types'

/**
 * Every subject the app teaches, defined in one place. Screens, stats, ranks and the database
 * mapping read from here, so adding a subject starts with one new entry.
 *
 * (In the code and database a subject is still called `mode`; Mode and SubjectId are the same.)
 */
export type SubjectId = Mode

export interface Subject {
  id: SubjectId
  /** "Reading" */
  label: string
  /** Short name for tight spaces (subject switch, cards): "Spelling". */
  shortLabel: string
  /** "Reading (English)": the longer name used when choosing a subject. */
  longLabel: string
  icon: string
  /** One line describing what practice looks like. */
  blurb: string
  /** Speech recognition / Iris voice language. */
  speechLang: 'en-US' | 'es-US'
  /** Suffix for mastered-item keys per level ("12", "12_es", "12_sp"). */
  masterySuffix: string
  /** Learner columns that hold the current level and the best level ever reached. */
  levelColumn: 'reading_level' | 'spanish_level' | 'spelling_level'
  bestColumn: 'reading_best' | 'spanish_best' | 'spelling_best'
  /** Name of the level scale shown in Help. */
  scaleNote: string
  /** Subject switch colors (active tab). */
  activeClass: string
  /** Line color in the level chart. */
  chart: { className: string; dot: string; fill: string }
  /** Seconds on one item before a "stuck" problem report. */
  stuckAfterSeconds: number
  /** Needs a newer database (shown only when the columns exist). */
  needsDbUpdate?: string
}

export const SUBJECTS: readonly Subject[] = [
  {
    id: 'reading', label: 'Reading', shortLabel: 'Reading', longLabel: 'Reading (English)', icon: '📖',
    blurb: 'Read words, phrases and sentences out loud, then answer what they mean.',
    speechLang: 'en-US', masterySuffix: '', levelColumn: 'reading_level', bestColumn: 'reading_best',
    scaleNote: 'U.S. grade level',
    activeClass: 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow',
    chart: { className: 'stroke-indigo-500', dot: 'bg-indigo-500', fill: 'fill-indigo-500' },
    stuckAfterSeconds: 90,
  },
  {
    id: 'spanish', label: 'Spanish', shortLabel: 'Spanish', longLabel: 'Spanish (from English)', icon: '🇪🇸',
    blurb: 'See an English word or phrase and say it in Spanish, starting with travel phrases.',
    speechLang: 'es-US', masterySuffix: '_es', levelColumn: 'spanish_level', bestColumn: 'spanish_best',
    scaleNote: 'CEFR scale: A1 beginner → B1 intermediate',
    activeClass: 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow',
    chart: { className: 'stroke-amber-500', dot: 'bg-amber-500', fill: 'fill-amber-500' },
    stuckAfterSeconds: 90,
  },
  {
    id: 'spelling', label: 'Spelling Bee', shortLabel: 'Spelling', longLabel: 'Spelling Bee', icon: '🐝',
    blurb: 'Hear a word and spell it out loud, letter by letter, like a real spelling bee.',
    speechLang: 'en-US', masterySuffix: '_sp', levelColumn: 'spelling_level', bestColumn: 'spelling_best',
    scaleNote: 'U.S. grade level',
    activeClass: 'bg-gradient-to-r from-emerald-500 to-lime-500 text-white shadow',
    chart: { className: 'stroke-emerald-500', dot: 'bg-emerald-500', fill: 'fill-emerald-500' },
    stuckAfterSeconds: 150,
    needsDbUpdate: '008',
  },
]

const BY_ID = new Map(SUBJECTS.map((s) => [s.id, s]))

/** The subject with this id (falls back to Reading for unknown values). */
export function subject(id: string | null | undefined): Subject {
  return BY_ID.get(id as SubjectId) ?? SUBJECTS[0]
}

export const isSubjectId = (v: unknown): v is SubjectId => typeof v === 'string' && BY_ID.has(v as SubjectId)

/** "📖 Reading" */
export const subjectName = (id: string | null | undefined) => `${subject(id).icon} ${subject(id).label}`

type LevelFields = Partial<Pick<Learner, Subject['levelColumn'] | Subject['bestColumn']>>

/** A learner's current level in a subject (1 when not started or not available yet). */
export function subjectLevel(l: LevelFields, id: SubjectId): number {
  return l[subject(id).levelColumn] ?? 1
}

/** Highest level ever reached in a subject (never below the current level). */
export function subjectBest(l: LevelFields, id: SubjectId): number {
  const s = subject(id)
  return Math.max(l[s.bestColumn] ?? 1, l[s.levelColumn] ?? 1)
}

/** The fields to change to put a learner at `level` in a subject (best only ever goes up). */
export function withSubjectLevel<T extends LevelFields>(l: T, id: SubjectId, level: number): T {
  const s = subject(id)
  return { ...l, [s.levelColumn]: level, [s.bestColumn]: Math.max(l[s.bestColumn] ?? 1, level) }
}
