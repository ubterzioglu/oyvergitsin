import { timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { getAdminClient } from '@/lib/supabase/admin'
import { runLoggedSiyasetRadariScan } from '@/lib/siyaset-radari/scan'
import { SiyasetRadariCronSchema } from '@/lib/validation/siyaset-radari'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

function authorized(request: NextRequest): boolean {
  const configuredSecret = process.env.CRON_SECRET?.trim()
  const suppliedSecret = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()

  if (!configuredSecret || !suppliedSecret) {
    return false
  }

  const expected = Buffer.from(configuredSecret)
  const actual = Buffer.from(suppliedSecret)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

async function run(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 })
  }

  try {
    const body = request.method === 'POST' ? await request.json().catch(() => ({})) : {}
    const cadenceFromQuery = request.nextUrl.searchParams.get('cadence') ?? undefined
    const { cadence } = SiyasetRadariCronSchema.parse({
      cadence: cadenceFromQuery ?? body.cadence,
    })

    const summary = await runLoggedSiyasetRadariScan(getAdminClient(), cadence, 'cron')
    return NextResponse.json({ ok: true, cadence, summary })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Geçersiz tarama sıklığı.' }, { status: 400 })
    }
    console.error('Siyaset radari cron error:', error)
    return NextResponse.json({ error: 'Zamanlanmış tarama başarısız oldu.' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return run(request)
}

export async function POST(request: NextRequest) {
  return run(request)
}
