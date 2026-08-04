import Link from 'next/link'
import { siteConfig } from '@/lib/site'

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-heading text-lg font-bold leading-none text-ink-primary sm:text-xl">
            {siteConfig.shortName}
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-ink-secondary">
          <Link href="/siyaset-radari" className="transition-colors hover:text-ink-primary">
            Siyaset Radarı
          </Link>
          <Link href="/consent" className="transition-colors hover:text-ink-primary">
            Anketi Başlat
          </Link>
        </nav>
      </div>
      <div className="rainbow-gradient-border h-[3px] w-full" aria-hidden="true" />
    </header>
  )
}
