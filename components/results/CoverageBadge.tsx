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
/**
 * Kademeler sıralı bir büyüklük (kapsama oranı), bu yüzden gökkuşağı
 * renkleri yerine scale-* rampası kullanılıyor: koyu = çok kapsama.
 *
 * B10 eski yeşil/sarı/kırmızı tint'leri nötr değerlere bağlamıştı; üçü de
 * neredeyse aynı açık griye düştüğü için kademeler GÖRSEL OLARAK AYIRT
 * EDİLEMEZ hâle gelmişti. Rampa bunu geri kazandırıyor.
 *
 * Rampanın komşu adımları birbirine yakın (1.32–1.39), bu yüzden renk TEK
 * ayırt edici değil: her rozet kendi metin etiketini ("yüksek" / "orta" /
 * "düşük") taşıyor ve title'da ham sayı var.
 *
 * Seçilen adımların kontrastı (11px = küçük metin, eşik 4.5):
 *   high   scale-5 #38737C + beyaz  ->  5.37
 *   medium scale-3 #769DA2 + ink    ->  5.80
 *   low    scale-1 #C6D2D3 + ink    -> 11.06
 *   none   surface-muted + ink-secondary -> 5.95
 * scale-4 bilerek atlandı: üzerine küçük metin konamıyor (ink 4.23 / beyaz 4.05).
 */
const TIER_STYLES: Record<CoverageTier, { label: string; className: string }> = {
  high: { label: 'yüksek', className: 'bg-scale-5 text-white' },
  medium: { label: 'orta', className: 'bg-scale-3 text-ink-primary' },
  low: { label: 'düşük', className: 'bg-scale-1 text-ink-primary' },
  // ink-muted idi: surface-muted üzerinde 4.22 veriyor, 11px küçük metinde
  // AA altı. ink-secondary ile 5.95.
  none: { label: 'yanıt yok', className: 'bg-surface-muted text-ink-secondary' },
}

export function CoverageBadge({ tier, answered, total }: CoverageBadgeProps) {
  const style = TIER_STYLES[tier] ?? TIER_STYLES.none

  return (
    <span
      className={`rounded-badge px-2 py-0.5 text-[11px] ${style.className}`}
      title={`${answered}/${total} madde yanıtlandı`}
    >
      {style.label}
    </span>
  )
}
