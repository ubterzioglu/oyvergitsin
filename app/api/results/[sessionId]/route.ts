import { NextResponse } from 'next/server'
import { getRouteClient } from '@/lib/supabase/route'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const supabase = getRouteClient()
    const { sessionId } = await params

    // Try to get existing result snapshot
    const { data: snapshot, error: snapshotError } = await supabase
      .from('result_snapshots')
      .select('*')
      .eq('session_id', sessionId)
      .single()

    if (!snapshotError && snapshot) {
      return NextResponse.json({
        axisScores: snapshot.axis_scores,
        partySimilarities: snapshot.party_similarities
      })
    }

    // If no snapshot, calculate on the fly
    const { calculateResults } = await import('@/lib/scoring/engine')
    const results = await calculateResults(sessionId)

    return NextResponse.json(results)
  } catch (error) {
    console.error('Results fetch error:', error)
    const message = error instanceof Error ? error.message : 'Failed to fetch results'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
