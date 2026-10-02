import { z } from 'zod'
import { getRouteClient } from '@/lib/supabase/route'
import { assertSessionOwnership } from '@/lib/session-ownership'
import { API_ERROR_CODES } from '@/lib/api/error-codes'
import { jsonError, noStoreJson } from '@/lib/api/responses'
import { handleUnexpectedError } from '@/lib/api/route-helpers'

const ParamsSchema = z.object({ sessionId: z.string().uuid() })

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const resolvedParams = await params
    const parsed = ParamsSchema.safeParse(resolvedParams)

    if (!parsed.success) {
      return jsonError(API_ERROR_CODES.INVALID_REQUEST, 'Geçersiz oturum kimliği.')
    }

    const { sessionId } = parsed.data

    const owns = await assertSessionOwnership(sessionId)
    if (!owns) {
      return jsonError(API_ERROR_CODES.FORBIDDEN, 'Yetkisiz istek.')
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

      return noStoreJson(storedResults)
    }

    // If no snapshot, calculate on the fly
    const { calculateResults } = await import('@/lib/scoring/engine')
    const results = await calculateResults(sessionId)

    return noStoreJson(results)
  } catch (error) {
    return handleUnexpectedError(
      'api/results',
      error,
      'Sonuçlar alınamadı. Lütfen tekrar deneyin.'
    )
  }
}
