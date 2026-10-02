import { NextRequest, NextResponse } from 'next/server'
import { getRouteClient } from '@/lib/supabase/route'
import { SubmitFeedbackSchema } from '@/lib/validation/feedback'
import { sendFeedbackNotification } from '@/lib/email/sendFeedbackNotification'
import { enforceRateLimit, handleUnexpectedError, parseJsonBody } from '@/lib/api/route-helpers'

export async function POST(request: NextRequest) {
  try {
    const rateLimited = enforceRateLimit(request, {
      bucket: 'feedback',
      limit: 5,
      windowMs: 10 * 60 * 1000
    })
    if (rateLimited) return rateLimited

    const parsed = await parseJsonBody(request, SubmitFeedbackSchema)
    if (!parsed.ok) return parsed.response

    const { message } = parsed.data

    const supabase = getRouteClient()
    const { error } = await supabase.from('feedback').insert({ message })

    if (error) throw error

    void sendFeedbackNotification(message)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleUnexpectedError(
      'api/feedback',
      error,
      'Geri bildirim kaydedilemedi. Lütfen tekrar deneyin.'
    )
  }
}
