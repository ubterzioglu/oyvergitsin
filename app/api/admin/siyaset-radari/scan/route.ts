import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { getAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/radar/admin-auth'
import { runSiyasetRadariScan } from '@/lib/siyaset-radari/scan'
import { SiyasetRadariScanSchema } from '@/lib/validation/siyaset-radari'

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 403 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const { source } = SiyasetRadariScanSchema.parse(body)
    const summary = await runSiyasetRadariScan(getAdminClient(), source)
    return NextResponse.json({ summary })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 })
    }
    console.error('Siyaset radari scan error:', error)
    return NextResponse.json({ error: 'Tarama başarısız oldu.' }, { status: 500 })
  }
}
