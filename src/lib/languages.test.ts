import { describe, expect, it } from 'vitest'
import { LANGUAGE_LEVELS } from './languages'
import { CONCEPTS, LANGUAGE_LEVEL_COUNT } from './languages/concepts'
import { isNativeMatch, isSpanishMatch } from './match'
import { SUBJECTS, subject } from './subjects'
import { levelItems, maxLevel } from './progress'
import { LEVEL_GUIDE, gradeFor } from './levelGuide'
import { stageName } from './curriculum'

const NATIVE = /[぀-ヿ一-鿿가-힯؀-ۿ]/

describe('language paths', () => {
  it('every new language has 30 full levels', () => {
    expect(CONCEPTS).toHaveLength(LANGUAGE_LEVEL_COUNT)
    for (const [id, levels] of Object.entries(LANGUAGE_LEVELS)) {
      expect(subject(id).language?.maxLevel, id).toBe(LANGUAGE_LEVEL_COUNT)
      for (let l = 1; l <= LANGUAGE_LEVEL_COUNT; l++) {
        expect(levels[l], `${id} level ${l}`).toHaveLength(10)
        for (const e of levels[l]) {
          expect(e.es.trim(), `${id} ${e.en}`).not.toBe('')
          expect(e.en).not.toContain('{lang}')
        }
      }
    }
  })

  it('romanized languages show English letters and keep the native script for listening', () => {
    for (const s of SUBJECTS.filter((x) => x.language?.romanized)) {
      for (let l = 1; l <= maxLevel(s.id); l++) {
        for (const it of levelItems(l, s.id)) {
          expect(NATIVE.test(it.spanish!.es), `${s.id} shows ${it.spanish!.es}`).toBe(false)
          expect(NATIVE.test(it.target), `${s.id} listens for ${it.target}`).toBe(true)
        }
      }
    }
  })

  it('mastery keys are unique per level and per subject', () => {
    const suffixes = SUBJECTS.map((s) => s.masterySuffix)
    expect(new Set(suffixes).size).toBe(suffixes.length)
    for (const id of Object.keys(LANGUAGE_LEVELS)) {
      for (let l = 1; l <= 30; l++) {
        const keys = levelItems(l, id as never).map((i) => i.key)
        expect(new Set(keys).size, `${id} ${l}`).toBe(keys.length)
      }
    }
  })

  it('has a level guide, stage and grade for each level', () => {
    expect(LEVEL_GUIDE.french[0]).toMatchObject({ from: 1, stage: 'Travel basics' })
    expect(LEVEL_GUIDE.japanese[LEVEL_GUIDE.japanese.length - 1].to).toBe(30)
    expect(stageName(30, 'korean')).toBe('Sentences')
    expect(gradeFor(1, 'farsi')).toBe('Beginner (A1)')
  })
})

describe('matching in other scripts', () => {
  it('Japanese: kanji, kana and katakana forms', () => {
    expect(isNativeMatch('犬', '犬', ['いぬ'])).toBe(true)
    expect(isNativeMatch('いぬ', '犬', ['いぬ'])).toBe(true)
    expect(isNativeMatch('イヌ', '犬', ['いぬ'])).toBe(true)
    expect(isNativeMatch('ねこ', '犬', ['いぬ'])).toBe(false)
    expect(isNativeMatch('こんにちは。', 'こんにちは', [])).toBe(true)
  })
  it('short answers must stand alone', () => {
    expect(isNativeMatch('일곱', '하나', ['일', '1'])).toBe(false)
    expect(isNativeMatch('1', '하나', ['일', '1'])).toBe(true)
  })
  it('Chinese phrases forgive one wrong character', () => {
    expect(isNativeMatch('你会说英语吗', '你会说英语吗')).toBe(true)
    expect(isNativeMatch('你会说英文吗', '你会说英语吗')).toBe(true)
    expect(isNativeMatch('我不知道', '你会说英语吗')).toBe(false)
  })
  it('Persian: Arabic letter forms, joiners and digits', () => {
    expect(isNativeMatch('ممنون', 'مرسی', ['ممنون'])).toBe(true)
    expect(isNativeMatch('مي‌خواهم آب', 'آب می‌خواهم', [])).toBe(false)
    expect(isNativeMatch('دانش آموز', 'دانش‌آموز', [])).toBe(true)
    expect(isNativeMatch('۱۰', 'ده', ['10'])).toBe(true)
  })
  it('French and Portuguese accept missing accents and articles listed as variants', () => {
    const chien = levelItems(9, 'french')[0]
    expect(isSpanishMatch('chien', chien.target, chien.spanish!.variants)).toBe(true)
    const pao = levelItems(4, 'portuguese')[1]
    expect(isSpanishMatch('pao', pao.target, pao.spanish!.variants)).toBe(true)
  })
})
