import type { SupabaseClient } from '@supabase/supabase-js'
import { rssAdapter } from '@/lib/radar/adapters/rss'
import { atomAdapter } from '@/lib/radar/adapters/atom'
import { checkDuplicate } from '@/lib/radar/dedupe'
import { normalizeItem } from '@/lib/radar/normalize-item'
import type {
  FeedAdapter,
  NewsKeywordRow,
  NewsSourceRow,
  ScanSummary,
} from '@/lib/radar/types'

const STALE_RUN_MS = 10 * 60 * 1000

export class ConcurrentScanError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConcurrentScanError'
  }
}

export interface RunScanOptions {
  triggerType: 'cron' | 'manual'
  sourceIds?: string[]
  startedBy?: string | null
}

function getAdapter(sourceType: string): FeedAdapter | null {
  if (sourceType === 'rss') {
    return rssAdapter
  }
  if (sourceType === 'atom') {
    return atomAdapter
  }
  return null
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Bilinmeyen hata'
}

async function assertNoConcurrentScan(supabaseAdmin: SupabaseClient): Promise<void> {
  const threshold = new Date(Date.now() - STALE_RUN_MS).toISOString()
  const { data, error } = await supabaseAdmin
    .from('news_scan_runs')
    .select('id')
    .eq('status', 'running')
    .gte('started_at', threshold)
    .limit(1)

  if (error) {
    throw new Error(`Eşzamanlı tarama kontrolü başarısız: ${error.message}`)
  }

  if ((data?.length ?? 0) > 0) {
    throw new ConcurrentScanError('Zaten devam eden bir tarama var. Lütfen bitmesini bekleyin.')
  }
}

async function loadSources(
  supabaseAdmin: SupabaseClient,
  sourceIds?: string[]
): Promise<NewsSourceRow[]> {
  let query = supabaseAdmin
    .from('news_sources')
    .select('*')
    .eq('is_enabled', true)
    .eq('terms_checked', true)

  if (sourceIds && sourceIds.length > 0) {
    query = query.in('id', sourceIds)
  }

  const { data, error } = await query
  if (error) {
    throw new Error(`Kaynaklar yüklenemedi: ${error.message}`)
  }
  return (data ?? []) as NewsSourceRow[]
}

async function loadKeywords(supabaseAdmin: SupabaseClient): Promise<NewsKeywordRow[]> {
  const { data, error } = await supabaseAdmin
    .from('news_keywords')
    .select('*')
    .eq('is_enabled', true)

  if (error) {
    throw new Error(`Anahtar kelimeler yüklenemedi: ${error.message}`)
  }
  return (data ?? []) as NewsKeywordRow[]
}

interface SourceScanResult {
  fetched: number
  inserted: number
  duplicates: number
  filtered: number
  failed: boolean
}

async function scanSource(
  supabaseAdmin: SupabaseClient,
  source: NewsSourceRow,
  keywords: NewsKeywordRow[],
  scanRunId: string
): Promise<SourceScanResult> {
  const result: SourceScanResult = { fetched: 0, inserted: 0, duplicates: 0, filtered: 0, failed: false }
  const adapter = getAdapter(source.source_type)

  if (!adapter) {
    result.failed = true
    await supabaseAdmin
      .from('news_sources')
      .update({
        last_error_at: new Date().toISOString(),
        last_error_message: `Desteklenmeyen kaynak türü: ${source.source_type}`,
      })
      .eq('id', source.id)
    return result
  }

  try {
    const items = await adapter.fetchItems(source)
    result.fetched = items.length

    for (const raw of items) {
      const normalized = await normalizeItem(raw, source, keywords)
      if (!normalized) {
        result.filtered += 1
        continue
      }

      const { isDupe } = await checkDuplicate(supabaseAdmin, normalized)
      if (isDupe) {
        result.duplicates += 1
        continue
      }

      const { error: insertError } = await supabaseAdmin.from('news_candidates').insert({
        source_id: source.id,
        scan_run_id: scanRunId,
        review_status: 'pending',
        ...normalized,
      })

      if (insertError) {
        // Unique-constraint races land here; treat them as duplicates, not failures.
        if (insertError.code === '23505') {
          result.duplicates += 1
          continue
        }
        throw new Error(insertError.message)
      }

      result.inserted += 1
    }

    await supabaseAdmin
      .from('news_sources')
      .update({ last_success_at: new Date().toISOString() })
      .eq('id', source.id)
  } catch (error) {
    result.failed = true
    await supabaseAdmin
      .from('news_sources')
      .update({
        last_error_at: new Date().toISOString(),
        last_error_message: getErrorMessage(error),
      })
      .eq('id', source.id)
  }

  return result
}

/**
 * Orchestrates a full scan across enabled sources. Every candidate that passes
 * normalization and dedupe is inserted with review_status = 'pending'. Nothing
 * is auto-published.
 */
export async function runScan(
  supabaseAdmin: SupabaseClient,
  options: RunScanOptions
): Promise<ScanSummary> {
  await assertNoConcurrentScan(supabaseAdmin)

  const { data: runRow, error: runError } = await supabaseAdmin
    .from('news_scan_runs')
    .insert({
      trigger_type: options.triggerType,
      status: 'running',
      started_by: options.startedBy ?? null,
    })
    .select('id')
    .single()

  if (runError || !runRow) {
    throw new Error(`Tarama kaydı oluşturulamadı: ${runError?.message ?? 'bilinmeyen hata'}`)
  }

  const scanRunId = runRow.id as string

  let sources: NewsSourceRow[] = []
  let keywords: NewsKeywordRow[] = []

  try {
    sources = await loadSources(supabaseAdmin, options.sourceIds)
    keywords = await loadKeywords(supabaseAdmin)
  } catch (error) {
    const message = getErrorMessage(error)
    await supabaseAdmin
      .from('news_scan_runs')
      .update({ status: 'failed', completed_at: new Date().toISOString(), error_message: message })
      .eq('id', scanRunId)
    return {
      scanRunId,
      status: 'failed',
      sourceCount: 0,
      fetchedCount: 0,
      insertedCount: 0,
      duplicateCount: 0,
      filteredCount: 0,
      failedSourceCount: 0,
      errorMessage: message,
    }
  }

  let fetchedCount = 0
  let insertedCount = 0
  let duplicateCount = 0
  let filteredCount = 0
  let failedSourceCount = 0

  for (const source of sources) {
    const outcome = await scanSource(supabaseAdmin, source, keywords, scanRunId)
    fetchedCount += outcome.fetched
    insertedCount += outcome.inserted
    duplicateCount += outcome.duplicates
    filteredCount += outcome.filtered
    if (outcome.failed) {
      failedSourceCount += 1
    }
  }

  let status: ScanSummary['status'] = 'completed'
  if (sources.length > 0 && failedSourceCount === sources.length) {
    status = 'failed'
  } else if (failedSourceCount > 0) {
    status = 'partial'
  }

  await supabaseAdmin
    .from('news_scan_runs')
    .update({
      status,
      completed_at: new Date().toISOString(),
      source_count: sources.length,
      fetched_count: fetchedCount,
      inserted_count: insertedCount,
      duplicate_count: duplicateCount,
      filtered_count: filteredCount,
      failed_source_count: failedSourceCount,
    })
    .eq('id', scanRunId)

  return {
    scanRunId,
    status,
    sourceCount: sources.length,
    fetchedCount,
    insertedCount,
    duplicateCount,
    filteredCount,
    failedSourceCount,
    errorMessage: null,
  }
}
