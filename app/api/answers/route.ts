import { NextRequest, NextResponse } from 'next/server'
import { getRouteClient } from '@/lib/supabase/route'
import { SubmitAnswersSchema } from '@/lib/validation/survey'
import { assertSessionOwnership } from '@/lib/session-ownership'
import { isRateLimited, getClientIp } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request)
    if (isRateLimited(`answers:${clientIp}`, 30, 60 * 1000)) {
      return NextResponse.json({ error: 'Çok fazla istek. Lütfen biraz sonra tekrar deneyin.' }, { status: 429 })
    }

    const body = await request.json().catch(() => ({}))
    const parsed = SubmitAnswersSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 })
    }

    const { sessionId, answers } = parsed.data

    const owns = await assertSessionOwnership(sessionId)
    if (!owns) {
      return NextResponse.json({ error: 'Yetkisiz istek.' }, { status: 403 })
    }

    const supabase = getRouteClient()
    const { data, error } = await supabase
      .from('answers')
      .insert(
        answers.map((answer) => ({
          session_id: sessionId,
          question_id: answer.questionId,
          answer_value: answer.value
        }))
      )
      .select()

    if (error) throw error

    return NextResponse.json({ success: true, count: data.length })
  } catch (error) {
    console.error('Answers submission error:', error)
    return NextResponse.json({ error: 'Cevaplar kaydedilemedi. Lütfen tekrar deneyin.' }, { status: 500 })
  }
}
