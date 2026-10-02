import { describe, expect, it } from 'vitest'
import {
  API_ERROR_CODES,
  classifyUnexpectedError,
  statusForErrorCode
} from '@/lib/api/error-codes'

describe('classifyUnexpectedError', () => {
  it('Supabase ağ hatasını altyapı arızası olarak sınıflar', () => {
    // undici'nin Supabase istemcisi üzerinden ilettiği tipik hata.
    const error = new Error('fetch failed')

    expect(classifyUnexpectedError(error)).toBe(API_ERROR_CODES.UPSTREAM_UNAVAILABLE)
  })

  it('ağ hatası iç içe cause olarak geldiğinde de yakalar', () => {
    const error = new Error('TypeError: fetch failed', {
      cause: new Error('connect ECONNREFUSED 127.0.0.1:54321')
    })

    expect(classifyUnexpectedError(error)).toBe(API_ERROR_CODES.UPSTREAM_UNAVAILABLE)
  })

  it.each(['ENOTFOUND db.example.supabase.co', 'socket hang up', 'ETIMEDOUT'])(
    '%s → UPSTREAM_UNAVAILABLE',
    (message) => {
      expect(classifyUnexpectedError(new Error(message))).toBe(
        API_ERROR_CODES.UPSTREAM_UNAVAILABLE
      )
    }
  )

  it('supabase-js ağ hatasının gerçek şeklini tanır', () => {
    // Bu nesne uydurma degil: yerel sunucu erisilemez bir Supabase host'una
    // yonlendirilip /api/questions cagrilarak kopyalandi. supabase-js bunu
    // Error olarak DEGIL, duz PostgrestError nesnesi olarak firlatiyor.
    const supabaseNetworkError = {
      message: 'TypeError: fetch failed',
      details:
        'TypeError: fetch failed\n\nCaused by: Error: getaddrinfo ENOTFOUND db.example.supabase.co (ENOTFOUND)',
      hint: '',
      code: ''
    }

    expect(classifyUnexpectedError(supabaseNetworkError)).toBe(
      API_ERROR_CODES.UPSTREAM_UNAVAILABLE
    )
  })

  it('PostgREST sorgu hatasını altyapı arızası saymaz', () => {
    const error = Object.assign(new Error('column "foo" does not exist'), {
      code: '42703'
    })

    expect(classifyUnexpectedError(error)).toBe(API_ERROR_CODES.INTERNAL_ERROR)
  })

  it('Error olmayan değerleri de güvenle ele alır', () => {
    expect(classifyUnexpectedError('bir şeyler ters gitti')).toBe(
      API_ERROR_CODES.INTERNAL_ERROR
    )
    expect(classifyUnexpectedError(null)).toBe(API_ERROR_CODES.INTERNAL_ERROR)
    expect(classifyUnexpectedError(undefined)).toBe(API_ERROR_CODES.INTERNAL_ERROR)
  })
})

describe('statusForErrorCode', () => {
  it('her kod için HTTP statüsü tanımlı', () => {
    for (const code of Object.values(API_ERROR_CODES)) {
      const status = statusForErrorCode(code)

      expect(typeof status).toBe('number')
      expect(status).toBeGreaterThanOrEqual(400)
      expect(status).toBeLessThan(600)
    }
  })

  it('altyapı arızası 500 değil 503 döner', () => {
    // Ayrım burada: 500 "kodu düzelt" demek, 503 "servis dönünce geçer" demek.
    expect(statusForErrorCode(API_ERROR_CODES.UPSTREAM_UNAVAILABLE)).toBe(503)
    expect(statusForErrorCode(API_ERROR_CODES.INTERNAL_ERROR)).toBe(500)
  })
})
