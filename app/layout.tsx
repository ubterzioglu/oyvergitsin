import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { getSiteUrl, siteConfig } from '@/lib/site'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export function generateMetadata(): Metadata {
  const siteUrl = getSiteUrl()

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: siteConfig.title,
      template: `%s | ${siteConfig.name}`
    },
    description: siteConfig.description,
    applicationName: siteConfig.name,
    keywords: [...siteConfig.keywords],
    category: 'politics',
    alternates: {
      languages: {
        'tr-TR': '/'
      }
    },
    openGraph: {
      type: 'website',
      locale: siteConfig.locale,
      url: siteUrl,
      siteName: siteConfig.name,
      title: siteConfig.title,
      description: siteConfig.description,
      images: [
        {
          url: '/opengraph-image',
          width: 1200,
          height: 630,
          alt: `${siteConfig.name} sosyal paylasim gorseli`
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: siteConfig.title,
      description: siteConfig.description,
      images: ['/opengraph-image']
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1
      }
    },
    other: {
      'geo.region': siteConfig.countryCode,
      'geo.placename': 'Turkey',
      'geo.position': `${siteConfig.coordinates.latitude};${siteConfig.coordinates.longitude}`,
      ICBM: `${siteConfig.coordinates.latitude}, ${siteConfig.coordinates.longitude}`
    }
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body className={inter.className}>
        <div className="flex min-h-screen flex-col">
          <div className="flex-1">{children}</div>
          <footer className="border-t border-gray-200 bg-white">
            <div className="mx-auto max-w-6xl px-4 py-6 text-center text-sm text-gray-600">
              <p>
                Faydali baglanti:{' '}
                <a
                  href="https://ufuksoynakliyat.com.tr/pendik-evden-eve-nakliyat"
                  rel="dofollow"
                  target="_blank"
                  className="font-medium text-blue-700 underline underline-offset-4 transition-colors hover:text-blue-800"
                  title="Pendik Evden Eve Nakliyat - Ufuksoy Nakliyat A.S."
                  aria-label="Pendik Evden Eve Nakliyat Firmasi Ufuksoy Nakliyat A.S."
                >
                  Pendik Evden Eve Nakliyat
                </a>{' '}
                Firmasi Ufuksoy Nakliyat A.S.
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
