import Image from 'next/image'
import Link from 'next/link'
import { siteConfig } from '@/lib/site'

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-brand-accent/30 bg-brand-ink">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.png" alt={siteConfig.shortName} width={36} height={36} priority />
          <span className="font-heading text-xl font-semibold text-white">
            {siteConfig.shortName}
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-white/80">
          <Link href="/consent" className="transition-colors hover:text-white">
            Anketi Başlat
          </Link>
        </nav>
      </div>
    </header>
  )
}
