import { PARTY_COLORS } from '@/lib/parties'

/**
 * Radar grafiklerinde parti dilimlerini gerçek parti renkleriyle boyar.
 *
 * NEDEN BU DOSYA VAR — devir belgesi §6.2'nin B13 maddesi:
 * Dashboard'daki `COLORS` dizisi dilimleri sırayla boyuyordu, yani bir
 * partinin dilimi başka bir partinin markasıyla renklenebiliyordu. Renk
 * burada veri; kabuk değil. `lib/parties.ts` tek doğru kaynak.
 *
 * İŞİN ZORLUĞU — ad biçimleri üç ayrı yerden geliyor ve hiçbiri uyuşmuyor:
 *   `PARTY_COLORS` anahtarları     : kısa ad       → "AKP", "YENİ PARTİ"
 *   `parties` tablosundaki `name`  : resmî ad      → "Adalet ve Kalkınma Partisi"
 *   TBMM'den yazılan `party_name`  : BÜYÜK resmî ad → "ADALET VE KALKINMA PARTİSİ"
 *
 * `election_results_by_area.party_name` ham metin sütunu; `public-data.ts`
 * parti kayıt defterine join atmıyor ve o dosya başka bir batch'in
 * sahipliğinde. Bu yüzden eşleme burada, sunum katmanında yapılıyor.
 *
 * Doğru çözüm uzun vadede `party_aliases` tablosu üzerinden join (migration
 * 012 bu tabloyu getiriyor ama canlıya henüz uygulanmadı). O geldiğinde bu
 * dosyadaki ALIAS tablosu silinebilir.
 */

/** Türkçe duyarlı; "İYİ PARTİ" ile "İyi Parti" aynı anahtara iner. */
function normalize(name: string): string {
  return name.toLocaleLowerCase('tr-TR').replace(/[^\p{L}\p{N}]+/gu, '')
}

/**
 * Resmî/uzun ad → `PARTY_COLORS` anahtarı.
 *
 * TBMM sandalye dağılımı sayfasındaki 16 satırın tamamı ve `parties`
 * tablosundaki 13 kaydın resmî adları buradan karşılanıyor.
 */
const NAME_ALIASES: Record<string, string> = {
  'adalet ve kalkınma partisi': 'AKP',
  'cumhuriyet halk partisi': 'CHP',
  'milliyetçi hareket partisi': 'MHP',
  'iyi parti': 'İYİ',
  'demokrasi ve atılım partisi': 'DEVA',
  'gelecek partisi': 'Gelecek',
  'saadet partisi': 'Saadet',
  'türkiye işçi partisi': 'TİP',
  'vatan partisi': 'Vatan',
  'zafer partisi': 'Zafer',
  'memleket partisi': 'Memleket',
  'yeni parti': 'YENİ PARTİ',
  // DEM, YSP'nin devamı; `lib/parties.ts`'te her iki anahtar da var
  // (design/shell ekledi — eski snapshot'lar YSP'ye, güncel veri DEM'e
  // bakıyor, ikisi de aynı marka rengi #0F7A3A).
  'halkların eşitlik ve demokrasi partisi': 'DEM',
  dem: 'DEM',
  'dem parti': 'DEM',
}

/**
 * Marka rengi olmayan partiler için nötr rampa (`scale-1..6`).
 *
 * Açık/koyu dönüşümlü sıralandı: komşu dilimler rampadaki yan yana
 * adımlara düşmesin. Rampanın komşu adımları yalnızca 1.32–1.39 kontrast
 * veriyor (devir belgesi §6.3), bu yüzden renk TEK başına ayırt edici
 * bırakılmıyor — grafiklerde her dilimin metin etiketi var.
 */
const NEUTRAL_RAMP = ['#1D616B', '#C6D2D3', '#55868E', '#9BB6B9', '#38737C', '#769DA2']

const DIRECT_INDEX = new Map(
  Object.entries(PARTY_COLORS).map(([shortName, color]) => [normalize(shortName), color])
)

const ALIAS_INDEX = new Map(
  Object.entries(NAME_ALIASES).map(([fullName, shortName]) => [normalize(fullName), shortName])
)

/** Partinin marka rengi; yoksa `null`. */
export function resolvePartyColor(partyName: string): string | null {
  const key = normalize(partyName)

  const direct = DIRECT_INDEX.get(key)
  if (direct) {
    return direct
  }

  const shortName = ALIAS_INDEX.get(key)
  if (shortName) {
    return DIRECT_INDEX.get(normalize(shortName)) ?? null
  }

  return null
}

/**
 * Bir grafikteki tüm dilimlere renk atar.
 *
 * Marka rengi olanlar kendi rengini alır. Olmayanlar (bağımsızlar ve
 * küçük partiler) nötr rampadan **giriş sırasına göre** boyanır — rastgele
 * değil, aynı veri aynı rengi versin diye.
 */
export function assignPartyColors(partyNames: string[]): string[] {
  let neutralIndex = 0

  return partyNames.map((name) => {
    const brandColor = resolvePartyColor(name)
    if (brandColor) {
      return brandColor
    }

    const fallback = NEUTRAL_RAMP[neutralIndex % NEUTRAL_RAMP.length]
    neutralIndex += 1
    return fallback
  })
}

/**
 * Uzun resmî adları grafik etiketi için kısaltır.
 * "ADALET VE KALKINMA PARTİSİ" → "AKP". Karşılığı yoksa ad olduğu gibi döner.
 */
export function toPartyShortName(partyName: string): string {
  const key = normalize(partyName)

  if (DIRECT_INDEX.has(key)) {
    return partyName
  }

  const shortName = ALIAS_INDEX.get(key)
  if (shortName) {
    return shortName
  }

  return partyName
}
