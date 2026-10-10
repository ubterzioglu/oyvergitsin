// Siyaset Radarı alt sayfaları: hem sayfalardaki alt menü hem üst menü buradan okur.
export const RADAR_HOME_PATH = '/siyaset-radari'

export const RADAR_PAGES = [
  { href: RADAR_HOME_PATH, label: 'Güncel Akış' },
  { href: '/siyaset-radari/meclis', label: 'Mecliste Sandalye Dağılımı' },
  { href: '/siyaset-radari/tutuklu-gazeteciler', label: 'Tutuklu Gazeteciler' },
] as const

// Üst menüde "Siyaset Radarı" zaten ana sayfaya gidiyor; kısayol olarak yalnız alt sayfalar.
export const RADAR_SECTION_PAGES = RADAR_PAGES.filter((page) => page.href !== RADAR_HOME_PATH)

// Sekmeler ayrı sayfalara taşındı; eski ?sekme= linkleri kırılmasın.
const LEGACY_TAB_PATHS: Record<string, string> = {
  meclis: '/siyaset-radari/meclis',
  'parti-gecisleri': '/siyaset-radari/meclis',
  'il-durumu': '/siyaset-radari/meclis',
  'tutuklu-gazeteciler': '/siyaset-radari/tutuklu-gazeteciler',
}

export function legacyRadarTabPath(value: unknown): string | null {
  return typeof value === 'string' ? (LEGACY_TAB_PATHS[value] ?? null) : null
}
