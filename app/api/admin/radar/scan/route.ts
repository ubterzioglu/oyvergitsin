import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { getAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/radar/admin-auth'
import { runScan, ConcurrentScanError } from '@/lib/radar/scan'
import { ManualScanSchema } from '@/lib/validation/radar'

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok || !auth.userId) {
    return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json().catch(() => ({}))
    const { sourceIds } = ManualScanSchema.parse(body)

    const admin = getAdminClient()
    const summary = await runScan(admin, {
      triggerType: 'manual',
      sourceIds,
      startedBy: auth.userId
    })

    return NextResponse.json({ summary })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 })
    }
    if (error instanceof ConcurrentScanError) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    console.error('Manual radar scan error:', error)
    return NextResponse.json({ error: 'Tarama başarısız oldu.' }, { status: 500 })
  }
}
