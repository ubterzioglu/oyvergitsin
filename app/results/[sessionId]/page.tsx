'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from 'recharts'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Container } from '@/components/ui/Container'
import { CoverageBadge } from '@/components/results/CoverageBadge'
import { MatchReasons } from '@/components/results/MatchReasons'
import { PartyBadge } from '@/components/results/PartyBadge'
import type { CoverageTier } from '@/lib/scoring/types'

// Metodoloji raporu §9: ilk sonuçlar birbirine bu kadar yakınsa tek bir
// "kazanan" göstermek sahte kesinlik yaratır.
const CLOSE_MATCH_MARGIN = 3

// <Link> içine sarılı <Button> için odak halkası; halkayı odağı gerçekten
// alan <a> öğesine taşır.
const LINK_BUTTON_FOCUS =
  'inline-flex rounded-button focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2'

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
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div role="status" className="text-ink-secondary">
          Sonuçlar yükleniyor...
        </div>
      </div>
    )
  }

  if (!result || errorMessage) {
    // Hata kutusu ham Tailwind paletini kullanıyordu (red-50/200/700) — tasarım
    // sisteminin dışında kalan tek yerdi ve "Kamusal Ekran" grafit kabuğunda
    // yabancı duruyordu. Token'lara alındı; hata bilgisi renkle değil
    // role="alert" ve metnin kendisiyle taşınıyor.
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface px-4">
        <div
          role="alert"
          className="w-full max-w-xl rounded-card border border-border-strong bg-surface-card p-6 text-center shadow-soft"
        >
          <p className="text-sm text-ink-primary">{errorMessage || 'Sonuç bulunamadı.'}</p>
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
          <Card className="mb-8 border-l-4 border-l-border-strong">
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
              <PartyBadge shortName={topMatch.partyShortName} size="lg" />
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-ink-primary">{topMatch.partyName}</h3>
                <p className="text-sm text-ink-secondary">
                  <span className="data-figure">{topMatch.axesUsed}</span> eksen üzerinden
                  hesaplandı.
                </p>
              </div>
              {/*
                Yüzde rakamı eskiden parti renginde yazılıyordu. İki sorun vardı:
                (1) Okunabilirlik — parti rengi beyaz kartın üstünde AKP 2.28,
                    MHP 1.82, Memleket 1.48 veriyordu; 3:1'in bile altı.
                (2) Anlam — bu rakam kullanıcının kendi hesaplanmış skoru, parti
                    verisi değil. Yön kararı rengi yalnızca parti verisine
                    bırakıyor. Parti kimliği zaten rozette taşınıyor.
                ink-primary ile kontrast 17.13.
              */}
              <div className="text-right">
                <div className="data-figure text-4xl font-bold text-ink-primary">
                  %{topMatch.similarity}
                </div>
                <div className="text-sm text-ink-secondary">politika görüşü benzerliği</div>
              </div>
            </div>

            {isClose && (
              <p className="mt-6 rounded-card border border-border bg-accent-tint px-4 py-3 text-sm text-ink-primary">
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
                  {/* B10 — kapsam istisnası; yalnızca renk değeri nötrleştirildi
                      (eski #1E9BE0 Gelecek Partisi mavisinden 5.5° uzaktaydı).
                      Bu kullanıcının kendi skoru, bir parti verisi değil —
                      bu yüzden accent petrol doğru seçim. Yapı B15'e ait. */}
                  <Radar name="Skor" dataKey="score" stroke="#0E6E7D" fill="#0E6E7D" fillOpacity={0.45} />
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
                    <span
                      className={`font-semibold text-ink-primary ${axis.score === null ? '' : 'data-figure'}`}
                    >
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
                  className="flex items-center justify-between gap-3 rounded-card border border-border p-4 transition-all duration-300 hover:border-border-strong hover:shadow-soft"
                >
                  <div className="flex items-center gap-3">
                    {/* Sıra numarası ve yüzde veri: mono + tabular, satırlar hizalanır. */}
                    <div className="data-figure text-lg font-bold text-ink-muted">
                      #{index + 1}
                    </div>
                    <PartyBadge shortName={party.partyShortName} size="sm" />
                    <span className="font-medium text-ink-primary">{party.partyName}</span>
                  </div>
                  <div className="data-figure shrink-0 text-xl font-bold text-ink-primary">
                    %{party.similarity}
                  </div>
                </div>
              ))}
            </div>

            {unpositioned.length > 0 && (
              <div className="mt-6 border-t border-border pt-4">
                <p className="mb-2 text-sm font-medium text-ink-secondary">
                  Sıralamaya girmeyen partiler
                </p>
                <p className="mb-3 text-xs text-ink-muted">
                  Bu partiler için yayımlanmış kaynaklardan yeterli sayıda eksende konum
                  kodlanamadı. Sıfır puan almıyorlar; az sayıda eksen üzerinden hesaplanan bir
                  yüzde yanıltıcı olacağı için karşılaştırma dışı bırakılıyorlar.
                </p>
                <ul className="flex flex-wrap gap-2">
                  {unpositioned.map((party) => (
                    <li
                      key={party.partyId}
                      className="rounded-full border border-border px-3 py-1 text-xs text-ink-secondary"
                    >
                      {party.partyName}
                      {party.axesUsed > 0 && (
                        <span className="ml-1 text-ink-muted">
                          (<span className="data-figure">
                            {party.axesUsed}/{axes.length}
                          </span>{' '}
                          eksen)
                        </span>
                      )}
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

        {/*
          Odak halkası düzeltmesi (devir belgesi §6.2): Tab odağı dıştaki <a>
          öğesine gidiyor ama halka <button> üzerinde tanımlıydı — klavye
          kullanıcısı odağın nerede olduğunu göremiyordu. Halka odağı gerçekten
          alan öğeye taşındı, buton odak sırasından çıkarıldı.
        */}
        <div className="flex justify-center gap-4">
          <Link href="/" className={LINK_BUTTON_FOCUS}>
            <Button variant="primary" tabIndex={-1}>
              Ana Sayfa
            </Button>
          </Link>
          <Link
            href="/survey"
            onClick={() => localStorage.removeItem('sessionId')}
            className={LINK_BUTTON_FOCUS}
          >
            <Button variant="secondary" tabIndex={-1}>
              Yeni Anket
            </Button>
          </Link>
        </div>
      </Container>
    </div>
  )
}
