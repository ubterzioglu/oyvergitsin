import { NextRequest, NextResponse } from 'next/server'
import { getRouteClient } from '@/lib/supabase/route'
import { SubmitFeedbackSchema } from '@/lib/validation/feedback'
import { sendFeedbackNotification } from '@/lib/email/sendFeedbackNotification'
import { isRateLimited, getClientIp } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request)
    if (isRateLimited(`feedback:${clientIp}`, 5, 10 * 60 * 1000)) {
      return NextResponse.json({ error: 'Çok fazla istek. Lütfen biraz sonra tekrar deneyin.' }, { status: 429 })
    }

    const body = await request.json().catch(() => ({}))
    const parsed = SubmitFeedbackSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 })
    }

    const { message } = parsed.data

    const supabase = getRouteClient()
    const { error } = await supabase.from('feedback').insert({ message })

    if (error) throw error

    void sendFeedbackNotification(message)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Feedback submission error:', error)
    return NextResponse.json({ error: 'Geri bildirim kaydedilemedi. Lütfen tekrar deneyin.' }, { status: 500 })
  }
}
