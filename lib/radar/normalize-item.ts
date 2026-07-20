import { canonicalizeUrl } from '@/lib/radar/canonicalize-url'
import { buildCanonicalUrlHash, buildContentHash, normalizeTitle } from '@/lib/radar/hash'
import { sanitizeSummary } from '@/lib/radar/sanitize-html'
import { scoreRelevance } from '@/lib/radar/relevance-score'
import type {
  NewsKeywordRow,
  NewsSourceRow,
  NormalizedNewsItem,
  RawNewsItem,
} from '@/lib/radar/types'

function parsePublishedAt(raw?: string): string | null {
  if (!raw) {
    return null
  }
  const parsed = Date.parse(raw)
  if (Number.isNaN(parsed)) {
    return null
  }
  return new Date(parsed).toISOString()
}

/**
 * Turns a raw feed item into a fully normalized candidate. Returns null when
 * the item lacks a usable title or a valid, canonicalizable URL.
 */
export async function normalizeItem(
  raw: RawNewsItem,
  source: NewsSourceRow,
  dbKeywords: NewsKeywordRow[]
): Promise<NormalizedNewsItem | null> {
  const title = raw.title?.trim()
  if (!title || !raw.url) {
    return null
  }

  const canonicalUrl = canonicalizeUrl(raw.url)
  if (!canonicalUrl) {
    return null
  }

  const normalizedTitle = normalizeTitle(title)
  if (!normalizedTitle) {
    return null
  }

  const publishedAt = parsePublishedAt(raw.publishedAt)
  const summary = raw.summary ? sanitizeSummary(raw.summary) || null : null

  const { score, reasons } = scoreRelevance(title, summary, source, dbKeywords, publishedAt)

  const canonicalUrlHash = await buildCanonicalUrlHash(canonicalUrl)
  const contentHash = await buildContentHash(normalizedTitle, source.name, publishedAt)

  return {
    source_name: source.name,
    source_url: source.website_url ?? null,
    original_url: raw.url,
    canonical_url: canonicalUrl,
    title,
    normalized_title: normalizedTitle,
    summary,
    image_source_url: raw.imageUrl ?? null,
    category: raw.category ?? source.category_default ?? null,
    language: raw.language ?? source.language ?? null,
    country: source.country ?? null,
    published_at: publishedAt,
    relevance_score: score,
    relevance_reasons: reasons,
    canonical_url_hash: canonicalUrlHash,
    content_hash: contentHash,
    raw_payload: { ...raw },
  }
}
