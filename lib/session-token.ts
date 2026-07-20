import 'server-only'

import { randomBytes, createHash, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'

const COOKIE_NAME = 'session_token'

export function generateSessionToken(): string {
  return randomBytes(32).toString('hex')
}

export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export async function setSessionTokenCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 // 24 hours, enough to complete the survey
  })
}

export async function getSessionTokenFromCookie(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(COOKIE_NAME)?.value ?? null
}

export function verifySessionToken(token: string, storedHash: string | null): boolean {
  if (!storedHash) return false

  const candidateHash = hashSessionToken(token)
  const candidateBuffer = Buffer.from(candidateHash, 'hex')
  const storedBuffer = Buffer.from(storedHash, 'hex')

  if (candidateBuffer.length !== storedBuffer.length) return false

  return timingSafeEqual(candidateBuffer, storedBuffer)
}
