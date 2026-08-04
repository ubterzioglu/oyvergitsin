import { NextRequest } from 'next/server'
import { getRouteClient } from '@/lib/supabase/route'
import { calculateResults } from '@/lib/scoring/engine'
import { getActiveAxisModelId } from '@/lib/scoring/active-model'
import { validateSurveyCompletion } from '@/lib/survey/completion'
import { CompleteSessionSchema } from '@/lib/validation/survey'
import { assertSessionOwnership } from '@/lib/session-ownership'
import { isRateLimited, getClientIp } from '@/lib/rate-limit'
import { jsonError, noStoreJson } from '@/lib/api/responses'

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request)
    if (isRateLimited(`complete:${clientIp}`, 10, 60 * 1000)) {
      return jsonError('Çok fazla istek. Lütfen biraz sonra tekrar deneyin.', 429)
    }

    const body = await request.json().catch(() => ({}))
    const parsed = CompleteSessionSchema.safeParse(body)

    if (!parsed.success) {
      return jsonError('Geçersiz istek.', 400)
    }

    const { sessionId } = parsed.data

    const owns = await assertSessionOwnership(sessionId)
    if (!owns) {
      return jsonError('Yetkisiz istek.', 403)
    }

    const supabase = getRouteClient()
    const axisModelId = await getActiveAxisModelId(supabase)
    if (!axisModelId) {
      return jsonError('Aktif eksen modeli bulunamadı.', 503)
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
      return jsonError('Tüm soruları doğru cevaplamalısınız.', 400, {
        firstInvalidQuestionId: completion.firstInvalidQuestionId,
        missingQuestionCount: completion.missingQuestionIds.length,
        failedAttentionQuestionCount: completion.failedAttentionQuestionIds.length,
      })
    }

    // Mark session as completed
    const { error: sessionError } = await supabase
      .from('sessions')
      .update({ completed_at: new Date().toISOString() })
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
    console.error('Complete session error:', error)
    return jsonError('Anket tamamlanamadı. Lütfen tekrar deneyin.', 500)
  }
}
