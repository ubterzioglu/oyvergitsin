// Türkiye Siyasi Eksen Modeli v2 — içerik tanımı.
//
// Kaynak: resultdeepresearch.html §3 (boyut önerisi) ve §4 (kodlanabilir örnek
// soru seti). Eksen adları, kutup tanımları ve soru metinleri rapordan birebir
// alınmıştır; puanlama şeması rapordaki ±25 / ±12 / 0 Likert kalıbıdır.
//
// Bu dosya yalnızca veridir; DB'ye yazma işi scripts/seed-axis-model-v2.js'te.

const AXIS_MODEL = {
  name: 'Türkiye Siyasi Eksen Modeli v2',
  version: 'v2',
}

const AXES = [
  {
    slug: 'ekonomi',
    name: 'Ekonomik Model ve Yeniden Dağıtım',
    description:
      'Ekonomik kaynakların piyasa mı yoksa devlet eliyle mi yönlendirileceği ve vergi-transfer yoluyla yeniden dağıtımın kapsamı.',
    pole_negative: 'Piyasa ağırlıklı, düşük vergi ve sınırlı devlet müdahalesi',
    pole_positive: 'Müdahaleci, yeniden dağıtımcı ve kamu yatırımı ağırlıklı yaklaşım',
    order_index: 1,
  },
  {
    slug: 'demokrasi',
    name: 'Demokratik Kurumlar ve Hukukun Üstünlüğü',
    description:
      'Yürütme yetkisinin sınırları, yargı bağımsızlığı, kuvvetler ayrılığı ve temel hak ve özgürlüklerin güvencesi.',
    pole_negative: 'Yürütme gücünün merkezileşmesi ve çoğunlukçu yönetim',
    pole_positive: 'Kuvvetler ayrılığı, yargı bağımsızlığı ve çoğulcu denetim',
    order_index: 2,
  },
  {
    slug: 'sekulerizm',
    name: 'Sekülerizm ve Dinin Kamusal Rolü',
    description:
      'Din ile devlet arasındaki ilişki; dini referansların kamu politikası ve eğitim üzerindeki etkisi.',
    pole_negative: 'Dinin kamusal düzen ve kamu politikalarında daha belirleyici olması',
    pole_positive: 'Devletin dinler karşısında tarafsız ve laik hukukla sınırlı olması',
    order_index: 3,
  },
  {
    slug: 'kimlik',
    name: 'Kimlik, Kürt Meselesi ve Yerel Özerklik',
    description:
      'Etnik ve kültürel kimliklerin tanınması, anadil hakları ve merkezî idare ile yerel yönetimler arasındaki yetki dengesi.',
    pole_negative: 'Üniter-merkeziyetçi ve asimilasyoncu yaklaşım',
    pole_positive: 'Çoğulcu tanınma, kültürel haklar ve daha güçlü yerel özerklik',
    order_index: 4,
  },
  {
    slug: 'goc',
    name: 'Göç ve Sığınmacı Politikası',
    description:
      'Sığınmacıların hukuki statüsü, geri dönüş politikaları ve uyum hizmetlerine ayrılan kaynak.',
    pole_negative: 'Kısıtlayıcı, geri dönüş öncelikli yaklaşım',
    pole_positive: 'Koruma, uyum ve koşullu kalıcı statü yaklaşımı',
    order_index: 5,
  },
  {
    slug: 'sosyal',
    name: 'Refah, Eğitim, Toplumsal Cinsiyet ve Aile',
    description:
      'Sosyal politikanın evrensel mi hedefli mi olacağı, eğitim müfredatının yönü ve toplumsal cinsiyet ile aile politikaları.',
    pole_negative: 'Geleneksel aile merkezli ve hedefli sosyal yardım yaklaşımı',
    pole_positive: 'Evrensel sosyal yatırım, kamusal hizmet ve toplumsal cinsiyet eşitliği',
    order_index: 6,
  },
  {
    slug: 'cevre',
    name: 'Çevre ve Kalkınma',
    description:
      'Ekonomik büyüme ve yatırım öncelikleri ile ekolojik koruma ve iklim hedefleri arasındaki denge.',
    pole_negative: 'Büyüme, altyapı ve yatırım öncelikli yaklaşım',
    pole_positive: 'Ekolojik koruma, iklim dönüşümü ve çevresel sınırlama',
    order_index: 7,
  },
  {
    slug: 'dis',
    name: 'Dış Politika, Güvenlik Yönelimi ve Avrupa',
    description:
      'Türkiye’nin Batı kurumlarıyla ilişkisi, AB süreci ve stratejik özerklik ile çok taraflı işbirliği arasındaki tercih.',
    pole_negative: 'Egemenlikçi stratejik özerklik ve Batı kurumlarından mesafe',
    pole_positive: 'AB yönelimli, kurumsal uyum ve çok taraflı işbirliği',
    order_index: 8,
  },
]

// 5'li Likert seçenekleri. `no_opinion` kasıtlı olarak `neutral`den ayrıdır:
// nötr gerçek bir 0 puandır ve paydaya girer, "fikrim yok" ise puanlamadan
// tamamen dışlanır (rapor §5.1).
const LIKERT_OPTIONS = [
  { value: 'strongly_disagree', text: 'Kesinlikle katılmıyorum' },
  { value: 'disagree', text: 'Katılmıyorum' },
  { value: 'neutral', text: 'Kararsızım' },
  { value: 'agree', text: 'Katılıyorum' },
  { value: 'strongly_agree', text: 'Kesinlikle katılıyorum' },
  { value: 'no_opinion', text: 'Fikrim yok' },
]

// Maddenin maksimum mutlak katkısı M_i.
const LIKERT_MAX_CONTRIBUTION = 25

// Düz kodlanmış (reversed: false) bir maddede "kesinlikle katılıyorum" eksenin
// +100 ucuna doğru iter. Ters kodlanmış maddede işaretler çevrilir.
const LIKERT_SCORES = {
  strongly_agree: 25,
  agree: 12,
  neutral: 0,
  disagree: -12,
  strongly_disagree: -25,
}

// 24 puanlanan madde: eksen başına 3, her eksende en az bir ters kodlanmış
// madde var (rapor §7: "aynı eksende hem artı hem eksi anahtarlı maddeler
// dengeli biçimde bulunmalı").
const QUESTIONS = [
  {
    code: 'ekonomi_1',
    axis: 'ekonomi',
    text: 'Büyük şirketler ve yüksek gelir grupları için vergi oranları artırılmalıdır.',
    reversed: false,
  },
  {
    code: 'ekonomi_2',
    axis: 'ekonomi',
    text: 'Stratejik sektörlerde devlet mülkiyeti ve kamu yatırımı artırılmalıdır.',
    reversed: false,
  },
  {
    code: 'ekonomi_3',
    axis: 'ekonomi',
    text: 'Asgari ücret artışları, enflasyonla mücadele gerekçesiyle daha sınırlı tutulmalıdır.',
    reversed: true,
  },
  {
    code: 'demokrasi_1',
    axis: 'demokrasi',
    text: 'Cumhurbaşkanının yetkileri azaltılarak Meclis ve yargı denetimi güçlendirilmelidir.',
    reversed: false,
  },
  {
    code: 'demokrasi_2',
    axis: 'demokrasi',
    text: 'Terörle mücadele gerekçesiyle ifade ve protesto özgürlüğüne daha geniş sınırlamalar getirilebilir.',
    reversed: true,
  },
  {
    code: 'demokrasi_3',
    axis: 'demokrasi',
    text: 'Seçilmiş belediye başkanları, kesin yargı kararı olmadan görevden alınmamalıdır.',
    reversed: false,
  },
  {
    code: 'sekulerizm_1',
    axis: 'sekulerizm',
    text: 'Zorunlu din kültürü dersleri seçimlik hale getirilmelidir.',
    reversed: false,
  },
  {
    code: 'sekulerizm_2',
    axis: 'sekulerizm',
    text: 'Diyanet’in kamu politikaları üzerindeki rolü genişletilmelidir.',
    reversed: true,
  },
  {
    code: 'sekulerizm_3',
    axis: 'sekulerizm',
    text: 'Kamuda kararlar dini referanslardan bağımsız, laik hukuk çerçevesinde alınmalıdır.',
    reversed: false,
  },
  {
    code: 'kimlik_1',
    axis: 'kimlik',
    text: 'Kamu hizmetlerinde Türkçeden başka dillerin kullanımına daha fazla imkân tanınmalıdır.',
    reversed: false,
  },
  {
    code: 'kimlik_2',
    axis: 'kimlik',
    text: 'Yerel yönetimlere daha fazla idari ve mali özerklik verilmelidir.',
    reversed: false,
  },
  {
    code: 'kimlik_3',
    axis: 'kimlik',
    text: 'Kimlik ve terör riski gerekçesiyle merkezî idarenin yerel yönetimler üzerindeki denetimi artırılmalıdır.',
    reversed: true,
  },
  {
    code: 'goc_1',
    axis: 'goc',
    text: 'Suriyelilerin ve diğer sığınmacıların hızlı geri dönüşü devlet politikası olmalıdır.',
    reversed: true,
  },
  {
    code: 'goc_2',
    axis: 'goc',
    text: 'Uzun süredir Türkiye’de yaşayan ve belirli koşulları sağlayan sığınmacılara kademeli kalıcı statü verilmelidir.',
    reversed: false,
  },
  {
    code: 'goc_3',
    axis: 'goc',
    text: 'Belediyeler göçmenlere yönelik eğitim ve uyum hizmetlerine daha fazla kaynak ayırmalıdır.',
    reversed: false,
  },
  {
    code: 'sosyal_1',
    axis: 'sosyal',
    text: 'Devlet kreşleri ve bakım hizmetleri ülke genelinde hızla yaygınlaştırılmalıdır.',
    reversed: false,
  },
  {
    code: 'sosyal_2',
    axis: 'sosyal',
    text: 'Aile politikalarında kadının asli rolü annelik olarak görülmelidir.',
    reversed: true,
  },
  {
    code: 'sosyal_3',
    axis: 'sosyal',
    text: 'Devlet okullarında bilimsel ve eleştirel düşünmeyi güçlendiren müfredat öncelik olmalıdır.',
    reversed: false,
  },
  {
    code: 'cevre_1',
    axis: 'cevre',
    text: 'Maden ve enerji projelerinde çevresel itirazlar karşısında yatırım süreçleri hızlandırılmalıdır.',
    reversed: true,
  },
  {
    code: 'cevre_2',
    axis: 'cevre',
    text: 'İklim hedefleri için fosil yakıt teşvikleri kademeli olarak kaldırılmalıdır.',
    reversed: false,
  },
  {
    code: 'cevre_3',
    axis: 'cevre',
    text: 'Su havzaları ve tarım arazileri, ekonomik büyüme pahasına da olsa daha sıkı korunmalıdır.',
    reversed: false,
  },
  {
    code: 'dis_1',
    axis: 'dis',
    text: 'Türkiye’nin AB ile üyelik ve uyum süreci yeniden stratejik öncelik haline getirilmelidir.',
    reversed: false,
  },
  {
    code: 'dis_2',
    axis: 'dis',
    text: 'Türkiye dış politikada Batı kurumlarından bağımsız, daha sert ve özerk bir çizgi izlemelidir.',
    reversed: true,
  },
  {
    code: 'dis_3',
    axis: 'dis',
    text: 'NATO ve Avrupa kurumlarıyla güvenlik işbirliği Türkiye’nin güvenliği için vazgeçilmezdir.',
    reversed: false,
  },
]

// Dikkat kontrolü (rapor §3: "1–2 adet"). Skor üretmez, yalnızca kalite bayrağı.
const ATTENTION_CHECK = {
  code: 'dikkat_1',
  text: 'Bu bir dikkat kontrolüdür. Lütfen "Katılmıyorum" seçeneğini işaretleyin.',
  description: 'Anketin dikkatle doldurulduğunu doğrulamak için kullanılır; sonucunuzu etkilemez.',
  expected_value: 'disagree',
}

/**
 * Anket sırası: her eksenden birinci maddeler, sonra ikinciler, dikkat
 * kontrolü, sonra üçüncüler. Aynı eksenin maddeleri arka arkaya gelmediği için
 * cevap alışkanlığı (response set) etkisi azalır.
 *
 * @returns {Array<{ code: string, axis: string|null, text: string, reversed: boolean|null,
 *                   type: string, is_scored: boolean, order_index: number,
 *                   description?: string, expected_value?: string }>}
 */
function buildOrderedQuestions() {
  const byRound = [1, 2, 3].map((round) =>
    AXES.map((axis) => QUESTIONS.find((q) => q.code === `${axis.slug}_${round}`)).filter(Boolean)
  )

  const ordered = [
    ...byRound[0],
    ...byRound[1],
    {
      ...ATTENTION_CHECK,
      axis: null,
      reversed: null,
      type: 'attention_check',
      is_scored: false,
    },
    ...byRound[2],
  ]

  return ordered.map((question, index) => ({
    type: 'likert_5',
    is_scored: true,
    ...question,
    order_index: index + 1,
  }))
}

/**
 * Bir madde için scoring_rules satırlarını üretir. `no_opinion` için satır
 * yazılmaz — kuralı olmayan cevap motorda hem paydan hem paydadan düşer.
 *
 * @param {{ reversed: boolean }} question
 * @returns {Array<{ answer_value: string, score_modifier: number }>}
 */
function buildScoringRules(question) {
  const sign = question.reversed ? -1 : 1

  return Object.entries(LIKERT_SCORES).map(([answer_value, score]) => ({
    answer_value,
    score_modifier: sign * score,
  }))
}

module.exports = {
  AXIS_MODEL,
  AXES,
  QUESTIONS,
  ATTENTION_CHECK,
  LIKERT_OPTIONS,
  LIKERT_SCORES,
  LIKERT_MAX_CONTRIBUTION,
  buildOrderedQuestions,
  buildScoringRules,
}
