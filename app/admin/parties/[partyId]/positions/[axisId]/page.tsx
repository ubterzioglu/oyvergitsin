import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { PositionEditor } from '@/components/admin/PositionEditor'
import { requireAdmin } from '@/lib/radar/admin-auth'
import { getAdminClient } from '@/lib/supabase/admin'
import { getPositionEditorData } from '@/lib/content-review/queries'
import { daysSince, isPositionStale, POSITION_REVIEW_DAYS } from '@/lib/content-review/stale'

export const dynamic = 'force-dynamic'

const ACTION_LABELS: Record<string, string> = {
  publish: 'Yayın',
  verify: 'Doğrulama',
  seed: 'Script',
}

function formatDateTime(value: string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })
}

function scoreChange(changes: Record<string, unknown>): string | null {
  const score = changes.score as { from?: number | null; to?: number | null } | undefined
  if (!score || score.from === score.to) return null
  return `${score.from ?? '—'} → ${score.to ?? '—'}`
}

interface PageProps {
  params: Promise<{ partyId: string; axisId: string }>
}

export default async function PositionEditPage({ params }: PageProps) {
  const auth = await requireAdmin()
  if (!auth.ok) {
    redirect('/admin/login')
  }

  const { partyId, axisId } = await params
  const data = await getPositionEditorData(getAdminClient(), partyId, axisId)
  if (!data) {
    notFound()
  }

  const { party, axis, position, evidence, history } = data
  const stale = position ? isPositionStale(position.lastVerifiedAt) : false
  const age = position ? daysSince(position.lastVerifiedAt) : null

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/admin/parties" className="text-sm font-semibold text-accent hover:text-accent-hover">
        ← Partiler
      </Link>
      <h1 className="mt-3 text-3xl font-bold text-ink-primary">
        {party.name} · {axis.name}
      </h1>
      {(axis.poleNegative || axis.polePositive) && (
        <p className="mt-1 text-sm text-ink-secondary">
          −100: {axis.poleNegative ?? '—'} · +100: {axis.polePositive ?? '—'}
        </p>
      )}

      <dl className="mt-4 grid gap-3 rounded-card border border-border bg-surface-card p-4 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs text-ink-secondary">Mevcut puan</dt>
          <dd className="data-figure text-lg font-semibold text-ink-primary">{position?.score ?? 'Konum yok'}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-secondary">Son değişiklik</dt>
          <dd className="text-ink-primary">{formatDateTime(position?.updatedAt ?? null)}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-secondary">Son doğrulama</dt>
          <dd className="text-ink-primary">
            {formatDateTime(position?.lastVerifiedAt ?? null)}
            {stale && (
              <span className="ml-2 rounded-badge bg-ink-primary px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                {age === null ? 'Doğrulanmamış' : `${age} gün`} · {POSITION_REVIEW_DAYS}+ gün
              </span>
            )}
          </dd>
        </div>
      </dl>

      <div className="mt-6">
        {/* Her yeni sunucu sürümünde editör sıfırdan kurulur: yayın sonrası eski notlar yeni değişikliğe taşınmasın. */}
        <PositionEditor
          key={`${position?.updatedAt ?? 'new'}:${position?.lastVerifiedAt ?? ''}`}
          partyId={party.id}
          axisId={axis.id}
          positionId={position?.id ?? null}
          updatedAt={position?.updatedAt ?? null}
          initialScore={position?.score ?? null}
          initialEvidence={evidence}
        />
      </div>

      <section className="mt-10">
        <h2 className="mb-3 text-sm font-semibold text-ink-primary">Son değişiklikler</h2>
        {history.length === 0 ? (
          <p className="text-sm text-ink-secondary">
            Panelden yapılmış değişiklik yok. Bu konum ilk olarak script ile yüklendi.
          </p>
        ) : (
          <ol className="space-y-2">
            {history.map((entry) => (
              <li key={entry.id} className="rounded-card border border-border bg-surface-card p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2 text-ink-primary">
                  <span className="font-semibold">{ACTION_LABELS[entry.action] ?? entry.action}</span>
                  <span className="text-ink-secondary">{formatDateTime(entry.createdAt)}</span>
                  {scoreChange(entry.changes) && <span className="data-figure">{scoreChange(entry.changes)}</span>}
                  {entry.isPublic && entry.action === 'publish' && (
                    <span className="rounded-badge bg-accent-tint px-2 py-0.5 text-[10px] font-semibold text-accent">herkese açık</span>
                  )}
                </div>
                {entry.note && <p className="mt-1 text-ink-secondary">{entry.note}</p>}
                {entry.publicNote && <p className="mt-1 text-ink-secondary">Kamu notu: {entry.publicNote}</p>}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}
