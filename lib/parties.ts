export const PARTY_COLORS: Record<string, string> = {
  AKP: '#F7941D',
  CHP: '#E30A17',
  MHP: '#F2B705',
  'İYİ': '#0B1F3A',
  DEVA: '#7A3DB8',
  Gelecek: '#1B6FB3',
  Saadet: '#6A1BB3',
  'TİP': '#333333',
  Vatan: '#D10F2F',
  // Yeşil Sol Parti Aralık 2023'te DEM Parti'ye dönüştü; migration 010 DB
  // satırını yerinde güncelledi (short_name 'DEM', parties.color '#0F7A3A').
  DEM: '#0F7A3A',
  // YSP anahtarı bilinçli olarak duruyor: result_snapshots'ta 'YSP'
  // shortName'iyle donmuş payload'lar var ve eski sonuçlar değişmemeli.
  YSP: '#0F7A3A',
  Zafer: '#00964C',
  Memleket: '#FDD007',
  'YENİ PARTİ': '#E41E26',
}

const DEFAULT_PARTY_COLOR = '#6B7280'

export function getPartyColor(shortName: string): string {
  return PARTY_COLORS[shortName] || DEFAULT_PARTY_COLOR
}

export function getPartyGradient(shortName: string): string {
  const color = getPartyColor(shortName)
  return `linear-gradient(135deg, ${color}, ${color}cc)`
}
