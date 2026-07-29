'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from 'recharts'
import { getPartyColor } from '@/lib/parties'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Container } from '@/components/ui/Container'
import { CoverageBadge } from '@/components/results/CoverageBadge'
import { MatchReasons } from '@/components/results/MatchReasons'
import type { CoverageTier } from '@/lib/scoring/types'

// Metodoloji raporu §9: ilk sonuçlar birbirine bu kadar yakınsa tek bir
// "kazanan" göstermek sahte kesinlik yaratır.
const CLOSE_MATCH_MARGIN = 3

interface AxisComparison {
  axisId: string
  axisName: string
  userScore: number
  partyScore: number
  impact: number
  weight: number
}

interface ResultAxis {
  axisId: string
  axisName: string
  slug: string
  poleNegative: string | null
  polePositive: string | null
  score: number | null
  coverage: number
  tier: CoverageTier
  answeredItems: number
  totalItems: number
  excludedFromMatching: boolean
}

interface ResultParty {
  partyId: string
  partyName: string
  partyShortName: string
  similarity: number | null
  axesUsed: number
  agreements: AxisComparison[]
  disagreements: AxisComparison[]
}

interface Result {
  algorithmVersion: number
  axisScores: Record<string, number | null>
  partySimilarities: Record<string, number | null>
  axes: ResultAxis[]
  parties: ResultParty[]
}

export default function ResultsPage() {
  const params = useParams()
  const router = useRouter()
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const sessionId = String(params.sessionId ?? '')

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await fetch(`/api/results/${sessionId}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Sonuçlar alınamadı.')
        }

        setResult(data)
      } catch (error) {
        console.error('Error fetching results:', error)
        setErrorMessage(
          error instanceof Error ? error.message : 'Sonuçlar alınamadı. Lütfen tekrar deneyin.'
        )
      } finally {
        setLoading(false)
      }
    }

    if (sessionId) {
      fetchResults()
    } else {
      router.push('/consent')
    }
  }, [router, sessionId])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-ink-secondary">Sonuçlar yükleniyor...</div>
      </div>
    )
  }

  if (!result || errorMessage) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-xl rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-700">{errorMessage || 'Sonuç bulunamadı.'}</p>
        </div>
      </div>
    )
  }

  // Sunucu yanıtı beklenen dizileri içermezse sayfa çökmek yerine boş görünmeli.
  const axes = result.axes ?? []
  const parties = result.parties ?? []
  const isLegacy = (result.algorithmVersion ?? 1) < 2

  // Konumlandırılmamış partiler (similarity === null) sıralamaya girmez;
  // "0" göstermek "tamamen zıt" anlamına gelirdi.
  const ranked = parties.filter((party) => party.similarity !== null)
  const unpositioned = parties.filter((party) => party.similarity === null)

  // Skoru olmayan eksen radar grafiğinde 0 gibi görünmemeli.
  const radarData = axes
    .filter((axis) => axis.score !== null)
    .map((axis) => ({ axis: axis.axisName.split(':')[0], score: axis.score }))

  const topMatch = ranked[0]
  const isClose =
    ranked.length > 1 &&
    topMatch?.similarity !== null &&
    topMatch !== undefined &&
    (topMatch.similarity as number) - (ranked[Math.min(2, ranked.length - 1)].similarity as number) <=
      CLOSE_MATCH_MARGIN

  const lowCoverageAxes = axes.filter((axis) => axis.excludedFromMatching && axis.totalItems > 0)

  return (
    <div className="min-h-screen bg-surface px-4 py-12">
      <Container>
        <h1 className="mb-2 text-center font-heading text-4xl font-semibold text-ink-primary">
          Sonuçlarınız
        </h1>
        <p className="mb-8 text-center text-sm text-ink-secondary">
          Bu sonuç bir oy verme tavsiyesi değil, politika görüşlerinizin partilerin
          kayıtlı konumlarıyla ne kadar örtüştüğünün ölçüsüdür.{' '}
          <Link href="/metodoloji" className="underline">
            Yöntemi okuyun
          </Link>
          .
        </p>

        {isLegacy && (
          <Card className="mb-8 border-l-4 border-l-rainbow-orange">
            <p className="text-sm text-ink-secondary">
              Bu sonuç önceki metodoloji sürümüyle hesaplandı ve yeni soru setiyle karşılaştırılamaz.
              Güncel sonucunuz için anketi yeniden doldurabilirsiniz.
            </p>
          </Card>
        )}

        {topMatch && (
          <Card elevated className="mb-8">
            <h2 className="mb-4 font-heading text-2xl font-semibold text-ink-primary">
              En Yüksek Örtüşme
            </h2>
            <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
              <div
                className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full text-2xl font-bold text-white"
                style={{ backgroundColor: getPartyColor(topMatch.partyShortName) }}
              >
                {topMatch.partyShortName}
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-ink-primary">{topMatch.partyName}</h3>
                <p className="text-sm text-ink-secondary">
                  {topMatch.axesUsed} eksen üzerinden hesaplandı.
                </p>
              </div>
              <div className="text-right">
                <div
                  className="text-4xl font-bold"
                  style={{ color: getPartyColor(topMatch.partyShortName) }}
                >
                  %{topMatch.similarity}
                </div>
                <div className="text-sm text-ink-secondary">politika görüşü benzerliği</div>
              </div>
            </div>

            {isClose && (
              <p className="mt-6 rounded-lg bg-rainbow-yellow-tint px-4 py-3 text-sm text-ink-primary">
                İlk sıradaki sonuçlar birbirine çok yakın. Aradaki fark, soru setindeki küçük
                değişikliklerle yer değiştirebilecek kadar küçüktür; tek bir parti seçimi olarak
                okumayın.
              </p>
            )}
          </Card>
        )}

        <div className="mb-8 grid gap-8 md:grid-cols-2">
          <Card elevated>
            <h2 className="mb-1 font-heading text-2xl font-semibold text-ink-primary">Eksen Skorları</h2>
            <p className="mb-4 text-sm text-ink-secondary">
              Açıklayıcı görseldir; sekiz ekseni tek bakışta özetler, sıralamayı belirlemez.
            </p>
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={360}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis domain={[-100, 100]} tick={{ fontSize: 10 }} />
                  <Radar name="Skor" dataKey="score" stroke="#1E9BE0" fill="#1E9BE0" fillOpacity={0.5} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-ink-secondary">
                Hiçbir eksende puanlanabilir cevap bulunmadığı için grafik gösterilemiyor.
              </p>
            )}

            <ul className="mt-4 space-y-2">
              {axes.map((axis) => (
                <li key={axis.axisId} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-ink-secondary">{axis.axisName}</span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="font-semibold text-ink-primary">
                      {axis.score === null ? 'veri yok' : axis.score}
                    </span>
                    <CoverageBadge
                      tier={axis.tier}
                      answered={axis.answeredItems}
                      total={axis.totalItems}
                    />
                  </span>
                </li>
              ))}
            </ul>

            {lowCoverageAxes.length > 0 && (
              <p className="mt-4 text-xs text-ink-muted">
                Yeterli cevap verilmediği için eşleşmeye dahil edilmeyen eksenler:{' '}
                {lowCoverageAxes.map((axis) => axis.axisName).join(', ')}.
              </p>
            )}
          </Card>

          <Card elevated>
            <h2 className="mb-4 font-heading text-2xl font-semibold text-ink-primary">
              Parti Eşleşmeleri
            </h2>
            <div className="space-y-3">
              {ranked.map((party, index) => (
                <div
                  key={party.partyId}
                  className="flex items-center justify-between rounded-lg border-2 border-border p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-lg font-bold text-ink-muted">#{index + 1}</div>
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: getPartyColor(party.partyShortName) }}
                    >
                      {party.partyShortName}
                    </div>
                    <span className="font-medium text-ink-primary">{party.partyName}</span>
                  </div>
                  <div
                    className="text-xl font-bold"
                    style={{ color: getPartyColor(party.partyShortName) }}
                  >
                    %{party.similarity}
                  </div>
                </div>
              ))}
            </div>

            {unpositioned.length > 0 && (
              <div className="mt-6 border-t border-border pt-4">
                <p className="mb-2 text-sm font-medium text-ink-secondary">
                  Konumlandırılmamış partiler
                </p>
                <p className="mb-3 text-xs text-ink-muted">
                  Bu partiler için yayımlanmış yeterli kaynak bulunmadığından eksen konumları
                  kodlanmadı. Sıfır puan almıyorlar; karşılaştırma dışı bırakılıyorlar.
                </p>
                <ul className="flex flex-wrap gap-2">
                  {unpositioned.map((party) => (
                    <li
                      key={party.partyId}
                      className="rounded-full border border-border px-3 py-1 text-xs text-ink-secondary"
                    >
                      {party.partyName}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        </div>

        {topMatch && (topMatch.agreements.length > 0 || topMatch.disagreements.length > 0) && (
          <MatchReasons party={topMatch} className="mb-8" />
        )}

        <div className="flex justify-center gap-4">
          <Link href="/">
            <Button variant="primary">Ana Sayfa</Button>
          </Link>
          <Link href="/survey" onClick={() => localStorage.removeItem('sessionId')}>
            <Button variant="secondary">Yeni Anket</Button>
          </Link>
        </div>
      </Container>
    </div>
  )
}
