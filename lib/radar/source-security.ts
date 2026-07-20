/**
 * SSRF guard for outbound feed fetches. Rejects any endpoint URL that
 * targets localhost, private/reserved IP ranges, or a non-http(s) protocol.
 */

export interface SourceUrlValidation {
  ok: boolean
  reason?: string
}

const PRIVATE_IPV4_PATTERNS: RegExp[] = [
  /^127\./, // loopback
  /^10\./, // private class A
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // private class B 172.16-31
  /^192\.168\./, // private class C
  /^169\.254\./, // link-local
  /^0\./, // "this" network
]

function isPrivateIpv4(hostname: string): boolean {
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
    return false
  }
  return PRIVATE_IPV4_PATTERNS.some((pattern) => pattern.test(hostname))
}

function isBlockedHostname(hostname: string): boolean {
  const lower = hostname.toLowerCase().replace(/^\[|\]$/g, '')

  if (lower === 'localhost' || lower.endsWith('.localhost')) {
    return true
  }

  // IPv6 loopback / unspecified / link-local / unique-local
  if (lower === '::1' || lower === '::' || lower.startsWith('fe80:') || lower.startsWith('fc') || lower.startsWith('fd')) {
    return true
  }

  return isPrivateIpv4(lower)
}

export function validateSourceUrl(url: string): SourceUrlValidation {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return { ok: false, reason: 'Geçersiz URL formatı.' }
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, reason: `Desteklenmeyen protokol: ${parsed.protocol}` }
  }

  if (isBlockedHostname(parsed.hostname)) {
    return { ok: false, reason: `Engellenen host adresi: ${parsed.hostname}` }
  }

  return { ok: true }
}
