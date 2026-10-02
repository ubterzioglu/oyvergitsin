import { NextResponse } from 'next/server'
import { type ApiErrorCode, statusForErrorCode } from '@/lib/api/error-codes'

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

export interface ApiErrorBody {
  /** Kullanıcıya gösterilebilir Türkçe mesaj. */
  error: string
  /** Makine tarafından okunan, kararlı hata kodu. */
  code: ApiErrorCode
}

/**
 * Hata gövdesi her zaman hem `error` (insan) hem `code` (makine) taşır.
 * HTTP statüsü koddan türetilir; kod ile statüyü ayrı argüman olarak geçmek
 * ikisinin birbirinden kopmasına açık kapı bırakıyordu.
 */
export function jsonError<T extends Record<string, unknown> = Record<string, never>>(
  code: ApiErrorCode,
  error: string,
  details?: T
): NextResponse<ApiErrorBody & T> {
  return noStoreJson({ error, code, ...(details ?? {}) } as ApiErrorBody & T, {
    status: statusForErrorCode(code),
  })
}
