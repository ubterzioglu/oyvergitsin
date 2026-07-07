import { NextResponse } from 'next/server'
import { getPublicServerClient, hasServiceRoleKey } from '@/lib/supabase/route'

export async function GET() {
  try {
    const supabase = getPublicServerClient()
    const { error } = await supabase
      .from('consent_texts')
      .select('id', { head: true, count: 'exact' })

    if (error) throw error

    return NextResponse.json(
      {
        status: hasServiceRoleKey() ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        service: 'oyvergitsin',
        supabaseReachable: true,
        serviceRoleConfigured: hasServiceRoleKey()
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Health check error:', error)

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        service: 'oyvergitsin',
        supabaseReachable: false,
        serviceRoleConfigured: hasServiceRoleKey()
      },
      { status: 503 }
    )
  }
}
