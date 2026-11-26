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
  /** Speech recognition language. */
  speechLang: string
  /** A language to say (Spanish, French …): what's needed to teach it. Absent for Reading and Spelling Bee. */
  language?: LanguageInfo
  /** Suffix for mastered-item keys per level ("12", "12_es", "12_sp"). */
  masterySuffix: string
  /**
   * Older learner columns that also hold this subject's level and best level. Only the first three
   * subjects have them; levels live in learner_subjects, so a new subject leaves these out.
   */
  levelColumn?: 'reading_level' | 'spanish_level' | 'spelling_level'
  bestColumn?: 'reading_best' | 'spanish_best' | 'spelling_best'
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

export interface LanguageInfo {
  /** "French" (used in "Say this in French"). */
  name: string
  /** Iris's voice for the language. */
  voiceLang: string
  /** Number of levels in this path. */
  maxLevel: number
  /** How answers are compared: letters (Latin), characters (Japanese, Korean, Chinese) or Persian script. */
  script: 'latin' | 'cjk' | 'persian'
  /** Shown in English letters (the card never shows the native script). */
  romanized?: boolean
  /** New, being checked by native speakers. */
  beta?: boolean
}

const lang = (id: SubjectId, label: string, icon: string, speechLang: string, info: Omit<LanguageInfo, 'name' | 'maxLevel'> & { maxLevel?: number },
  colors: { active: string; chart: Subject['chart'] }, extra = ''): Subject => ({
  id, label, shortLabel: label, longLabel: `${label} (from English)${info.beta ? ' · Beta' : ''}`, icon,
  blurb: `See an English word or phrase and say it in ${label}, starting with travel phrases.${extra}`,
  speechLang, masterySuffix: `_${id.slice(0, 3)}`,
  language: { name: label, maxLevel: 30, ...info },
  scaleNote: 'CEFR scale: A1 beginner → A2 elementary',
  activeClass: `bg-gradient-to-r ${colors.active} text-white shadow`,
  chart: colors.chart,
  stuckAfterSeconds: 90,
  needsDbUpdate: '017',
})

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
    language: { name: 'Spanish', voiceLang: 'es-ES', maxLevel: 100, script: 'latin' },
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
  lang('french', 'French', '🇫🇷', 'fr-FR', { voiceLang: 'fr-FR', script: 'latin', beta: true },
    { active: 'from-blue-600 to-red-500', chart: { className: 'stroke-blue-600', dot: 'bg-blue-600', fill: 'fill-blue-600' } }),
  lang('portuguese', 'Portuguese', '🇵🇹', 'pt-PT', { voiceLang: 'pt-PT', script: 'latin', beta: true },
    { active: 'from-green-700 to-red-600', chart: { className: 'stroke-green-700', dot: 'bg-green-700', fill: 'fill-green-700' } }, ' European Portuguese (Portugal).'),
  lang('tagalog', 'Tagalog', '🇵🇭', 'fil-PH', { voiceLang: 'fil-PH', script: 'latin', beta: true },
    { active: 'from-blue-700 to-yellow-500', chart: { className: 'stroke-sky-600', dot: 'bg-sky-600', fill: 'fill-sky-600' } }, ' Also called Filipino.'),
  lang('japanese', 'Japanese', '🇯🇵', 'ja-JP', { voiceLang: 'ja-JP', script: 'cjk', romanized: true, beta: true },
    { active: 'from-rose-600 to-pink-400', chart: { className: 'stroke-rose-600', dot: 'bg-rose-600', fill: 'fill-rose-600' } }, ' Shown in English letters.'),
  lang('korean', 'Korean', '🇰🇷', 'ko-KR', { voiceLang: 'ko-KR', script: 'cjk', romanized: true, beta: true },
    { active: 'from-sky-600 to-red-500', chart: { className: 'stroke-cyan-600', dot: 'bg-cyan-600', fill: 'fill-cyan-600' } }, ' Shown in English letters.'),
  lang('mandarin', 'Mandarin', '🇨🇳', 'zh-CN', { voiceLang: 'zh-CN', script: 'cjk', romanized: true, beta: true },
    { active: 'from-red-600 to-yellow-500', chart: { className: 'stroke-red-600', dot: 'bg-red-600', fill: 'fill-red-600' } }, ' Mandarin Chinese, shown in pinyin.'),
  lang('farsi', 'Farsi', '🇮🇷', 'fa-IR', { voiceLang: 'fa-IR', script: 'persian', romanized: true, beta: true },
    { active: 'from-emerald-600 to-red-500', chart: { className: 'stroke-teal-600', dot: 'bg-teal-600', fill: 'fill-teal-600' } }, ' Persian, shown in English letters.'),
]

/** True for subjects where the learner says a word in another language (Spanish, French …). */
export const isLanguage = (id: string | null | undefined) => Boolean(subject(id).language)

const BY_ID = new Map(SUBJECTS.map((s) => [s.id, s]))

/** The subject with this id (falls back to Reading for unknown values). */
export function subject(id: string | null | undefined): Subject {
  return BY_ID.get(id as SubjectId) ?? SUBJECTS[0]
}

export const isSubjectId = (v: unknown): v is SubjectId => typeof v === 'string' && BY_ID.has(v as SubjectId)

/** "📖 Reading" */
export const subjectName = (id: string | null | undefined) => `${subject(id).icon} ${subject(id).label}`

type LevelFields = Partial<Pick<Learner, NonNullable<Subject['levelColumn']> | NonNullable<Subject['bestColumn']> | 'levels'>>

/** A learner's current level in a subject (1 when not started or not available yet). */
export function subjectLevel(l: LevelFields, id: SubjectId): number {
  const col = subject(id).levelColumn
  return l.levels?.[id]?.level ?? (col ? l[col] : undefined) ?? 1
}

/** Highest level ever reached in a subject (never below the current level). */
export function subjectBest(l: LevelFields, id: SubjectId): number {
  const col = subject(id).bestColumn
  return Math.max(l.levels?.[id]?.best ?? 1, (col ? l[col] : undefined) ?? 1, subjectLevel(l, id))
}

/** The fields to change to put a learner at `level` in a subject (best only ever goes up). */
export function withSubjectLevel<T extends LevelFields>(l: T, id: SubjectId, level: number): T {
  const s = subject(id)
  const best = Math.max(subjectBest(l, id), level)
  return {
    ...l,
    ...(s.levelColumn ? { [s.levelColumn]: level } : {}),
    ...(s.bestColumn ? { [s.bestColumn]: best } : {}),
    levels: { ...l.levels, [id]: { level, best } },
  }
}

/** Every subject's level and best, as rows for the learner_subjects table. */
export function levelRows(l: LevelFields & { id: string }, ids: readonly SubjectId[] = SUBJECTS.map((s) => s.id)) {
  return ids.map((id) => ({ learner_id: l.id, subject: id, level: subjectLevel(l, id), best: subjectBest(l, id) }))
}
