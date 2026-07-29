import type { CoverageTier } from '@/lib/scoring/types'

interface CoverageBadgeProps {
  tier: CoverageTier
  answered: number
  total: number
}

/**
 * Eksen başına güven etiketi (metodoloji raporu §5.4).
 *
 * Yüksek: maddelerin >= %80'i yanıtlandı. Orta: %50-79. Düşük: < %50 —
 * bu eksen parti eşleşmesine dahil edilmez.
 */
const TIER_STYLES: Record<CoverageTier, { label: string; className: string }> = {
  high: { label: 'yüksek', className: 'bg-rainbow-green-tint text-ink-primary' },
  medium: { label: 'orta', className: 'bg-rainbow-yellow-tint text-ink-primary' },
  low: { label: 'düşük', className: 'bg-rainbow-red-tint text-ink-primary' },
  none: { label: 'yanıt yok', className: 'bg-surface-muted text-ink-muted' },
}

export function CoverageBadge({ tier, answered, total }: CoverageBadgeProps) {
  const style = TIER_STYLES[tier] ?? TIER_STYLES.none

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] ${style.className}`}
      title={`${answered}/${total} madde yanıtlandı`}
    >
      {style.label}
    </span>
  )
}
