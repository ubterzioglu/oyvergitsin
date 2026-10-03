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
import { assignPartyColors, toPartyShortName } from '@/components/siyaset-radari/party-colors'
import { SOURCE_LINK_CLASS } from '@/components/siyaset-radari/styles'
import type {
  DashboardElectionResult,
  DashboardJournalistEvent,
  DashboardPoliticalEvent,
} from '@/lib/siyaset-radari/public-data'

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

/**
 * Dilim etiketi — dilimin DIŞINA, beyaz zemine yazılır.
 *
 * Etiketi dilimin içine koymak kontrastı parti rengine bağımlı kılardı
 * (MHP sarısı #F2B705 üzerinde beyaz metin 1.8:1). Dışarıda, beyaz üzerinde
 * ink-primary ile 17.13:1.
 *
 * recharts'ın varsayılan etiketi gri (#808080, beyazda 3.95 — AA altı), bu
 * yüzden metin elle çiziliyor.
 */
function renderSliceLabel({
  cx,
  cy,
  midAngle,
  outerRadius,
  percent,
  name,
  value,
}: {
  cx: number
  cy: number
  midAngle: number
  outerRadius: number
  percent: number
  name: string
  value: number
}) {
  // Çok küçük dilimlerde etiketler üst üste biniyor; onlar grafiğin
  // altındaki listeden ve tooltip'ten okunuyor.
  if (percent < 0.04) {
    return null
  }

  const radian = Math.PI / 180
  const radius = outerRadius + 16
  const x = cx + radius * Math.cos(-midAngle * radian)
  const y = cy + radius * Math.sin(-midAngle * radian)

  return (
    <text
      x={x}
      y={y}
      fill="#191C1E"
      fontSize={12}
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
    >
      {`${toPartyShortName(name)} ${value}`}
    </text>
  )
}

const TOOLTIP_PROPS = {
  contentStyle: {
    borderRadius: '0.625rem',
    border: '1px solid #C3CDCD',
    fontSize: 13,
    color: '#191C1E',
  },
  labelStyle: { color: '#191C1E' },
} as const

// Eksen etiketleri ink-secondary; beyaz kart üzerinde 6.38:1.
const AXIS_TICK = { fill: '#566164', fontSize: 12 } as const

const LEGEND_PROPS = {
  formatter: (value: string) => toPartyShortName(value),
  wrapperStyle: { fontSize: 13, color: '#566164' },
} as const

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
    <div className="mt-4 rounded-card border border-dashed border-border-strong bg-surface-muted px-6 py-12 text-center text-sm text-ink-secondary">
      {children}
    </div>
  )
}

/**
 * "Doğrulaması eskimiş" işareti.
 *
 * Eskiden kırmızıydı; yön tek accent kullandığı için ikinci bir anlam rengi
 * eklenmiyor. Uyarı ağırlığını çerçeve ve kalın metin taşıyor — zaten metnin
 * kendisi de durumu söylüyor, yani bilgi renge bağlı değil.
 */
function StaleFlag({ children }: { children: React.ReactNode }) {
  return (
    <span className="mt-1 inline-flex items-center rounded-badge border border-border-strong px-2 py-0.5 text-xs font-semibold text-ink-primary">
      {children}
    </span>
  )
}

export function SiyasetRadariDashboard({ politicalEvents, journalistEvents, electionResults }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('switches')

  // Dilim renkleri parti verisinden geliyor (components/siyaset-radari/party-colors.ts),
  // kabuk paletinden değil. Sıra bağımlı boyama tarafsızlığı bozuyordu.
  const currentSeatDistribution = useMemo(() => {
    const rows = electionResults
      .filter((item) => item.electionType === 'tbmm_current_seat_distribution' && item.areaLevel === 'country')
      .map((item) => ({ name: item.partyName, value: item.seatCount ?? 0, stale: item.isStale }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value)

    const colors = assignPartyColors(rows.map((row) => row.name))
    return rows.map((row, index) => ({ ...row, color: colors[index] }))
  }, [electionResults])

  const totalSeats = useMemo(
    () => currentSeatDistribution.reduce((sum, row) => sum + row.value, 0),
    [currentSeatDistribution]
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
    const rows = [...counts.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    const colors = assignPartyColors(rows.map((row) => row.name))
    return rows.map((row, index) => ({ ...row, color: colors[index] }))
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

  const provinceBarColors = useMemo(() => assignPartyColors(provinceBars.parties), [provinceBars.parties])

  return (
    <div>
      <div className="flex flex-wrap gap-2 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            aria-current={activeTab === tab.id ? 'true' : undefined}
            className={`rounded-t-badge border-b-2 px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
              activeTab === tab.id
                ? 'border-accent text-ink-primary'
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
                  <article
                    key={event.id}
                    className="rounded-card border border-border bg-surface-card p-5 transition-shadow hover:shadow-elevated"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <Link
                          href={`/siyaset-radari/kisi/${event.personSlug}`}
                          className="rounded-badge text-lg font-semibold text-ink-primary hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
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
                      <span className="data-figure">{formatDate(event.happenedOn)}</span>
                      <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer" className={SOURCE_LINK_CLASS}>
                        {event.sourceName}
                      </a>
                      <a href={xSearchUrl(event.fullName)} target="_blank" rel="noopener noreferrer" className={SOURCE_LINK_CLASS}>
                        {"X'te ara"}
                      </a>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-card border border-border bg-surface-card p-5">
              <h3 className="text-base font-semibold text-ink-primary">Geçişlerin Hedef Dağılımı</h3>
              {switchDistribution.length === 0 ? (
                <EmptyState>Grafik için onaylı geçiş verisi yok.</EmptyState>
              ) : (
                <div className="mt-4 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={switchDistribution}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={80}
                        label={renderSliceLabel}
                      >
                        {switchDistribution.map((row) => (
                          <Cell key={row.name} fill={row.color} />
                        ))}
                      </Pie>
                      <Tooltip {...TOOLTIP_PROPS} formatter={(value: number) => [`${value} kişi`, 'Geçiş']} />
                      <Legend {...LEGEND_PROPS} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="rounded-card border border-border bg-surface-card p-5">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-base font-semibold text-ink-primary">Güncel TBMM Dağılımı</h3>
                {totalSeats > 0 && (
                  <span className="data-figure text-sm text-ink-secondary">{totalSeats} sandalye</span>
                )}
              </div>
              {currentSeatDistribution.length === 0 ? (
                <EmptyState>
                  <span className="block text-sm font-medium text-ink-primary">
                    Onaylı TBMM sandalye verisi yok.
                  </span>
                  <span className="mx-auto mt-2 block max-w-md text-sm text-ink-secondary">
                    Sandalye dağılımı TBMM&apos;nin resmî sayfasından otomatik taranır; kayıtlar
                    kaynak kontrolü ve editoryal onaydan geçtikten sonra bu grafikte yayımlanır.
                  </span>
                </EmptyState>
              ) : (
                <>
                  <div className="mt-4 h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={currentSeatDistribution}
                          dataKey="value"
                          nameKey="name"
                          outerRadius={80}
                          label={renderSliceLabel}
                        >
                          {currentSeatDistribution.map((row) => (
                            <Cell key={row.name} fill={row.color} />
                          ))}
                        </Pie>
                        <Tooltip {...TOOLTIP_PROPS} formatter={(value: number) => [`${value} sandalye`, 'TBMM']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/*
                    Rampanın komşu adımları yakın (1.32–1.39) ve parti
                    renklerinin bazıları birbirine benziyor. Grafiğin altındaki
                    bu liste renge bağımlılığı tamamen kaldırıyor: ad ve sayı
                    metin olarak da okunuyor, ekran okuyucuya da buradan geçiyor.
                  */}
                  <ul className="mt-4 space-y-1.5 border-t border-border pt-4">
                    {currentSeatDistribution.map((row) => (
                      <li key={row.name} className="flex items-center gap-2.5 text-sm">
                        <span
                          aria-hidden="true"
                          className="h-2.5 w-2.5 shrink-0 rounded-sm border border-border-strong"
                          style={{ backgroundColor: row.color }}
                        />
                        <span className="min-w-0 flex-1 truncate text-ink-secondary">
                          {toPartyShortName(row.name)}
                        </span>
                        <span className="data-figure shrink-0 font-medium text-ink-primary">{row.value}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </aside>
        </section>
      )}

      {activeTab === 'journalists' && (
        <section className="mt-8">
          <h2 className="font-heading text-2xl font-semibold text-ink-primary">Tutuklu/Hükümlü Gazeteciler</h2>
          <div className="mt-5 overflow-hidden rounded-card border border-border bg-surface-card">
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
                          <Link
                            href={`/siyaset-radari/kisi/${event.personSlug}`}
                            className="rounded-badge font-medium text-ink-primary hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                          >
                            {event.fullName}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-ink-secondary">{event.outlet ?? '—'}</td>
                        <td className="px-4 py-3 text-ink-secondary">{event.jobTitle ?? '—'}</td>
                        <td className="px-4 py-3">
                          <Badge>{event.statusLabel}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer" className={SOURCE_LINK_CLASS}>
                            {event.sourceName}
                          </a>
                        </td>
                        <td className="px-4 py-3 text-ink-secondary">
                          <div className="data-figure">{formatDate(event.lastVerifiedAt)}</div>
                          {event.isStale && <StaleFlag>Tekrar doğrulanmalı</StaleFlag>}
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
            <div className="mt-5 rounded-card border border-border bg-surface-card p-5">
              <h3 className="text-base font-semibold text-ink-primary">İle Göre Geçiş Yoğunluğu</h3>
              {provinceBars.rows.length === 0 ? (
                <EmptyState>İl kırılımı için onaylı parti geçişi yok.</EmptyState>
              ) : (
                <div className="mt-4 h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={provinceBars.rows}>
                      <XAxis dataKey="province" tick={AXIS_TICK} />
                      <YAxis allowDecimals={false} tick={AXIS_TICK} />
                      <Tooltip {...TOOLTIP_PROPS} />
                      <Legend {...LEGEND_PROPS} />
                      {provinceBars.parties.map((party, index) => (
                        <Bar key={party} dataKey={party} stackId="switches" fill={provinceBarColors[index]} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
          <aside className="rounded-card border border-border bg-surface-card p-5">
            <h3 className="text-base font-semibold text-ink-primary">Onaylı Seçim/Sandalye Verisi</h3>
            <div className="mt-4 space-y-3">
              {electionResults.length === 0 ? (
                <EmptyState>İl veya sandalye verisi yok.</EmptyState>
              ) : (
                electionResults.slice(0, 20).map((result) => (
                  <div key={result.id} className="border-b border-border pb-3 last:border-b-0">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-ink-primary">{toPartyShortName(result.partyName)}</span>
                      <span className="data-figure text-sm text-ink-secondary">
                        {result.seatCount ?? result.voteShare ?? '—'}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-ink-muted">
                      {result.areaName} · {result.sourceName}
                    </div>
                    {result.isStale && <StaleFlag>Eski doğrulama</StaleFlag>}
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
