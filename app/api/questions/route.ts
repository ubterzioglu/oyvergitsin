import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET() {
  try {
    const { data: questions, error } = await supabase
      .from('questions')
      .select(`
        *,
        question_options(*)
      `)
      .order('order_index', { ascending: true })

    if (error) throw error

    return NextResponse.json({ questions })
  } catch (error) {
    console.error('Questions fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
  }
}
