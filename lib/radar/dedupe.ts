import type { SupabaseClient } from '@supabase/supabase-js'
import type { NormalizedNewsItem } from '@/lib/radar/types'

export interface DuplicateCheckResult {
  isDupe: boolean
}

/**
 * Checks whether a normalized candidate already exists in news_candidates by
 * either its canonical URL hash or its content hash.
 */
export async function checkDuplicate(
  supabaseAdmin: SupabaseClient,
  normalized: NormalizedNewsItem
): Promise<DuplicateCheckResult> {
  const { data, error } = await supabaseAdmin
    .from('news_candidates')
    .select('id')
    .or(
      `canonical_url_hash.eq.${normalized.canonical_url_hash},content_hash.eq.${normalized.content_hash}`
    )
    .limit(1)

  if (error) {
    throw new Error(`Tekilleştirme kontrolü başarısız: ${error.message}`)
  }

  return { isDupe: (data?.length ?? 0) > 0 }
}
