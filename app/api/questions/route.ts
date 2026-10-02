import { NextResponse } from 'next/server'
import { getPublicServerClient } from '@/lib/supabase/route'
import { getActiveAxisModelId } from '@/lib/scoring/active-model'
import { API_ERROR_CODES } from '@/lib/api/error-codes'
import { jsonError } from '@/lib/api/responses'
import { handleUnexpectedError } from '@/lib/api/route-helpers'

export async function GET() {
  try {
    const supabase = getPublicServerClient()

    // Soru seti eksen modeline bağlıdır: v1 demo soruları ile v2 metodoloji
    // soruları aynı tabloda durur. Filtre olmadan anket ikisini birden gösterir.
    const axisModelId = await getActiveAxisModelId(supabase)

    if (!axisModelId) {
      return jsonError(API_ERROR_CODES.AXIS_MODEL_UNAVAILABLE, 'Aktif eksen modeli bulunamadı.')
    }

    const { data: questions, error } = await supabase
      .from('questions')
      .select(`
        *,
        question_options(*)
      `)
      .eq('axis_model_id', axisModelId)
      .order('order_index', { ascending: true })

    if (error) throw error

    return NextResponse.json({
      questions: (questions || []).map((question) => ({
        ...question,
        question_options: [...(question.question_options || [])].sort(
          (a, b) => a.order_index - b.order_index
        )
      }))
    })
  } catch (error) {
    return handleUnexpectedError(
      'api/questions',
      error,
      'Sorular yüklenemedi. Lütfen tekrar deneyin.'
    )
  }
}
