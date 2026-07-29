// Parti konumlarının v1 (10 eksen) modelinden v2 (8 eksen) modeline türetilmesi.
//
// KRİTİK: v1'in kutup konvansiyonu birkaç eksende v2'nin tam tersidir. İşaret
// çevirmeleri atlanırsa tüm parti eşleşmesi sessizce ters döner. Aşağıdaki
// tabloda her dönüşümün yönü açıkça yazılıdır.
//
// v1 kutup konvansiyonu:  docs/party-positions-2026-update.md
// v2 kutup tanımları:     scripts/data/axis-model-v2.js
// Gerekçe dokümanı:       docs/party-positions-v2-derivation.md

/**
 * v1 skor matrisi — docs/party-positions-2026-update.md ve
 * docs/new-party-2026-research.md dosyalarından birebir alınmıştır.
 * Kaynak rapor: yeni_deep-research-report.md (20 Temmuz 2026).
 */
const V1_SCORES = {
  AKP: {
    economy_market_state: 55, income_distribution: 20, civil_liberties: -45, security_state: 60,
    secularism: 55, identity_migration: 40, foreign_policy: 60, eu_relations: 35,
    education_social_policy: 35, environment_growth: 45,
  },
  CHP: {
    economy_market_state: -25, income_distribution: 55, civil_liberties: 55, security_state: -15,
    secularism: -35, identity_migration: -30, foreign_policy: -25, eu_relations: -55,
    education_social_policy: -40, environment_growth: -30,
  },
  YSP: {
    economy_market_state: -50, income_distribution: 80, civil_liberties: 85, security_state: -60,
    secularism: -20, identity_migration: -75, foreign_policy: -40, eu_relations: -30,
    education_social_policy: -60, environment_growth: -85,
  },
  MHP: {
    economy_market_state: 40, income_distribution: 15, civil_liberties: -55, security_state: 75,
    secularism: 45, identity_migration: 70, foreign_policy: 55, eu_relations: 60,
    education_social_policy: 30, environment_growth: 25,
  },
  'İYİ': {
    economy_market_state: -35, income_distribution: -10, civil_liberties: 50, security_state: 10,
    secularism: 10, identity_migration: 20, foreign_policy: 15, eu_relations: -10,
    education_social_policy: -45, environment_growth: -15,
  },
  Saadet: {
    economy_market_state: 15, income_distribution: 45, civil_liberties: 40, security_state: 20,
    secularism: 60, identity_migration: 30, foreign_policy: 45, eu_relations: 20,
    education_social_policy: 20, environment_growth: 5,
  },
  Gelecek: {
    economy_market_state: -20, income_distribution: 15, civil_liberties: 60, security_state: -20,
    secularism: -15, identity_migration: -10, foreign_policy: -35, eu_relations: -50,
    education_social_policy: 0, environment_growth: -55,
  },
  DEVA: {
    economy_market_state: -45, income_distribution: 10, civil_liberties: 65, security_state: -25,
    secularism: -25, identity_migration: -20, foreign_policy: -30, eu_relations: -40,
    education_social_policy: -20, environment_growth: -35,
  },
  'YENİ PARTİ': {
    economy_market_state: 25, income_distribution: 65, civil_liberties: 75, security_state: 5,
    secularism: -45, identity_migration: -25, foreign_policy: -30, eu_relations: -60,
    education_social_policy: -55, environment_growth: -45,
  },
}

/**
 * v2 `kimlik` ekseni v1 `identity_migration`dan farklı olarak yerel özerkliği
 * de kapsıyor. yeni_deep-research-report.md'deki "Yerel yönetimler" satırından
 * okunan düzeltmeler. Pozitif değer daha güçlü yerelleşme talebi demektir.
 */
const LOCAL_AUTONOMY_ADJUSTMENT = {
  AKP: -5,           // "merkezi koordinasyon baskın"
  CHP: 10,           // "katılımcı ve güçlü belediyecilik"
  YSP: 10,           // "yerelleşme ve özerklik şartı"
  MHP: -5,           // "hizmet kapasitesi artışı", genel çerçeve merkeziyetçi
  'İYİ': 20,         // "çerçeve kanun, katılımcı mahalli idare"
  Saadet: 20,        // "görev devri ve yerel güçlenme"
  Gelecek: 15,       // "yetki devri ve demokratik yerellik"
  DEVA: 10,          // "yerel kalkınma ve veri-temelli koordinasyon"
  'YENİ PARTİ': 10,  // güçlü Meclis + yerel demokrasi vurgusu
}

/**
 * v2 `goc` ekseni v1'de bağımsız değildi; göç kimlikle aynı eksene sıkışmıştı.
 *
 * İlk turda bu eksen `identity_migration`dan türetilmişti. O türetme şu
 * varsayıma dayanıyordu: "Kürt kimliği konusunda çoğulcu olan parti, göç
 * konusunda da korumacıdır." Kaynak taraması bu varsayımın tutmadığını
 * gösterdi — özellikle CHP ve İYİ Parti'de türetilen değerler yönü bile
 * yanlıştı (CHP +15 çıkmıştı, gerçek konum -45).
 *
 * Aşağıdaki değerler doğrudan kaynak kodlamasıdır. Kaynak taraması:
 * 29 Temmuz 2026. Ayrıntılı gerekçe: docs/party-positions-v2-derivation.md
 *
 * SINIR: Bu tek kodlayıcılı bir kodlamadır. Metodoloji raporu §6 iki bağımsız
 * kodlayıcı ve kodlayıcılar arası güvenirlik ölçümü istiyor; o adım yapılmadı.
 */
const MIGRATION_SHRINKAGE = 0.5

const MIGRATION_DIRECT = {
  'İYİ': {
    score: -80,
    rationale:
      'Kodlanan partiler arasında en kısıtlayıcı çizgi: üç yıl içinde zorunlu geri dönüş hedefi, "hiçbir koşulda vatandaşlık verilmemesi", ilçe bazlı %10 kota önerisi ve uyuma açık karşıtlık. Türkçe eğitimi yalnızca dönüş öncesi geçici tedbir olarak konumlandırılıyor.',
  },
  MHP: {
    score: -65,
    rationale:
      'Parti söyleminde düzensiz göç "isimsiz işgal" ve "demografik yapıya karşı komplo" olarak tanımlanıyor; Suriye\'ye gidip dönenlerin girişinin engellenmesi talep ediliyor. Resmî çizgi Suriye\'de huzur sağlandığında gönüllü dönüş olduğu için İYİ Parti\'nin gerisinde konumlandırıldı.',
  },
  CHP: {
    score: -45,
    rationale:
      '2015\'teki uyum odaklı çerçeve (göç ve uyum bakanlığı, coğrafi çekincenin kaldırılması, işgücüne katılım) terk edildi; güncel çizgi iki yıl içinde geri gönderme taahhüdü ve "Suriyelilerden başlayarak tüm göçmenleri geri göndermekte kararlıyız" ifadesi. Ancak bu "ırkçılık, ayrımcılık veya düşmanlık olmadan" ve hukuk çerçevesinde tanımlandığı için zorunlu dönüş savunan partilerden ayrıldı.',
  },
  AKP: {
    score: -40,
    rationale:
      'Resmî politika "gönüllü, güvenli ve onurlu geri dönüş"; sınır dışı etme reddediliyor ama güvenli bölgelere milyonluk dönüş hedefi ve kuzey Suriye\'de yerleşim modeli var. Nüfusu barındırmayı sürdüren, yönetimsel ve dönüş odaklı çizgi.',
  },
  DEVA: {
    score: -30,
    rationale:
      'Sığınma hakkı olmayan düzensiz göçmenlerin sınır dışı edilmesi; geçici koruma altındakiler için ise uluslararası işbirliğiyle Suriye\'nin güvenli hale getirilmesi, üçüncü ülkelere yerleştirme ve yük paylaşımı öneriliyor. Tek taraflı dönüşten çok çok taraflı ve hukuki çerçeve.',
  },
  Gelecek: {
    score: -30,
    rationale:
      'Millet İttifakı Ortak Politikalar Mutabakat Metni\'ne taraf: Suriyelilerin "en kısa sürede, iç hukuk ve uluslararası hukuka uygun olarak" geri gönderilmesi. Partiye özgü daha sert bir çizgi tespit edilmedi; kurumsal ve hukuk temelli çerçeve.',
  },
  Saadet: {
    score: -25,
    rationale:
      'Aynı ortak mutabakat metnine taraf, dolayısıyla dönüş odaklı. Milli Görüş geleneğindeki dayanışma vurgusu söylemi diğer ittifak ortaklarına göre bir miktar yumuşatıyor; partiye özgü kısıtlayıcı bir politika belgesi bulunamadı.',
  },
  'YENİ PARTİ': {
    score: -25,
    rationale:
      'Program hak temelli dili korurken düzensiz göçe sıfır tolerans, sınır güvenliği ve gönüllü geri dönüş politikalarını içeriyor. "Gönüllü" vurgusu, CHP\'nin güncel "hepsini göndereceğiz" çizgisinden daha ölçülü bir konum veriyor.',
  },
  YSP: {
    score: 75,
    rationale:
      'Kodlanan partiler arasında tek koruma yanlısı çizgi (HDP–Yeşil Sol–DEM hattı): zorla geri göndermeye ve "gönüllü dönüş" adı altındaki uygulamalara açık karşıtlık, geri gönderme merkezlerinin kapatılması, Cenevre Sözleşmesi\'ndeki coğrafi çekincenin kaldırılması, kalanlara mülteci statüsü, eşit işe eşit ücret ve sendika hakkı, çok dilli hizmet ve belediye bütçelerinin vatandaşlığa değil ikamet eden nüfusa göre dağıtılması.',
  },
}

/** Yarıyı sıfırdan uzağa yuvarlar; Math.round negatiflerde asimetriktir. */
function roundHalfAwayFromZero(value) {
  return Math.sign(value) * Math.round(Math.abs(value))
}

function mean(...values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function clamp(value) {
  return Math.max(-100, Math.min(100, value))
}

/**
 * v2 eksenlerinin her biri için dönüşüm kuralı.
 * `invert` alanı yalnızca belgeleme amaçlıdır; hesap `derive` içindedir.
 */
const DERIVATIONS = [
  {
    slug: 'ekonomi',
    from: ['economy_market_state', 'income_distribution'],
    invert: false,
    confidence: 'orta',
    note:
      'İki v1 ekseninin ortalaması. Kutup yönü aynı (+ = müdahaleci / yeniden dağıtımcı). ' +
      'Bileşik eksen olduğu için devlet yönlendirmesi güçlü ama yeniden dağıtımı sınırlı ' +
      'partilerde (AKP, MHP) iki bileşen ayrışır; bu maddeler elden geçirilmelidir.',
    derive: (v1) => mean(v1.economy_market_state, v1.income_distribution),
  },
  {
    slug: 'demokrasi',
    from: ['civil_liberties', 'security_state'],
    invert: true,
    confidence: 'orta',
    note:
      'v1 civil_liberties ile v1 security_state birleştirildi. security_state İŞARET ÇEVRİLDİ: ' +
      'v1de + = güçlü merkezi güvenlik aygıtı, v2de + = çoğulcu denetim.',
    derive: (v1) => mean(v1.civil_liberties, -v1.security_state),
  },
  {
    slug: 'sekulerizm',
    from: ['secularism'],
    invert: true,
    confidence: 'yüksek',
    note: 'İŞARET ÇEVRİLDİ: v1de + = dinin kamusal etkisi güçlü, v2de + = laik/tarafsız devlet.',
    derive: (v1) => -v1.secularism,
  },
  {
    slug: 'kimlik',
    from: ['identity_migration'],
    invert: true,
    confidence: 'orta',
    note:
      'İŞARET ÇEVRİLDİ (v1de + = milliyetçi/kısıtlayıcı, v2de + = çoğulcu tanınma). ' +
      'v2 ekseni yerel özerkliği de kapsadığı için rapordaki yerel yönetim duruşuna göre düzeltildi.',
    derive: (v1, shortName) => -v1.identity_migration + (LOCAL_AUTONOMY_ADJUSTMENT[shortName] ?? 0),
  },
  {
    slug: 'goc',
    from: [],
    invert: false,
    confidence: 'orta',
    note:
      'YENİ EKSEN. v1 skorundan türetilmedi; parti programları, ittifak mutabakat metinleri ' +
      've resmî açıklamalar taranarak doğrudan kodlandı (kaynak taraması 29 Temmuz 2026). ' +
      'Tek kodlayıcılıdır; ikinci bağımsız kodlayıcı incelemesi yapılmadı.',
    derive: (v1, shortName) => {
      const direct = MIGRATION_DIRECT[shortName]
      if (direct) return direct.score
      // Kaynak kodlaması olmayan bir parti eklenirse eski türetmeye düşülür ve
      // belirsizlik nedeniyle merkeze çekilir; confidenceFor bunu "düşük"
      // olarak işaretler.
      return -v1.identity_migration * MIGRATION_SHRINKAGE
    },
    confidenceFor: (shortName) => (MIGRATION_DIRECT[shortName] ? 'orta' : 'düşük'),
  },
  {
    slug: 'sosyal',
    from: ['education_social_policy'],
    invert: true,
    confidence: 'orta',
    note:
      'İŞARET ÇEVRİLDİ: v1de + = seçici/aile merkezli, v2de + = evrensel sosyal yatırım. ' +
      'v2 ekseni toplumsal cinsiyet boyutunu da kapsıyor; bu bileşen v1de ayrı ölçülmemişti.',
    derive: (v1) => -v1.education_social_policy,
  },
  {
    slug: 'cevre',
    from: ['environment_growth'],
    invert: true,
    confidence: 'yüksek',
    note: 'İŞARET ÇEVRİLDİ: v1de + = büyüme önceliği, v2de + = ekolojik koruma.',
    derive: (v1) => -v1.environment_growth,
  },
  {
    slug: 'dis',
    from: ['foreign_policy', 'eu_relations'],
    invert: true,
    confidence: 'yüksek',
    note:
      'İki v1 ekseninin ortalaması alınıp İŞARET ÇEVRİLDİ: v1de + = stratejik özerklik / ABye ' +
      'mesafeli, v2de + = AB yönelimli ve çok taraflı.',
    derive: (v1) => -mean(v1.foreign_policy, v1.eu_relations),
  },
]

/**
 * Tüm partiler için v2 konumlarını üretir.
 *
 * @returns {Array<{ shortName: string, axisSlug: string, score: number,
 *                   confidence: string, note: string, sourceAxes: string[] }>}
 */
function deriveAllPositions() {
  const rows = []

  for (const [shortName, v1] of Object.entries(V1_SCORES)) {
    for (const derivation of DERIVATIONS) {
      rows.push({
        shortName,
        axisSlug: derivation.slug,
        score: clamp(roundHalfAwayFromZero(derivation.derive(v1, shortName))),
        confidence: derivation.confidenceFor?.(shortName) ?? derivation.confidence,
        note: MIGRATION_DIRECT[shortName]?.rationale && derivation.slug === 'goc'
          ? MIGRATION_DIRECT[shortName].rationale
          : derivation.note,
        sourceAxes: derivation.from,
        isDirectlyCoded: derivation.slug === 'goc' && Boolean(MIGRATION_DIRECT[shortName]),
      })
    }
  }

  return rows
}

module.exports = {
  V1_SCORES,
  DERIVATIONS,
  LOCAL_AUTONOMY_ADJUSTMENT,
  MIGRATION_DIRECT,
  MIGRATION_SHRINKAGE,
  deriveAllPositions,
  roundHalfAwayFromZero,
}
