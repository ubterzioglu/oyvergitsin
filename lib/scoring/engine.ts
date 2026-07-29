import { getRouteClient } from '@/lib/supabase/route'
import { getActiveAxisModelId } from './active-model'
import { ALGORITHM_VERSION } from './constants'
import { calculate } from './core'
import type {
  AxisComparison,
  CoverageTier,
  PartyPosition,
  QualityFlags,
  ScorableQuestion,
  ScoringRule,
  UserAnswer,
} from './types'

export interface AxisScore {
  axisId: string
  axisName: string
  slug: string
  poleNegative: string | null
  polePositive: string | null
  score: number | null
  coverage: number
  tier: CoverageTier
  answeredItems: number
  totalItems: number
  excludedFromMatching: boolean
}

export interface AxisComparisonView extends AxisComparison {
  axisName: string
}

export interface PartySimilarity {
  partyId: string
  partyName: string
  partyShortName: string
  similarity: number | null
  axesUsed: number
  agreements: AxisComparisonView[]
  disagreements: AxisComparisonView[]
}

export interface CalculationResult {
  algorithmVersion: number
  axisScores: Record<string, number | null>
  partySimilarities: Record<string, number | null>
  axisCoverage: Record<string, number>
  qualityFlags: QualityFlags | null
  axes: AxisScore[]
  parties: PartySimilarity[]
}

export interface StoredSnapshot {
  axis_scores: Record<string, number | null> | null
  party_similarities: Record<string, number | null> | null
  axis_coverage?: Record<string, number> | null
  quality_flags?: QualityFlags | null
  algorithm_version?: number | null
  /** v2'den itibaren sonuç sayfasının tam gövdesi burada saklanır. */
  result_payload?: CalculationResult | null
}

interface AxisRow {
  id: string
  name: string
  slug: string
  pole_negative: string | null
  pole_positive: string | null
  order_index: number
}

interface PartyRow {
  id: string
  name: string
  short_name: string
}

const EMPTY_QUALITY: QualityFlags = { attentionChecksTotal: 0, attentionChecksFailed: 0 }

/**
 * Kaydedilmiş bir snapshot'ı isim bilgileriyle zenginleştirir.
 *
 * Snapshot yalnızca id -> skor eşlemesi tutar. Eski (v1) snapshot'lar artık
 * aktif olmayan bir eksen modeline ait id'ler içerdiğinden eksenler AKTİF
 * modele göre değil, snapshot'ta geçen id'lere göre çözülür — aksi halde eski
 * sonuç sayfaları boş görünürdü.
 */
export async function formatStoredResults(snapshot: StoredSnapshot): Promise<CalculationResult> {
  // v2'den itibaren sonuç sayfasının ihtiyaç duyduğu her şey snapshot'ta
  // saklanıyor. Yeniden hesaplamak yanlış olurdu: parti konumları sonradan
  // güncellenirse kullanıcının daha önce gördüğü sonuç sessizce değişirdi.
  if (snapshot.result_payload) {
    return snapshot.result_payload
  }

  const supabase = getRouteClient()

  const axisScores = snapshot.axis_scores ?? {}
  const partySimilarities = snapshot.party_similarities ?? {}
  const axisIds = Object.keys(axisScores)
  const partyIds = Object.keys(partySimilarities)

  const [axesResult, partiesResult] = await Promise.all([
    axisIds.length > 0
      ? supabase
          .from('axes')
          .select('id, name, slug, pole_negative, pole_positive, order_index')
          .in('id', axisIds)
      : Promise.resolve({ data: [] as AxisRow[], error: null }),
    partyIds.length > 0
      ? supabase.from('parties').select('id, name, short_name').in('id', partyIds)
      : Promise.resolve({ data: [] as PartyRow[], error: null }),
  ])

  if (axesResult.error) throw axesResult.error
  if (partiesResult.error) throw partiesResult.error

  const axes = (axesResult.data ?? []) as AxisRow[]
  const parties = (partiesResult.data ?? []) as PartyRow[]
  const coverage = snapshot.axis_coverage ?? {}

  return {
    algorithmVersion: snapshot.algorithm_version ?? 1,
    axisScores,
    partySimilarities,
    axisCoverage: coverage,
    qualityFlags: snapshot.quality_flags ?? null,
    axes: [...axes]
      .sort((a, b) => a.order_index - b.order_index)
      .map((axis) => ({
        axisId: axis.id,
        axisName: axis.name,
        slug: axis.slug,
        poleNegative: axis.pole_negative,
        polePositive: axis.pole_positive,
        score: axisScores[axis.id] ?? null,
        coverage: coverage[axis.id] ?? 0,
        tier: 'none' as CoverageTier,
        answeredItems: 0,
        totalItems: 0,
        excludedFromMatching: false,
      })),
    parties: parties
      .map((party) => ({
        partyId: party.id,
        partyName: party.name,
        partyShortName: party.short_name,
        similarity: partySimilarities[party.id] ?? null,
        axesUsed: 0,
        agreements: [],
        disagreements: [],
      }))
      .sort(bySimilarityDesc),
  }
}

export async function calculateResults(sessionId: string): Promise<CalculationResult> {
  const supabase = getRouteClient()

  const axisModelId = await getActiveAxisModelId(supabase)
  if (!axisModelId) {
    throw new Error('Aktif eksen modeli bulunamadı')
  }

  const [axesResult, questionsResult, answersResult, partiesResult] = await Promise.all([
    supabase
      .from('axes')
      .select('id, name, slug, pole_negative, pole_positive, order_index')
      .eq('axis_model_id', axisModelId)
      .order('order_index', { ascending: true }),
    supabase
      .from('questions')
      .select('id, type, is_scored, weight, max_contribution, expected_value')
      .eq('axis_model_id', axisModelId),
    supabase.from('answers').select('question_id, answer_value, is_important').eq('session_id', sessionId),
    supabase.from('parties').select('id, name, short_name'),
  ])

  if (axesResult.error) throw axesResult.error
  if (questionsResult.error) throw questionsResult.error
  if (answersResult.error) throw answersResult.error
  if (partiesResult.error) throw partiesResult.error

  const axes = (axesResult.data ?? []) as AxisRow[]
  const parties = (partiesResult.data ?? []) as PartyRow[]
  const questionRows = questionsResult.data ?? []
  const axisIds = axes.map((axis) => axis.id)
  const questionIds = questionRows.map((question) => question.id)

  const [rulesResult, positionsResult] = await Promise.all([
    questionIds.length > 0
      ? supabase
          .from('scoring_rules')
          .select('question_id, answer_value, axis_id, score_modifier')
          .in('question_id', questionIds)
      : Promise.resolve({ data: [], error: null }),
    axisIds.length > 0
      ? supabase.from('party_positions').select('party_id, axis_id, score').in('axis_id', axisIds)
      : Promise.resolve({ data: [], error: null }),
  ])

  if (rulesResult.error) throw rulesResult.error
  if (positionsResult.error) throw positionsResult.error

  const rulesByQuestion = new Map<string, ScoringRule[]>()
  for (const row of rulesResult.data ?? []) {
    const rules = rulesByQuestion.get(row.question_id) ?? []
    rules.push({
      answerValue: row.answer_value,
      axisId: row.axis_id,
      scoreModifier: row.score_modifier,
    })
    rulesByQuestion.set(row.question_id, rules)
  }

  const questions: ScorableQuestion[] = questionRows.map((question) => ({
    id: question.id,
    type: question.type,
    isScored: question.is_scored ?? true,
    weight: Number(question.weight ?? 1),
    maxContribution: question.max_contribution ?? null,
    expectedValue: question.expected_value ?? null,
    rules: rulesByQuestion.get(question.id) ?? [],
  }))

  const answers: UserAnswer[] = (answersResult.data ?? []).map((answer) => ({
    questionId: answer.question_id,
    value: answer.answer_value,
    isImportant: answer.is_important ?? false,
  }))

  const partyPositions: PartyPosition[] = (positionsResult.data ?? []).map((position) => ({
    partyId: position.party_id,
    axisId: position.axis_id,
    score: position.score,
  }))

  const result = calculate({
    axisIds,
    questions,
    answers,
    partyIds: parties.map((party) => party.id),
    partyPositions,
  })

  const axisNameById = new Map(axes.map((axis) => [axis.id, axis.name]))
  const axisResultById = new Map(result.axes.map((axis) => [axis.axisId, axis]))
  const explanationByParty = new Map(result.explanations.map((item) => [item.partyId, item]))

  const withAxisName = (comparison: AxisComparison): AxisComparisonView => ({
    ...comparison,
    axisName: axisNameById.get(comparison.axisId) ?? '',
  })

  return {
    algorithmVersion: ALGORITHM_VERSION,
    axisScores: Object.fromEntries(result.axes.map((axis) => [axis.axisId, axis.score])),
    partySimilarities: Object.fromEntries(result.parties.map((party) => [party.partyId, party.similarity])),
    axisCoverage: Object.fromEntries(result.axes.map((axis) => [axis.axisId, axis.coverage])),
    qualityFlags: result.quality ?? EMPTY_QUALITY,
    axes: axes.map((axis) => {
      const scored = axisResultById.get(axis.id)
      return {
        axisId: axis.id,
        axisName: axis.name,
        slug: axis.slug,
        poleNegative: axis.pole_negative,
        polePositive: axis.pole_positive,
        score: scored?.score ?? null,
        coverage: scored?.coverage ?? 0,
        tier: scored?.tier ?? 'none',
        answeredItems: scored?.answeredItems ?? 0,
        totalItems: scored?.totalItems ?? 0,
        excludedFromMatching: scored?.excludedFromMatching ?? true,
      }
    }),
    parties: parties
      .map((party) => {
        const match = result.parties.find((item) => item.partyId === party.id)
        const explanation = explanationByParty.get(party.id)

        return {
          partyId: party.id,
          partyName: party.name,
          partyShortName: party.short_name,
          similarity: match?.similarity ?? null,
          axesUsed: match?.axesUsed ?? 0,
          agreements: (explanation?.agreements ?? []).map(withAxisName),
          disagreements: (explanation?.disagreements ?? []).map(withAxisName),
        }
      })
      .sort(bySimilarityDesc),
  }
}

/** Konumlandırılmamış partiler (similarity === null) listenin sonuna gider. */
function bySimilarityDesc(a: { similarity: number | null }, b: { similarity: number | null }): number {
  if (a.similarity === null && b.similarity === null) return 0
  if (a.similarity === null) return 1
  if (b.similarity === null) return -1
  return b.similarity - a.similarity
}
