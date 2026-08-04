import { NextResponse } from 'next/server'

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, private',
} as const

export function noStoreJson<T>(body: T, init?: ResponseInit): NextResponse<T> {
  return NextResponse.json(body, {
    ...init,
    headers: {
      ...NO_STORE_HEADERS,
      ...init?.headers,
    },
  })
}

export function jsonError<T extends Record<string, unknown> = Record<string, never>>(
  error: string,
  status: number,
  details?: T
): NextResponse<{ error: string } & T> {
  return noStoreJson({ error, ...(details ?? {}) } as { error: string } & T, { status })
}
