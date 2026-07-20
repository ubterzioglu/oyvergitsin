import type { Metadata, Viewport } from 'next'
import { Inter, Source_Serif_4 } from 'next/font/google'
import Script from 'next/script'
import { getSiteUrl, siteConfig } from '@/lib/site'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-body' })
const sourceSerif = Source_Serif_4({ subsets: ['latin'], variable: '--font-heading' })

export const viewport: Viewport = {
  themeColor: siteConfig.themeColor,
  width: 'device-width',
  initialScale: 1
}

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
    manifest: '/manifest.webmanifest',
    alternates: {
      canonical: '/',
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
      countryName: siteConfig.countryName
    },
    twitter: {
      card: 'summary_large_image',
      title: siteConfig.title,
      description: siteConfig.description
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
      'geo.region': siteConfig.geoRegion,
      'geo.placename': siteConfig.geoPlacename,
      'geo.position': `${siteConfig.coordinates.latitude};${siteConfig.coordinates.longitude}`,
      ICBM: `${siteConfig.coordinates.latitude}, ${siteConfig.coordinates.longitude}`,
      'content-language': siteConfig.language,
      language: siteConfig.language
    }
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const siteUrl = getSiteUrl()
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: siteUrl,
        name: siteConfig.name,
        description: siteConfig.description,
        inLanguage: siteConfig.language,
        areaServed: {
          '@type': 'Country',
          name: siteConfig.countryName,
          alternateName: 'Turkiye'
        }
      },
      {
        '@type': 'Organization',
        '@id': `${siteUrl}/#organization`,
        name: siteConfig.name,
        url: siteUrl,
        description: siteConfig.description,
        location: {
          '@type': 'Place',
          name: siteConfig.geoPlacename,
          geo: {
            '@type': 'GeoCoordinates',
            latitude: Number(siteConfig.coordinates.latitude),
            longitude: Number(siteConfig.coordinates.longitude)
          },
          address: {
            '@type': 'PostalAddress',
            addressCountry: siteConfig.countryCode
          }
        }
      },
      {
        '@type': 'WebApplication',
        '@id': `${siteUrl}/#webapp`,
        name: siteConfig.name,
        url: siteUrl,
        description: siteConfig.description,
        applicationCategory: 'PoliticsApplication',
        operatingSystem: 'Web',
        isAccessibleForFree: true,
        inLanguage: siteConfig.language,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'TRY'
        }
      }
    ]
  }

  return (
    <html lang="tr">
      <body className={`${inter.variable} ${sourceSerif.variable} font-body`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "xpckj8ftyr");
          `}
        </Script>
        <div className="flex min-h-screen flex-col">
          <Header />
          <div className="flex-1">{children}</div>
          <Footer />
        </div>
      </body>
    </html>
  )
}
