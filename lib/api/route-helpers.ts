import 'server-only'
import type { NextResponse } from 'next/server'
import type { ZodSchema } from 'zod'
import { API_ERROR_CODES, classifyUnexpectedError } from '@/lib/api/error-codes'
import { type ApiErrorBody, jsonError } from '@/lib/api/responses'
import { getClientIp, isRateLimited } from '@/lib/rate-limit'

/**
 * Route handler'larında aynı üç blok tekrarlanıyordu: hız sınırı, Zod ayrıştırma
 * ve catch zarfı. Burada ince yardımcılara ayrıldılar.
 *
 * Bilerek HOF (`withApiRoute(...)`) yazılmadı: handler'ların akışı okunur
 * kalsın, erken dönüşler görünür olsun istiyoruz.
 */

const RATE_LIMITED_MESSAGE = 'Çok fazla istek. Lütfen biraz sonra tekrar deneyin.'
const INVALID_REQUEST_MESSAGE = 'Geçersiz istek.'

export interface RateLimitRule {
  /** Hız sınırı kovasının adı, ör. `sessions`. IP ile birleştirilir. */
  bucket: string
  limit: number
  windowMs: number
}

/**
 * Sınır aşılmışsa hazır 429 yanıtı, aşılmamışsa `null` döner.
 */
export function enforceRateLimit(
  request: Request,
  rule: RateLimitRule
): NextResponse<ApiErrorBody> | null {
  const clientIp = getClientIp(request)

  if (isRateLimited(`${rule.bucket}:${clientIp}`, rule.limit, rule.windowMs)) {
    return jsonError(API_ERROR_CODES.RATE_LIMITED, RATE_LIMITED_MESSAGE)
  }

  return null
}

export type ParsedBody<T> =
  | { ok: true; data: T }
  | { ok: false; response: NextResponse<ApiErrorBody> }

/**
 * Gövdeyi okur ve şemaya göre doğrular. Bozuk JSON ile şemaya uymayan gövde
 * aynı şekilde ele alınır: ikisi de istemci hatasıdır ve ayrıntı sızdırmamalı.
 */
export async function parseJsonBody<T>(
  request: Request,
  schema: ZodSchema<T>,
  message: string = INVALID_REQUEST_MESSAGE
): Promise<ParsedBody<T>> {
  const body = await request.json().catch(() => ({}))
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return { ok: false, response: jsonError(API_ERROR_CODES.INVALID_REQUEST, message) }
  }

  return { ok: true, data: parsed.data }
}

/**
 * Beklenmeyen hataları sunucu tarafında ayrıntısıyla loglar, istemciye nazik
 * bir mesajla birlikte ayırt edilebilir bir kod döner.
 *
 * Kritik ayrım: Supabase'e ulaşılamadığında `UPSTREAM_UNAVAILABLE` (503)
 * dönüyoruz, `INTERNAL_ERROR` (500) değil. Canlıdaki kesinti sırasında bu
 * ayrım olmadığı için altyapı arızası kod hatasıyla karıştırıldı.
 */
export function handleUnexpectedError(
  context: string,
  error: unknown,
  fallbackMessage: string
): NextResponse<ApiErrorBody> {
  const code = classifyUnexpectedError(error)

  console.error(`[${context}] ${code}`, error)

  if (code === API_ERROR_CODES.UPSTREAM_UNAVAILABLE) {
    return jsonError(
      code,
      'Servise şu anda ulaşılamıyor. Lütfen birazdan tekrar deneyin.'
    )
  }

  return jsonError(code, fallbackMessage)
}
