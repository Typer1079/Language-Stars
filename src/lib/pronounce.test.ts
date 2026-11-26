import { describe, expect, it } from 'vitest'
import { soundPieces, soundsLike, syllables } from './pronounce'
import { levelItems } from './progress'

describe('pronunciation help', () => {
  it('splits English-letter spellings into syllables', () => {
    expect(syllables('konnichiwa')).toEqual(['kon', 'ni', 'chi', 'wa'])
    expect(syllables('annyeonghaseyo').join('-')).toBe('an-nyeong-ha-se-yo')
    expect(syllables('obrigado')).toEqual(['o', 'bri', 'ga', 'do'])
    expect(soundsLike('muito obrigado')).toBe('mui-to o-bri-ga-do')
    expect(soundsLike("s'il vous plaît")).toBe("s'il vous plaît")
  })
  it('pieces Iris says one at a time', () => {
    const ja = levelItems(1, 'japanese')[0] // こんにちは
    expect(soundPieces(ja.spanish!, 'Japanese')).toEqual(['こ', 'ん', 'に', 'ち', 'は'])
    const ko = levelItems(1, 'korean')[0] // 안녕하세요
    expect(soundPieces(ko.spanish!, 'Korean')).toEqual(['안', '녕', '하', '세', '요'])
    const zh = levelItems(1, 'mandarin')[0] // 你好
    expect(soundPieces(zh.spanish!, 'Mandarin')).toEqual(['你', '好'])
    const pt = levelItems(1, 'portuguese').find((i) => i.key === 'good morning')!
    expect(soundPieces(pt.spanish!, 'Portuguese')).toEqual(['bom', 'dia'])
    expect(soundPieces(levelItems(1, 'portuguese')[0].spanish!, 'Portuguese')).toEqual([])
  })
  it('Japanese beats keep small kana with the one before', () => {
    const it = levelItems(14, 'japanese').find((i) => i.key === 'today')! // 今日 / きょう
    expect(soundPieces(it.spanish!, 'Japanese')).toEqual(['きょ', 'う'])
    const tea = levelItems(2, 'japanese').find((i) => i.key === 'nice to meet you')!
    expect(soundPieces(tea.spanish!, 'Japanese')).toEqual(['は', 'じ', 'め', 'ま', 'し', 'て'])
  })
})
