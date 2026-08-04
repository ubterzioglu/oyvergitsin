import type { SupabaseClient } from '@supabase/supabase-js'
import { confidenceForUrl } from './source-confidence'
import type { ScanOutcome } from './types'

export type RadarFeedTopic =
  | 'party_switch'
  | 'parliament'
  | 'press_freedom'
  | 'election'
  | 'general_politics'

interface GnewsSource {
  name?: string | null
  url?: string | null
}

interface GnewsArticle {
  title?: string | null
  description?: string | null
  content?: string | null
  url?: string | null
  image?: string | null
  publishedAt?: string | null
  source?: GnewsSource | null
}

interface GnewsResponse {
  totalArticles?: number
  articles?: GnewsArticle[]
  errors?: string[]
}

interface TopicQuery {
  topic: RadarFeedTopic
  query: string
}

const GNEWS_ENDPOINT = 'https://gnews.io/api/v4/search'

const TOPIC_QUERIES: TopicQuery[] = [
  {
    topic: 'party_switch',
    query: '"partisine katıldı" OR "parti değiştirdi" OR "partisinden istifa etti" OR "bağımsız milletvekili"',
  },
  {
    topic: 'parliament',
    query: 'TBMM OR milletvekili OR "sandalye dağılımı"',
  },
  {
    topic: 'press_freedom',
    query: 'gazeteci AND (tutuklandı OR "gözaltına alındı" OR "tahliye edildi")',
  },
]

function envInteger(name: string, fallback: number, min: number, max: number): number {
  const parsed = Number.parseInt(process.env[name] ?? '', 10)
  if (!Number.isFinite(parsed)) {
    return fallback
  }
  return Math.min(max, Math.max(min, parsed))
}

function validHttpUrl(value: string | null | undefined): string | null {
  if (!value) {
    return null
  }

  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null
  } catch {
    return null
  }
}

function trimText(value: string | null | undefined, maxLength: number): string | null {
  const normalized = value?.replace(/\s+/g, ' ').trim()
  if (!normalized) {
    return null
  }
  return normalized.slice(0, maxLength)
}

async function fetchTopicArticles(
  apiKey: string,
  topicQuery: TopicQuery,
  lookbackHours: number,
  maxArticles: number
): Promise<GnewsArticle[]> {
  const from = new Date(Date.now() - lookbackHours * 60 * 60 * 1000).toISOString()
  const params = new URLSearchParams({
    q: topicQuery.query,
    lang: 'tr',
    country: 'tr',
    max: String(maxArticles),
    from,
    sortby: 'publishedAt',
  })

  const response = await fetch(`${GNEWS_ENDPOINT}?${params.toString()}`, {
    headers: {
      Accept: 'application/json',
      'X-Api-Key': apiKey,
      'User-Agent': 'oyvergitsin.org public-interest data verifier',
    },
    cache: 'no-store',
  })

  const payload = (await response.json().catch(() => ({}))) as GnewsResponse
  if (!response.ok) {
    const details = Array.isArray(payload.errors) ? payload.errors.join(', ') : `HTTP ${response.status}`
    throw new Error(`GNews isteği başarısız: ${details}`)
  }

  return Array.isArray(payload.articles) ? payload.articles : []
}

export async function scanGnewsFeed(
  supabaseAdmin: SupabaseClient,
  options: { lookbackHours?: number } = {}
): Promise<ScanOutcome> {
  const outcome: ScanOutcome = {
    source: 'GNews Türkiye siyasi haber akışı',
    fetched: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    failed: false,
    errorMessage: null,
  }

  const apiKey = process.env.GNEWS_API_KEY?.trim()
  if (!apiKey) {
    outcome.skipped = 1
    outcome.errorMessage = 'GNEWS_API_KEY tanımlı olmadığı için haber taraması atlandı.'
    return outcome
  }

  const maxArticles = envInteger('GNEWS_MAX_ARTICLES', 10, 1, 100)
  const defaultLookback = envInteger('GNEWS_LOOKBACK_HOURS', 48, 1, 720)
  const lookbackHours = options.lookbackHours ?? defaultLookback

  try {
    for (const topicQuery of TOPIC_QUERIES) {
      const articles = await fetchTopicArticles(apiKey, topicQuery, lookbackHours, maxArticles)
      outcome.fetched += articles.length

      for (const article of articles) {
        const articleUrl = validHttpUrl(article.url)
        const title = trimText(article.title, 500)
        if (!articleUrl || !title) {
          outcome.skipped += 1
          continue
        }

        const sourceUrl = validHttpUrl(article.source?.url)
        const sourceName = trimText(article.source?.name, 200) ?? new URL(articleUrl).hostname
        const publishedAt = article.publishedAt && !Number.isNaN(Date.parse(article.publishedAt))
          ? new Date(article.publishedAt).toISOString()
          : null
        const nowIso = new Date().toISOString()

        const payload = {
          provider: 'gnews',
          provider_item_id: articleUrl,
          topic: topicQuery.topic,
          title,
          description: trimText(article.description, 1200),
          source_name: sourceName,
          source_url: sourceUrl,
          image_url: validHttpUrl(article.image),
          published_at: publishedAt,
          discovered_at: nowIso,
          search_query: topicQuery.query,
          source_confidence: confidenceForUrl(sourceUrl ?? articleUrl),
          raw_payload: article,
        }

        const { data: existing, error: selectError } = await supabaseAdmin
          .from('radar_feed_items')
          .select('id')
          .eq('article_url', articleUrl)
          .maybeSingle()

        if (selectError) {
          throw new Error(selectError.message)
        }

        if (existing?.id) {
          const { error: updateError } = await supabaseAdmin
            .from('radar_feed_items')
            .update(payload)
            .eq('id', existing.id)

          if (updateError) {
            throw new Error(updateError.message)
          }
          outcome.updated += 1
          continue
        }

        const { error: insertError } = await supabaseAdmin.from('radar_feed_items').insert({
          ...payload,
          article_url: articleUrl,
          review_status: 'pending',
          visibility: 'private',
        })

        if (insertError) {
          throw new Error(insertError.message)
        }
        outcome.inserted += 1
      }
    }
  } catch (error) {
    outcome.failed = true
    outcome.errorMessage = error instanceof Error ? error.message : 'Bilinmeyen GNews hatası'
  }

  return outcome
}
