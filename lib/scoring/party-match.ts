import { AXIS_SCORE_RANGE, PARTY_AXIS_COVERAGE_THRESHOLD } from './constants'
import type { AxisComparison, AxisResult, MatchExplanation, PartyMatch, PartyPosition } from './types'

/**
 * Kullanıcı tarafında karşılaştırmaya uygun eksen sayısı: skoru üretilmiş ve
 * kapsama eşiğini geçmiş eksenler.
 */
function comparableAxisCount(axes: AxisResult[]): number {
  return axes.filter((axis) => axis.score !== null && !axis.excludedFromMatching).length
}

/** Bir partinin karşılaştırılabildiği eksenler ve her birindeki fark. */
function comparisonsFor(
  partyId: string,
  axes: AxisResult[],
  positionsByParty: Map<string, Map<string, number>>
): AxisComparison[] {
  const positions = positionsByParty.get(partyId)
  if (!positions) return []

  const comparisons: AxisComparison[] = []

  for (const axis of axes) {
    if (axis.score === null || axis.excludedFromMatching) continue

    const partyScore = positions.get(axis.axisId)
    if (partyScore === undefined) continue

    comparisons.push({
      axisId: axis.axisId,
      userScore: axis.score,
      partyScore,
      impact: axis.weight * Math.abs(axis.score - partyScore),
      weight: axis.weight,
    })
  }

  return comparisons
}

function groupPositions(positions: PartyPosition[]): Map<string, Map<string, number>> {
  const byParty = new Map<string, Map<string, number>>()

  for (const position of positions) {
    const axes = byParty.get(position.partyId) ?? new Map<string, number>()
    axes.set(position.axisId, position.score)
    byParty.set(position.partyId, axes)
  }

  return byParty
}

/**
 * Ağırlıklı Manhattan (şehir bloku) uzaklığına dayalı parti benzerliği
 * (rapor §5.2):
 *
 *   distance_p = Σ (λ_a * |U_a - P_pa|)
 *   match_p    = 100 * (1 - distance_p / (200 * Σ λ_a))
 *
 * Yalnızca kullanıcının skor ürettiği, kapsama eşiğini geçen ve partinin
 * konumlandığı eksenler hesaba girer. Hiç ortak eksen yoksa benzerlik null
 * döner — 0 döndürmek "tamamen zıt" anlamına gelirdi ve yanıltıcı olurdu.
 */
export function computePartyMatches(
  partyIds: string[],
  axes: AxisResult[],
  positions: PartyPosition[]
): PartyMatch[] {
  const positionsByParty = groupPositions(positions)

  // Yeterince eksende konumlanmamış partiler sıralamaya girmez; aksi halde
  // yalnızca kendilerine uyan birkaç eksen üzerinden haksız biçimde üste
  // çıkarlar.
  const required = Math.ceil(PARTY_AXIS_COVERAGE_THRESHOLD * comparableAxisCount(axes))

  return partyIds.map((partyId) => {
    const comparisons = comparisonsFor(partyId, axes, positionsByParty)

    if (comparisons.length === 0 || comparisons.length < required) {
      return { partyId, similarity: null, axesUsed: comparisons.length }
    }

    const distance = comparisons.reduce((sum, comparison) => sum + comparison.impact, 0)
    const weightSum = comparisons.reduce((sum, comparison) => sum + comparison.weight, 0)
    const similarity = 100 * (1 - distance / (AXIS_SCORE_RANGE * weightSum))

    return {
      partyId,
      similarity: Math.round(Math.max(0, Math.min(100, similarity))),
      axesUsed: comparisons.length,
    }
  })
}

/**
 * "Neden bu sonuç?" açıklaması — yalnızca puanlama matrisinden türetilir,
 * serbest metin üretimi yoktur (rapor §9).
 *
 * Uyumlar en küçük farka, ayrışmalar en büyük ağırlıklı farka göre sıralanır;
 * eşitlikte önem ağırlığı yüksek olan eksen öne alınır.
 */
export function buildExplanations(
  partyIds: string[],
  axes: AxisResult[],
  positions: PartyPosition[],
  topN = 3
): MatchExplanation[] {
  const positionsByParty = groupPositions(positions)

  return partyIds.map((partyId) => {
    const comparisons = comparisonsFor(partyId, axes, positionsByParty)

    const agreements = [...comparisons]
      .sort((a, b) => rawDistance(a) - rawDistance(b) || b.weight - a.weight)
      .slice(0, topN)

    const disagreements = [...comparisons]
      .sort((a, b) => b.impact - a.impact || b.weight - a.weight)
      .slice(0, topN)

    return { partyId, agreements, disagreements }
  })
}

function rawDistance(comparison: AxisComparison): number {
  return Math.abs(comparison.userScore - comparison.partyScore)
}
