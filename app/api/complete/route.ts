import { NextRequest } from 'next/server'
import { getRouteClient } from '@/lib/supabase/route'
import { calculateResults } from '@/lib/scoring/engine'
import { getActiveAxisModelId } from '@/lib/scoring/active-model'
import { validateSurveyCompletion } from '@/lib/survey/completion'
import { CompleteSessionSchema } from '@/lib/validation/survey'
import { assertSessionOwnership } from '@/lib/session-ownership'
import { API_ERROR_CODES } from '@/lib/api/error-codes'
import { jsonError, noStoreJson } from '@/lib/api/responses'
import { enforceRateLimit, handleUnexpectedError, parseJsonBody } from '@/lib/api/route-helpers'

export async function POST(request: NextRequest) {
  try {
    const rateLimited = enforceRateLimit(request, {
      bucket: 'complete',
      limit: 10,
      windowMs: 60 * 1000
    })
    if (rateLimited) return rateLimited

    const parsed = await parseJsonBody(request, CompleteSessionSchema)
    if (!parsed.ok) return parsed.response

    const { sessionId, hp_website } = parsed.data

    // Invisible Honeypot check: Bots filling hidden fields are immediately rejected or flagged
    if (hp_website && hp_website.trim().length > 0) {
      return jsonError(API_ERROR_CODES.INVALID_REQUEST, 'Geçersiz istek.')
    }

    const owns = await assertSessionOwnership(sessionId)
    if (!owns) {
      return jsonError(API_ERROR_CODES.FORBIDDEN, 'Yetkisiz istek.')
    }

    const supabase = getRouteClient()
    const axisModelId = await getActiveAxisModelId(supabase)
    if (!axisModelId) {
      return jsonError(API_ERROR_CODES.AXIS_MODEL_UNAVAILABLE, 'Aktif eksen modeli bulunamadı.')
    }

    const [questionsResult, answersResult] = await Promise.all([
      supabase
        .from('questions')
        .select('id, type, expected_value')
        .eq('axis_model_id', axisModelId),
      supabase
        .from('answers')
        .select('question_id, answer_value')
        .eq('session_id', sessionId),
    ])

    if (questionsResult.error) throw questionsResult.error
    if (answersResult.error) throw answersResult.error

    const completion = validateSurveyCompletion(
      (questionsResult.data ?? []).map((question) => ({
        id: question.id,
        type: question.type,
        expected_value: question.expected_value ?? null,
      })),
      (answersResult.data ?? []).map((answer) => ({
        questionId: answer.question_id,
        value: answer.answer_value,
      }))
    )

    if (!completion.ok) {
      return jsonError(API_ERROR_CODES.SURVEY_INCOMPLETE, 'Tüm soruları doğru cevaplamalısınız.', {
        firstInvalidQuestionId: completion.firstInvalidQuestionId,
        missingQuestionCount: completion.missingQuestionIds.length,
        failedAttentionQuestionCount: completion.failedAttentionQuestionIds.length,
      })
    }

    // Fetch session start time to detect bot speeders
    const { data: sessionData } = await supabase
      .from('sessions')
      .select('created_at, risk_score')
      .eq('id', sessionId)
      .single()

    let calculatedRisk = sessionData?.risk_score ?? 0
    if (sessionData?.created_at) {
      const elapsedSeconds = (Date.now() - new Date(sessionData.created_at).getTime()) / 1000
      // 25 soruluk bir anketi 15 saniyenin altında tamamlamak insan davranışı olamaz (bot / script)
      if (elapsedSeconds < 15) {
        calculatedRisk += 50
      } else if (elapsedSeconds < 30) {
        calculatedRisk += 25
      }
    }

    // Straightlining (bütün sorulara tıpatıp aynı cevabı verme) tespiti
    const answerValues = (answersResult.data ?? []).map((a) => a.answer_value)
    if (answerValues.length >= 15) {
      const uniqueAnswers = new Set(answerValues)
      if (uniqueAnswers.size === 1) {
        // Her soruya birebir aynı cevap verilmiş
        calculatedRisk += 30
      }
    }

    // Mark session as completed
    const { error: sessionError } = await supabase
      .from('sessions')
      .update({
        completed_at: new Date().toISOString(),
        risk_score: calculatedRisk
      })
      .eq('id', sessionId)

    if (sessionError) throw sessionError

    // Calculate results
    const results = await calculateResults(sessionId)

    // Store result snapshot. Algoritma sürümü ve kapsama bilgisi de yazılır;
    // sonuç sayfası eski (v1) snapshot'ları bu alanla ayırt eder.
    const { error: snapshotError } = await supabase
      .from('result_snapshots')
      .insert({
        session_id: sessionId,
        axis_scores: results.axisScores,
        party_similarities: results.partySimilarities,
        axis_coverage: results.axisCoverage,
        quality_flags: results.qualityFlags,
        algorithm_version: results.algorithmVersion,
        result_payload: results
      })

    if (snapshotError) throw snapshotError

    return noStoreJson(results)
  } catch (error) {
    return handleUnexpectedError(
      'api/complete',
      error,
      'Anket tamamlanamadı. Lütfen tekrar deneyin.'
    )
  }
}
