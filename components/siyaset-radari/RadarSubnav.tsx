'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { RADAR_PAGES } from '@/lib/siyaset-radari/tabs'

export function RadarSubnav() {
  const pathname = usePathname()

  return (
    <nav aria-label="Siyaset Radarı bölümleri" className="flex flex-wrap gap-2 border-b border-border">
      {RADAR_PAGES.map((page) => {
        const active = pathname === page.href
        return (
          <Link
            key={page.href}
            href={page.href}
            aria-current={active ? 'page' : undefined}
            className={`border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
              active ? 'border-accent text-ink-primary' : 'border-transparent text-ink-secondary hover:text-ink-primary'
            }`}
          >
            {page.label}
          </Link>
        )
      })}
    </nav>
  )
}
