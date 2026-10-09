import Link from 'next/link'

interface PlayfulCtaProps {
  label?: string
  tone?: 'accent' | 'light'
}

// Tek odak durağı: halka doğrudan <a> üzerinde (StartSurveyLink ile aynı ilke).
// Sert gölge + basılınca çöken buton, "damga basma" hissini verir.
const BASE =
  'group inline-flex items-center gap-3 rounded-full border-2 border-ink-primary px-8 py-4 text-lg font-extrabold shadow-[4px_4px_0_0_#191C1E] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_#191C1E] active:translate-x-1 active:translate-y-1 active:shadow-none motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-4'

const TONE_CLASSES = {
  accent: 'bg-accent text-white focus-visible:ring-ink-primary',
  light: 'bg-white text-ink-primary focus-visible:ring-white focus-visible:ring-offset-accent',
}

export function PlayfulCta({ label = 'Anketi başlat', tone = 'accent' }: PlayfulCtaProps) {
  return (
    <Link href="/consent" className={`${BASE} ${TONE_CLASSES[tone]}`}>
      <span aria-hidden="true" className="text-2xl transition-transform group-hover:-rotate-12">
        🗳️
      </span>
      {label}
    </Link>
  )
}
