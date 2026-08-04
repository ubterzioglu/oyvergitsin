import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/Badge'
import { Container } from '@/components/ui/Container'
import { fetchPersonDetail } from '@/lib/siyaset-radari/public-data'

interface Props {
  params: Promise<{ slug: string }>
}

export const dynamic = 'force-dynamic'

function formatDate(value: string | null): string {
  if (!value) {
    return 'Tarih yok'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Tarih yok'
  }
  return date.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })
}

function xSearchUrl(name: string, handle: string | null): string {
  if (handle) {
    return `https://x.com/${handle.replace(/^@/, '')}`
  }
  return `https://x.com/search?q=${encodeURIComponent(`"${name}"`)}&src=typed_query&f=live`
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const person = await fetchPersonDetail(slug)
  if (!person) {
    return { title: 'Kişi bulunamadı' }
  }

  return {
    title: person.fullName,
    description: `${person.fullName} için kaynaklı siyaset radarı kaydı.`,
    alternates: {
      canonical: `/siyaset-radari/kisi/${slug}`,
    },
  }
}

export default async function SiyasetRadariPersonPage({ params }: Props) {
  const { slug } = await params
  const person = await fetchPersonDetail(slug)
  if (!person) {
    notFound()
  }

  return (
    <main className="bg-white">
      <section className="border-b border-border bg-surface-muted py-10">
        <Container>
          <Link href="/siyaset-radari" className="text-sm font-semibold text-rainbow-blue">
            Siyaset Radarı
          </Link>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-heading text-4xl font-semibold text-ink-primary">{person.fullName}</h1>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge>{person.primaryRole}</Badge>
                {person.province && <Badge>{person.province}</Badge>}
                <Badge>Son doğrulama: {formatDate(person.lastVerifiedAt)}</Badge>
              </div>
            </div>
            <a
              href={xSearchUrl(person.fullName, person.xHandle)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-button bg-ink-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-ink-secondary"
            >
              {"X'te aç"}
            </a>
          </div>
          {person.bio && <p className="mt-5 max-w-3xl text-sm text-ink-secondary">{person.bio}</p>}
        </Container>
      </section>

      <section className="py-10">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-8">
              <section>
                <h2 className="font-heading text-2xl font-semibold text-ink-primary">Parti/Kurum Timeline</h2>
                <div className="mt-5 space-y-4">
                  {person.politicalEvents.length === 0 && person.journalistEvents.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border px-6 py-10 text-center text-sm text-ink-secondary">
                      Onaylanmış timeline kaydı yok.
                    </div>
                  ) : (
                    <>
                      {person.politicalEvents.map((event) => (
                        <article key={event.id} className="rounded-lg border border-border bg-white p-5 shadow-soft">
                          <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                            {formatDate(event.happenedOn)}
                          </div>
                          <h3 className="mt-1 text-base font-semibold text-ink-primary">
                            {event.fromPartyName ?? '—'} {'->'} {event.toPartyName ?? 'Bağımsız'}
                          </h3>
                          {event.summary && <p className="mt-2 text-sm text-ink-secondary">{event.summary}</p>}
                          <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm text-rainbow-blue">
                            {event.sourceName}
                          </a>
                        </article>
                      ))}
                      {person.journalistEvents.map((event) => (
                        <article key={event.id} className="rounded-lg border border-border bg-white p-5 shadow-soft">
                          <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                            {formatDate(event.lastVerifiedAt)}
                          </div>
                          <h3 className="mt-1 text-base font-semibold text-ink-primary">
                            {event.statusLabel}{event.outlet ? ` · ${event.outlet}` : ''}
                          </h3>
                          <p className="mt-2 text-sm text-ink-secondary">{event.jobTitle ?? 'Görev bilgisi yok'}</p>
                          <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm text-rainbow-blue">
                            {event.sourceName}
                          </a>
                        </article>
                      ))}
                    </>
                  )}
                </div>
              </section>
            </div>

            <aside className="rounded-lg border border-border bg-white p-5 shadow-soft">
              <h2 className="text-base font-semibold text-ink-primary">Kanıtlar</h2>
              <div className="mt-4 space-y-4">
                {person.evidence.length === 0 ? (
                  <p className="text-sm text-ink-secondary">Onaylanmış kanıt bağlantısı yok.</p>
                ) : (
                  person.evidence.map((evidence) => (
                    <div key={evidence.id} className="border-b border-border pb-4 last:border-b-0">
                      <div className="text-xs font-semibold uppercase text-ink-muted">{evidence.sourceType}</div>
                      <a href={evidence.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-1 block text-sm font-semibold text-rainbow-blue">
                        {evidence.title ?? evidence.sourceName}
                      </a>
                      {evidence.excerpt && <p className="mt-2 text-sm text-ink-secondary">{evidence.excerpt}</p>}
                      <p className="mt-2 text-xs text-ink-muted">{formatDate(evidence.publishedAt ?? evidence.capturedAt)}</p>
                    </div>
                  ))
                )}
              </div>
            </aside>
          </div>
        </Container>
      </section>
    </main>
  )
}
