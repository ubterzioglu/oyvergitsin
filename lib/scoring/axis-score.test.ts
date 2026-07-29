import { describe, expect, it } from 'vitest'
import { computeAxisScores } from './axis-score'
import { answer, likertQuestion } from './test-helpers'

const AXIS = 'axis-ekonomi'
const OTHER = 'axis-cevre'

function threeItemAxis() {
  return [likertQuestion('q1', AXIS), likertQuestion('q2', AXIS), likertQuestion('q3', AXIS)]
}

describe('eksen skoru normalizasyonu', () => {
  it('tüm maddelerde en uç cevap ekseni +100 yapar', () => {
    const [axis] = computeAxisScores(
      [AXIS],
      threeItemAxis(),
      ['q1', 'q2', 'q3'].map((id) => answer(id, 'strongly_agree'))
    )

    expect(axis.score).toBe(100)
    expect(axis.coverage).toBe(1)
    expect(axis.tier).toBe('high')
  })

  it('ılımlı cevaplar uca yapışmaz — kırpma yerine normalizasyon', () => {
    // raw = 3 * 12 = 36, max = 3 * 25 = 75 -> 100 * 36 / 75 = 48
    const [axis] = computeAxisScores(
      [AXIS],
      threeItemAxis(),
      ['q1', 'q2', 'q3'].map((id) => answer(id, 'agree'))
    )

    expect(axis.score).toBe(48)
  })

  it('madde sayısı arttıkça skor şişmez (eski kırpma davranışının regresyonu)', () => {
    const threeItems = computeAxisScores(
      [AXIS],
      threeItemAxis(),
      ['q1', 'q2', 'q3'].map((id) => answer(id, 'agree'))
    )

    const sixItems = computeAxisScores(
      [AXIS],
      [...threeItemAxis(), likertQuestion('q4', AXIS), likertQuestion('q5', AXIS), likertQuestion('q6', AXIS)],
      ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'].map((id) => answer(id, 'agree'))
    )

    expect(sixItems[0].score).toBe(threeItems[0].score)
  })

  it('ters kodlanmış maddede katılmak ekseni negatife çeker', () => {
    const [axis] = computeAxisScores(
      [AXIS],
      [likertQuestion('q1', AXIS, { reversed: true })],
      [answer('q1', 'strongly_agree')]
    )

    expect(axis.score).toBe(-100)
  })

  it('madde ağırlığı w paya ve paydaya birlikte girer', () => {
    // q1 ağırlık 2 ile +25, q2 ağırlık 1 ile -25
    // raw = 2*25 - 1*25 = 25, max = 2*25 + 1*25 = 75 -> 33
    const [axis] = computeAxisScores(
      [AXIS],
      [likertQuestion('q1', AXIS, { weight: 2 }), likertQuestion('q2', AXIS)],
      [answer('q1', 'strongly_agree'), answer('q2', 'strongly_disagree')]
    )

    expect(axis.score).toBe(33)
  })
})

describe('fikrim yok ve kararsızım ayrımı', () => {
  it('fikrim yok hem paydan hem paydadan düşer', () => {
    // q3 dışlanır: raw = 50, max = 50 -> 100
    const [axis] = computeAxisScores(
      [AXIS],
      threeItemAxis(),
      [answer('q1', 'strongly_agree'), answer('q2', 'strongly_agree'), answer('q3', 'no_opinion')]
    )

    expect(axis.score).toBe(100)
    expect(axis.answeredItems).toBe(2)
    expect(axis.totalItems).toBe(3)
  })

  it('kararsızım gerçek sıfırdır ve paydada kalır', () => {
    // raw = 50, max = 75 -> 67
    const [axis] = computeAxisScores(
      [AXIS],
      threeItemAxis(),
      [answer('q1', 'strongly_agree'), answer('q2', 'strongly_agree'), answer('q3', 'neutral')]
    )

    expect(axis.score).toBe(67)
    expect(axis.answeredItems).toBe(3)
  })

  it('hiç puanlanabilir cevap yoksa skor null olur, 0 değil', () => {
    const [axis] = computeAxisScores([AXIS], threeItemAxis(), [answer('q1', 'no_opinion')])

    expect(axis.score).toBeNull()
    expect(axis.tier).toBe('none')
    expect(axis.excludedFromMatching).toBe(true)
  })

  it('hiç cevaplanmamış eksen null döner', () => {
    const [axis] = computeAxisScores([AXIS], threeItemAxis(), [])

    expect(axis.score).toBeNull()
    expect(axis.coverage).toBe(0)
  })
})

describe('kapsama etiketleri', () => {
  it('3/3 yanıt -> yüksek, eşleşmeye dahil', () => {
    const [axis] = computeAxisScores(
      [AXIS],
      threeItemAxis(),
      ['q1', 'q2', 'q3'].map((id) => answer(id, 'agree'))
    )

    expect(axis.tier).toBe('high')
    expect(axis.excludedFromMatching).toBe(false)
  })

  it('2/3 yanıt -> orta, eşleşmeye dahil', () => {
    const [axis] = computeAxisScores(
      [AXIS],
      threeItemAxis(),
      [answer('q1', 'agree'), answer('q2', 'agree')]
    )

    expect(axis.tier).toBe('medium')
    expect(axis.excludedFromMatching).toBe(false)
  })

  it('1/3 yanıt -> düşük, eşleşmeden çıkarılır', () => {
    const [axis] = computeAxisScores([AXIS], threeItemAxis(), [answer('q1', 'agree')])

    expect(axis.tier).toBe('low')
    expect(axis.excludedFromMatching).toBe(true)
    // Skor yine de hesaplanır; sonuç ekranı düşük kapsama uyarısıyla gösterir.
    expect(axis.score).toBe(48)
  })
})

describe('önem ağırlığı', () => {
  it('bir madde önemli işaretlenmişse eksenin ağırlığı 1.5 olur', () => {
    const [axis] = computeAxisScores(
      [AXIS],
      threeItemAxis(),
      [answer('q1', 'agree', true), answer('q2', 'agree'), answer('q3', 'agree')]
    )

    expect(axis.weight).toBe(1.5)
  })

  it('hiçbiri işaretli değilse ağırlık 1 kalır', () => {
    const [axis] = computeAxisScores(
      [AXIS],
      threeItemAxis(),
      ['q1', 'q2', 'q3'].map((id) => answer(id, 'agree'))
    )

    expect(axis.weight).toBe(1)
  })

  it('önem işareti yalnızca kendi eksenini etkiler', () => {
    const axes = computeAxisScores(
      [AXIS, OTHER],
      [likertQuestion('q1', AXIS), likertQuestion('q2', OTHER)],
      [answer('q1', 'agree', true), answer('q2', 'agree')]
    )

    expect(axes[0].weight).toBe(1.5)
    expect(axes[1].weight).toBe(1)
  })
})
