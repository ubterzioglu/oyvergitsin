// Siyaset Radarı sekmeleri: hem sayfadaki sekme çubuğu hem üst menü buradan okur.
export const RADAR_TABS = [
  { id: 'parti-gecisleri', label: 'Parti Geçişleri' },
  { id: 'tutuklu-gazeteciler', label: 'Tutuklu Gazeteciler' },
  { id: 'il-durumu', label: 'İl Durumu' },
] as const

export type RadarTabId = (typeof RADAR_TABS)[number]['id']

export const DEFAULT_RADAR_TAB: RadarTabId = 'parti-gecisleri'
export const RADAR_TABS_ANCHOR = 'radar-sekmeler'

export function parseRadarTab(value: unknown): RadarTabId {
  return RADAR_TABS.some((tab) => tab.id === value) ? (value as RadarTabId) : DEFAULT_RADAR_TAB
}

export function radarTabHref(id: RadarTabId): string {
  return `/siyaset-radari?sekme=${id}#${RADAR_TABS_ANCHOR}`
}
