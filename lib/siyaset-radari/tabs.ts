// Siyaset Radarı sekmeleri: hem sayfadaki sekme çubuğu hem üst menü buradan okur.
export const RADAR_TABS = [
  { id: 'meclis', label: 'Mecliste Sandalye Dağılımı' },
  { id: 'tutuklu-gazeteciler', label: 'Tutuklu Gazeteciler' },
] as const

export type RadarTabId = (typeof RADAR_TABS)[number]['id']

export const DEFAULT_RADAR_TAB: RadarTabId = 'meclis'
export const RADAR_TABS_ANCHOR = 'radar-sekmeler'

// Parti Geçişleri ve İl Durumu "meclis" sekmesinde birleşti; eski paylaşılmış linkler kırılmasın.
const LEGACY_TAB_ALIASES: Record<string, RadarTabId> = {
  'parti-gecisleri': 'meclis',
  'il-durumu': 'meclis',
}

export function parseRadarTab(value: unknown): RadarTabId {
  if (typeof value !== 'string') {
    return DEFAULT_RADAR_TAB
  }
  const tab = RADAR_TABS.find((item) => item.id === value)
  return tab?.id ?? LEGACY_TAB_ALIASES[value] ?? DEFAULT_RADAR_TAB
}

export function radarTabHref(id: RadarTabId): string {
  return `/siyaset-radari?sekme=${id}#${RADAR_TABS_ANCHOR}`
}
