'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { ReadOnlyNotice } from '@/components/admin/ReadOnlyNotice'

interface Party {
  id: string
  name: string
  short_name: string | null
  color: string
  description: string | null
  registry_status?: string | null
  match_status?: string | null
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
          supabase.from('parties').select('*').order('name', { ascending: true }),
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
    return <div className="text-ink-secondary">Yükleniyor...</div>
  }

  const scoreFor = (partyId: string, axisId: string) =>
    positions.find((position) => position.party_id === partyId && position.axis_id === axisId)?.score

  const positioned = parties.filter((party) => positions.some((p) => p.party_id === party.id))
  const unpositioned = parties.filter((party) => !positions.some((p) => p.party_id === party.id))

  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold text-ink-primary">Partiler</h1>
      <p className="mb-6 text-sm text-ink-secondary">
        Aktif eksen modelindeki konumlar gösterilir. Konumu olmayan parti eşleşmeye <strong>hiç
        girmez</strong> — sıfır puan almaz, karşılaştırma dışı kalır.
      </p>

      <ReadOnlyNotice
        source="scripts/data/party-positions-v2.js"
        command="npm run v2:positions"
      />

      {errorMessage && (
        <div className="mb-4 rounded-badge border border-border-strong border-l-4 border-l-ink-primary bg-surface-muted p-3 text-sm text-ink-primary">
          {errorMessage}
        </div>
      )}

      {axes.length > 0 && (
        <div className="mb-8 overflow-x-auto rounded-lg bg-surface-card border border-border">
          <table className="min-w-full">
            <thead className="bg-surface">
              <tr>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium uppercase text-ink-secondary">Parti</th>
                {axes.map((axis) => (
                  <th
                    key={axis.id}
                    title={axis.name}
                    className="px-2 py-3 text-right text-xs font-medium text-ink-secondary"
                  >
                    {axis.slug}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {positioned.map((party) => (
                <tr key={party.id} className="hover:bg-surface">
                  <td className="whitespace-nowrap px-3 py-2 text-sm">
                    <span className="inline-flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="inline-block h-3 w-3 rounded-full border border-border"
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
                        className="px-2 py-2 text-right text-sm data-figure text-ink-primary"
                      >
                        {score === undefined ? <span className="text-ink-muted">—</span> : score}
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
        <div className="mb-8 rounded-lg bg-surface-card p-4 border border-border">
          <h2 className="mb-2 text-sm font-semibold text-ink-primary">Konumlandırılmamış partiler</h2>
          <p className="mb-3 text-sm text-ink-secondary">
            Bu partiler için yayımlanmış yeterli kaynak kodlanmadı; sonuç ekranında ayrı listelenir.
          </p>
          <ul className="flex flex-wrap gap-2">
            {unpositioned.map((party) => (
              <li
                key={party.id}
                className="rounded-full border border-border-strong px-3 py-1 text-xs text-ink-primary"
              >
                {party.name}
                {party.match_status && (
                  <span className="ml-2 rounded-badge bg-surface-muted px-2 py-0.5 text-[10px] uppercase tracking-wide text-ink-secondary">
                    {party.match_status}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {parties.map((party) => (
          <div key={party.id} className="rounded-lg bg-surface-card p-4 border border-border">
            <div className="mb-2 flex items-center gap-3">
              {/* Parti rengi veri katmanıdır ama üstüne sabit beyaz metin AA'yı
                  bozuyor (AKP 2.28, MHP 1.82, Memleket 1.48) — swatch dekoratif
                  dolgu, kısa ad metin olarak yanında. */}
              <span
                aria-hidden="true"
                className="h-10 w-10 shrink-0 rounded-full border border-border-strong"
                style={{ backgroundColor: party.color }}
              />
              <div>
                <h3 className="font-semibold text-ink-primary">{party.name}</h3>
                <p className="text-xs text-ink-secondary">{party.short_name ?? 'Kısa ad yok'}</p>
              </div>
            </div>
            <p className="text-sm text-ink-secondary">{party.description ?? 'Açıklama eklenmemiş.'}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
