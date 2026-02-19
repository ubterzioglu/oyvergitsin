import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, isGuest = true } = body

    // Generate IP hash (in production, get from headers)
    const ipHash = Buffer.from(Date.now().toString()).toString('base64').substring(0, 64)

    // Generate device hash
    const userAgent = request.headers.get('user-agent') || ''
    const deviceHash = Buffer.from(userAgent).toString('base64').substring(0, 64)

    // Get latest consent version
    const { data: consent } = await supabase
      .from('consent_texts')
      .select('version')
      .eq('is_active', true)
      .order('version', { ascending: false })
      .limit(1)
      .single()

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
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ session })
  } catch (error) {
    console.error('Session creation error:', error)
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }
}
