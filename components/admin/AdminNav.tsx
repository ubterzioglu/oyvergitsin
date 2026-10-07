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
    <nav className="border-b border-border-strong/20 bg-ink-primary shadow-elevated">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-3 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
          {/* Logo / Başlık */}
          <Link
            href="/admin"
            className="shrink-0 whitespace-nowrap font-heading text-base font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink-primary sm:text-lg"
          >
            Yönetim Paneli
          </Link>

          {/* Dikey ayraç */}
          <div className="h-5 w-[1px] shrink-0 bg-white/20" aria-hidden="true" />

          {/* Menü Linkleri (Tek satır, dikey ayraçlı) */}
          <div className="flex items-center overflow-x-auto py-1 scrollbar-none [scrollbar-width:none]">
            <div className="flex items-center text-xs sm:text-sm font-medium text-border-strong">
              {NAV_LINKS.map((link, idx) => (
                <div key={link.href} className="flex items-center">
                  {idx > 0 && (
                    <span className="mx-2 text-white/20 select-none" aria-hidden="true">
                      |
                    </span>
                  )}
                  <Link
                    href={link.href}
                    className="whitespace-nowrap transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-1 focus-visible:ring-offset-ink-primary"
                  >
                    {link.label}
                  </Link>
                </div>
              ))}

              {EXTERNAL_LINKS.map((link) => (
                <div key={link.href} className="flex items-center">
                  <span className="mx-2 text-white/20 select-none" aria-hidden="true">
                    |
                  </span>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="whitespace-nowrap transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-1 focus-visible:ring-offset-ink-primary"
                  >
                    {link.label}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sağ Taraf: Ana Sayfa & Çıkış */}
        <div className="ml-3 flex shrink-0 items-center text-xs sm:text-sm font-medium text-border-strong">
          <div className="mr-3 h-5 w-[1px] bg-white/20" aria-hidden="true" />
          <Link
            href="/"
            className="whitespace-nowrap transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-1 focus-visible:ring-offset-ink-primary"
          >
            Ana Sayfa
          </Link>
          <span className="mx-2 text-white/20 select-none" aria-hidden="true">
            |
          </span>
          <div className="whitespace-nowrap">
            <LogoutButton />
          </div>
        </div>
      </div>
    </nav>
  )
}
