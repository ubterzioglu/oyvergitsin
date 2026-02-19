import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { calculateResults } from '@/lib/scoring/engine'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId } = body

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    // Mark session as completed
    const { error: sessionError } = await supabase
      .from('sessions')
      .update({ completed_at: new Date().toISOString() })
      .eq('id', sessionId)

    if (sessionError) throw sessionError

    // Calculate results
    const results = await calculateResults(sessionId)

    // Store result snapshot
    const { error: snapshotError } = await supabase
      .from('result_snapshots')
      .insert({
        session_id: sessionId,
        axis_scores: results.axisScores,
        party_similarities: results.partySimilarities
      })

    if (snapshotError) throw snapshotError

    return NextResponse.json(results)
  } catch (error) {
    console.error('Complete session error:', error)
    return NextResponse.json({ error: 'Failed to complete session' }, { status: 500 })
  }
}
