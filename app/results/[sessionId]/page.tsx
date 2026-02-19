'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from 'recharts'

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

  useEffect(() => {
    fetchResults()
  }, [params.sessionId])

  const fetchResults = async () => {
    try {
      const response = await fetch(`/api/results/${params.sessionId}`)
      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error('Error fetching results:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Sonuçlar yükleniyor...</div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">Sonuç bulunamadı.</div>
      </div>
    )
  }

  const radarData = result.axes.map(axis => ({
    axis: axis.axisName.split(':')[0],
    score: axis.score
  }))

  const topMatch = result.parties[0]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
          Sonuçlarınız
        </h1>

        {/* Top match */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4">En Uyumlu Partiniz</h2>
          {topMatch && (
            <div className="flex items-center gap-6">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-2xl"
                style={{ backgroundColor: getPartyColor(topMatch.partyShortName) }}
              >
                {topMatch.partyShortName}
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold">{topMatch.partyName}</h3>
                <p className="text-gray-600">
                  {getMatchExplanation(topMatch, result.axes)}
                </p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold" style={{ color: getPartyColor(topMatch.partyShortName) }}>
                  %{topMatch.similarity}
                </div>
                <div className="text-gray-600">Eşleşme</div>
              </div>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Radar chart */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold mb-4">Eksen Skorları</h2>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="axis" />
                <PolarRadiusAxis domain={[-100, 100]} tick={{ fontSize: 10 }} />
                <Radar
                  name="Skor"
                  dataKey="score"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.6}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Party rankings */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold mb-4">Parti Eşleşmeleri</h2>
            <div className="space-y-3">
              {result.parties.map((party, index) => (
                <div
                  key={party.partyId}
                  className="flex items-center justify-between p-4 rounded-lg border-2 hover:border-gray-300 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-lg font-bold text-gray-400">#{index + 1}</div>
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      style={{ backgroundColor: getPartyColor(party.partyShortName) }}
                    >
                      {party.partyShortName}
                    </div>
                    <span className="font-medium">{party.partyName}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold" style={{ color: getPartyColor(party.partyShortName) }}>
                      %{party.similarity}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <Link
            href="/"
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all"
          >
            Ana Sayfa
          </Link>
          <Link
            href="/survey"
            onClick={() => localStorage.removeItem('sessionId')}
            className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
          >
            Yeni Anket
          </Link>
        </div>
      </div>
    </div>
  )
}

function getPartyColor(shortName: string): string {
  const colors: Record<string, string> = {
    'AKP': '#F7941D',
    'CHP': '#E30A17',
    'MHP': '#F2B705',
    'İYİ': '#0B1F3A',
    'DEVA': '#7A3DB8',
    'Gelecek': '#1B6FB3',
    'Saadet': '#6A1BB3',
    'TİP': '#333333',
    'Vatan': '#D10F2F',
    'YSP': '#0F7A3A',
    'Zafer': '#00964C',
    'Memleket': '#FDD007'
  }
  return colors[shortName] || '#6B7280'
}

function getMatchExplanation(party: any, axes: any[]): string {
  const topAxes = axes
    .sort((a, b) => Math.abs(b.score) - Math.abs(a.score))
    .slice(0, 2)

  if (topAxes.length === 0) {
    return `Sizin görüşleriniz ${party.partyName} ile ${party.similarity}% benzerlik gösteriyor.`
  }

  const axisNames = topAxes.map(a => a.axisName).join(' ve ')
  return `Sizin görüşleriniz ${party.partyName} ile ${party.similarity}% benzerlik gösteriyor. Özellikle ${axisNames} konularında benzer yaklaşım sergiliyorsunuz.`
}
