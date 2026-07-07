import { NextResponse } from 'next/server'
import { getPublicServerClient } from '@/lib/supabase/route'

export async function GET() {
  try {
    const supabase = getPublicServerClient()
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
    const message = error instanceof Error ? error.message : 'Failed to fetch questions'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
