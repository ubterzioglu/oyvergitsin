import type { Metadata } from 'next'
import { MeclisSection } from '@/components/siyaset-radari/MeclisSection'
import { RadarPageShell } from '@/components/siyaset-radari/RadarPageShell'
import { fetchSiyasetRadariDashboard } from '@/lib/siyaset-radari/public-data'

export const metadata: Metadata = {
  title: 'Mecliste Sandalye Dağılımı',
  description:
    "TBMM'deki güncel sandalye dağılımı ve bu dağılımı değiştiren parti geçişleri; kaynaklı ve doğrulama tarihli.",
  alternates: {
    canonical: '/siyaset-radari/meclis',
  },
}

export const dynamic = 'force-dynamic'

export default async function MeclisPage() {
  const data = await fetchSiyasetRadariDashboard()

  return (
    <RadarPageShell
      title="Mecliste Sandalye Dağılımı"
      description="TBMM'deki güncel sandalye dağılımı ve bu dağılımı değiştiren parti geçişleri."
    >
      <MeclisSection politicalEvents={data.politicalEvents} electionResults={data.electionResults} />
    </RadarPageShell>
  )
}
