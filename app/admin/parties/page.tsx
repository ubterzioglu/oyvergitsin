'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { ReadOnlyNotice } from '@/components/admin/ReadOnlyNotice'

interface Party {
  id: string
  name: string
  short_name: string
  color: string
  description: string
}

interface Axis {
  id: string
  name: string
  slug: string
  order_index: number
  axis_model_id: string
}

interface Position {
  party_id: string
  axis_id: string
  score: number
}

export default function PartiesPage() {
  const [parties, setParties] = useState<Party[]>([])
  const [axes, setAxes] = useState<Axis[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const activeModel = await supabase
          .from('axis_models')
          .select('id')
          .eq('is_active', true)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle()

        const modelId = activeModel.data?.id

        const [partiesRes, axesRes] = await Promise.all([
          supabase.from('parties').select('*').order('short_name', { ascending: true }),
          modelId
            ? supabase
                .from('axes')
                .select('id, name, slug, order_index, axis_model_id')
                .eq('axis_model_id', modelId)
                .order('order_index', { ascending: true })
            : Promise.resolve({ data: [], error: null }),
        ])

        if (partiesRes.error) throw partiesRes.error
        if (axesRes.error) throw axesRes.error

        const axisList = (axesRes.data ?? []) as Axis[]
        setParties((partiesRes.data ?? []) as Party[])
        setAxes(axisList)

        if (axisList.length > 0) {
          const { data: positionData, error: positionError } = await supabase
            .from('party_positions')
            .select('party_id, axis_id, score')
            .in(
              'axis_id',
              axisList.map((axis) => axis.id)
            )

          if (positionError) throw positionError
          setPositions((positionData ?? []) as Position[])
        }
      } catch (error) {
        console.error('Error fetching parties:', error)
        setErrorMessage('Partiler yüklenemedi')
      } finally {
        setLoading(false)
      }
    }

    fetchAll()
  }, [])

  if (loading) {
    return <div className="text-gray-600">Yükleniyor...</div>
  }

  const scoreFor = (partyId: string, axisId: string) =>
    positions.find((position) => position.party_id === partyId && position.axis_id === axisId)?.score

  const positioned = parties.filter((party) => positions.some((p) => p.party_id === party.id))
  const unpositioned = parties.filter((party) => !positions.some((p) => p.party_id === party.id))

  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold text-gray-900">Partiler</h1>
      <p className="mb-6 text-sm text-gray-600">
        Aktif eksen modelindeki konumlar gösterilir. Konumu olmayan parti eşleşmeye <strong>hiç
        girmez</strong> — sıfır puan almaz, karşılaştırma dışı kalır.
      </p>

      <ReadOnlyNotice
        source="scripts/data/party-positions-v2.js"
        command="npm run v2:positions"
      />

      {errorMessage && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {axes.length > 0 && (
        <div className="mb-8 overflow-x-auto rounded-lg bg-white shadow-md">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase text-gray-500">Parti</th>
                {axes.map((axis) => (
                  <th
                    key={axis.id}
                    title={axis.name}
                    className="px-2 py-3 text-right text-xs font-medium text-gray-500"
                  >
                    {axis.slug}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {positioned.map((party) => (
                <tr key={party.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-3 py-2 text-sm">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="inline-block h-3 w-3 rounded-full"
                        style={{ backgroundColor: party.color }}
                      />
                      {party.name}
                    </span>
                  </td>
                  {axes.map((axis) => {
                    const score = scoreFor(party.id, axis.id)
                    return (
                      <td
                        key={axis.id}
                        className="px-2 py-2 text-right text-sm tabular-nums text-gray-700"
                      >
                        {score === undefined ? <span className="text-gray-300">—</span> : score}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {unpositioned.length > 0 && (
        <div className="mb-8 rounded-lg bg-white p-4 shadow-md">
          <h2 className="mb-2 text-sm font-semibold text-gray-900">Konumlandırılmamış partiler</h2>
          <p className="mb-3 text-sm text-gray-600">
            Bu partiler için yayımlanmış yeterli kaynak kodlanmadı; sonuç ekranında ayrı listelenir.
          </p>
          <ul className="flex flex-wrap gap-2">
            {unpositioned.map((party) => (
              <li
                key={party.id}
                className="rounded-full border border-gray-300 px-3 py-1 text-xs text-gray-700"
              >
                {party.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {parties.map((party) => (
          <div key={party.id} className="rounded-lg bg-white p-4 shadow-md">
            <div className="mb-2 flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: party.color }}
              >
                {party.short_name}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{party.name}</h3>
                <p className="text-xs text-gray-500">{party.short_name}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">{party.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
