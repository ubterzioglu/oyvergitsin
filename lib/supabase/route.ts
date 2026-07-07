import 'server-only'

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || ''

function createSupabaseClient(key: string) {
  return createClient(supabaseUrl, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

function assertBaseConfig() {
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured')
  }
}

export function hasServiceRoleKey() {
  return Boolean(supabaseServiceKey)
}

export function getPublicServerClient() {
  assertBaseConfig()

  if (!supabaseAnonKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured')
  }

  return createSupabaseClient(supabaseAnonKey)
}

export function getRouteClient() {
  assertBaseConfig()

  if (supabaseServiceKey) {
    return createSupabaseClient(supabaseServiceKey)
  }

  return getPublicServerClient()
}
