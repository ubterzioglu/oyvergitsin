import {
  COVERAGE_HIGH,
  COVERAGE_MATCHING_THRESHOLD,
  COVERAGE_MEDIUM,
  DEFAULT_AXIS_WEIGHT,
  IMPORTANT_AXIS_WEIGHT,
} from './constants'
import { scoreItem } from './item-score'
import { parseAnswerValue } from './parse-answer'
import type { AxisResult, CoverageTier, ScorableQuestion, UserAnswer } from './types'

interface AxisAccumulator {
  raw: number
  max: number
  answeredItems: number
  totalItems: number
  hasImportant: boolean
}

/**
 * Eksen skorlarını hesaplar (rapor §5.1):
 *
 *   raw_a = Σ (w_i * s_i)
 *   max_a = Σ (w_i * M_i)        yalnızca yanıtlanan maddeler
 *   skor  = 100 * raw_a / max_a  (max_a > 0), aksi halde null
 *
 * Mevcut v1 motorundan temel farkı: ham toplam [-100, 100] aralığına
 * KIRPILMAZ, ulaşılabilir maksimuma göre normalize edilir. Kırpma, farklı
 * madde sayısına sahip eksenleri karşılaştırılamaz hale getiriyordu.
 */
export function computeAxisScores(
  axisIds: string[],
  questions: ScorableQuestion[],
  answers: UserAnswer[]
): AxisResult[] {
  const answerByQuestion = new Map(answers.map((answer) => [answer.questionId, answer]))
  const accumulators = new Map<string, AxisAccumulator>(
    axisIds.map((axisId) => [
      axisId,
      { raw: 0, max: 0, answeredItems: 0, totalItems: 0, hasImportant: false },
    ])
  )

  for (const question of questions) {
    if (!question.isScored) continue

    // Maddenin dokunduğu eksenler: kuralları hangi eksenlere yazılmışsa.
    const touchedAxes = new Set(question.rules.map((rule) => rule.axisId))
    for (const axisId of touchedAxes) {
      const accumulator = accumulators.get(axisId)
      if (accumulator) accumulator.totalItems += 1
    }

    const answer = answerByQuestion.get(question.id)
    if (!answer) continue

    const parsed = parseAnswerValue(question.type, answer.value)
    const { contributions, maxima } = scoreItem(question, parsed)

    for (const [axisId, max] of Object.entries(maxima)) {
      const accumulator = accumulators.get(axisId)
      if (!accumulator || max <= 0) continue

      accumulator.raw += question.weight * (contributions[axisId] ?? 0)
      accumulator.max += question.weight * max
      accumulator.answeredItems += 1
      if (answer.isImportant) accumulator.hasImportant = true
    }
  }

  return axisIds.map((axisId) => {
    const accumulator = accumulators.get(axisId)!
    const coverage = accumulator.totalItems > 0 ? accumulator.answeredItems / accumulator.totalItems : 0
    const score =
      accumulator.max > 0 ? clampScore(Math.round((100 * accumulator.raw) / accumulator.max)) : null

    return {
      axisId,
      score,
      coverage,
      tier: coverageTier(accumulator.answeredItems, coverage),
      answeredItems: accumulator.answeredItems,
      totalItems: accumulator.totalItems,
      weight: accumulator.hasImportant ? IMPORTANT_AXIS_WEIGHT : DEFAULT_AXIS_WEIGHT,
      excludedFromMatching: score === null || coverage < COVERAGE_MATCHING_THRESHOLD,
    }
  })
}

function clampScore(score: number): number {
  return Math.max(-100, Math.min(100, score))
}

function coverageTier(answeredItems: number, coverage: number): CoverageTier {
  if (answeredItems === 0) return 'none'
  if (coverage >= COVERAGE_HIGH) return 'high'
  if (coverage >= COVERAGE_MEDIUM) return 'medium'
  return 'low'
}
