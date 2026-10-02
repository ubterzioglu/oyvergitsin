/**
 * API hata kodları.
 *
 * Neden var: Bu projede canlıda bir kesinti yaşandı ve `/consent` kullanıcıya
 * "Oturum oluşturulurken beklenmeyen bir hata oluştu" dedi. Gerçek sebep
 * Supabase'in servis dışı olmasıydı (Cloudflare 521), ama hata gövdesi kod
 * hatasıyla altyapı arızasını ayırt edilemez kılıyordu. Teşhis ancak
 * `/api/health` sayesinde yapılabildi.
 *
 * Kullanıcıya gösterilen Türkçe mesaj nazik kalır; `code` alanı ise makine
 * tarafından okunur ve altyapı arızasını kullanıcı hatasından ayırır.
 */
export const API_ERROR_CODES = {
  /** İstemci hız sınırını aştı. */
  RATE_LIMITED: 'RATE_LIMITED',
  /** Gövde veya parametre şemaya uymuyor. */
  INVALID_REQUEST: 'INVALID_REQUEST',
  /** Oturum sahipliği doğrulanamadı. */
  FORBIDDEN: 'FORBIDDEN',
  /** Anket eksik ya da dikkat kontrolü başarısız. */
  SURVEY_INCOMPLETE: 'SURVEY_INCOMPLETE',
  /** Aktif eksen modeli yok — veri/konfigürasyon eksikliği, kod hatası değil. */
  AXIS_MODEL_UNAVAILABLE: 'AXIS_MODEL_UNAVAILABLE',
  /** Supabase'e ulaşılamıyor. Altyapı arızası — kodu değiştirmek düzeltmez. */
  UPSTREAM_UNAVAILABLE: 'UPSTREAM_UNAVAILABLE',
  /** Sınıflandırılamayan sunucu hatası. */
  INTERNAL_ERROR: 'INTERNAL_ERROR'
} as const

export type ApiErrorCode = (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES]

/**
 * Her kodun tek bir HTTP statüsü vardır. Kod ve statüyü ayrı ayrı geçmek
 * yerine buradan türetiyoruz ki ikisi birbirinden kopmasın.
 */
const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  RATE_LIMITED: 429,
  INVALID_REQUEST: 400,
  FORBIDDEN: 403,
  SURVEY_INCOMPLETE: 400,
  AXIS_MODEL_UNAVAILABLE: 503,
  UPSTREAM_UNAVAILABLE: 503,
  INTERNAL_ERROR: 500
}

export function statusForErrorCode(code: ApiErrorCode): number {
  return STATUS_BY_CODE[code]
}

/**
 * Hata nesnesinden aranabilir metni toplar.
 *
 * DİKKAT: supabase-js ağ hatasını `Error` olarak DEĞİL, PostgrestError
 * şeklinde düz bir nesne olarak fırlatıyor:
 *   { message: 'TypeError: fetch failed',
 *     details: 'Caused by: Error: getaddrinfo ENOTFOUND … (ENOTFOUND)',
 *     hint: '', code: '' }
 * Bu yüzden yalnızca `instanceof Error` kontrolüne güvenmek yetmiyor —
 * yerel olarak erişilemez bir host'a yönlendirilip doğrulandı.
 */
function collectErrorText(error: unknown): string {
  if (error == null) return ''
  if (typeof error === 'string') return error

  const parts: string[] = []

  if (error instanceof Error) {
    parts.push(error.message)
    if (error.cause) {
      parts.push(collectErrorText(error.cause))
    }
  }

  if (typeof error === 'object') {
    const record = error as Record<string, unknown>
    for (const key of ['message', 'details', 'hint', 'name']) {
      const value = record[key]
      if (typeof value === 'string') {
        parts.push(value)
      }
    }
    if (!(error instanceof Error) && record.cause) {
      parts.push(collectErrorText(record.cause))
    }
  }

  return parts.join(' ')
}

/**
 * Supabase istemcisi ağ katmanında başarısız olduğunda `fetch failed`
 * ailesinden bir hata fırlatır; sorgu düzeyindeki hatalar ise PostgREST
 * kodu (`PGRST…`) ya da SQLSTATE taşır. Ayrımı burada yapıyoruz, böylece
 * 500 yığınının içinde altyapı arızası kaybolmuyor.
 */
export function classifyUnexpectedError(error: unknown): ApiErrorCode {
  const haystack = collectErrorText(error).toLowerCase()

  const networkMarkers = [
    'fetch failed',
    'econnrefused',
    'enotfound',
    'etimedout',
    'econnreset',
    'socket hang up',
    'network error',
    'und_err'
  ]

  if (networkMarkers.some((marker) => haystack.includes(marker))) {
    return API_ERROR_CODES.UPSTREAM_UNAVAILABLE
  }

  return API_ERROR_CODES.INTERNAL_ERROR
}
