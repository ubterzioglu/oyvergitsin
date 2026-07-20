import { createClient as createAuthClient } from '@/lib/supabase/server'

export interface AdminAuthResult {
  ok: boolean
  userId?: string
}

/**
 * Verifies the caller is an authenticated admin using their cookie-bound
 * Supabase session and the is_admin() RPC (RLS-safe). Returns the user id on
 * success so callers can attribute writes.
 */
export async function requireAdmin(): Promise<AdminAuthResult> {
  const authClient = await createAuthClient()

  const {
    data: { user }
  } = await authClient.auth.getUser()

  if (!user) {
    return { ok: false }
  }

  const { data: isAdmin, error } = await authClient.rpc('is_admin')
  if (error || !isAdmin) {
    return { ok: false }
  }

  return { ok: true, userId: user.id }
}
