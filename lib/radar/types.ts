import type { Database, RelevanceReason } from '@/lib/supabase/client'

export type NewsSourceRow = Database['public']['Tables']['news_sources']['Row']
export type NewsKeywordRow = Database['public']['Tables']['news_keywords']['Row']
export type NewsCandidateInsert = Database['public']['Tables']['news_candidates']['Insert']

export type { RelevanceReason }

/**
 * Raw item as extracted from a feed adapter before normalization.
 */
export interface RawNewsItem {
  title: string
  url: string
  summary?: string
  publishedAt?: string
  imageUrl?: string
  language?: string
  category?: string
}

/**
 * Fully normalized candidate ready to insert into news_candidates.
 * Mirrors the insert shape but omits DB-managed fields (id, timestamps,
 * source_id, scan_run_id) that the orchestrator supplies.
 */
export interface NormalizedNewsItem {
  source_name: string
  source_url: string | null
  original_url: string
  canonical_url: string
  title: string
  normalized_title: string
  summary: string | null
  image_source_url: string | null
  category: string | null
  language: string | null
  country: string | null
  published_at: string | null
  relevance_score: number
  relevance_reasons: RelevanceReason[]
  canonical_url_hash: string
  content_hash: string
  raw_payload: Record<string, unknown>
}

/**
 * Feed adapter contract. Each adapter fetches and parses one source type.
 */
export interface FeedAdapter {
  fetchItems(source: NewsSourceRow): Promise<RawNewsItem[]>
}

export interface ScanSummary {
  scanRunId: string
  status: 'completed' | 'partial' | 'failed'
  sourceCount: number
  fetchedCount: number
  insertedCount: number
  duplicateCount: number
  filteredCount: number
  failedSourceCount: number
  errorMessage: string | null
}
