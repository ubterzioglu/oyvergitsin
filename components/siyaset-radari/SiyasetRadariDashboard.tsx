'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Badge } from '@/components/ui/Badge'
import type {
  DashboardElectionResult,
  DashboardJournalistEvent,
  DashboardPoliticalEvent,
} from '@/lib/siyaset-radari/public-data'

const COLORS = ['#1E9BE0', '#E8385C', '#3CB043', '#F5C518', '#7B4FE0', '#F5821F', '#0F172A']
const TABS = [
  { id: 'switches', label: 'Parti Geçişleri' },
  { id: 'journalists', label: 'Tutuklu Gazeteciler' },
  { id: 'provinces', label: 'İl Durumu' },
] as const

type TabId = (typeof TABS)[number]['id']

interface Props {
  politicalEvents: DashboardPoliticalEvent[]
  journalistEvents: DashboardJournalistEvent[]
  electionResults: DashboardElectionResult[]
}

function formatDate(value: string | null): string {
  if (!value) {
    return 'Tarih yok'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Tarih yok'
  }
  return date.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })
}

function xSearchUrl(name: string): string {
  return `https://x.com/search?q=${encodeURIComponent(`"${name}"`)}&src=typed_query&f=live`
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-white px-6 py-12 text-center text-sm text-ink-secondary">
      {children}
    </div>
  )
}

export function SiyasetRadariDashboard({ politicalEvents, journalistEvents, electionResults }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('switches')

  const currentSeatDistribution = useMemo(
    () =>
      electionResults
        .filter((item) => item.electionType === 'tbmm_current_seat_distribution' && item.areaLevel === 'country')
        .map((item) => ({ name: item.partyName, value: item.seatCount ?? 0, stale: item.isStale }))
        .filter((item) => item.value > 0),
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
    <div>
      <div className="flex flex-wrap gap-2 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
              activeTab === tab.id
                ? 'border-rainbow-blue text-ink-primary'
                : 'border-transparent text-ink-secondary hover:text-ink-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'switches' && (
        <section className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <h2 className="font-heading text-2xl font-semibold text-ink-primary">Parti Geçişleri</h2>
            <div className="mt-5 space-y-4">
              {politicalEvents.length === 0 ? (
                <EmptyState>Onaylanmış parti geçişi kaydı henüz yok.</EmptyState>
              ) : (
                politicalEvents.map((event) => (
                  <article key={event.id} className="rounded-lg border border-border bg-white p-5 shadow-soft">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <Link
                          href={`/siyaset-radari/kisi/${event.personSlug}`}
                          className="text-lg font-semibold text-ink-primary hover:text-rainbow-blue"
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
                    <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-ink-muted">
                      <span>{formatDate(event.happenedOn)}</span>
                      <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-rainbow-blue">
                        {event.sourceName}
                      </a>
                      <a href={xSearchUrl(event.fullName)} target="_blank" rel="noopener noreferrer" className="text-rainbow-blue">
                        {"X'te ara"}
                      </a>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-lg border border-border bg-white p-5 shadow-soft">
              <h3 className="text-base font-semibold text-ink-primary">Geçişlerin Hedef Dağılımı</h3>
              {switchDistribution.length === 0 ? (
                <EmptyState>Grafik için onaylı geçiş verisi yok.</EmptyState>
              ) : (
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
              )}
            </div>

            <div className="rounded-lg border border-border bg-white p-5 shadow-soft">
              <h3 className="text-base font-semibold text-ink-primary">Güncel TBMM Dağılımı</h3>
              {currentSeatDistribution.length === 0 ? (
                <EmptyState>Onaylı TBMM sandalye verisi yok.</EmptyState>
              ) : (
                <div className="mt-4 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={currentSeatDistribution} dataKey="value" nameKey="name" outerRadius={90}>
                        {currentSeatDistribution.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </aside>
        </section>
      )}

      {activeTab === 'journalists' && (
        <section className="mt-8">
          <h2 className="font-heading text-2xl font-semibold text-ink-primary">Tutuklu/Hükümlü Gazeteciler</h2>
          <div className="mt-5 overflow-hidden rounded-lg border border-border bg-white shadow-soft">
            {journalistEvents.length === 0 ? (
              <EmptyState>Onaylanmış gazeteci durum kaydı henüz yok.</EmptyState>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-surface-muted text-ink-secondary">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Ad Soyad</th>
                      <th className="px-4 py-3 font-semibold">Kurum</th>
                      <th className="px-4 py-3 font-semibold">Görev</th>
                      <th className="px-4 py-3 font-semibold">Statü</th>
                      <th className="px-4 py-3 font-semibold">Kaynak</th>
                      <th className="px-4 py-3 font-semibold">Doğrulama</th>
                    </tr>
                  </thead>
                  <tbody>
                    {journalistEvents.map((event) => (
                      <tr key={event.id} className="border-t border-border">
                        <td className="px-4 py-3">
                          <Link href={`/siyaset-radari/kisi/${event.personSlug}`} className="font-medium text-ink-primary hover:text-rainbow-blue">
                            {event.fullName}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-ink-secondary">{event.outlet ?? '—'}</td>
                        <td className="px-4 py-3 text-ink-secondary">{event.jobTitle ?? '—'}</td>
                        <td className="px-4 py-3">
                          <Badge>{event.statusLabel}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-rainbow-blue">
                            {event.sourceName}
                          </a>
                        </td>
                        <td className="px-4 py-3 text-ink-secondary">
                          <div>{formatDate(event.lastVerifiedAt)}</div>
                          {event.isStale && <span className="text-xs font-semibold text-rainbow-red">Tekrar doğrulanmalı</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {activeTab === 'provinces' && (
        <section className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <h2 className="font-heading text-2xl font-semibold text-ink-primary">İl Durumu</h2>
            <div className="mt-5 rounded-lg border border-border bg-white p-5 shadow-soft">
              <h3 className="text-base font-semibold text-ink-primary">İle Göre Geçiş Yoğunluğu</h3>
              {provinceBars.rows.length === 0 ? (
                <EmptyState>İl kırılımı için onaylı parti geçişi yok.</EmptyState>
              ) : (
                <div className="mt-4 h-96">
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
              )}
            </div>
          </div>
          <aside className="rounded-lg border border-border bg-white p-5 shadow-soft">
            <h3 className="text-base font-semibold text-ink-primary">Onaylı Seçim/Sandalye Verisi</h3>
            <div className="mt-4 space-y-3">
              {electionResults.length === 0 ? (
                <EmptyState>İl veya sandalye verisi yok.</EmptyState>
              ) : (
                electionResults.slice(0, 20).map((result) => (
                  <div key={result.id} className="border-b border-border pb-3 last:border-b-0">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-ink-primary">{result.partyName}</span>
                      <span className="text-sm text-ink-secondary">{result.seatCount ?? result.voteShare ?? '—'}</span>
                    </div>
                    <div className="mt-1 text-xs text-ink-muted">
                      {result.areaName} · {result.sourceName}
                      {result.isStale && <span className="ml-2 font-semibold text-rainbow-red">Eski doğrulama</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>
        </section>
      )}
    </div>
  )
}
