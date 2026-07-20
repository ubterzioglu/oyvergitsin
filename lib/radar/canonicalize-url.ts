/**
 * Strips tracking query parameters and normalizes a URL into a stable
 * canonical form used for deduplication and hashing.
 */

const TRACKING_PARAM_PREFIXES = ['utm_']
const TRACKING_PARAM_EXACT = new Set([
  'fbclid',
  'gclid',
  'gclsrc',
  'dclid',
  'msclkid',
  'mc_cid',
  'mc_eid',
  'igshid',
  'ref',
  'ref_src',
])

function isTrackingParam(key: string): boolean {
  const lower = key.toLowerCase()
  if (TRACKING_PARAM_EXACT.has(lower)) {
    return true
  }
  return TRACKING_PARAM_PREFIXES.some((prefix) => lower.startsWith(prefix))
}

export function canonicalizeUrl(url: string): string | null {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return null
  }

  const keptParams: [string, string][] = []
  parsed.searchParams.forEach((value, key) => {
    if (!isTrackingParam(key)) {
      keptParams.push([key, value])
    }
  })

  keptParams.sort(([a], [b]) => a.localeCompare(b))

  parsed.search = ''
  for (const [key, value] of keptParams) {
    parsed.searchParams.append(key, value)
  }

  parsed.hash = ''
  parsed.hostname = parsed.hostname.toLowerCase()

  // Drop a trailing slash on the path (but keep the root "/").
  if (parsed.pathname.length > 1 && parsed.pathname.endsWith('/')) {
    parsed.pathname = parsed.pathname.slice(0, -1)
  }

  return parsed.toString()
}
