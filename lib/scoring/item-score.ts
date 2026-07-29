import { MATRIX_TYPES, MULTI_VALUE_TYPES, SINGLE_VALUE_TYPES } from './constants'
import type { ParsedAnswer, ScorableQuestion, ScoringRule } from './types'

/**
 * Bir maddenin tek bir cevaba karşılık ürettiği katkı.
 *
 * `maxima` yalnızca maddenin GERÇEKTEN puanlanabildiği eksenleri içerir. Bir
 * eksen burada yoksa madde o eksenin hem payından hem paydasından düşer —
 * "fikrim yok", geçersiz veri ve kuralı olmayan cevaplar bu yolla dışlanır.
 */
export interface ItemContribution {
  /** axisId -> ham katkı s_i */
  contributions: Record<string, number>
  /** axisId -> maddenin o eksendeki maksimum mutlak katkısı M_i */
  maxima: Record<string, number>
}

const EMPTY: ItemContribution = { contributions: {}, maxima: {} }

/** Kuralları eksene göre gruplar. */
function groupByAxis(rules: ScoringRule[]): Map<string, ScoringRule[]> {
  const byAxis = new Map<string, ScoringRule[]>()

  for (const rule of rules) {
    const current = byAxis.get(rule.axisId)
    if (current) {
      current.push(rule)
    } else {
      byAxis.set(rule.axisId, [rule])
    }
  }

  return byAxis
}

function maxAbsolute(rules: ScoringRule[]): number {
  return rules.reduce((max, rule) => Math.max(max, Math.abs(rule.scoreModifier)), 0)
}

/**
 * Bir maddenin verilen cevap için eksen bazlı katkısını ve maksimumunu hesaplar.
 * Saf fonksiyon: yan etkisi yok, girdiyi değiştirmez.
 */
export function scoreItem(question: ScorableQuestion, parsed: ParsedAnswer): ItemContribution {
  if (!question.isScored || question.rules.length === 0) return EMPTY

  const byAxis = groupByAxis(question.rules)

  if (SINGLE_VALUE_TYPES.has(question.type) && parsed.kind === 'single') {
    return scoreSingle(question, byAxis, parsed.value)
  }

  if (MULTI_VALUE_TYPES.has(question.type) && parsed.kind === 'multi') {
    return scoreMulti(question, byAxis, parsed.values)
  }

  if (question.type === 'ranking' && parsed.kind === 'ranking') {
    return scoreRanking(byAxis, parsed.order)
  }

  if (MATRIX_TYPES.has(question.type) && parsed.kind === 'matrix') {
    return scoreMatrix(question, byAxis, parsed.rows)
  }

  if (question.type === 'allocation' && parsed.kind === 'allocation') {
    return scoreAllocation(question, byAxis, parsed.shares)
  }

  if (question.type === 'slider_0_100' && parsed.kind === 'numeric') {
    return scoreSlider(question, byAxis, parsed.value)
  }

  if (question.type === 'numeric_input' && parsed.kind === 'numeric') {
    return scoreNumeric(question, byAxis, parsed.value)
  }

  return EMPTY
}

/**
 * Tekli seçim / Likert: cevap değeri bir kurala birebir eşleşir.
 * Hiçbir kural eşleşmezse ("fikrim yok" gibi) madde tamamen dışlanır.
 * "Kararsızım" için 0 puanlı bir kural bulunduğundan o madde paydaya girer —
 * nötr ile fikrim yok arasındaki fark tam olarak buradan doğar.
 */
function scoreSingle(
  question: ScorableQuestion,
  byAxis: Map<string, ScoringRule[]>,
  value: string
): ItemContribution {
  const contributions: Record<string, number> = {}
  const maxima: Record<string, number> = {}

  for (const [axisId, axisRules] of byAxis) {
    const matched = axisRules.filter((rule) => rule.answerValue === value)
    if (matched.length === 0) continue

    contributions[axisId] = matched.reduce((sum, rule) => sum + rule.scoreModifier, 0)
    maxima[axisId] = question.maxContribution ?? maxAbsolute(axisRules)
  }

  return { contributions, maxima }
}

/**
 * Çoklu seçim: seçili şıkların puanları toplanır. Kullanıcı hiçbir "yüklü"
 * şıkkı seçmemiş olsa bile madde paydaya girer; "hiçbirini seçmedim" de bilgi
 * taşır. M, ulaşılabilir en büyük mutlak toplamdır.
 */
function scoreMulti(
  question: ScorableQuestion,
  byAxis: Map<string, ScoringRule[]>,
  values: string[]
): ItemContribution {
  const selected = new Set(values)
  const contributions: Record<string, number> = {}
  const maxima: Record<string, number> = {}

  for (const [axisId, axisRules] of byAxis) {
    const sum = axisRules
      .filter((rule) => selected.has(rule.answerValue))
      .reduce((total, rule) => total + rule.scoreModifier, 0)

    const positiveTotal = axisRules.reduce((t, r) => t + Math.max(0, r.scoreModifier), 0)
    const negativeTotal = axisRules.reduce((t, r) => t + Math.abs(Math.min(0, r.scoreModifier)), 0)
    const max = question.maxContribution ?? Math.max(positiveTotal, negativeTotal)

    if (max <= 0) continue

    contributions[axisId] = sum
    maxima[axisId] = max
  }

  return { contributions, maxima }
}

/**
 * Sıralama: Borda sayımı.
 *
 * Rapordaki ham form (b_j = n - rank_j) tüm seçenekler aynı işaretli olduğunda
 * kullanıcı sıralaması ne olursa olsun sabit işaretli bir skor üretir; yani
 * madde ekseni her zaman aynı yöne iter. Bunu önlemek için Borda ağırlıkları
 * ortalamaları sıfır olacak şekilde merkezlenir — sıralamanın anlamı korunur,
 * yapay kayma ortadan kalkar.
 */
function scoreRanking(byAxis: Map<string, ScoringRule[]>, order: string[]): ItemContribution {
  const n = order.length
  if (n < 2) return EMPTY

  const center = (n - 1) / 2
  const weights = order.map((_, index) => n - 1 - index - center)

  const contributions: Record<string, number> = {}
  const maxima: Record<string, number> = {}

  for (const [axisId, axisRules] of byAxis) {
    const directionOf = new Map(axisRules.map((rule) => [rule.answerValue, rule.scoreModifier]))
    const directions = order.map((value) => directionOf.get(value) ?? 0)

    const score = directions.reduce((sum, direction, index) => sum + direction * weights[index], 0)

    // Yeniden düzenleme eşitsizliği: en büyük ağırlığa en büyük yönü vermek
    // ulaşılabilir maksimumu, en küçüğünü vermek minimumu verir.
    const weightsDesc = [...weights].sort((a, b) => b - a)
    const best = dotProduct(weightsDesc, [...directions].sort((a, b) => b - a))
    const worst = dotProduct(weightsDesc, [...directions].sort((a, b) => a - b))
    const max = Math.max(Math.abs(best), Math.abs(worst))

    if (max <= 0) continue

    contributions[axisId] = score
    maxima[axisId] = max
  }

  return { contributions, maxima }
}

function dotProduct(a: number[], b: number[]): number {
  return a.reduce((sum, value, index) => sum + value * b[index], 0)
}

/**
 * Matris: her satır bağımsız bir alt-madde gibi puanlanır.
 *
 * scoring_rules'ta satır kavramı yok; bu yüzden kural değeri
 * "<satır>:<sütun>" biçiminde kodlanır. Bu, question_options'ta zaten
 * kullanılan "row:" / "col:" öneki konvansiyonunun karşılığıdır
 * (bkz. app/survey/page.tsx splitMatrixOptions).
 *
 * Yalnızca kullanıcının doldurduğu satırlar paydaya girer.
 */
function scoreMatrix(
  question: ScorableQuestion,
  byAxis: Map<string, ScoringRule[]>,
  rows: Record<string, string[]>
): ItemContribution {
  const contributions: Record<string, number> = {}
  const maxima: Record<string, number> = {}

  for (const [axisId, axisRules] of byAxis) {
    let score = 0
    let max = 0

    for (const [rowKey, columns] of Object.entries(rows)) {
      const prefix = `${rowKey}:`
      const rowRules = axisRules.filter((rule) => rule.answerValue.startsWith(prefix))
      if (rowRules.length === 0) continue

      const selected = new Set(columns)
      score += rowRules
        .filter((rule) => selected.has(rule.answerValue.slice(prefix.length)))
        .reduce((sum, rule) => sum + rule.scoreModifier, 0)

      max += question.maxContribution ?? maxAbsolute(rowRules)
    }

    if (max <= 0) continue

    contributions[axisId] = score
    maxima[axisId] = max
  }

  return { contributions, maxima }
}

/**
 * 100 puan dağıtımı: s = M * (artı payların toplamı - eksi payların toplamı) / toplam.
 * Paylar 100'e tamamlanmadığında da doğru çalışsın diye gerçek toplam kullanılır.
 */
function scoreAllocation(
  question: ScorableQuestion,
  byAxis: Map<string, ScoringRule[]>,
  shares: Record<string, number>
): ItemContribution {
  const total = Object.values(shares).reduce((sum, share) => sum + share, 0)
  if (total <= 0) return EMPTY

  const contributions: Record<string, number> = {}
  const maxima: Record<string, number> = {}

  for (const [axisId, axisRules] of byAxis) {
    const max = question.maxContribution ?? maxAbsolute(axisRules)
    if (max <= 0) continue

    let signedShare = 0
    for (const rule of axisRules) {
      const share = shares[rule.answerValue]
      if (!share) continue
      signedShare += Math.sign(rule.scoreModifier) * share
    }

    contributions[axisId] = (max * signedShare) / total
    maxima[axisId] = max
  }

  return { contributions, maxima }
}

/**
 * 0-100 kaydırıcı: s = M * (x - 50) / 50.
 *
 * Kaydırıcının şıkkı olmadığı için eksen bağlantısı ve yön, o eksene yazılmış
 * kuralın işaretinden okunur (mutlak değeri en büyük kural belirleyicidir).
 */
function scoreSlider(
  question: ScorableQuestion,
  byAxis: Map<string, ScoringRule[]>,
  value: number
): ItemContribution {
  const x = Math.min(100, Math.max(0, value))
  const contributions: Record<string, number> = {}
  const maxima: Record<string, number> = {}

  for (const [axisId, axisRules] of byAxis) {
    const dominant = axisRules.reduce((best, rule) =>
      Math.abs(rule.scoreModifier) > Math.abs(best.scoreModifier) ? rule : best
    )

    const max = question.maxContribution ?? Math.abs(dominant.scoreModifier)
    if (max <= 0) continue

    const direction = dominant.scoreModifier < 0 ? -1 : 1
    contributions[axisId] = (direction * max * (x - 50)) / 50
    maxima[axisId] = max
  }

  return { contributions, maxima }
}

/**
 * Sayısal giriş: kural değeri ya birebir sayı ya da "alt..üst" aralığıdır
 * (uçlar dahil). Aralıkların ideolojik anlamı yayımlanmış olmalıdır.
 */
function scoreNumeric(
  question: ScorableQuestion,
  byAxis: Map<string, ScoringRule[]>,
  value: number
): ItemContribution {
  const contributions: Record<string, number> = {}
  const maxima: Record<string, number> = {}

  for (const [axisId, axisRules] of byAxis) {
    const matched = axisRules.filter((rule) => matchesBucket(rule.answerValue, value))
    if (matched.length === 0) continue

    contributions[axisId] = matched.reduce((sum, rule) => sum + rule.scoreModifier, 0)
    maxima[axisId] = question.maxContribution ?? maxAbsolute(axisRules)
  }

  return { contributions, maxima }
}

function matchesBucket(answerValue: string, value: number): boolean {
  const range = answerValue.split('..')

  if (range.length === 2) {
    const lower = Number(range[0])
    const upper = Number(range[1])
    if (!Number.isFinite(lower) || !Number.isFinite(upper)) return false
    return value >= lower && value <= upper
  }

  const exact = Number(answerValue)
  return Number.isFinite(exact) && exact === value
}
