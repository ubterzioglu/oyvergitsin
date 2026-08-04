import Link from 'next/link'
import { siteConfig } from '@/lib/site'
import { FeedbackButton } from '@/components/feedback/FeedbackButton'

const LEGAL_LINKS = [
  { href: '/legal/privacy-policy', label: 'Gizlilik Politikası' },
  { href: '/legal/terms-of-use', label: 'Kullanım Şartları' },
  { href: '/legal/kvkk-disclosure', label: 'KVKK Aydınlatma Metni' },
  { href: '/legal/cookie-policy', label: 'Çerez Politikası' },
]

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="select-none bg-ink-primary text-white/80">
      <div className="rainbow-gradient-border h-[2px] w-full" aria-hidden="true" />
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 pt-2 text-[11px] font-medium tracking-wide text-white/65">
        {LEGAL_LINKS.map((link, index) => (
          <span key={link.href} className="flex items-center gap-x-3">
            {index > 0 && <span className="h-3 w-px bg-white/15" aria-hidden="true" />}
            <Link
              href={link.href}
              className="underline underline-offset-4 transition-colors hover:text-rainbow-blue"
            >
              {link.label}
            </Link>
          </span>
        ))}
        <span className="flex items-center gap-x-3">
          <span className="h-3 w-px bg-white/15" aria-hidden="true" />
          <FeedbackButton className="underline underline-offset-4 transition-colors hover:text-rainbow-blue" />
        </span>
      </div>
      <div className="mx-auto mt-2 max-w-6xl border-t border-white/15 px-4 py-1 text-center text-[8px] leading-tight text-white/45">
        <span className="font-heading font-semibold text-white/80">{siteConfig.shortName}</span>
        {' · '}
        Türkiye Siyasi Eşleşme Platformu
        {' · '}
        Faydali baglanti:{' '}
        <a
          href="https://ufuksoynakliyat.com.tr/pendik-evden-eve-nakliyat"
          rel="dofollow"
          target="_blank"
          className="font-medium text-rainbow-blue underline underline-offset-4 transition-colors hover:text-rainbow-blue-hover"
          title="Pendik Evden Eve Nakliyat - Ufuksoy Nakliyat A.Ş."
          aria-label="Pendik Evden Eve Nakliyat Firması Ufuksoy Nakliyat A.Ş."
        >
          Pendik Evden Eve Nakliyat
        </a>{' '}
        Firması Ufuksoy Nakliyat A.Ş
        {' · '}
        <span>
          <a href="https://tekhurdametal.com/hurda-demir-fiyatlari/" rel="dofollow" className="font-medium text-rainbow-blue underline underline-offset-4 transition-colors hover:text-rainbow-blue-hover">
            Demir Hurda Fiyatları
          </a>{' '}
          Tek Hurda Metal
        </span>
        {' · '}
        <span>
          <a
            href="https://lionerotik.com/urunler/fetis-urunleri"
            rel="dofollow"
            className="font-medium text-rainbow-blue underline underline-offset-4 transition-colors hover:text-rainbow-blue-hover"
          >
            Antalya Erotik Shop
          </a>{' '}
          Lion Erotik
        </span>
        {' · '}
        <a
          href="https://tekhurdametal.com/beylikduzu-hurdaci/"
          rel="dofollow"
          target="_blank"
          className="font-medium text-rainbow-blue underline underline-offset-4 transition-colors hover:text-rainbow-blue-hover"
          title="Beylikdüzü Hurdacı - Tek Hurda Metal A.Ş."
          aria-label="Beylikdüzü Hurdacı Firması Tek Hurda Metal A.Ş."
        >
          Beylikdüzü Hurdacı
        </a>{' '}
        Firması Tek Hurda Metal A.Ş.
        {' · '}
        <a
          href="https://lionerotik.com/urunler/fetis-urunleri"
          rel="dofollow"
          target="_blank"
          className="font-medium text-rainbow-blue underline underline-offset-4 transition-colors hover:text-rainbow-blue-hover"
        >
          Antalya Erotik Shop
        </a>{' '}
        Lion Erotik
        {' · '}
        © {year} {siteConfig.shortName}. Tüm hakları saklıdır.
      </div>
    </footer>
  )
}
