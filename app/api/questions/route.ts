import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = getAdminClient()
    const { data: questions, error } = await supabase
      .from('questions')
      .select(`
        *,
        question_options(*)
      `)
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
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
  }
}
