import { NextRequest, NextResponse } from 'next/server'
import { getRouteClient } from '@/lib/supabase/route'
import { calculateResults } from '@/lib/scoring/engine'
import { CompleteSessionSchema } from '@/lib/validation/survey'
import { assertSessionOwnership } from '@/lib/session-ownership'
import { isRateLimited, getClientIp } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request)
    if (isRateLimited(`complete:${clientIp}`, 10, 60 * 1000)) {
      return NextResponse.json({ error: 'Çok fazla istek. Lütfen biraz sonra tekrar deneyin.' }, { status: 429 })
    }

    const body = await request.json().catch(() => ({}))
    const parsed = CompleteSessionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 })
    }

    const { sessionId } = parsed.data

    const owns = await assertSessionOwnership(sessionId)
    if (!owns) {
      return NextResponse.json({ error: 'Yetkisiz istek.' }, { status: 403 })
    }

    const supabase = getRouteClient()

    // Mark session as completed
    const { error: sessionError } = await supabase
      .from('sessions')
      .update({ completed_at: new Date().toISOString() })
      .eq('id', sessionId)

    if (sessionError) throw sessionError

    // Calculate results
    const results = await calculateResults(sessionId)

    // Store result snapshot. Algoritma sürümü ve kapsama bilgisi de yazılır;
    // sonuç sayfası eski (v1) snapshot'ları bu alanla ayırt eder.
    const { error: snapshotError } = await supabase
      .from('result_snapshots')
      .insert({
        session_id: sessionId,
        axis_scores: results.axisScores,
        party_similarities: results.partySimilarities,
        axis_coverage: results.axisCoverage,
        quality_flags: results.qualityFlags,
        algorithm_version: results.algorithmVersion,
        result_payload: results
      })

    if (snapshotError) throw snapshotError

    return NextResponse.json(results)
  } catch (error) {
    console.error('Complete session error:', error)
    return NextResponse.json({ error: 'Anket tamamlanamadı. Lütfen tekrar deneyin.' }, { status: 500 })
  }
}
