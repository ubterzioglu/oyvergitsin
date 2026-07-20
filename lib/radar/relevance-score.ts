import type { NewsKeywordRow, NewsSourceRow, RelevanceReason } from '@/lib/radar/types'

/**
 * Keyword-based relevance scoring. No LLM involved — deterministic rules only.
 */

const SUMMARY_WEIGHT_FACTOR = 0.45
const NEGATIVE_PENALTY = 40
const TRUSTED_SOURCE_BONUS = 10
const RECENT_BONUS = 10
const RECENT_WINDOW_MS = 24 * 60 * 60 * 1000

export interface RelevanceResult {
  score: number
  reasons: RelevanceReason[]
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function isRecent(publishedAt?: string | null): boolean {
  if (!publishedAt) {
    return false
  }
  const published = Date.parse(publishedAt)
  if (Number.isNaN(published)) {
    return false
  }
  return Date.now() - published <= RECENT_WINDOW_MS
}

export function scoreRelevance(
  title: string,
  summary: string | null | undefined,
  source: NewsSourceRow,
  dbKeywords: NewsKeywordRow[],
  publishedAt?: string | null
): RelevanceResult {
  const haystackTitle = title.toLowerCase()
  const haystackSummary = (summary ?? '').toLowerCase()
  const reasons: RelevanceReason[] = []
  let score = 0

  // Track categories already credited so each positive category counts once.
  const creditedCategories = new Set<string>()

  for (const keyword of dbKeywords) {
    const needle = keyword.keyword.toLowerCase().trim()
    if (!needle) {
      continue
    }
    const inTitle = haystackTitle.includes(needle)
    const inSummary = haystackSummary.includes(needle)
    if (!inTitle && !inSummary) {
      continue
    }

    if (keyword.is_negative) {
      score -= NEGATIVE_PENALTY
      reasons.push({ rule: 'negative_keyword', value: keyword.keyword, score: -NEGATIVE_PENALTY })
      continue
    }

    const categoryKey = keyword.category ?? `__kw_${keyword.id}`
    if (creditedCategories.has(categoryKey)) {
      continue
    }
    creditedCategories.add(categoryKey)

    const weight = inTitle ? keyword.weight : Math.round(keyword.weight * SUMMARY_WEIGHT_FACTOR)
    if (weight === 0) {
      continue
    }
    score += weight
    reasons.push({
      rule: inTitle ? 'keyword_title' : 'keyword_summary',
      value: keyword.keyword,
      score: weight,
    })
  }

  if (source.trust_level === 'official' || source.trust_level === 'high') {
    score += TRUSTED_SOURCE_BONUS
    reasons.push({ rule: 'trusted_source', value: source.trust_level, score: TRUSTED_SOURCE_BONUS })
  }

  if (isRecent(publishedAt)) {
    score += RECENT_BONUS
    reasons.push({ rule: 'recent', score: RECENT_BONUS })
  }

  return { score: clamp(score, 0, 100), reasons }
}
