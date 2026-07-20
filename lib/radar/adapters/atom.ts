import { XMLParser } from 'fast-xml-parser'
import type { FeedAdapter, NewsSourceRow, RawNewsItem } from '@/lib/radar/types'
import { fetchFeedText, nodeText, toArray } from '@/lib/radar/adapters/fetch-feed'

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  trimValues: true,
})

interface AtomLink {
  '@_href'?: string
  '@_rel'?: string
  '@_type'?: string
}

interface AtomEntry {
  title?: unknown
  link?: AtomLink | AtomLink[]
  summary?: unknown
  content?: unknown
  updated?: unknown
  published?: unknown
  category?: { '@_term'?: string } | Array<{ '@_term'?: string }>
}

function extractLink(entry: AtomEntry): string | undefined {
  const links = toArray(entry.link)
  const alternate = links.find((link) => !link['@_rel'] || link['@_rel'] === 'alternate')
  const chosen = alternate ?? links[0]
  return chosen?.['@_href']
}

function extractImage(entry: AtomEntry): string | undefined {
  const links = toArray(entry.link)
  const enclosure = links.find((link) => link['@_rel'] === 'enclosure' && link['@_type']?.startsWith('image/'))
  return enclosure?.['@_href']
}

export const atomAdapter: FeedAdapter = {
  async fetchItems(source: NewsSourceRow): Promise<RawNewsItem[]> {
    const xml = await fetchFeedText(source)
    const parsed = parser.parse(xml) as {
      feed?: { entry?: AtomEntry | AtomEntry[] }
    }

    const rawEntries = toArray(parsed.feed?.entry).slice(0, source.max_items_per_scan)
    const results: RawNewsItem[] = []

    for (const entry of rawEntries) {
      const title = nodeText(entry.title)
      const url = extractLink(entry)
      if (!title || !url) {
        continue
      }
      const category = toArray(entry.category)[0]?.['@_term']
      results.push({
        title,
        url,
        summary: nodeText(entry.summary) ?? nodeText(entry.content),
        publishedAt: nodeText(entry.published) ?? nodeText(entry.updated),
        imageUrl: extractImage(entry),
        category: category ?? undefined,
        language: source.language ?? undefined,
      })
    }

    return results
  },
}
