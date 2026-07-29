import { getRouteClient } from '@/lib/supabase/route'

export interface AxisScore {
  axisId: string
  axisName: string
  score: number
}

export interface PartySimilarity {
  partyId: string
  partyName: string
  partyShortName: string
  similarity: number
}

export interface CalculationResult {
  axisScores: Record<string, number>
  partySimilarities: Record<string, number>
  axes: AxisScore[]
  parties: PartySimilarity[]
}

interface AxisRow {
  id: string
  name: string
}

interface PartyRow {
  id: string
  name: string
  short_name: string
}

/**
 * Ham skor kayıtlarını istemcinin beklediği tam yanıt şekline dönüştürür.
 * Hem anlık hesaplama hem de result_snapshots üzerinden okuma aynı şekli
 * üretsin diye tek noktada tutulur.
 */
function formatResults(
  axes: AxisRow[],
  parties: PartyRow[],
  axisScores: Record<string, number>,
  partySimilarities: Record<string, number>
): CalculationResult {
  return {
    axisScores,
    partySimilarities,
    axes: axes.map((axis) => ({
      axisId: axis.id,
      axisName: axis.name,
      score: axisScores[axis.id] || 0
    })),
    parties: parties
      .map((party) => ({
        partyId: party.id,
        partyName: party.name,
        partyShortName: party.short_name,
        similarity: partySimilarities[party.id] || 0
      }))
      .sort((a, b) => b.similarity - a.similarity)
  }
}

/**
 * Kaydedilmiş bir snapshot'ı isim bilgileriyle zenginleştirir. Snapshot yalnızca
 * id -> skor eşlemesi tuttuğu için eksen/parti adları tablolardan tamamlanır.
 */
export async function formatStoredResults(
  axisScores: Record<string, number>,
  partySimilarities: Record<string, number>
): Promise<CalculationResult> {
  const supabase = getRouteClient()

  const [{ data: axes, error: axesError }, { data: parties, error: partiesError }] = await Promise.all([
    supabase.from('axes').select('id, name'),
    supabase.from('parties').select('id, name, short_name')
  ])

  if (axesError) throw axesError
  if (partiesError) throw partiesError

  return formatResults(axes || [], parties || [], axisScores || {}, partySimilarities || {})
}

export async function calculateResults(sessionId: string): Promise<CalculationResult> {
  const supabase = getRouteClient()

  // 1. Fetch session answers
  const { data: answers, error: answersError } = await supabase
    .from('answers')
    .select('*')
    .eq('session_id', sessionId)

  if (answersError) throw answersError

  // 2. Fetch scoring rules
  const { data: scoringRules, error: rulesError } = await supabase
    .from('scoring_rules')
    .select('*')

  if (rulesError) throw rulesError

  // 3. Fetch all axes
  const { data: axes, error: axesError } = await supabase
    .from('axes')
    .select('*')

  if (axesError) throw axesError

  // 4. Fetch party positions
  const { data: partyPositions, error: positionsError } = await supabase
    .from('party_positions')
    .select('*')

  if (positionsError) throw positionsError

  // 5. Fetch parties
  const { data: parties, error: partiesError } = await supabase
    .from('parties')
    .select('*')

  if (partiesError) throw partiesError

  // 6. Calculate axis scores
  const axisScores: Record<string, number> = {}
  axes.forEach(axis => {
    axisScores[axis.id] = 0
  })

  answers.forEach(answer => {
    const relevantRules = scoringRules.filter(
      rule => rule.question_id === answer.question_id
    )

    relevantRules.forEach(rule => {
      if (rule.answer_value === answer.answer_value) {
        axisScores[rule.axis_id] = (axisScores[rule.axis_id] || 0) + rule.score_modifier
      }
    })
  })

  // Normalize to [-100, 100]
  const normalizedAxisScores: Record<string, number> = {}
  Object.keys(axisScores).forEach(axisId => {
    let score = axisScores[axisId]
    score = Math.max(-100, Math.min(100, score))
    normalizedAxisScores[axisId] = score
  })

  // 7. Calculate party similarities
  const partySimilarities: Record<string, number> = {}

  parties.forEach(party => {
    let totalDifference = 0
    let axisCount = 0

    axes.forEach(axis => {
      const partyPosition = partyPositions.find(
        pos => pos.party_id === party.id && pos.axis_id === axis.id
      )

      if (partyPosition) {
        const userScore = normalizedAxisScores[axis.id] || 0
        const difference = Math.abs(userScore - partyPosition.score)
        totalDifference += difference
        axisCount++
      }
    })

    // Calculate similarity (0-100)
    const avgDifference = axisCount > 0 ? totalDifference / axisCount : 0
    const similarity = Math.max(0, 100 - avgDifference)
    partySimilarities[party.id] = Math.round(similarity)
  })

  // 8. Format response
  return formatResults(axes, parties, normalizedAxisScores, partySimilarities)
}

export function getExplanationForMatch(
  party: PartySimilarity,
  axisScores: AxisScore[]
): string {
  const topAxes = [...axisScores]
    .sort((a, b) => Math.abs(b.score) - Math.abs(a.score))
    .slice(0, 3)

  if (topAxes.length === 0) {
    return `Sizin görüşleriniz ${party.partyName} ile ${party.similarity}% benzerlik gösteriyor.`
  }

  const axisNames = topAxes.map(a => a.axisName).join(', ')
  return `Sizin görüşleriniz ${party.partyName} ile ${party.similarity}% benzerlik gösteriyor. Özellikle ${axisNames} konularında benzer yaklaşım sergiliyorsunuz.`
}
