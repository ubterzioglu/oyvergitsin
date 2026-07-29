'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from 'recharts'
import { getPartyColor } from '@/lib/parties'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Container } from '@/components/ui/Container'

interface Result {
  axisScores: Record<string, number>
  partySimilarities: Record<string, number>
  axes: Array<{
    axisId: string
    axisName: string
    score: number
  }>
  parties: Array<{
    partyId: string
    partyName: string
    partyShortName: string
    similarity: number
  }>
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

  const radarData = axes.map(axis => ({
    axis: axis.axisName.split(':')[0],
    score: axis.score
  }))

  const topMatch = parties[0]

  return (
    <div className="min-h-screen bg-surface px-4 py-12">
      <Container>
        <h1 className="mb-8 text-center font-heading text-4xl font-semibold text-ink-primary">
          Sonuçlarınız
        </h1>

        <Card elevated className="mb-8">
          <h2 className="mb-4 font-heading text-2xl font-semibold text-ink-primary">En Uyumlu Partiniz</h2>
          {topMatch && (
            <div className="flex items-center gap-6">
              <div
                className="flex h-24 w-24 items-center justify-center rounded-full text-2xl font-bold text-white"
                style={{ backgroundColor: getPartyColor(topMatch.partyShortName) }}
              >
                {topMatch.partyShortName}
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-ink-primary">{topMatch.partyName}</h3>
                <p className="text-ink-secondary">
                  {getMatchExplanation(topMatch, axes)}
                </p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold" style={{ color: getPartyColor(topMatch.partyShortName) }}>
                  %{topMatch.similarity}
                </div>
                <div className="text-ink-secondary">Eşleşme</div>
              </div>
            </div>
          )}
        </Card>

        <div className="mb-8 grid gap-8 md:grid-cols-2">
          <Card elevated>
            <h2 className="mb-4 font-heading text-2xl font-semibold text-ink-primary">Eksen Skorları</h2>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="axis" />
                <PolarRadiusAxis domain={[-100, 100]} tick={{ fontSize: 10 }} />
                <Radar
                  name="Skor"
                  dataKey="score"
                  stroke="#1B2A4A"
                  fill="#1B2A4A"
                  fillOpacity={0.6}
                />
              </RadarChart>
            </ResponsiveContainer>
          </Card>

          <Card elevated>
            <h2 className="mb-4 font-heading text-2xl font-semibold text-ink-primary">Parti Eşleşmeleri</h2>
            <div className="space-y-3">
              {parties.map((party, index) => (
                <div
                  key={party.partyId}
                  className="flex items-center justify-between rounded-lg border-2 border-border p-4 transition-all hover:border-border-strong"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-lg font-bold text-ink-muted">#{index + 1}</div>
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: getPartyColor(party.partyShortName) }}
                    >
                      {party.partyShortName}
                    </div>
                    <span className="font-medium text-ink-primary">{party.partyName}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold" style={{ color: getPartyColor(party.partyShortName) }}>
                      %{party.similarity}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

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

function getMatchExplanation(party: any, axes: any[]): string {
  const topAxes = [...axes]
    .sort((a, b) => Math.abs(b.score) - Math.abs(a.score))
    .slice(0, 2)

  if (topAxes.length === 0) {
    return `Sizin görüşleriniz ${party.partyName} ile ${party.similarity}% benzerlik gösteriyor.`
  }

  const axisNames = topAxes.map(a => a.axisName).join(' ve ')
  return `Sizin görüşleriniz ${party.partyName} ile ${party.similarity}% benzerlik gösteriyor. Özellikle ${axisNames} konularında benzer yaklaşım sergiliyorsunuz.`
}
