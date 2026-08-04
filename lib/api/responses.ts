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

export function jsonError(error: string, status: number): NextResponse<{ error: string }> {
  return noStoreJson({ error }, { status })
}
