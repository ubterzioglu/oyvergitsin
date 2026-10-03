/**
 * Radar sayfalarında paylaşılan sınıf dizileri.
 *
 * Yalnızca görünüm; yerleşim (mt-*, block, inline-flex) çağrı yerinde
 * veriliyor ki aynı stil farklı bağlamlarda kullanılabilsin.
 */

/**
 * Kaynak/dış bağlantı.
 *
 * Odak halkası bilinçli: devir belgesi §6.2'ye göre bu sayfalarda klavye
 * odağı görünmüyordu. `focus-visible` kullanılıyor, yani fareyle tıklayanda
 * halka çıkmıyor, Tab ile gezende çıkıyor.
 *
 * accent (#0E6E7D) beyaz üzerinde 5.92:1 — küçük metin için AA.
 */
export const SOURCE_LINK_CLASS =
  'rounded-badge font-medium text-accent underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2'
