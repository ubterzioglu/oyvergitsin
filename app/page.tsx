import type { Metadata } from 'next'
import { siteConfig } from '@/lib/site'
import { Card } from '@/components/ui/Card'
import { Container } from '@/components/ui/Container'
import { NewsRadarSlideshow } from '@/components/home/NewsRadarSlideshow'
import { FeatureCard } from '@/components/home/FeatureCard'
import { StartSurveyLink } from '@/components/home/StartSurveyLink'
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
    title: 'Anketi Başlat',
    description: 'Açık rıza metnini onaylayarak anonim oturumunuzu başlatın.',
  },
  {
    number: '02',
    title: 'Soruları Yanıtla',
    description: 'İdeolojik eksenler üzerinden kısa sorulara samimi cevaplar verin.',
  },
  {
    number: '03',
    title: 'Sonuçları Gör',
    description: 'Size en yakın partileri ve eksen skorlarınızı görselleştirilmiş şekilde inceleyin.',
  },
]

// B10'un geçici olarak nötrlediği `RAINBOW_ACCENTS` dizisi burada kaldırıldı.
// Yön A tek vurgu rengi kullanıyor: kartlara sırayla renk dağıtan döngüsel
// accent kavramı artık yok. Renk yalnızca parti verisinde anlam taşır.

const TRUST_SIGNALS = [
  { title: 'Tamamen Anonim', description: 'Kimliğiniz veya iletişim bilgileriniz talep edilmez.', icon: '🕶️' },
  { title: 'Tarafsız Algoritma', description: 'Skorlama, herhangi bir partiye avantaj sağlamayan sabit kurallarla çalışır.', icon: '⚖️' },
  { title: 'Açık Kaynak', description: 'Eşleşme mantığı ve veri kullanımı şeffaf bir şekilde belgelenmiştir.', icon: '🔓' },
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
      <section className="relative overflow-hidden bg-ink-primary">
        {/*
          poster kaldırıldı: eski marka logosu (public/logo.png) siliniyor.
          Video yüklenene kadar bölümün kendi bg-ink-primary arka planı
          görünür, bu yüzden görsel boşluk oluşmuyor.
        */}
        <video
          className="absolute inset-0 h-full w-full object-cover motion-reduce:hidden"
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
        >
          <source src="/videos/hero-bg.mp4" type="video/mp4" />
        </video>
        <Container className="relative py-24 md:py-32">
          {/*
            Panel eskiden yarı saydamdı (from-white/80 to-white/60 + blur) ve
            metin ink-primary/80 ile /65 opaklıkta yazılıyordu. Arkasında oynayan
            video olduğu için metnin gerçek zemini kare kare değişiyordu: kontrast
            ölçülemez, dolayısıyla AA garanti edilemezdi. Panel opak yüzey
            token'ına alındı, metin opaklık yerine ink token'larıyla ifade edildi —
            artık ölçülebilir: 17.13 ve 6.38.
          */}
          <div className="mx-auto max-w-2xl rounded-card border border-border bg-surface-card p-8 text-center shadow-elevated md:p-14">
            <h1 className="font-heading text-5xl font-semibold text-ink-primary md:text-6xl">
              oyvergitsin.org
            </h1>
            <p className="mt-6 text-xl text-ink-primary">
              Türkiye Siyasi Eşleşme Platformu
            </p>
            <p className="mt-4 text-lg text-ink-secondary">
              Siyasi görüşlerinizi anonim ve kısa bir anketle analiz edin; tarafsız bir
              eşleşme mantığıyla size en yakın partileri keşfedin.
            </p>
            <div className="mt-10 flex justify-center gap-4">
              <StartSurveyLink />
            </div>
          </div>
        </Container>
      </section>

      {/* Hero under-section Slider */}
      <NewsRadarSlideshow />

      <section id="nasil-calisir" className="bg-surface py-24 relative overflow-hidden">
        {/* Subtle decorative gradient */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-32 bg-accent/5 blur-[100px] pointer-events-none rounded-full" />
        
        <Container className="relative z-10">
          <h2 className="text-center font-heading text-3xl font-semibold text-ink-primary">
            Nasıl Çalışır?
          </h2>
          <div className="mx-auto mt-12 grid max-w-4xl gap-6">
            {STEPS.map((step) => (
              <Card
                key={step.number}
                className="transition-all duration-300 hover:border-border-strong hover:shadow-elevated"
              >
                {/* Adım numarası bir veri etiketi: mono + tabular. */}
                <span className="data-figure text-3xl font-semibold text-accent">
                  {step.number}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-ink-primary">{step.title}</h3>
                <p className="mt-2 text-sm text-ink-secondary">{step.description}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-white py-20">
        <Container>
          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-3">
            {TRUST_SIGNALS.map((signal) => (
              <FeatureCard
                key={signal.title}
                icon={signal.icon}
                title={signal.title}
                body={signal.description}
              />
            ))}
          </div>
        </Container>
      </section>

      <section id="eksenler" className="bg-surface py-24 relative">
        <Container>
          <h2 className="text-center font-heading text-3xl font-semibold text-ink-primary">
            {ideologicalAxes.length} İdeolojik Eksen
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-ink-secondary">
            Anket, Türkiye siyasetini yansıtan {ideologicalAxes.length} ideolojik eksende sorular
            içerir. Her eksende verdiğiniz cevaplar, partilerin bu eksenlerdeki konumlarıyla
            karşılaştırılır.
          </p>
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {ideologicalAxes.map((axis) => (
              <FeatureCard
                key={axis.slug}
                icon={axis.icon}
                title={axis.name}
                body={axis.description}
              />
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-white py-24 relative border-t border-border">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-surface to-white opacity-50" />
        <Container className="relative z-10">
          <h2 className="text-center font-heading text-3xl font-semibold text-ink-primary">
            Sıkça Sorulan Sorular
          </h2>
          <div className="mx-auto mt-12 max-w-3xl space-y-4">
            {faqItems.map((item) => (
              <FeatureCard
                key={item.question}
                icon={item.icon}
                title={item.question}
                body={item.answer}
              />
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-white py-16">
        <Container className="text-center">
          <h2 className="font-heading text-2xl font-semibold text-ink-primary">
            Siyasi duruşunuzu birkaç dakikada keşfedin
          </h2>
          <div className="mt-8">
            <StartSurveyLink />
          </div>
        </Container>
      </section>
    </main>
  )
}
