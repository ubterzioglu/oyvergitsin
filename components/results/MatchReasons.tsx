import { Card } from '@/components/ui/Card'

interface AxisComparison {
  axisId: string
  axisName: string
  userScore: number
  partyScore: number
  impact: number
  weight: number
}

interface MatchReasonsProps {
  party: {
    partyName: string
    agreements: AxisComparison[]
    disagreements: AxisComparison[]
  }
  className?: string
}

/**
 * "Neden bu sonuç?" kartı (metodoloji raporu §9).
 *
 * Metin, puanlama matrisindeki doğrulanabilir farklardan üretilir; parti
 * hakkında serbest üretim yapan bir dil modeli kullanılmaz. Rapor bunu açıkça
 * şart koşuyor.
 *
 * Şemada parti konumu madde bazında değil EKSEN bazında tutulduğu için etki
 * eksen düzeyinde hesaplanır: impact = lambda_a * |kullanıcı_a - parti_a|.
 */
export function MatchReasons({ party, className = '' }: MatchReasonsProps) {
  return (
    <Card elevated className={className}>
      <h2 className="mb-1 font-heading text-2xl font-semibold text-ink-primary">Neden bu sonuç?</h2>
      <p className="mb-6 text-sm text-ink-secondary">
        {party.partyName} ile en çok örtüştüğünüz ve en çok ayrıştığınız konular.
      </p>

      <div className="grid gap-6 sm:grid-cols-2">
        <ComparisonList
          title="En çok örtüşen konular"
          accent="border-l-rainbow-green"
          items={party.agreements}
        />
        <ComparisonList
          title="En çok ayrışan konular"
          accent="border-l-rainbow-red"
          items={party.disagreements}
        />
      </div>
    </Card>
  )
}

function ComparisonList({
  title,
  accent,
  items,
}: {
  title: string
  accent: string
  items: AxisComparison[]
}) {
  if (items.length === 0) return null

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-ink-primary">{title}</h3>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.axisId} className={`border-l-4 ${accent} rounded-r bg-surface-muted px-3 py-2`}>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm text-ink-primary">{item.axisName}</span>
              {item.weight > 1 && (
                <span className="shrink-0 text-[11px] text-ink-muted">sizin için önemli</span>
              )}
            </div>
            <div className="mt-1 text-xs text-ink-secondary">
              siz {item.userScore} · parti {item.partyScore}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
