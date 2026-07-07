import { NextRequest, NextResponse } from 'next/server'
import { getPublicServerClient } from '@/lib/supabase/route'

export async function POST(request: NextRequest) {
  try {
    const supabase = getPublicServerClient()
    const body = await request.json()
    const { userId, isGuest = true } = body

    // Generate IP hash (in production, get from headers)
    const ipHash = Buffer.from(Date.now().toString()).toString('base64').substring(0, 64)

    // Generate device hash
    const userAgent = request.headers.get('user-agent') || ''
    const deviceHash = Buffer.from(userAgent).toString('base64').substring(0, 64)

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

    const { data: session, error } = await supabase
      .from('sessions')
      .insert({
        user_id: userId || null,
        ip_hash: ipHash,
        device_hash: deviceHash,
        consent_version: consentVersion,
        is_guest: isGuest,
        risk_score: 0
      })
      .select('id')
      .single()

    if (error) throw error

    return NextResponse.json({ sessionId: session.id })
  } catch (error) {
    console.error('Session creation error:', error)
    const message = error instanceof Error ? error.message : 'Failed to create session'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
