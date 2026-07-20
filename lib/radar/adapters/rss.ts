import { XMLParser } from 'fast-xml-parser'
import type { FeedAdapter, NewsSourceRow, RawNewsItem } from '@/lib/radar/types'
import { fetchFeedText, nodeText, toArray } from '@/lib/radar/adapters/fetch-feed'

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  trimValues: true,
})

interface RssItem {
  title?: unknown
  link?: unknown
  description?: unknown
  pubDate?: unknown
  category?: unknown
  enclosure?: { '@_url'?: string; '@_type'?: string } | Array<{ '@_url'?: string; '@_type'?: string }>
  'media:content'?: { '@_url'?: string } | Array<{ '@_url'?: string }>
  'media:thumbnail'?: { '@_url'?: string } | Array<{ '@_url'?: string }>
}

function extractImage(item: RssItem): string | undefined {
  const enclosures = toArray(item.enclosure)
  for (const enclosure of enclosures) {
    const type = enclosure?.['@_type']
    const url = enclosure?.['@_url']
    if (url && (!type || type.startsWith('image/'))) {
      return url
    }
  }
  const mediaContent = toArray(item['media:content'])
  if (mediaContent[0]?.['@_url']) {
    return mediaContent[0]['@_url']
  }
  const mediaThumb = toArray(item['media:thumbnail'])
  if (mediaThumb[0]?.['@_url']) {
    return mediaThumb[0]['@_url']
  }
  return undefined
}

export const rssAdapter: FeedAdapter = {
  async fetchItems(source: NewsSourceRow): Promise<RawNewsItem[]> {
    const xml = await fetchFeedText(source)
    const parsed = parser.parse(xml) as {
      rss?: { channel?: { item?: RssItem | RssItem[] } }
    }

    const rawItems = toArray(parsed.rss?.channel?.item).slice(0, source.max_items_per_scan)
    const results: RawNewsItem[] = []

    for (const item of rawItems) {
      const title = nodeText(item.title)
      const url = nodeText(item.link)
      if (!title || !url) {
        continue
      }
      results.push({
        title,
        url,
        summary: nodeText(item.description),
        publishedAt: nodeText(item.pubDate),
        imageUrl: extractImage(item),
        category: nodeText(item.category),
        language: source.language ?? undefined,
      })
    }

    return results
  },
}
