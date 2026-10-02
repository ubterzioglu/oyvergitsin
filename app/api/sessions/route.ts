import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { getRouteClient } from '@/lib/supabase/route'
import { createClient as createAuthClient } from '@/lib/supabase/server'
import { CreateSessionSchema } from '@/lib/validation/survey'
import { generateSessionToken, hashSessionToken, setSessionTokenCookie } from '@/lib/session-token'
import { getClientIp } from '@/lib/rate-limit'
import { getSessionHashSecret } from '@/lib/security/session-hash-secret'
import { noStoreJson } from '@/lib/api/responses'
import { enforceRateLimit, handleUnexpectedError, parseJsonBody } from '@/lib/api/route-helpers'

function hashIp(ip: string, secret: string): string {
  return createHmac('sha256', secret).update(ip).digest('hex').substring(0, 64)
}

export async function POST(request: NextRequest) {
  try {
    const hashSecret = getSessionHashSecret()

    const rateLimited = enforceRateLimit(request, {
      bucket: 'sessions',
      limit: 10,
      windowMs: 60 * 1000
    })
    if (rateLimited) return rateLimited

    const clientIp = getClientIp(request)
    const supabase = getRouteClient()

    const parsed = await parseJsonBody(request, CreateSessionSchema)
    if (!parsed.ok) return parsed.response

    const { isGuest } = parsed.data

    // Derive userId from the caller's actual authenticated Supabase session rather
    // than trusting a client-supplied field — guests simply get user_id = null.
    const authClient = await createAuthClient()
    const {
      data: { user }
    } = await authClient.auth.getUser()
    const userId = user?.id ?? null

    const ipHash = hashIp(clientIp, hashSecret)

    const userAgent = request.headers.get('user-agent') || ''
    const deviceHash = createHmac('sha256', hashSecret)
      .update(userAgent)
      .digest('hex')
      .substring(0, 64)

    // Get latest consent version
    const { data: consent, error: consentError } = await supabase
      .from('consent_texts')
      .select('version')
      .eq('is_active', true)
      .order('version', { ascending: false })
      .limit(1)
      .single()

    if (consentError && consentError.code !== 'PGRST116') {
      throw consentError
    }

    const consentVersion = consent?.version || 1

    const token = generateSessionToken()
    const tokenHash = hashSessionToken(token)

    const { data: session, error } = await supabase
      .from('sessions')
      .insert({
        user_id: userId,
        ip_hash: ipHash,
        device_hash: deviceHash,
        consent_version: consentVersion,
        is_guest: userId ? isGuest : true,
        risk_score: 0,
        token_hash: tokenHash
      })
      .select('id')
      .single()

    if (error) throw error

    await setSessionTokenCookie(token)

    return noStoreJson({ sessionId: session.id })
  } catch (error) {
    return handleUnexpectedError(
      'api/sessions',
      error,
      'Oturum oluşturulamadı. Lütfen tekrar deneyin.'
    )
  }
}
