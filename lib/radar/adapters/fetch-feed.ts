import { validateSourceUrl } from '@/lib/radar/source-security'
import type { NewsSourceRow } from '@/lib/radar/types'

const MAX_RESPONSE_BYTES = 2 * 1024 * 1024 // 2MB

/**
 * Fetches raw feed text with an AbortController timeout, SSRF validation,
 * and a hard cap on response size. Shared by the RSS and Atom adapters.
 */
export async function fetchFeedText(source: NewsSourceRow): Promise<string> {
  const validation = validateSourceUrl(source.endpoint_url)
  if (!validation.ok) {
    throw new Error(`Kaynak URL güvenlik doğrulaması başarısız: ${validation.reason}`)
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), source.timeout_ms)

  try {
    const response = await fetch(source.endpoint_url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
        'User-Agent': 'OyVerGitsinRadar/1.0 (+https://oyvergitsin.org)',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`)
    }

    const contentLength = response.headers.get('content-length')
    if (contentLength && Number(contentLength) > MAX_RESPONSE_BYTES) {
      throw new Error('Yanıt boyutu 2MB sınırını aşıyor.')
    }

    const buffer = await response.arrayBuffer()
    if (buffer.byteLength > MAX_RESPONSE_BYTES) {
      throw new Error('Yanıt boyutu 2MB sınırını aşıyor.')
    }

    return new TextDecoder('utf-8').decode(buffer)
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Coerces fast-xml-parser output (single object OR array) into an array.
 */
export function toArray<T>(value: T | T[] | undefined | null): T[] {
  if (value === undefined || value === null) {
    return []
  }
  return Array.isArray(value) ? value : [value]
}

/**
 * Extracts text content from an fast-xml-parser node which may be a plain
 * string, a number, or an object with a "#text" key.
 */
export function nodeText(node: unknown): string | undefined {
  if (node === undefined || node === null) {
    return undefined
  }
  if (typeof node === 'string') {
    return node.trim() || undefined
  }
  if (typeof node === 'number') {
    return String(node)
  }
  if (typeof node === 'object' && '#text' in (node as Record<string, unknown>)) {
    const text = (node as Record<string, unknown>)['#text']
    return text === undefined || text === null ? undefined : String(text).trim() || undefined
  }
  return undefined
}
