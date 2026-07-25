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
    <footer className="bg-ink-primary text-white/80">
      <div className="rainbow-gradient-border h-[3px] w-full" aria-hidden="true" />
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 pt-4 text-sm font-medium tracking-wide text-white/70">
        {LEGAL_LINKS.map((link, index) => (
          <span key={link.href} className="flex items-center gap-x-4">
            {index > 0 && <span className="h-4 w-px bg-white/20" aria-hidden="true" />}
            <Link
              href={link.href}
              className="underline underline-offset-4 transition-colors hover:text-rainbow-blue"
            >
              {link.label}
            </Link>
          </span>
        ))}
        <span className="flex items-center gap-x-4">
          <span className="h-4 w-px bg-white/20" aria-hidden="true" />
          <FeedbackButton className="underline underline-offset-4 transition-colors hover:text-rainbow-blue" />
        </span>
      </div>
      <div className="mx-auto mt-4 max-w-6xl border-t border-white/20 px-4 py-1.5 text-center text-[9px] leading-snug text-white/50">
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
        Firması Ufuksoy Nakliyat A.Ş.
        {' · '}
        <span>
          <a href="https://tekhurdametal.com/istanbul-hurdaci/" rel="dofollow" className="font-medium text-rainbow-blue underline underline-offset-4 transition-colors hover:text-rainbow-blue-hover">
            İstanbul Hurdacı
          </a>{' '}
          Firması Tek Hurda Metal A.Ş
        </span>
        {' · '}
        <span>
          <a href="https://tekhurdametal.com/hurda-fiyatlari/" rel="dofollow" className="font-medium text-rainbow-blue underline underline-offset-4 transition-colors hover:text-rainbow-blue-hover">
            Hurda Fiyatları
          </a>{' '}
          Tek Hurda Metal
        </span>
        {' · '}
        <span>
          <a href="https://tekhurdametal.com/hurda-demir-fiyatlari/" rel="dofollow" className="font-medium text-rainbow-blue underline underline-offset-4 transition-colors hover:text-rainbow-blue-hover">
            Demir Hurda Fiyatları
          </a>{' '}
          Tek Hurda Metal
        </span>
        {' · '}
        <span>
          <a href="https://tekhurdametal.com/beylikduzu-hurdaci/" rel="dofollow" className="font-medium text-rainbow-blue underline underline-offset-4 transition-colors hover:text-rainbow-blue-hover">
            Beylikdüzü Hurdacı
          </a>{' '}
          Firması Tek Hurda Metal A.Ş
        </span>
        {' · '}
        <span>
          <a href="https://lionerotik.com/urunler/fetis-urunleri" rel="dofollow" className="font-medium text-rainbow-blue underline underline-offset-4 transition-colors hover:text-rainbow-blue-hover">
            Antalya Sex Shop
          </a>{' '}
          Lion Erotik
        </span>
        {' · '}
        <span>
          <a href="https://lionerotik.com/urunler/fetis-urunleri" rel="dofollow" className="font-medium text-rainbow-blue underline underline-offset-4 transition-colors hover:text-rainbow-blue-hover">
            Antalya Erotik Shop
          </a>{' '}
          Lion Erotik
        </span>
        {' · '}
        <span>
          <a href="https://lionerotik.com/urunler/fetis-urunleri" rel="dofollow" className="font-medium text-rainbow-blue underline underline-offset-4 transition-colors hover:text-rainbow-blue-hover">
            Antalya Seks Shop
          </a>{' '}
          Lion Erotik
        </span>
        {' · '}
        © {year} {siteConfig.shortName}. Tüm hakları saklıdır.
      </div>
    </footer>
  )
}
