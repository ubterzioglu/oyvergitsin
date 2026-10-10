import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/siyaset-radari/EmptyState'
import { formatRadarDate } from '@/lib/siyaset-radari/format'
import type { DashboardJournalistEvent } from '@/lib/siyaset-radari/public-data'

/** /siyaset-radari/tutuklu-gazeteciler: onaylı gazeteci durum kayıtları tablosu. */
export function JournalistsTable({ journalistEvents }: { journalistEvents: DashboardJournalistEvent[] }) {
  return (
    <section>
      <div className="mt-5 overflow-hidden rounded-lg border border-border bg-white shadow-soft">
        {journalistEvents.length === 0 ? (
          <EmptyState>Onaylanmış gazeteci durum kaydı henüz yok.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-surface-muted text-ink-secondary">
                <tr>
                  <th className="px-4 py-3 font-semibold">Ad Soyad</th>
                  <th className="px-4 py-3 font-semibold">Kurum</th>
                  <th className="px-4 py-3 font-semibold">Görev</th>
                  <th className="px-4 py-3 font-semibold">Statü</th>
                  <th className="px-4 py-3 font-semibold">Kaynak</th>
                  <th className="px-4 py-3 font-semibold">Doğrulama</th>
                </tr>
              </thead>
              <tbody>
                {journalistEvents.map((event) => (
                  <tr key={event.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <Link href={`/siyaset-radari/kisi/${event.personSlug}`} className="font-medium text-ink-primary hover:text-accent">
                        {event.fullName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-ink-secondary">{event.outlet ?? '—'}</td>
                    <td className="px-4 py-3 text-ink-secondary">{event.jobTitle ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Badge>{event.statusLabel}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-accent">
                        {event.sourceName}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-ink-secondary">
                      <div>{formatRadarDate(event.lastVerifiedAt)}</div>
                      {event.isStale && <span className="text-xs font-semibold text-ink-secondary">Tekrar doğrulanmalı</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
