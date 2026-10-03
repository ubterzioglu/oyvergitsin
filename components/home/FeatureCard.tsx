import { Card } from '@/components/ui/Card'

interface FeatureCardProps {
  icon: string
  title: string
  // Eksen açıklaması veritabanından geliyor ve null olabilir. Eski kodda
  // doğrudan JSX'e basılıyordu, yani null sessizce boş paragraf üretiyordu.
  // Burada açıkça ele alınıyor: açıklama yoksa paragraf hiç render edilmiyor.
  body: string | null
}

/**
 * Ana sayfadaki üç ızgara (güven sinyalleri, ideolojik eksenler, SSS) aynı
 * kart yapısını kullanıyordu; üçü de ayrı ayrı yazılmıştı. Tek yerde toplandı.
 *
 * Eski hâlinde her kart `RAINBOW_ACCENTS` dizisinden sırayla bir renk alıyor,
 * onu inline style ile üst kenarlığa ve ikon zeminine basıyordu. "Kamusal
 * Ekran" tek vurgu rengi kullanıyor — döngüsel accent kavramı kalktı, renk
 * artık yalnızca parti verisinde anlam taşıyor. Kartlar birbirinden renkle
 * değil 1px kenarlıkla ayrışıyor; gölge yalnızca hover'da.
 */
export function FeatureCard({ icon, title, body }: FeatureCardProps) {
  return (
    <Card className="group transition-all duration-300 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-elevated">
      <div className="flex items-start gap-4">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-card bg-accent-tint text-lg"
          aria-hidden="true"
        >
          {icon}
        </span>
        <div>
          <h3 className="text-base font-semibold text-ink-primary">{title}</h3>
          {body && <p className="mt-2 text-sm text-ink-secondary">{body}</p>}
        </div>
      </div>
    </Card>
  )
}
