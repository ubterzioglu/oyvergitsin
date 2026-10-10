import Link from 'next/link'

interface PlayfulCtaProps {
  label?: string
  tone?: 'accent' | 'light'
}

// Tek odak durağı: halka doğrudan <a> üzerinde (StartSurveyLink ile aynı ilke).
// Sert gölge + basılınca çöken buton, "damga basma" hissini verir.
const BASE =
  'group inline-flex items-center gap-4 rounded-2xl border-2 border-ink-primary py-3 pl-3 pr-7 text-lg font-extrabold shadow-[0_4px_0_0_#191C1E] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_6px_0_0_#191C1E] active:translate-y-1 active:shadow-none motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-4'

const TONE_CLASSES = {
  accent: 'bg-accent text-white focus-visible:ring-ink-primary',
  light: 'bg-white text-ink-primary focus-visible:ring-white focus-visible:ring-offset-accent',
}

const ICON_TONE_CLASSES = {
  accent: 'bg-white text-accent',
  light: 'bg-accent text-white',
}

// Emoji yerine satır içi SVG: işletim sistemine göre soluk gri görünüyordu.
// Onay işareti: "oy ver" jestini tek bakışta okutur, hover'da hafif büyür.
function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="transition-transform duration-150 group-hover:scale-110">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  )
}

export function PlayfulCta({ label = 'Anketi başlat', tone = 'accent' }: PlayfulCtaProps) {
  return (
    <Link href="/consent" className={`${BASE} ${TONE_CLASSES[tone]}`}>
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${ICON_TONE_CLASSES[tone]}`}>
        <CheckIcon />
      </span>
      {label}
    </Link>
  )
}
