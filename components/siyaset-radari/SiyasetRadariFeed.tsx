import { Badge } from '@/components/ui/Badge'
import type { DashboardFeedItem } from '@/lib/siyaset-radari/public-data'

const TOPIC_LABELS: Record<string, string> = {
  party_switch: 'Parti Geçişi',
  parliament: 'TBMM',
  press_freedom: 'Basın Özgürlüğü',
  election: 'Seçim',
  general_politics: 'Siyaset',
}

function formatDate(value: string | null): string {
  if (!value) {
    return 'Yayın tarihi belirtilmedi'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Yayın tarihi belirtilmedi'
  }
  return date.toLocaleString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function SiyasetRadariFeed({ items }: { items: DashboardFeedItem[] }) {
  return (
    <section className="mb-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl font-semibold text-ink-primary">Güncel Akış</h2>
          <p className="mt-1 text-sm text-ink-secondary">
            Otomatik bulunan içerikler kaynak kontrolünden ve editoryal onaydan sonra yayınlanır.
          </p>
        </div>
        <span className="data-figure text-xs text-ink-muted">Günlük tarama · Haftalık kapsamlı kontrol</span>
      </div>

      {items.length === 0 ? (
        <div className="mt-5 rounded-card border border-dashed border-border-strong bg-surface-muted px-6 py-12 text-center">
          <p className="text-sm font-medium text-ink-primary">Onaylanmış güncel akış kaydı henüz yok.</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-secondary">
            Otomatik tarama bulduğu içerikleri editoryal onaya düşürür; onaylanan kayıtlar burada
            kaynağı ve yayın tarihiyle görünür.
          </p>
        </div>
      ) : (
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="flex h-full flex-col rounded-card border border-border bg-surface-card p-5 transition-shadow hover:shadow-elevated"
            >
              <div className="flex items-center justify-between gap-3">
                <Badge>{TOPIC_LABELS[item.topic] ?? 'Siyaset'}</Badge>
                <span className="data-figure text-xs text-ink-muted">{formatDate(item.publishedAt)}</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold leading-6 text-ink-primary">{item.title}</h3>
              {item.description && (
                <p className="mt-3 line-clamp-4 text-sm leading-6 text-ink-secondary">{item.description}</p>
              )}
              <div className="mt-auto flex items-center justify-between gap-3 pt-5 text-sm">
                <span className="truncate text-ink-muted">{item.sourceName}</span>
                <a
                  href={item.articleUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="shrink-0 rounded-badge font-semibold text-accent underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                >
                  Kaynağa git
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
