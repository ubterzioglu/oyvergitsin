import { NextResponse } from 'next/server'
import { getSupabaseConfigError } from '@/lib/supabase/config'
import { createClient } from '@/lib/supabase/server'

const INVALID_LOGIN_MESSAGE = 'Kullanıcı adı veya şifre hatalı.'

function jsonError(message: string, status: number) {
  return NextResponse.json({ message }, { status })
}

function resolveAdminEmail(username: string) {
  const adminUsername = process.env.ADMIN_USERNAME?.trim()
  const adminEmail = process.env.ADMIN_EMAIL?.trim()

  if (adminUsername && adminEmail && username.toLowerCase() === adminUsername.toLowerCase()) {
    return adminEmail
  }

  return username
}

export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return jsonError('Giriş bilgileri okunamadı.', 400)
  }

  const username = typeof (body as { username?: unknown }).username === 'string'
    ? (body as { username: string }).username.trim()
    : ''
  const password = typeof (body as { password?: unknown }).password === 'string'
    ? (body as { password: string }).password
    : ''

  if (!username || !password) {
    return jsonError('Kullanıcı adı ve şifre zorunludur.', 400)
  }

  const configError = getSupabaseConfigError()
  if (configError) {
    return jsonError(configError, 500)
  }

  const email = resolveAdminEmail(username)
  if (!email.includes('@')) {
    return jsonError(INVALID_LOGIN_MESSAGE, 401)
  }

  const supabase = await createClient()
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

  if (signInError) {
    return jsonError(INVALID_LOGIN_MESSAGE, 401)
  }

  const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin')

  if (adminError || !isAdmin) {
    await supabase.auth.signOut()
    return jsonError('Bu hesabın yönetim paneline erişim yetkisi yok.', 403)
  }

  return NextResponse.json({ ok: true })
}