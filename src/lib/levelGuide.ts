import { MAX_LEVEL, ITEMS_PER_LEVEL } from './curriculum'
import { SPELLING_WORDS } from './spellingWords'
import type { Mode } from './types'

/** One range of levels: what it's called, roughly what school grade (or CEFR level) it matches, and what you practice. */
export interface LevelRange {
  from: number
  to: number
  stage: string
  grade: string
  what: string
}

const READING: LevelRange[] = [
  { from: 1, to: 5, stage: 'Words', grade: 'Kindergarten', what: 'Short sight words and 3-letter words (cat, sun, hen)' },
  { from: 6, to: 12, stage: 'Words', grade: 'Grade 1', what: 'Sh/ch/th words, long vowels, silent e (ship, cake, boat)' },
  { from: 13, to: 15, stage: 'Words', grade: 'Grade 2', what: 'Two- and three-syllable words (rabbit, elephant)' },
  { from: 16, to: 25, stage: 'Phrases', grade: 'Grade 1–2', what: 'Short phrases (red cup, the big blue kite)' },
  { from: 26, to: 40, stage: 'Phrases', grade: 'Grade 2–3', what: 'Longer phrases; meaning questions start at Level 31' },
  { from: 41, to: 55, stage: 'Sentences', grade: 'Grade 3–4', what: 'Full sentences with a question about what each means' },
  { from: 56, to: 60, stage: 'Grade 5–6', grade: 'Grade 5–6', what: 'Vocabulary (enormous, persuade) and sayings (break the ice)' },
  { from: 61, to: 65, stage: 'Middle School', grade: 'Grade 7–8', what: 'Words like ambiguous, infer; idioms' },
  { from: 66, to: 70, stage: 'High School', grade: 'Grade 9–10', what: 'Words like ephemeral, juxtapose' },
  { from: 71, to: 75, stage: 'College Prep', grade: 'Grade 11–12', what: 'SAT-level words (ubiquitous, obfuscate)' },
  { from: 76, to: 80, stage: 'College', grade: 'College', what: 'Academic words (empirical, correlation)' },
  { from: 81, to: 85, stage: 'Advanced College', grade: 'Upper college', what: 'Ideas from philosophy and science (epistemology, heuristic)' },
  { from: 86, to: 90, stage: 'Graduate', grade: "Master's level", what: 'Research language (falsifiability, counterfactual)' },
  { from: 91, to: 95, stage: 'Graduate+', grade: 'PhD coursework', what: 'Advanced theory terms (supervenience, a priori)' },
  { from: 96, to: 100, stage: 'Doctorate', grade: 'Doctorate', what: 'Research methods (Bayesian inference, construct validity)' },
]

const SPANISH: LevelRange[] = [
  { from: 1, to: 6, stage: 'Travel basics', grade: 'Beginner (A1)', what: 'Greetings, help, numbers, food, directions, emergencies' },
  { from: 7, to: 15, stage: 'Words', grade: 'Beginner (A1)', what: 'Everyday nouns with el / la / un / una' },
  { from: 16, to: 25, stage: 'Phrases', grade: 'Beginner (A1–A2)', what: 'Nouns with adjectives that agree (la casa blanca)' },
  { from: 26, to: 35, stage: 'Phrases', grade: 'Elementary (A2)', what: 'Plurals and numbers (tres perros grandes)' },
  { from: 36, to: 60, stage: 'Sentences', grade: 'Elementary (A2)', what: 'Short sentences: wanting, having, going' },
  { from: 61, to: 85, stage: 'Sentences', grade: 'Intermediate (A2–B1)', what: 'Longer sentences with times and plans' },
  { from: 86, to: 100, stage: 'Sentences', grade: 'Intermediate (B1)', what: 'Complex sentences with when, because and always' },
]

/** Spelling: grades follow where each level's words sit in the list (easiest to championship). */
const SPELLING_BANDS = [
  { first: 'cat', stage: 'First words', grade: 'Grade 1', what: 'Three-letter words (cat, hen, zoo)' },
  { first: 'ship', stage: 'Word builder', grade: 'Grade 2', what: 'Blends, digraphs and long vowels (sheep, train)' },
  { first: 'because', stage: 'Tricky words', grade: 'Grade 3', what: 'Sight words and multi-syllable words (because, beautiful)' },
  { first: 'adventure', stage: 'Classroom bee', grade: 'Grade 4', what: 'Silent letters and tricky vowels (February, knuckle)' },
  { first: 'brilliant', stage: 'School bee', grade: 'Grade 5–6', what: 'School spelling bee words (rhythm, souvenir)' },
  { first: 'accommodate', stage: 'District bee', grade: 'Grade 6–7', what: 'District bee words (conscientious, mnemonic)' },
  { first: 'acquiesce', stage: 'Regional bee', grade: 'Grade 7–8', what: 'Regional bee words (dachshund, pseudonym)' },
  { first: 'abecedarian', stage: 'National prelims', grade: 'National bee', what: 'Early-round National Spelling Bee words (schadenfreude)' },
  { first: 'chrysanthemum', stage: 'National finals', grade: 'National bee finals', what: 'Late-round words (bouillabaisse, chiaroscuro)' },
  { first: 'fibranne', stage: 'Championship', grade: 'Scripps champion', what: 'Real National Spelling Bee winning words (appoggiatura, knaidel)' },
]
const bandStart = SPELLING_BANDS.map((b) => Math.max(0, SPELLING_WORDS.findIndex((w) => w.word === b.first)))
function spellingBand(level: number): number {
  const n = SPELLING_WORDS.length
  const start = Math.round(((level - 1) * (n - ITEMS_PER_LEVEL)) / (MAX_LEVEL - 1))
  const mid = start + ITEMS_PER_LEVEL / 2
  let b = 0
  for (let i = 0; i < bandStart.length; i++) if (mid >= bandStart[i]) b = i
  return b
}
function spellingRanges(): LevelRange[] {
  const out: LevelRange[] = []
  for (let l = 1; l <= MAX_LEVEL; l++) {
    const b = SPELLING_BANDS[spellingBand(l)]
    const last = out[out.length - 1]
    if (last && last.stage === b.stage) last.to = l
    else out.push({ from: l, to: l, stage: b.stage, grade: b.grade, what: b.what })
  }
  return out
}

export const LEVEL_GUIDE: Record<Mode, LevelRange[]> = { reading: READING, spanish: SPANISH, spelling: spellingRanges() }

export function rangeFor(level: number, mode: Mode): LevelRange {
  return LEVEL_GUIDE[mode].find((r) => level >= r.from && level <= r.to) ?? LEVEL_GUIDE[mode][LEVEL_GUIDE[mode].length - 1]
}

/** The school grade (or CEFR level for Spanish) a level's words match: "Grade 4", "College", "Beginner (A1)". */
export function gradeFor(level: number, mode: Mode): string {
  return rangeFor(level, mode).grade
}

/** Spelling stage name from the word bands. */
export function spellingStage(level: number): string {
  return SPELLING_BANDS[spellingBand(level)].stage
}
