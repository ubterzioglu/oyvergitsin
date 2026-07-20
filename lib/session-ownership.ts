import 'server-only'

import { getAdminClient } from '@/lib/supabase/admin'
import { getSessionTokenFromCookie, verifySessionToken } from '@/lib/session-token'

export async function assertSessionOwnership(sessionId: string): Promise<boolean> {
  const token = await getSessionTokenFromCookie()
  if (!token) return false

  const admin = getAdminClient()
  const { data: session, error } = await admin
    .from('sessions')
    .select('token_hash')
    .eq('id', sessionId)
    .single()

  if (error || !session) return false

  return verifySessionToken(token, session.token_hash)
}
