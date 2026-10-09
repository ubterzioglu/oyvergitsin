import type { Metadata } from 'next'
import { siteConfig } from '@/lib/site'
import { Container } from '@/components/ui/Container'
import { NewsRadarSlideshow } from '@/components/home/NewsRadarSlideshow'
import { Hero } from '@/components/home/Hero'
import { PlayfulCta } from '@/components/home/PlayfulCta'
import { FaqList } from '@/components/home/FaqList'
import { getPlatformFacts, type PlatformAxis, type PlatformParty } from '@/lib/geo/platform-facts'

// Eksen ve parti listeleri veritabanındaki AKTİF modelden okunur. Sayfa
// tamamen statik üretilirse model değiştiğinde bayat kalır; saatlik yeniden
// doğrulama bunu sınırlar. (Metodoloji sayfası aynı sebeple force-dynamic;
// orada bayatlık doğrudan şeffaflık sorunu olduğu için daha katı.)
export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Turkiye Siyasi Eslesme Testi',
  description:
    'Turkiye\'de siyasi gorusunuzu ideolojik eksenlerde kisa bir anketle analiz edin; size en yakin partileri tarafsiz, anonim ve ucretsiz bir eslesme testiyle gorun.',
  alternates: {
    canonical: '/'
  },
  keywords: [...siteConfig.keywords, 'turkiye siyasi eslesme testi']
}

const STEPS = [
  {
    number: '01',
    title: 'Anketi başlat',
    description: 'Açık rıza metnini onayla, anonim oturumun açılsın.',
  },
  {
    number: '02',
    title: 'Soruları yanıtla',
    description: 'Kısa sorulara içinden geldiği gibi cevap ver.',
  },
  {
    number: '03',
    title: 'Sonucu gör',
    description: 'Sana en yakın partileri ve eksen skorlarını grafiklerle incele.',
  },
]

// B10'un geçici olarak nötrlediği `RAINBOW_ACCENTS` dizisi burada kaldırıldı.
// Yön A tek vurgu rengi kullanıyor: kartlara sırayla renk dağıtan döngüsel
// accent kavramı artık yok. Renk yalnızca parti verisinde anlam taşır.

const TRUST_SIGNALS = [
  { title: 'Tamamen anonim', description: 'Kimliğin veya iletişim bilgilerin istenmez.', icon: '🕶️' },
  { title: 'Tarafsız algoritma', description: 'Skorlama, hiçbir partiye avantaj sağlamayan sabit kurallarla çalışır.', icon: '⚖️' },
  { title: 'Açık kaynak', description: 'Eşleşme mantığı ve veri kullanımı şeffaf biçimde belgelenmiştir.', icon: '🔓' },
]

// Eksen adları ve açıklamaları artık veritabanından geliyor; burada yalnızca
// sunum katmanı (ikon) kalıyor. Önceden tüm liste sabit kodluydu ve aktif
// model v2'ye geçtikten sonra ana sayfa hâlâ v1'in eksenlerini — "AB
// İlişkileri", "Gelir Dağılımı" gibi artık var olmayanları — gösteriyordu.
const AXIS_ICON_BY_SLUG: Record<string, string> = {
  ekonomi: '📈',
  demokrasi: '🏛️',
  sekulerizm: '⚖️',
  kimlik: '🌍',
  goc: '🧭',
  sosyal: '🎓',
  cevre: '🌱',
  dis: '🤝'
}

const FALLBACK_AXIS_ICON = '🔎'

interface DecoratedAxis extends PlatformAxis {
  icon: string
}

function decorateAxes(axes: PlatformAxis[]): DecoratedAxis[] {
  return axes.map((axis) => ({
    ...axis,
    icon: AXIS_ICON_BY_SLUG[axis.slug] ?? FALLBACK_AXIS_ICON
  }))
}

function formatPartyList(parties: PlatformParty[]): string {
  const labels = parties.map((party) => party.shortName || party.name)

  if (labels.length === 0) {
    return 'Türkiye\'deki başlıca partiler'
  }

  return labels.join(', ')
}

// SSS metinleri de aktif modelden besleniyor: eksen sayısı ve parti listesi
// elle yazıldığı için bayatlamıştı ("12 parti", "Yeşil Sol Parti"). Yanlış
// sayı FAQPage JSON-LD üzerinden üretken arama motorlarının yanıtlarına
// olduğu gibi geçiyor.
function buildFaqItems(axisCount: number, parties: PlatformParty[]) {
  return [
  {
    question: 'oyvergitsin.org nedir?',
    answer:
      'oyvergitsin.org, Türkiye\'deki seçmenlerin siyasi görüşlerini kısa ve anonim bir anketle analiz ederek hangi siyasi partiye ne kadar yakın olduklarını gösteren tarafsız bir siyasi eşleşme platformudur.',
    icon: '❓',
  },
  {
    question: 'Anket ne kadar sürer?',
    answer:
      `${axisCount} ideolojik eksen üzerinden hazırlanmış kısa sorulardan oluşur ve birkaç dakika içinde tamamlanabilir.`,
    icon: '⏱️',
  },
  {
    question: 'Verilerim anonim mi tutuluyor?',
    answer:
      'Evet. Anket tamamen anonimdir; ad, e-posta veya telefon gibi kimliğinizi ortaya çıkaracak herhangi bir bilgi talep edilmez.',
    icon: '🔒',
  },
  {
    question: 'Eşleşme sonucu nasıl hesaplanıyor?',
    answer:
      'Cevaplarınızdan her ideolojik eksen için bir puan hesaplanır ve bu puanlar Türkiye\'deki siyasi partilerin eksen pozisyonlarıyla karşılaştırılır. Sonuçta her parti için bir benzerlik yüzdesi elde edilir. Algoritma sabit kurallıdır ve herhangi bir partiye avantaj sağlamaz.',
    icon: '📊',
  },
  {
    question: 'Hangi partiler karşılaştırmaya dahil?',
    answer:
      `Karşılaştırmaya şu partiler dahildir: ${formatPartyList(parties)}.`,
    icon: '🤝',
  },
  ]
}

export default async function Home() {
  const facts = await getPlatformFacts()
  const ideologicalAxes = decorateAxes(facts.axes)
  const faqItems = buildFaqItems(facts.axes.length, facts.parties)

  const faqStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
      <Hero />

      {/* Hero under-section Slider */}
      <NewsRadarSlideshow />

      <section id="nasil-calisir" className="bg-surface py-20 md:py-24">
        <Container>
          <h2 className="text-center font-heading text-3xl font-black tracking-tight text-ink-primary md:text-4xl">
            Nasıl çalışıyor?
          </h2>
          <div className="mx-auto mt-12 grid max-w-5xl gap-8 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <div
                key={step.number}
                className={`rounded-3xl border-2 border-ink-primary bg-white p-7 shadow-[5px_5px_0_0_#191C1E] transition-transform duration-200 hover:rotate-0 motion-reduce:transition-none ${
                  index % 2 === 0 ? 'md:-rotate-1' : 'md:rotate-1'
                }`}
              >
                <span className="data-figure flex h-12 w-12 items-center justify-center rounded-full border-2 border-ink-primary bg-accent text-xl font-bold text-white">
                  {step.number}
                </span>
                <h3 className="mt-5 text-xl font-extrabold text-ink-primary">{step.title}</h3>
                <p className="mt-2 text-ink-secondary">{step.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-ink-primary py-16">
        <Container>
          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
            {TRUST_SIGNALS.map((signal) => (
              <div key={signal.title} className="text-center md:text-left">
                <span className="text-4xl" aria-hidden="true">
                  {signal.icon}
                </span>
                <h3 className="mt-3 text-lg font-extrabold text-white">{signal.title}</h3>
                <p className="mt-1 text-white/80">{signal.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section id="eksenler" className="bg-surface py-20 md:py-24">
        <Container>
          <h2 className="text-center font-heading text-3xl font-black tracking-tight text-ink-primary md:text-4xl">
            {ideologicalAxes.length} eksende nerede duruyorsun?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-ink-secondary">
            Her eksende verdiğin cevaplar, partilerin o eksendeki konumlarıyla karşılaştırılır.
          </p>
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {ideologicalAxes.map((axis, index) => (
              <div
                key={axis.slug}
                className={`flex items-start gap-4 rounded-2xl border-2 border-ink-primary p-5 shadow-[4px_4px_0_0_#191C1E] transition-transform duration-200 hover:-translate-y-1 motion-reduce:transition-none ${
                  index % 3 === 0 ? 'bg-accent-tint' : 'bg-white'
                }`}
              >
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-ink-primary bg-white text-2xl"
                  aria-hidden="true"
                >
                  {axis.icon}
                </span>
                <div>
                  <h3 className="text-lg font-extrabold text-ink-primary">{axis.name}</h3>
                  {axis.description && <p className="mt-1 text-ink-secondary">{axis.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-t-2 border-ink-primary bg-white py-20 md:py-24">
        <Container>
          <h2 className="text-center font-heading text-3xl font-black tracking-tight text-ink-primary md:text-4xl">
            Aklına takılanlar
          </h2>
          <FaqList items={faqItems} />
        </Container>
      </section>

      <section className="bg-surface py-16 md:py-20">
        <Container>
          <div className="mx-auto max-w-3xl rounded-[2rem] border-2 border-ink-primary bg-accent p-10 text-center shadow-[8px_8px_0_0_#191C1E] md:p-14">
            <h2 className="font-heading text-3xl font-black tracking-tight text-white text-balance md:text-4xl">
              Duruşunu birkaç dakikada keşfet
            </h2>
            <div className="mt-8">
              <PlayfulCta tone="light" />
            </div>
          </div>
        </Container>
      </section>
    </main>
  )
}
