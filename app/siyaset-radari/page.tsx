import type { Metadata } from 'next'
import { Container } from '@/components/ui/Container'
import { SiyasetRadariDashboard } from '@/components/siyaset-radari/SiyasetRadariDashboard'
import { SiyasetRadariFeed } from '@/components/siyaset-radari/SiyasetRadariFeed'
import { fetchSiyasetRadariDashboard } from '@/lib/siyaset-radari/public-data'
import { getSiteUrl, siteConfig } from '@/lib/site'

// lib/siyaset-radari/scan.ts içindeki aynı sabitin kopyası. Orayı dışa
// aktarmak daha temiz olurdu ama o dosya TBMM parser batch'inin sahipliğinde;
// iki batch aynı dosyaya dokunmasın diye burada yerel tutuluyor.
const TBMM_SEAT_DISTRIBUTION_URL = 'https://www.tbmm.gov.tr/sandalyedagilimi'

export const metadata: Metadata = {
  title: 'Siyaset Radarı',
  description:
    'Güncel siyasi haber akışı, parti geçişleri, il bazlı siyasi durum ve gazetecilere ilişkin özgürlük kayıtlarını kaynaklı ve doğrulama tarihli şekilde izleyin.',
  alternates: {
    canonical: '/siyaset-radari',
  },
}

export const dynamic = 'force-dynamic'

/**
 * Radar verisi için Dataset JSON-LD.
 *
 * Bu sayfanın değeri kaynaklı ve doğrulama tarihli olması. Üretken arama
 * motorlarının bir kaydı alıntılarken "ne zaman doğrulandı, kaynağı ne"
 * sorusuna cevap bulabilmesi için `dateModified` ve `isBasedOn` alanları
 * veriden türetiliyor — sabit tarih yazılmıyor.
 */
function buildRadarStructuredData(
  siteUrl: string,
  verificationDates: (string | null)[],
  sourceUrls: string[]
) {
  const pageUrl = `${siteUrl}/siyaset-radari`

  const latestVerifiedAt = verificationDates
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1)

  // Aynı kaynağın onlarca kaydı olabiliyor; isBasedOn listesi tekilleştirilir.
  const distinctSources = Array.from(new Set(sourceUrls.filter(Boolean))).slice(0, 25)

  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    '@id': `${pageUrl}#dataset`,
    name: 'Siyaset Radarı — parti geçişleri, TBMM sandalye dağılımı ve gazeteci özgürlüğü kayıtları',
    description:
      'Parti değiştiren siyasetçiler, TBMM sandalye dağılımı, il bazlı seçim sonuçları ve gazetecilere ilişkin özgürlük durumu kayıtları; her kayıt kaynaklı ve doğrulama tarihlidir.',
    url: pageUrl,
    inLanguage: siteConfig.language,
    isAccessibleForFree: true,
    creator: { '@id': `${siteUrl}/#organization` },
    ...(latestVerifiedAt ? { dateModified: latestVerifiedAt } : {}),
    isBasedOn: [TBMM_SEAT_DISTRIBUTION_URL, ...distinctSources]
  }
}

export default async function SiyasetRadariPage() {
  const data = await fetchSiyasetRadariDashboard()

  const structuredData = buildRadarStructuredData(
    getSiteUrl(),
    [
      ...data.politicalEvents.map((event) => event.lastVerifiedAt),
      ...data.journalistEvents.map((event) => event.lastVerifiedAt),
      ...data.electionResults.map((result) => result.lastVerifiedAt)
    ],
    [
      ...data.politicalEvents.map((event) => event.sourceUrl),
      ...data.journalistEvents.map((event) => event.sourceUrl),
      ...data.electionResults.map((result) => result.sourceUrl)
    ].filter((url): url is string => Boolean(url))
  )

  return (
    <main className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <section className="border-b border-border bg-surface-muted py-12">
        <Container>
          <div className="max-w-3xl">
            <h1 className="font-heading text-4xl font-semibold text-ink-primary">Siyaset Radarı</h1>
            <p className="mt-4 text-base text-ink-secondary">
              Güncel siyasi içerikler, parti değiştiren siyasetçiler, il bazlı dağılımlar ve
              gazetecilere ilişkin özgürlük durumu kayıtları yalnız kaynaklı ve editoryal onaydan
              geçmiş haliyle yayınlanır.
            </p>
          </div>
        </Container>
      </section>

      <section className="py-10">
        <Container>
          <SiyasetRadariFeed items={data.feedItems} />
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
