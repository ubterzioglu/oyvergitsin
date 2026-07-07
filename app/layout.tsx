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
      <body className={inter.className}>{children}</body>
    </html>
  )
}
