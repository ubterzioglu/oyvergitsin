'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogoutButton } from '@/components/admin/LogoutButton'

const NAV_LINKS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/axes', label: 'Eksenler' },
  { href: '/admin/questions', label: 'Sorular' },
  { href: '/admin/parties', label: 'Partiler' },
  { href: '/admin/consent', label: 'Onay Metinleri' },
]

const EXTERNAL_LINKS = [
  { href: 'https://clarity.microsoft.com/projects/view/xpckj8ftyr/gettingstarted', label: 'Clarity' },
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

  return (
    <nav className="bg-brand-ink shadow-md">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex items-center px-4">
              <Link href="/admin" className="font-heading text-xl font-semibold text-white">
                Yönetim Paneli
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              {NAV_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className="text-white/80 hover:text-white">
                  {link.label}
                </Link>
              ))}
              {EXTERNAL_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/80 hover:text-white"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-white/60 hover:text-white">
              Ana Sayfa
            </Link>
            <LogoutButton />
          </div>
        </div>
      </div>
    </nav>
  )
}
