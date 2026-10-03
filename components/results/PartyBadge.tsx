import { getPartyColor } from '@/lib/parties'
import { readableInkOn } from './party-ink'

interface PartyBadgeProps {
  shortName: string
  size: 'sm' | 'lg'
}

const SIZE_CLASSES = {
  sm: 'h-10 w-10',
  lg: 'h-24 w-24',
} as const

/**
 * Kısaltma uzunluğuna göre yazı boyutu.
 *
 * Sabit boyutta ("Gelecek", "Saadet", "YENİ PARTİ" gibi) uzun kısaltmalar
 * daireden taşıyor ve kırpılmış görünüyordu. Boyut uzunlukla küçülüyor,
 * metin ortalanıp gerekirse satır kırıyor.
 */
function textClass(size: 'sm' | 'lg', length: number): string {
  if (size === 'lg') {
    if (length <= 4) return 'text-2xl'
    if (length <= 7) return 'text-lg'
    return 'text-sm'
  }
  if (length <= 4) return 'text-sm'
  if (length <= 7) return 'text-[10px]'
  return 'text-[9px]'
}

/**
 * Parti kısaltmasını parti renginde bir daire içinde gösterir.
 *
 * Metin rengi sabit değil, zemine göre hesaplanıyor (bkz. party-ink.ts):
 * sabit beyaz, açık renkli partilerde 1.48'e kadar düşüyordu.
 *
 * `aria-hidden`: kısaltma, yanında tam adı zaten yazan partinin görsel
 * tekrarı. Ekran okuyucuya iki kez okutmanın değeri yok; dahası en kötü
 * durumda (Zafer #00964C, ink 4.46) küçük metin AA eşiğinin hemen altında
 * kalıyor — erişilebilir ad, kartın kendi metnindeki tam parti adıdır ve
 * o ink-primary ile 17.13 kontrastta.
 */
export function PartyBadge({ shortName, size }: PartyBadgeProps) {
  const background = getPartyColor(shortName)

  return (
    <div
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full px-1 text-center font-bold leading-[1.05] ${SIZE_CLASSES[size]} ${textClass(size, shortName.length)}`}
      style={{ backgroundColor: background, color: readableInkOn(background) }}
    >
      {shortName}
    </div>
  )
}
