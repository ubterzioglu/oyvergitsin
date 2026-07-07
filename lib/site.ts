export const siteConfig = {
  name: 'Öy Ver Gitsin',
  shortName: 'Öy Ver Gitsin',
  title: 'Öy Ver Gitsin | Türkiye Siyasi Eşleşme Platformu',
  description:
    'Siyasi görüşlerinizi anonim şekilde analiz edin ve Türkiye\'de hangi partiye daha yakın olduğunuzu öğrenin.',
  locale: 'tr_TR',
  language: 'tr-TR',
  countryCode: 'TR',
  countryName: 'Turkey',
  geoRegion: 'TR',
  geoPlacename: 'Turkey',
  themeColor: '#2563EB',
  coordinates: {
    latitude: '39.0',
    longitude: '35.0'
  },
  keywords: [
    'siyasi test',
    'parti testi',
    'turkiye siyaset',
    'secim anketi',
    'oy rehberi',
    'politik pusula',
    'siyasi eslesme'
  ]
} as const

const DEFAULT_SITE_URL = 'https://oyvergitsin.org'

export function getSiteUrl() {
  const rawUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || DEFAULT_SITE_URL
  const normalizedUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`

  return normalizedUrl.replace(/\/+$/, '')
}
