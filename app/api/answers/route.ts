import { NextRequest } from 'next/server'
import { getRouteClient } from '@/lib/supabase/route'
import { SubmitAnswersSchema } from '@/lib/validation/survey'
import { assertSessionOwnership } from '@/lib/session-ownership'
import { isRateLimited, getClientIp } from '@/lib/rate-limit'
import { jsonError, noStoreJson } from '@/lib/api/responses'

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request)
    if (isRateLimited(`answers:${clientIp}`, 30, 60 * 1000)) {
      return jsonError('Çok fazla istek. Lütfen biraz sonra tekrar deneyin.', 429)
    }

    const body = await request.json().catch(() => ({}))
    const parsed = SubmitAnswersSchema.safeParse(body)

    if (!parsed.success) {
      return jsonError('Geçersiz istek.', 400)
    }

    const { sessionId, answers } = parsed.data

    const owns = await assertSessionOwnership(sessionId)
    if (!owns) {
      return jsonError('Yetkisiz istek.', 403)
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
    console.error('Answers submission error:', error)
    return jsonError('Cevaplar kaydedilemedi. Lütfen tekrar deneyin.', 500)
  }
}
