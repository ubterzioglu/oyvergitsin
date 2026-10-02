import type { MetadataRoute } from 'next'
import { siteConfig } from '@/lib/site'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.title,
    short_name: siteConfig.shortName,
    description: siteConfig.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#FAFBFC',
    theme_color: siteConfig.themeColor,
    lang: siteConfig.language,
    // Eski marka logosu (public/logo.png, 1.8 MB) kaldırıldı; yeni logo
    // sonra yapılacak. Bu arada PWA ikonları Next.js'in dosya konvansiyonuyla
    // üretilen /icon.png ve /apple-icon.png rotalarından besleniyor.
    //
    // `maskable` purpose'u bilerek yok: maskelenebilir bir ikon güvenli
    // alan payı gerektirir; onu karşılamayan bir görseli maskable diye
    // bildirmek Android'de ikonun kırpılmasına yol açar. Yeni logo
    // geldiğinde ayrı bir maskable varyantla birlikte eklenmeli.
    icons: [
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any'
      }
    ]
  }
}
