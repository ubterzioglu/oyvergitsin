'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/siyaset-radari/EmptyState'
import { SeatDistributionChart } from '@/components/siyaset-radari/SeatDistributionChart'
import { formatRadarDate, xSearchUrl } from '@/lib/siyaset-radari/format'
import type { DashboardElectionResult, DashboardPoliticalEvent } from '@/lib/siyaset-radari/public-data'

// Geçiş grafiklerinde nötr rampa; parti renkleri sandalye grafiğinde (party-colors) kullanılıyor.
const COLORS = ['#1D616B', '#38737C', '#55868E', '#769DA2', '#9BB6B9', '#C6D2D3', '#191C1E']

interface Props {
  politicalEvents: DashboardPoliticalEvent[]
  electionResults: DashboardElectionResult[]
}

/** /siyaset-radari/meclis: TBMM sandalye dağılımı + (varsa) parti geçişleri ve geçiş grafikleri. */
export function MeclisSection({ politicalEvents, electionResults }: Props) {
  const currentSeatDistribution = useMemo(
    () =>
      electionResults
        .filter((item) => item.electionType === 'tbmm_current_seat_distribution' && item.areaLevel === 'country')
        .map((item) => ({ name: item.partyName, value: item.seatCount ?? 0, stale: item.isStale }))
        .filter((item) => item.value > 0),
    [electionResults]
  )

  // Sandalye grafiğinin altında gösterilen kaynak; en son doğrulanan satır esas alınır.
  const seatSource = useMemo(
    () =>
      electionResults
        .filter((item) => item.electionType === 'tbmm_current_seat_distribution' && item.areaLevel === 'country')
        .sort((a, b) => (b.lastVerifiedAt ?? '').localeCompare(a.lastVerifiedAt ?? ''))[0] ?? null,
    [electionResults]
  )

  const switchDistribution = useMemo(() => {
    const counts = new Map<string, number>()
    for (const event of politicalEvents) {
      if (!['party_join', 'party_switch', 'independent'].includes(event.eventType)) {
        continue
      }
      const party = event.toPartyName ?? 'Bağımsız'
      counts.set(party, (counts.get(party) ?? 0) + 1)
    }
    return [...counts.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [politicalEvents])

  const provinceBars = useMemo(() => {
    const parties = [...new Set(politicalEvents.map((event) => event.toPartyName ?? 'Bağımsız'))].slice(0, 6)
    const byProvince = new Map<string, Record<string, string | number>>()
    for (const event of politicalEvents) {
      const province = event.province ?? 'Belirtilmemiş'
      const party = event.toPartyName ?? 'Bağımsız'
      if (!parties.includes(party)) {
        continue
      }
      const row = byProvince.get(province) ?? { province }
      row[party] = Number(row[party] ?? 0) + 1
      byProvince.set(province, row)
    }
    return { parties, rows: [...byProvince.values()].slice(0, 12) }
  }, [politicalEvents])

  return (
    <section>
      {/* Parti geçişi kaydı yokken geçiş sütunu gizlenir; sandalye kartı tam genişliği kullanır. */}
      <div
        className={`mt-5 grid gap-8 ${politicalEvents.length > 0 ? 'lg:grid-cols-[minmax(0,1fr)_380px]' : ''}`}
      >
        <div className="rounded-lg border border-border bg-white p-5 shadow-soft">
          <h3 className="text-base font-semibold text-ink-primary">Güncel Sandalye Dağılımı</h3>
          {currentSeatDistribution.length === 0 ? (
            <EmptyState>Onaylı TBMM sandalye verisi yok.</EmptyState>
          ) : (
            <SeatDistributionChart rows={currentSeatDistribution} />
          )}
          {seatSource && (
            <p className="mt-4 text-xs text-ink-muted">
              Kaynak:{' '}
              <a href={seatSource.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-accent">
                {seatSource.sourceName}
              </a>
              {' · '}Doğrulama: {formatRadarDate(seatSource.lastVerifiedAt)}
            </p>
          )}
        </div>

        {politicalEvents.length > 0 && (
        <aside>
          <h3 className="text-base font-semibold text-ink-primary">Parti Geçişleri</h3>
          <div className="mt-4 space-y-4">
            {politicalEvents.map((event) => (
                <article key={event.id} className="rounded-lg border border-border bg-white p-4 shadow-soft">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Link
                        href={`/siyaset-radari/kisi/${event.personSlug}`}
                        className="font-semibold text-ink-primary hover:text-accent"
                      >
                        {event.fullName}
                      </Link>
                      <p className="mt-1 text-sm text-ink-secondary">
                        {event.fromPartyName ?? '—'} {'->'} {event.toPartyName ?? 'Bağımsız'}
                      </p>
                    </div>
                    <Badge>{event.province ?? 'İl yok'}</Badge>
                  </div>
                  {event.summary && <p className="mt-3 text-sm text-ink-secondary">{event.summary}</p>}
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-ink-muted">
                    <span>{formatRadarDate(event.happenedOn)}</span>
                    <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-accent">
                      {event.sourceName}
                    </a>
                    <a href={xSearchUrl(event.fullName)} target="_blank" rel="noopener noreferrer" className="text-accent">
                      {"X'te ara"}
                    </a>
                  </div>
                </article>
            ))}
          </div>
        </aside>
        )}
      </div>

      {/* Geçiş grafikleri yalnız onaylı geçiş verisi varsa gösterilir; boş grafik kutuları sayfayı kalabalıklaştırıyordu. */}
      {switchDistribution.length > 0 && (
        <div className="mt-8 grid gap-8 lg:grid-cols-[360px_minmax(0,1fr)]">
          <div className="rounded-lg border border-border bg-white p-5 shadow-soft">
            <h3 className="text-base font-semibold text-ink-primary">Geçişlerin Hedef Dağılımı</h3>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={switchDistribution} dataKey="value" nameKey="name" outerRadius={90} label>
                    {switchDistribution.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {provinceBars.rows.length > 0 && (
            <div className="rounded-lg border border-border bg-white p-5 shadow-soft">
              <h3 className="text-base font-semibold text-ink-primary">İle Göre Geçiş Yoğunluğu</h3>
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={provinceBars.rows}>
                    <XAxis dataKey="province" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    {provinceBars.parties.map((party, index) => (
                      <Bar key={party} dataKey={party} stackId="switches" fill={COLORS[index % COLORS.length]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
