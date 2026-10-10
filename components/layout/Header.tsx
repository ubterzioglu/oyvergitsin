import Link from 'next/link'
import { siteConfig } from '@/lib/site'
import { RADAR_TABS, radarTabHref } from '@/lib/siyaset-radari/tabs'

// Linkler arasında dikey ayraç: divide-x her linkin soluna ince çizgi koyar.
const NAV_LINK_CLASS = 'px-3 leading-4 transition-colors hover:text-ink-primary'

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-heading text-lg font-bold leading-none text-ink-primary sm:text-xl">
            {siteConfig.shortName}
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-4 text-sm font-medium text-ink-secondary">
          <div className="flex items-center divide-x divide-border-strong">
            <Link href="/#nasil-calisir" className={NAV_LINK_CLASS}>
              Nasıl Çalışır
            </Link>
            <Link href="/#eksenler" className={NAV_LINK_CLASS}>
              İdeolojik Eksenler
            </Link>
            <Link href="/metodoloji" className={NAV_LINK_CLASS}>
              Metodoloji
            </Link>
            <Link href="/siyaset-radari" className={NAV_LINK_CLASS}>
              Siyaset Radarı
            </Link>
            {/* Radar sekmelerine kısayollar; dar ekranda menüyü taşırmasın diye yalnız lg+ */}
            {RADAR_TABS.map((tab) => (
              <Link key={tab.id} href={radarTabHref(tab.id)} className={`hidden lg:inline ${NAV_LINK_CLASS}`}>
                {tab.label}
              </Link>
            ))}
          </div>
          <Link
            href="/consent"
            className="rounded-button bg-accent px-4 py-2 font-semibold text-white shadow-sm transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            Anketi Başlat
          </Link>
        </nav>
      </div>
      <div className="bg-gradient-to-r from-accent via-scale-4 to-border-strong h-[3px] w-full" aria-hidden="true" />
    </header>
  )
}
