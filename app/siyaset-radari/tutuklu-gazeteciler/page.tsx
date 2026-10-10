import type { Metadata } from 'next'
import { JournalistsTable } from '@/components/siyaset-radari/JournalistsTable'
import { RadarPageShell } from '@/components/siyaset-radari/RadarPageShell'
import { fetchSiyasetRadariDashboard } from '@/lib/siyaset-radari/public-data'

export const metadata: Metadata = {
  title: 'Tutuklu Gazeteciler',
  description:
    'Tutuklu ve hükümlü gazetecilere ilişkin özgürlük durumu kayıtları; her kayıt kaynaklı ve doğrulama tarihlidir.',
  alternates: {
    canonical: '/siyaset-radari/tutuklu-gazeteciler',
  },
}

export const dynamic = 'force-dynamic'

export default async function TutukluGazetecilerPage() {
  const data = await fetchSiyasetRadariDashboard()

  return (
    <RadarPageShell
      title="Tutuklu Gazeteciler"
      description="Tutuklu ve hükümlü gazetecilere ilişkin özgürlük durumu kayıtları, kaynağı ve son doğrulama tarihiyle."
    >
      <JournalistsTable journalistEvents={data.journalistEvents} />
    </RadarPageShell>
  )
}
