import type { DashboardFeedItem } from './public-data'

const FEED_LIMIT = 60

// İki kaynağı (radar_feed_items + news_posts) aynı haber URL'sinde tekilleştirip yeniden eskiye sıralar.
// Çakışmada ilk listedeki kayıt kalır.
export function mergeFeedItems(
  primary: DashboardFeedItem[],
  secondary: DashboardFeedItem[],
  limit = FEED_LIMIT
): DashboardFeedItem[] {
  const seen = new Set<string>()
  const merged: DashboardFeedItem[] = []
  for (const item of [...primary, ...secondary]) {
    if (seen.has(item.articleUrl)) {
      continue
    }
    seen.add(item.articleUrl)
    merged.push(item)
  }
  const sortKey = (item: DashboardFeedItem) => new Date(item.publishedAt ?? item.discoveredAt).getTime() || 0
  return merged.sort((a, b) => sortKey(b) - sortKey(a)).slice(0, limit)
}
