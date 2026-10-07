'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'

const EXCLUDED_PREFIXES = ['/admin', '/survey', '/results', '/consent', '/api']

interface GoogleAnalyticsProps {
  gaId?: string
}

export function GoogleAnalytics({ gaId }: GoogleAnalyticsProps) {
  const pathname = usePathname()

  if (!gaId) {
    return null
  }

  // AGENTS.md kurali: Survey, results, consent, admin veya API route'larina ucuncu taraf analytics eklenmez.
  const isExcluded = EXCLUDED_PREFIXES.some((prefix) => pathname?.startsWith(prefix))
  if (isExcluded) {
    return null
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}');
        `}
      </Script>
    </>
  )
}
