import { NextResponse } from 'next/server'
import { getPublicServerClient } from '@/lib/supabase/route'
import { getActiveAxisModelId } from '@/lib/scoring/active-model'

export async function GET() {
  try {
    const supabase = getPublicServerClient()

    // Soru seti eksen modeline bağlıdır: v1 demo soruları ile v2 metodoloji
    // soruları aynı tabloda durur. Filtre olmadan anket ikisini birden gösterir.
    const axisModelId = await getActiveAxisModelId(supabase)

    if (!axisModelId) {
      return NextResponse.json({ error: 'Aktif eksen modeli bulunamadı.' }, { status: 503 })
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
    console.error('Questions fetch error:', error)
    return NextResponse.json({ error: 'Sorular yüklenemedi. Lütfen tekrar deneyin.' }, { status: 500 })
  }
}
