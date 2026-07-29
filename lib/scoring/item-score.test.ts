import { describe, expect, it } from 'vitest'
import { scoreItem } from './item-score'
import { parseAnswerValue } from './parse-answer'
import { question } from './test-helpers'
import type { ScorableQuestion } from './types'

const AXIS = 'axis-a'

function score(q: ScorableQuestion, raw: string) {
  return scoreItem(q, parseAnswerValue(q.type, raw))
}

describe('çoklu seçim', () => {
  const q = question({
    id: 'q',
    type: 'multi_choice',
    rules: [
      { answerValue: 'a', axisId: AXIS, scoreModifier: 10 },
      { answerValue: 'b', axisId: AXIS, scoreModifier: 20 },
      { answerValue: 'c', axisId: AXIS, scoreModifier: -15 },
    ],
  })

  it('seçili şıkların puanlarını toplar', () => {
    expect(score(q, '["a","b"]').contributions[AXIS]).toBe(30)
  })

  it('artı ve eksi şıklar birbirini götürür', () => {
    expect(score(q, '["b","c"]').contributions[AXIS]).toBe(5)
  })

  it('M ulaşılabilir en büyük mutlak toplamdır', () => {
    // artı toplam 30, eksi toplam 15 -> M = 30
    expect(score(q, '["a"]').maxima[AXIS]).toBe(30)
  })

  it('kuralı olmayan şık seçilse de madde paydaya girer', () => {
    const result = score(q, '["bilinmeyen"]')

    expect(result.contributions[AXIS]).toBe(0)
    expect(result.maxima[AXIS]).toBe(30)
  })
})

describe('sıralama (Borda)', () => {
  const q = question({
    id: 'q',
    type: 'ranking',
    rules: [
      { answerValue: 'sol', axisId: AXIS, scoreModifier: 10 },
      { answerValue: 'orta', axisId: AXIS, scoreModifier: 0 },
      { answerValue: 'sag', axisId: AXIS, scoreModifier: -10 },
    ],
  })

  it('en yüksek yönü başa koymak maksimum skoru verir', () => {
    const result = score(q, 'sol,orta,sag')

    expect(result.contributions[AXIS]).toBe(result.maxima[AXIS])
  })

  it('ters sıralama simetrik olarak minimumu verir', () => {
    const result = score(q, 'sag,orta,sol')

    expect(result.contributions[AXIS]).toBe(-result.maxima[AXIS])
  })

  it('tüm yönler aynı işaretliyse madde ayrıştırıcı değildir ve tamamen dışlanır', () => {
    // Merkezlenmemiş Borda burada sıralamadan bağımsız sabit pozitif bir skor
    // üretirdi. Merkezlenmiş biçimde ulaşılabilir maksimum 0'dır; böyle bir
    // madde paydayı da şişirmemeli, yoksa ekseni yapay olarak sıfıra çeker.
    const allPositive = question({
      id: 'q2',
      type: 'ranking',
      rules: [
        { answerValue: 'a', axisId: AXIS, scoreModifier: 10 },
        { answerValue: 'b', axisId: AXIS, scoreModifier: 10 },
        { answerValue: 'c', axisId: AXIS, scoreModifier: 10 },
      ],
    })

    expect(score(allPositive, 'a,b,c').maxima[AXIS]).toBeUndefined()
    expect(score(allPositive, 'c,b,a').maxima[AXIS]).toBeUndefined()
  })

  it('tek seçenekli sıralama sıralanamaz, dışlanır', () => {
    expect(score(q, 'sol').maxima[AXIS]).toBeUndefined()
  })
})

describe('kaydırıcı', () => {
  const q = question({
    id: 'q',
    type: 'slider_0_100',
    maxContribution: 25,
    rules: [{ answerValue: 'scale', axisId: AXIS, scoreModifier: 25 }],
  })

  it('orta nokta sıfır katkı verir ama paydaya girer', () => {
    const result = score(q, '50')

    expect(result.contributions[AXIS]).toBe(0)
    expect(result.maxima[AXIS]).toBe(25)
  })

  it('uçlar +/- M verir', () => {
    expect(score(q, '100').contributions[AXIS]).toBe(25)
    expect(score(q, '0').contributions[AXIS]).toBe(-25)
  })

  it('aralık dışı değer kırpılır', () => {
    expect(score(q, '250').contributions[AXIS]).toBe(25)
  })

  it('kural işareti negatifse yön ters çevrilir', () => {
    const reversed = question({
      id: 'q2',
      type: 'slider_0_100',
      maxContribution: 25,
      rules: [{ answerValue: 'scale', axisId: AXIS, scoreModifier: -25 }],
    })

    expect(score(reversed, '100').contributions[AXIS]).toBe(-25)
  })
})

describe('matris', () => {
  // Kural değeri "<satır>:<sütun>" biçiminde kodlanır.
  const q = question({
    id: 'q',
    type: 'matrix_single',
    maxContribution: 25,
    rules: [
      { answerValue: 'r1:agree', axisId: AXIS, scoreModifier: 25 },
      { answerValue: 'r1:disagree', axisId: AXIS, scoreModifier: -25 },
      { answerValue: 'r2:agree', axisId: AXIS, scoreModifier: 25 },
      { answerValue: 'r2:disagree', axisId: AXIS, scoreModifier: -25 },
    ],
  })

  it('her satır ayrı bir alt-madde gibi toplanır', () => {
    const result = score(q, '{"r1":["agree"],"r2":["agree"]}')

    expect(result.contributions[AXIS]).toBe(50)
    expect(result.maxima[AXIS]).toBe(50)
  })

  it('yalnızca doldurulan satırlar paydaya girer', () => {
    const result = score(q, '{"r1":["agree"]}')

    expect(result.contributions[AXIS]).toBe(25)
    expect(result.maxima[AXIS]).toBe(25)
  })

  it('satırlar birbirini götürebilir', () => {
    const result = score(q, '{"r1":["agree"],"r2":["disagree"]}')

    expect(result.contributions[AXIS]).toBe(0)
    expect(result.maxima[AXIS]).toBe(50)
  })
})

describe('puan dağıtımı', () => {
  const q = question({
    id: 'q',
    type: 'allocation',
    maxContribution: 25,
    rules: [
      { answerValue: 'kamu', axisId: AXIS, scoreModifier: 25 },
      { answerValue: 'piyasa', axisId: AXIS, scoreModifier: -25 },
    ],
  })

  it('tüm puan tek kutba verilirse M kadar katkı olur', () => {
    expect(score(q, '{"kamu":100}').contributions[AXIS]).toBe(25)
  })

  it('eşit dağıtım sıfır verir', () => {
    expect(score(q, '{"kamu":50,"piyasa":50}').contributions[AXIS]).toBe(0)
  })

  it('paylar 100e tamamlanmasa da oran korunur', () => {
    // 30 - 10 = 20 fark, toplam 40 -> 25 * 0.5 = 12.5
    expect(score(q, '{"kamu":30,"piyasa":10}').contributions[AXIS]).toBe(12.5)
  })
})

describe('sayısal giriş', () => {
  const q = question({
    id: 'q',
    type: 'numeric_input',
    rules: [
      { answerValue: '0..30', axisId: AXIS, scoreModifier: -20 },
      { answerValue: '31..70', axisId: AXIS, scoreModifier: 0 },
      { answerValue: '71..100', axisId: AXIS, scoreModifier: 20 },
    ],
  })

  it('değeri aralığa göre kovalar', () => {
    expect(score(q, '15').contributions[AXIS]).toBe(-20)
    expect(score(q, '50').contributions[AXIS]).toBe(0)
    expect(score(q, '90').contributions[AXIS]).toBe(20)
  })

  it('aralık dışı değer maddeyi tamamen dışlar', () => {
    expect(score(q, '250').maxima[AXIS]).toBeUndefined()
  })
})

describe('skora girmeyen maddeler', () => {
  it('is_scored false ise katkı üretilmez', () => {
    const q = question({
      id: 'q',
      type: 'likert_5',
      isScored: false,
      rules: [{ answerValue: 'agree', axisId: AXIS, scoreModifier: 25 }],
    })

    expect(score(q, 'agree')).toEqual({ contributions: {}, maxima: {} })
  })

  it('kuralı olmayan madde katkı üretmez', () => {
    const q = question({ id: 'q', type: 'likert_5', rules: [] })

    expect(score(q, 'agree')).toEqual({ contributions: {}, maxima: {} })
  })
})
