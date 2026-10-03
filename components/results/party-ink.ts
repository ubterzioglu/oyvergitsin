/**
 * Parti rengi üzerine hangi metin renginin okunacağını hesaplar.
 *
 * NEDEN GEREKLİ: sonuç ekranı parti rozetlerine sabit `text-white` basıyordu.
 * Parti renkleri veri — tasarım token'ı değil — ve bazıları çok açık:
 *
 *   AKP      #F7941D  beyaz 2.28  ink  7.51
 *   MHP      #F2B705  beyaz 1.82  ink  9.42
 *   Memleket #FDD007  beyaz 1.48  ink 11.58
 *
 * Yani üç partinin rozetinde beyaz metin 3:1'in bile altında kalıyordu.
 * Renk veriden geldiği için tek doğru çözüm ön planı renge göre seçmek.
 *
 * Hesap çalışma anında yapılıyor, sabit tabloya yazılmıyor: parti listesi
 * değiştiğinde (yeni parti, renk güncellemesi) tablo bayatlar, hesap bayatlamaz.
 *
 * KAPSAM NOTU: bu yardımcı mantıken `lib/parties.ts`'e ait, ama orası B15'in
 * sahipliğinde değil ve paralel batch'lerle çakışırdı. Aynı sorun parti rengi
 * kullanan her yerde (B13'ün TBMM pasta grafiği etiketleri) geçerli —
 * sayfa batch'leri bitince `lib/parties.ts`'e taşınmalı.
 */

const INK_PRIMARY = '#191C1E'
const WHITE = '#FFFFFF'

function channelLuminance(channel: number): number {
  const c = channel / 255
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

function relativeLuminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16)
  return (
    0.2126 * channelLuminance((n >> 16) & 255) +
    0.7152 * channelLuminance((n >> 8) & 255) +
    0.0722 * channelLuminance(n & 255)
  )
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

/**
 * Verilen zemin üzerinde daha yüksek kontrast veren metin rengini döndürür.
 * Her zaman ikisinden iyi olanı seçer; hiçbir parti renginde ikisi birden
 * kötü değil (en düşük tepe değeri Zafer #00964C için 4.46).
 */
export function readableInkOn(background: string): string {
  return contrastRatio(WHITE, background) >= contrastRatio(INK_PRIMARY, background)
    ? WHITE
    : INK_PRIMARY
}
