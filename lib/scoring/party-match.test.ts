import { describe, expect, it } from 'vitest'
import { buildExplanations, computePartyMatches } from './party-match'
import type { AxisResult, PartyPosition } from './types'

const A = 'axis-a'
const B = 'axis-b'

function axis(axisId: string, score: number | null, overrides: Partial<AxisResult> = {}): AxisResult {
  return {
    axisId,
    score,
    coverage: 1,
    tier: 'high',
    answeredItems: 3,
    totalItems: 3,
    weight: 1,
    excludedFromMatching: false,
    ...overrides,
  }
}

function position(partyId: string, axisId: string, score: number): PartyPosition {
  return { partyId, axisId, score }
}

describe('parti benzerliği sınırları', () => {
  it('birebir aynı konum %100 verir', () => {
    const [match] = computePartyMatches(['X'], [axis(A, 60)], [position('X', A, 60)])

    expect(match.similarity).toBe(100)
  })

  it('tam zıt uçlar %0 verir', () => {
    const [match] = computePartyMatches(['X'], [axis(A, 100)], [position('X', A, -100)])

    expect(match.similarity).toBe(0)
  })

  it('yarı yol %75 verir', () => {
    // |0 - 50| = 50 ; 100 * (1 - 50/200) = 75
    const [match] = computePartyMatches(['X'], [axis(A, 0)], [position('X', A, 50)])

    expect(match.similarity).toBe(75)
  })

  it('konumu olmayan parti null döner, 0 değil', () => {
    const [match] = computePartyMatches(['X'], [axis(A, 50)], [])

    expect(match.similarity).toBeNull()
    expect(match.axesUsed).toBe(0)
  })

  it('yeterince eksende konumlanmamış parti sıralamaya girmez', () => {
    // 8 eksen karşılaştırılabilir; eşik %75 -> en az 6 konum gerekiyor.
    const axes = Array.from({ length: 8 }, (_, index) => axis(`axis-${index}`, 50))
    const sparse = Array.from({ length: 5 }, (_, index) => position('Az', `axis-${index}`, 50))
    const full = Array.from({ length: 8 }, (_, index) => position('Tam', `axis-${index}`, 50))

    const [az, tam] = computePartyMatches(['Az', 'Tam'], axes, [...sparse, ...full])

    // Az kodlanmış parti her eksende birebir uyuyor ama yine de sıralanmaz.
    expect(az.similarity).toBeNull()
    expect(az.axesUsed).toBe(5)
    expect(tam.similarity).toBe(100)
  })

  it('eşiği tam karşılayan parti sıralanır', () => {
    const axes = Array.from({ length: 8 }, (_, index) => axis(`axis-${index}`, 50))
    const positions = Array.from({ length: 6 }, (_, index) => position('Sinirda', `axis-${index}`, 50))

    const [match] = computePartyMatches(['Sinirda'], axes, positions)

    expect(match.similarity).toBe(100)
    expect(match.axesUsed).toBe(6)
  })

  it('kullanıcının kapsaması düşükse eşik de küçülür', () => {
    // Yalnızca 4 eksen karşılaştırılabilir -> eşik 3 konum.
    const axes = [
      axis(A, 50),
      axis(B, 50),
      axis('axis-c', 50),
      axis('axis-d', 50),
      axis('axis-e', null, { excludedFromMatching: true }),
      axis('axis-f', null, { excludedFromMatching: true }),
      axis('axis-g', null, { excludedFromMatching: true }),
      axis('axis-h', null, { excludedFromMatching: true }),
    ]
    const positions = [position('X', A, 50), position('X', B, 50), position('X', 'axis-c', 50)]

    const [match] = computePartyMatches(['X'], axes, positions)

    expect(match.similarity).toBe(100)
    expect(match.axesUsed).toBe(3)
  })

  it('kapsama eşiğinin altındaki eksen hesaba katılmaz', () => {
    const axes = [axis(A, 100), axis(B, -100, { excludedFromMatching: true, tier: 'low', coverage: 0.33 })]
    const [match] = computePartyMatches(['X'], axes, [position('X', A, 100), position('X', B, 100)])

    // Yalnızca A kullanılır, orada birebir uyum var.
    expect(match.similarity).toBe(100)
    expect(match.axesUsed).toBe(1)
  })

  it('skoru null olan eksen hesaba katılmaz', () => {
    const axes = [axis(A, 100), axis(B, null, { excludedFromMatching: true })]
    const [match] = computePartyMatches(['X'], axes, [position('X', A, 100), position('X', B, -100)])

    expect(match.similarity).toBe(100)
    expect(match.axesUsed).toBe(1)
  })
})

describe('önem ağırlığının sıralamaya etkisi', () => {
  const positions = [
    position('X', A, 100),
    position('X', B, -100),
    position('Y', A, -100),
    position('Y', B, 100),
  ]

  it('ağırlıksızken iki parti eşit çıkar', () => {
    const axes = [axis(A, 100), axis(B, 100)]
    const [x, y] = computePartyMatches(['X', 'Y'], axes, positions)

    expect(x.similarity).toBe(50)
    expect(y.similarity).toBe(50)
  })

  it('A ekseni önemli işaretlenince A ile uyuşan parti öne geçer', () => {
    // X: mesafe = 1.5*0 + 1*200 = 200 ; payda = 200 * 2.5 = 500 -> 60
    // Y: mesafe = 1.5*200 + 1*0 = 300 -> 40
    const axes = [axis(A, 100, { weight: 1.5 }), axis(B, 100)]
    const [x, y] = computePartyMatches(['X', 'Y'], axes, positions)

    expect(x.similarity).toBe(60)
    expect(y.similarity).toBe(40)
  })
})

describe('açıklama üretimi', () => {
  it('en küçük fark uyum, en büyük ağırlıklı fark ayrışma olarak sıralanır', () => {
    const axes = [axis(A, 100), axis(B, 0)]
    const positions = [position('X', A, 90), position('X', B, -80)]

    const [explanation] = buildExplanations(['X'], axes, positions)

    expect(explanation.agreements[0].axisId).toBe(A)
    expect(explanation.disagreements[0].axisId).toBe(B)
    expect(explanation.disagreements[0].impact).toBe(80)
  })

  it('yalnızca eşleşmeye giren eksenler açıklamada yer alır', () => {
    const axes = [axis(A, 100), axis(B, 0, { excludedFromMatching: true })]
    const positions = [position('X', A, 90), position('X', B, -80)]

    const [explanation] = buildExplanations(['X'], axes, positions)

    expect(explanation.agreements.map((item) => item.axisId)).toEqual([A])
    expect(explanation.disagreements.map((item) => item.axisId)).toEqual([A])
  })

  it('konumu olmayan parti için açıklama boştur', () => {
    const [explanation] = buildExplanations(['X'], [axis(A, 100)], [])

    expect(explanation.agreements).toEqual([])
    expect(explanation.disagreements).toEqual([])
  })
})
