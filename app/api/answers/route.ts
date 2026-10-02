import { NextRequest } from 'next/server'
import { getRouteClient } from '@/lib/supabase/route'
import { SubmitAnswersSchema } from '@/lib/validation/survey'
import { assertSessionOwnership } from '@/lib/session-ownership'
import { API_ERROR_CODES } from '@/lib/api/error-codes'
import { jsonError, noStoreJson } from '@/lib/api/responses'
import { enforceRateLimit, handleUnexpectedError, parseJsonBody } from '@/lib/api/route-helpers'

export async function POST(request: NextRequest) {
  try {
    const rateLimited = enforceRateLimit(request, {
      bucket: 'answers',
      limit: 30,
      windowMs: 60 * 1000
    })
    if (rateLimited) return rateLimited

    const parsed = await parseJsonBody(request, SubmitAnswersSchema)
    if (!parsed.ok) return parsed.response

    const { sessionId, answers } = parsed.data

    const owns = await assertSessionOwnership(sessionId)
    if (!owns) {
      return jsonError(API_ERROR_CODES.FORBIDDEN, 'Yetkisiz istek.')
    }

    const supabase = getRouteClient()
    const { data, error } = await supabase
      .from('answers')
      .insert(
        answers.map((answer) => ({
          session_id: sessionId,
          question_id: answer.questionId,
          answer_value: answer.value,
          is_important: answer.isImportant
        }))
      )
      .select()

    if (error) throw error

    return noStoreJson({ success: true, count: data.length })
  } catch (error) {
    return handleUnexpectedError(
      'api/answers',
      error,
      'Cevaplar kaydedilemedi. Lütfen tekrar deneyin.'
    )
  }
}
