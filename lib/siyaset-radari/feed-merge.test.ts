import { describe, expect, it } from 'vitest'
import { mergeFeedItems } from './feed-merge'
import type { DashboardFeedItem } from './public-data'

function item(id: string, articleUrl: string, publishedAt: string | null, discoveredAt = '2026-10-01T00:00:00Z'): DashboardFeedItem {
  return {
    id,
    topic: 'general_politics',
    title: id,
    description: null,
    sourceName: 'Kaynak',
    sourceUrl: null,
    articleUrl,
    publishedAt,
    discoveredAt,
  }
}

describe('mergeFeedItems', () => {
  it('aynı URL tekrarında ilk listedeki kaydı tutar', () => {
    const result = mergeFeedItems(
      [item('radar', 'https://a.test/1', '2026-10-05T10:00:00Z')],
      [item('news', 'https://a.test/1', '2026-10-05T10:00:00Z')]
    )
    expect(result.map((r) => r.id)).toEqual(['radar'])
  })

  it('iki kaynağı yeniden eskiye sıralar, tarih yoksa keşif tarihini kullanır', () => {
    const result = mergeFeedItems(
      [item('eski', 'https://a.test/1', '2026-10-01T10:00:00Z')],
      [
        item('yeni', 'https://a.test/2', '2026-10-09T10:00:00Z'),
        item('tarihsiz', 'https://a.test/3', null, '2026-10-05T00:00:00Z'),
      ]
    )
    expect(result.map((r) => r.id)).toEqual(['yeni', 'tarihsiz', 'eski'])
  })

  it('sonucu limite göre keser', () => {
    const many = Array.from({ length: 5 }, (_, i) => item(`n${i}`, `https://a.test/${i}`, `2026-10-0${i + 1}T00:00:00Z`))
    expect(mergeFeedItems([], many, 3)).toHaveLength(3)
  })
})
