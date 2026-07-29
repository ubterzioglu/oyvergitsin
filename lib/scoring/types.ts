/**
 * Skorlama çekirdeğinin veri tipleri.
 *
 * Bu katman Supabase'i tanımaz: girdi düz nesnelerdir, çıktı düz nesnelerdir.
 * Veri çekme işi lib/scoring/engine.ts'te kalır; böylece formüller veritabanı
 * olmadan test edilebilir.
 */

/** Saklanan `answers.answer_value` string'inin tipe göre çözümlenmiş hali. */
export type ParsedAnswer =
  | { kind: 'single'; value: string }
  | { kind: 'multi'; values: string[] }
  | { kind: 'ranking'; order: string[] }
  | { kind: 'matrix'; rows: Record<string, string[]> }
  | { kind: 'allocation'; shares: Record<string, number> }
  | { kind: 'numeric'; value: number }
  | { kind: 'text'; value: string }
  | { kind: 'invalid' }

export interface ScoringRule {
  answerValue: string
  axisId: string
  scoreModifier: number
}

export interface ScorableQuestion {
  id: string
  type: string
  /** false ise madde ideolojik skora hiç girmez (açık metin, dikkat kontrolü). */
  isScored: boolean
  /** Madde ağırlığı w_i. */
  weight: number
  /** Maddenin maksimum mutlak katkısı M_i. null ise kurallardan türetilir. */
  maxContribution: number | null
  /** Dikkat kontrolü maddelerinde beklenen cevap. */
  expectedValue: string | null
  rules: ScoringRule[]
}

export interface UserAnswer {
  questionId: string
  value: string
  isImportant: boolean
}

export interface PartyPosition {
  partyId: string
  axisId: string
  score: number
}

/** Bir eksende kaç maddenin yanıtlandığına dayalı güven etiketi (rapor §5.4). */
export type CoverageTier = 'high' | 'medium' | 'low' | 'none'

export interface AxisResult {
  axisId: string
  /** [-100, 100] normalize skor; eksende hiç puanlanabilir cevap yoksa null. */
  score: number | null
  /** Yanıtlanan madde oranı, 0..1. */
  coverage: number
  tier: CoverageTier
  answeredItems: number
  totalItems: number
  /** Parti uzaklığında kullanılan lambda ağırlığı. */
  weight: number
  /** Kapsama eşiğinin altında kaldığı için eşleşmeye dahil edilmedi mi? */
  excludedFromMatching: boolean
}

export interface PartyMatch {
  partyId: string
  /** [0, 100] benzerlik; karşılaştırılabilir eksen yoksa null. */
  similarity: number | null
  axesUsed: number
}

export interface AxisComparison {
  axisId: string
  userScore: number
  partyScore: number
  /** lambda_a * |U_a - P_pa| */
  impact: number
  weight: number
}

export interface MatchExplanation {
  partyId: string
  agreements: AxisComparison[]
  disagreements: AxisComparison[]
}

export interface QualityFlags {
  attentionChecksTotal: number
  attentionChecksFailed: number
}

export interface ScoringInput {
  /** Aktif eksen modeline ait eksen id'leri. */
  axisIds: string[]
  /** Aktif eksen modeline ait sorular ve puanlama kuralları. */
  questions: ScorableQuestion[]
  answers: UserAnswer[]
  partyIds: string[]
  partyPositions: PartyPosition[]
}

export interface ScoringOutput {
  axes: AxisResult[]
  parties: PartyMatch[]
  explanations: MatchExplanation[]
  quality: QualityFlags
}
