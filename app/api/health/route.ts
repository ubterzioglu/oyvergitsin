import { NextResponse } from 'next/server'
import { getPublicServerClient, hasServiceRoleKey } from '@/lib/supabase/route'
import { hasSessionHashSecret } from '@/lib/security/session-hash-secret'

export async function GET() {
  try {
    const supabase = getPublicServerClient()
    const { error } = await supabase
      .from('consent_texts')
      .select('id', { head: true, count: 'exact' })

    if (error) throw error
    const serviceRoleConfigured = hasServiceRoleKey()
    const sessionHashSecretConfigured = hasSessionHashSecret()

    return NextResponse.json(
      {
        status: serviceRoleConfigured && sessionHashSecretConfigured ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        service: 'oyvergitsin',
        supabaseReachable: true,
        serviceRoleConfigured,
        sessionHashSecretConfigured
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Health check error:', error)
    const serviceRoleConfigured = hasServiceRoleKey()
    const sessionHashSecretConfigured = hasSessionHashSecret()

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        service: 'oyvergitsin',
        supabaseReachable: false,
        serviceRoleConfigured,
        sessionHashSecretConfigured
      },
      { status: 503 }
    )
  }
}
