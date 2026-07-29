import { describe, expect, it } from 'vitest'
import { parseAnswerValue } from './parse-answer'

describe('cevap çözümleme', () => {
  it('tek değerli tipleri ham string olarak alır', () => {
    expect(parseAnswerValue('likert_5', 'agree')).toEqual({ kind: 'single', value: 'agree' })
  })

  it('çoklu seçimi JSON diziden okur', () => {
    expect(parseAnswerValue('multi_choice', '["a","b"]')).toEqual({ kind: 'multi', values: ['a', 'b'] })
  })

  it('çoklu seçimde virgüllü eski biçimi de kabul eder', () => {
    expect(parseAnswerValue('multi_choice', 'a, b')).toEqual({ kind: 'multi', values: ['a', 'b'] })
  })

  it('sıralamayı virgüllü listeden okur', () => {
    expect(parseAnswerValue('ranking', 'a,b,c')).toEqual({ kind: 'ranking', order: ['a', 'b', 'c'] })
  })

  it('matrisi satır -> sütun eşlemesi olarak okur', () => {
    expect(parseAnswerValue('matrix_single', '{"r1":["c2"]}')).toEqual({
      kind: 'matrix',
      rows: { r1: ['c2'] },
    })
  })

  it('puan dağıtımında sıfır payları eler', () => {
    expect(parseAnswerValue('allocation', '{"a":60,"b":40,"c":0}')).toEqual({
      kind: 'allocation',
      shares: { a: 60, b: 40 },
    })
  })

  it('kaydırıcı ve sayısal girişi sayıya çevirir', () => {
    expect(parseAnswerValue('slider_0_100', '75')).toEqual({ kind: 'numeric', value: 75 })
  })
})

describe('bozuk girdiler asla hata fırlatmaz', () => {
  const badInputs: Array<[string, unknown]> = [
    ['likert_5', null],
    ['likert_5', undefined],
    ['likert_5', ''],
    ['likert_5', '   '],
    ['multi_choice', '{bozuk json'],
    ['matrix_single', '["dizi bekleniyordu degil"]'],
    ['matrix_single', '{}'],
    ['allocation', 'null'],
    ['allocation', '{"a":"sayi degil"}'],
    ['slider_0_100', 'abc'],
    ['bilinmeyen_tip', 'deger'],
  ]

  it.each(badInputs)('%s + %s -> invalid', (type, raw) => {
    expect(() => parseAnswerValue(type, raw as string)).not.toThrow()
    expect(parseAnswerValue(type, raw as string).kind).toBe('invalid')
  })
})
