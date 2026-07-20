import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { runScan, ConcurrentScanError } from '@/lib/radar/scan'

export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET yapılandırılmamış.' }, { status: 500 })
  }

  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401 })
  }

  try {
    const admin = getAdminClient()
    const summary = await runScan(admin, { triggerType: 'cron' })
    return NextResponse.json({ summary })
  } catch (error) {
    if (error instanceof ConcurrentScanError) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    console.error('Cron radar scan error:', error)
    return NextResponse.json({ error: 'Tarama başarısız oldu.' }, { status: 500 })
  }
}
