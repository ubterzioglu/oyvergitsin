import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getRouteClient } from '@/lib/supabase/route'
import { assertSessionOwnership } from '@/lib/session-ownership'

const ParamsSchema = z.object({ sessionId: z.string().uuid() })

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const resolvedParams = await params
    const parsed = ParamsSchema.safeParse(resolvedParams)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Geçersiz oturum kimliği.' }, { status: 400 })
    }

    const { sessionId } = parsed.data

    const owns = await assertSessionOwnership(sessionId)
    if (!owns) {
      return NextResponse.json({ error: 'Yetkisiz istek.' }, { status: 403 })
    }

    const supabase = getRouteClient()

    // Try to get existing result snapshot
    const { data: snapshot, error: snapshotError } = await supabase
      .from('result_snapshots')
      .select('*')
      .eq('session_id', sessionId)
      .single()

    if (!snapshotError && snapshot) {
      // Snapshot yalnızca id -> skor eşlemesi tutuyor; istemci eksen ve parti
      // adlarını içeren dizileri de bekliyor, bu yüzden aynı şekle tamamlanır.
      const { formatStoredResults } = await import('@/lib/scoring/engine')
      const storedResults = await formatStoredResults(snapshot)

      return NextResponse.json(storedResults)
    }

    // If no snapshot, calculate on the fly
    const { calculateResults } = await import('@/lib/scoring/engine')
    const results = await calculateResults(sessionId)

    return NextResponse.json(results)
  } catch (error) {
    console.error('Results fetch error:', error)
    return NextResponse.json({ error: 'Sonuçlar alınamadı. Lütfen tekrar deneyin.' }, { status: 500 })
  }
}
