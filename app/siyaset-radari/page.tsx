import type { Metadata } from 'next'
import { Container } from '@/components/ui/Container'
import { SiyasetRadariDashboard } from '@/components/siyaset-radari/SiyasetRadariDashboard'
import { fetchSiyasetRadariDashboard } from '@/lib/siyaset-radari/public-data'

export const metadata: Metadata = {
  title: 'Siyaset Radarı',
  description:
    'Parti geçişleri, il bazlı siyasi durum ve tutuklu/hükümlü gazeteci kayıtlarını kaynaklı ve doğrulama tarihli şekilde izleyin.',
  alternates: {
    canonical: '/siyaset-radari',
  },
}

export const dynamic = 'force-dynamic'

export default async function SiyasetRadariPage() {
  const data = await fetchSiyasetRadariDashboard()

  return (
    <main className="bg-white">
      <section className="border-b border-border bg-surface-muted py-12">
        <Container>
          <div className="max-w-3xl">
            <h1 className="font-heading text-4xl font-semibold text-ink-primary">Siyaset Radarı</h1>
            <p className="mt-4 text-base text-ink-secondary">
              Parti değiştiren siyasetçiler, il bazlı dağılımlar ve gazetecilere ilişkin özgürlük
              durumu kayıtları yalnız kaynaklı ve editoryal onaydan geçmiş haliyle yayınlanır.
            </p>
          </div>
        </Container>
      </section>

      <section className="py-10">
        <Container>
          <SiyasetRadariDashboard
            politicalEvents={data.politicalEvents}
            journalistEvents={data.journalistEvents}
            electionResults={data.electionResults}
          />
        </Container>
      </section>
    </main>
  )
}
