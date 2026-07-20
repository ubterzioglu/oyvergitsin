import Link from 'next/link'
import { siteConfig } from '@/lib/site'

const LEGAL_LINKS = [
  { href: '/legal/privacy-policy', label: 'Gizlilik Politikası' },
  { href: '/legal/terms-of-use', label: 'Kullanım Şartları' },
  { href: '/legal/kvkk-disclosure', label: 'KVKK Aydınlatma Metni' },
  { href: '/legal/cookie-policy', label: 'Çerez Politikası' },
]

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-brand-accent/30 bg-brand-ink text-white/80">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 pt-4 text-sm font-medium tracking-wide text-white/70">
        {LEGAL_LINKS.map((link, index) => (
          <span key={link.href} className="flex items-center gap-x-4">
            {index > 0 && <span className="h-4 w-px bg-white/20" aria-hidden="true" />}
            <Link
              href={link.href}
              className="underline underline-offset-4 transition-colors hover:text-brand-accent"
            >
              {link.label}
            </Link>
          </span>
        ))}
      </div>
      <div className="mx-auto max-w-6xl px-4 py-1.5 text-center text-[9px] leading-snug text-white/50">
        <span className="font-heading font-semibold text-white/80">{siteConfig.shortName}</span>
        {' · '}
        Türkiye Siyasi Eşleşme Platformu
        {' · '}
        Faydali baglanti:{' '}
        <a
          href="https://ufuksoynakliyat.com.tr/pendik-evden-eve-nakliyat"
          rel="dofollow"
          target="_blank"
          className="font-medium text-brand-accent underline underline-offset-4 transition-colors hover:text-brand-accent-hover"
          title="Pendik Evden Eve Nakliyat - Ufuksoy Nakliyat A.Ş."
          aria-label="Pendik Evden Eve Nakliyat Firması Ufuksoy Nakliyat A.Ş."
        >
          Pendik Evden Eve Nakliyat
        </a>{' '}
        Firması Ufuksoy Nakliyat A.Ş.
        {' · '}
        © {year} {siteConfig.shortName}. Tüm hakları saklıdır.
      </div>
    </footer>
  )
}
