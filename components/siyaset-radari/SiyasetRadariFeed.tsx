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
        <span className="text-xs text-ink-muted">Günlük tarama · Haftalık kapsamlı kontrol</span>
      </div>

      {items.length === 0 ? (
        <div className="mt-5 rounded-lg border border-dashed border-border bg-white px-6 py-12 text-center text-sm text-ink-secondary">
          Onaylanmış güncel akış kaydı henüz yok.
        </div>
      ) : (
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <article key={item.id} className="flex h-full flex-col rounded-lg border border-border bg-white p-5 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <Badge>{TOPIC_LABELS[item.topic] ?? 'Siyaset'}</Badge>
                <span className="text-xs text-ink-muted">{formatDate(item.publishedAt)}</span>
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
                  className="shrink-0 font-semibold text-rainbow-blue hover:underline"
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
