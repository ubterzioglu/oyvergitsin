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
    icons: [
      {
        src: '/logo.png',
        sizes: '2000x2000',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/logo.png',
        sizes: '2000x2000',
        type: 'image/png',
        purpose: 'maskable'
      }
    ]
  }
}
