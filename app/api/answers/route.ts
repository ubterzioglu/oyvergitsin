import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, answers } = body

    if (!sessionId || !answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    // Insert all answers
    const { data, error } = await supabase
      .from('answers')
      .insert(
        answers.map((answer: any) => ({
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
    return NextResponse.json({ error: 'Failed to submit answers' }, { status: 500 })
  }
}
