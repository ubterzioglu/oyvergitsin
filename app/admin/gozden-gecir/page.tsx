import Link from 'next/link'
import { redirect } from 'next/navigation'
import { VerifyPositionButton } from '@/components/admin/VerifyPositionButton'
import { requireAdmin } from '@/lib/radar/admin-auth'
import { getAdminClient } from '@/lib/supabase/admin'
import { buildReviewQueue, getPositionMatrix, type StalePositionItem } from '@/lib/content-review/queries'
import { daysSince, PARTY_REVIEW_DAYS, POSITION_REVIEW_DAYS } from '@/lib/content-review/stale'

export const dynamic = 'force-dynamic'

function ageLabel(value: string | null): string {
  const days = daysSince(value)
  return days === null ? 'hiç doğrulanmadı' : `${days} gün önce`
}

function groupByParty(items: StalePositionItem[]): Array<{ partyName: string; items: StalePositionItem[] }> {
  const groups = new Map<string, { partyName: string; items: StalePositionItem[] }>()
  for (const item of items) {
    const group = groups.get(item.party.id) ?? { partyName: item.party.name, items: [] }
    groups.set(item.party.id, { ...group, items: [...group.items, item] })
  }
  return [...groups.values()]
}

export default async function ReviewQueuePage() {
  const auth = await requireAdmin()
  if (!auth.ok) {
    redirect('/admin/login')
  }

  const queue = buildReviewQueue(await getPositionMatrix(getAdminClient()))
  const groups = groupByParty(queue.positions)

  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold text-ink-primary">Gözden geçirilecekler</h1>
      <p className="mb-6 max-w-3xl text-sm text-ink-secondary">
        {POSITION_REVIEW_DAYS} günden uzun süredir doğrulanmamış parti konumları ve {PARTY_REVIEW_DAYS} günden
        uzun süredir kontrol edilmemiş parti kayıtları. Konum hâlâ geçerliyse <strong>Doğrulandı</strong> deyin;
        değiştiyse düzenleyip yeni kanıtla yayınlayın.
      </p>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-ink-primary">
          Parti konumları <span className="data-figure text-ink-secondary">({queue.positions.length})</span>
        </h2>
        {groups.length === 0 ? (
          <p className="rounded-card border border-dashed border-border bg-surface-card p-6 text-center text-sm text-ink-secondary">
            Gözden geçirilecek konum yok.
          </p>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => (
              <div key={group.partyName} className="overflow-hidden rounded-card border border-border bg-surface-card">
                <h3 className="border-b border-border bg-surface px-4 py-2 text-sm font-semibold text-ink-primary">
                  {group.partyName}
                </h3>
                <ul className="divide-y divide-border">
                  {group.items.map(({ position, party, axis }) => (
                    <li key={position.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 text-sm">
                      <span className="text-ink-primary">
                        {axis.name} <span className="data-figure text-ink-secondary">({position.score})</span>
                      </span>
                      <span className="flex items-center gap-3">
                        <span className="text-xs text-ink-secondary">{ageLabel(position.lastVerifiedAt)}</span>
                        <VerifyPositionButton positionId={position.id} />
                        <Link
                          href={`/admin/parties/${party.id}/positions/${axis.id}`}
                          className="text-xs font-semibold text-accent hover:text-accent-hover"
                        >
                          Düzenle
                        </Link>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-ink-primary">
          Parti kayıtları <span className="data-figure text-ink-secondary">({queue.parties.length})</span>
        </h2>
        {queue.parties.length === 0 ? (
          <p className="rounded-card border border-dashed border-border bg-surface-card p-6 text-center text-sm text-ink-secondary">
            Kontrolü eskimiş parti kaydı yok.
          </p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-card border border-border bg-surface-card">
            {queue.parties.map((party) => (
              <li key={party.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 text-sm">
                <span className="text-ink-primary">{party.name}</span>
                <span className="text-xs text-ink-secondary">
                  Kayıt durumu: {party.registryStatus ?? '—'} · son kontrol {ageLabel(party.registryCheckedAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs text-ink-muted">
          Parti durumunu (kapanma, eşleşmeden çıkarma) panelden güncelleme bir sonraki adımda eklenecek.
        </p>
      </section>
    </div>
  )
}
