import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { RadarPageShell } from '@/components/siyaset-radari/RadarPageShell'
import { SiyasetRadariFeed } from '@/components/siyaset-radari/SiyasetRadariFeed'
import { fetchSiyasetRadariDashboard } from '@/lib/siyaset-radari/public-data'
import { getSiteUrl, siteConfig } from '@/lib/site'
import { legacyRadarTabPath } from '@/lib/siyaset-radari/tabs'

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

interface PageProps {
  searchParams: Promise<{ sekme?: string | string[] }>
}

export default async function SiyasetRadariPage({ searchParams }: PageProps) {
  const legacyPath = legacyRadarTabPath((await searchParams).sekme)
  if (legacyPath) {
    redirect(legacyPath)
  }

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
    <RadarPageShell
      title="Siyaset Radarı"
      description="Güncel siyasi içerikler, meclisteki sandalye dağılımı ve gazetecilere ilişkin özgürlük durumu kayıtları yalnız kaynaklı ve editoryal onaydan geçmiş haliyle yayınlanır."
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <SiyasetRadariFeed items={data.feedItems} />
    </RadarPageShell>
  )
}