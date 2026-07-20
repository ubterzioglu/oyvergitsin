import { siteConfig } from '@/lib/site'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-brand-accent/30 bg-brand-ink text-white/80">
      <div className="mx-auto max-w-6xl px-4 py-3 text-center text-[11px] leading-relaxed text-white/50">
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
