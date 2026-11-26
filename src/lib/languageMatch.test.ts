import { it, expect } from 'vitest'
import { levelItems } from './progress'
import { isLanguageAnswer } from './languageMatch'
import { subject } from './subjects'
import type { Mode } from './types'

const ids: Mode[] = ['french', 'portuguese', 'tagalog', 'japanese', 'korean', 'mandarin', 'farsi', 'spanish']
const plain = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[?!¿¡.,]/g, '')
/** Saying each answer counts for that item, and (apart from real synonyms) not for another item of its level. */
it('every language item is recognized, and rarely mistaken for another', () => {
  const misses: string[] = []
  const cross: string[] = []
  for (const id of ids) {
    const script = subject(id).language!.script
    const top = id === 'spanish' ? 30 : 30
    for (let l = 1; l <= top; l++) {
      const items = levelItems(l, id)
      const m = (heard: string, it: (typeof items)[number]) => isLanguageAnswer(heard, it, items, subject(id).language!)
      for (const it of items) {
        const said = script === 'latin' ? plain(it.target) : it.target
        if (!m(said, it)) misses.push(`${id} L${l} ${it.key}: "${said}"`)
        for (const v of it.spanish!.variants) if (!/^\d+$/.test(v) && !m(script === 'latin' ? plain(v) : v, it)) misses.push(`${id} L${l} ${it.key} variant "${v}"`)
        for (const other of items) if (other !== it && other.target !== it.target && m(said, other)) cross.push(`${id} L${l}: saying "${said}" (${it.key}) also counts for ${other.key}`)
      }
    }
  }
  expect(misses).toEqual([])
  // Shared answers that really are synonyms (desculpe, pera, 足 / 脚, 晚上 …).
  expect(cross.length, cross.join('\n')).toBeLessThanOrEqual(16)
})

it('rivals: a longer answer from the same level wins', () => {
  const ko = levelItems(7, 'korean')
  const father = ko.find((i) => i.key === 'father')!
  expect(isLanguageAnswer('할아버지', father, ko, subject('korean').language!)).toBe(false)
  expect(isLanguageAnswer('아버지', father, ko, subject('korean').language!)).toBe(true)
  const fr = levelItems(3, 'french')
  expect(isLanguageAnswer('six', fr.find((i) => i.key === 'five')!, fr, subject('french').language!)).toBe(false)
  expect(isLanguageAnswer('cinq', fr.find((i) => i.key === 'five')!, fr, subject('french').language!)).toBe(true)
  const pt = levelItems(3, 'portuguese')
  expect(isLanguageAnswer('três', pt.find((i) => i.key === 'three')!, pt, subject('portuguese').language!)).toBe(true)
  expect(isLanguageAnswer('3', pt.find((i) => i.key === 'three')!, pt, subject('portuguese').language!)).toBe(true)
})
