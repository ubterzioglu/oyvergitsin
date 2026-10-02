export const siteConfig = {
  name: 'oyvergitsin.org',
  shortName: 'oyvergitsin.org',
  title: 'oyvergitsin.org | Türkiye Siyasi Eşleşme Platformu',
  description:
    'Siyasi görüşlerinizi anonim şekilde analiz edin ve Türkiye\'de hangi partiye daha yakın olduğunuzu öğrenin.',
  locale: 'tr_TR',
  language: 'tr-TR',
  countryCode: 'TR',
  countryName: 'Turkey',
  geoRegion: 'TR',
  geoPlacename: 'Turkey',
  themeColor: '#1B2A4A',
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

/**
 * Herkese açık (indekslenebilir) rotalar. Sitemap ve canonical/hreflang
 * üretimi tek bir listeden beslenir ki yeni bir public sayfa eklenince
 * sitemap ile sayfa metadata'sı birbirinden kopmasın.
 *
 * Özel akışlar (/consent, /survey, /results/*) ve /admin/* burada YOKTUR;
 * onlar kendi layout.tsx dosyalarında noindex taşır.
 */
export const PUBLIC_ROUTES = ['/', '/metodoloji', '/siyaset-radari'] as const

export const LEGAL_ROUTES = [
  '/legal/privacy-policy',
  '/legal/kvkk-disclosure',
  '/legal/cookie-policy',
  '/legal/terms-of-use'
] as const

/**
 * Sayfa metadata'sı icin canonical + hreflang ciftini uretir.
 * Site tek dilli (tr-TR) oldugundan x-default de ayni URL'yi gosterir.
 */
export function buildAlternates(path: string) {
  const normalizedPath = path === '/' ? '/' : `/${path.replace(/^\/+|\/+$/g, '')}`

  return {
    canonical: normalizedPath,
    languages: {
      [siteConfig.language]: normalizedPath,
      'x-default': normalizedPath
    }
  }
}
