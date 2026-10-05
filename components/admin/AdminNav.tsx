'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogoutButton } from '@/components/admin/LogoutButton'

const NAV_LINKS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/responses', label: 'Cevaplar' },
  { href: '/admin/axes', label: 'Eksenler' },
  { href: '/admin/questions', label: 'Sorular' },
  { href: '/admin/parties', label: 'Partiler' },
  { href: '/admin/radar', label: 'Haberler' },
  { href: '/admin/siyaset-radari', label: 'Siyaset Radarı' },
  { href: '/admin/siyaset-radari/feed', label: 'Radar Akışı' },
  { href: '/admin/consent', label: 'Onay Metinleri' },
  { href: '/admin/feedback', label: 'Geri Bildirimler' },
]

const EXTERNAL_LINKS = [
  {
    href: 'https://search.google.com/search-console/performance/search-analytics?resource_id=sc-domain%3Aoyvergitsin.org&hl=de',
    label: 'Search Console',
  },
]

export function AdminNav() {
  const pathname = usePathname()

  if (pathname === '/admin/login') {
    return null
  }

  // Grafit zeminde opaklık bazlı renkler (text-white/80) ölçülemez kontrast
  // üretir; token kullanılır: border-strong grafitte 10.55 (AA), hover beyaz
  // 17.13. Odak halkası koyu zeminde beyaz + grafit offset.
  return (
    <nav className="bg-ink-primary shadow-elevated">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex items-center px-4">
              <Link
                href="/admin"
                className="rounded-sm font-heading text-xl font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink-primary"
              >
                Yönetim Paneli
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-sm text-border-strong hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink-primary"
                >
                  {link.label}
                </Link>
              ))}
              {EXTERNAL_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-sm text-border-strong hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink-primary"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="rounded-sm text-border-strong hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink-primary"
            >
              Ana Sayfa
            </Link>
            <LogoutButton />
          </div>
        </div>
      </div>
    </nav>
  )
}
