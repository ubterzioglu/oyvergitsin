import type { Metadata } from 'next'
import Link from 'next/link'
import { siteConfig } from '@/lib/site'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Container } from '@/components/ui/Container'
import { Badge } from '@/components/ui/Badge'

export const metadata: Metadata = {
  title: 'Turkiye Siyasi Eslesme Testi',
  description:
    'Turkiye\'de siyasi gorusunuzu 10 ideolojik eksende kisa bir anketle analiz edin; size en yakin partileri tarafsiz, anonim ve ucretsiz bir eslesme testiyle gorun.',
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
    description: '10 ideolojik eksen üzerinden kısa sorulara samimi cevaplar verin.',
  },
  {
    number: '03',
    title: 'Sonuçları Gör',
    description: 'Size en yakın partileri ve eksen skorlarınızı görselleştirilmiş şekilde inceleyin.',
  },
]

const TRUST_SIGNALS = [
  { title: 'Tamamen Anonim', description: 'Kimliğiniz veya iletişim bilgileriniz talep edilmez.' },
  { title: 'Tarafsız Algoritma', description: 'Skorlama, herhangi bir partiye avantaj sağlamayan sabit kurallarla çalışır.' },
  { title: 'Açık Kaynak', description: 'Eşleşme mantığı ve veri kullanımı şeffaf bir şekilde belgelenmiştir.' },
]

const IDEOLOGICAL_AXES = [
  { name: 'Ekonomi: Piyasa vs Devlet', description: 'Ekonomik kararların piyasa mekanizmaları mı yoksa devlet müdahalesi mi ile yönetilmesi gerektiği' },
  { name: 'Gelir Dağılımı', description: 'Gelir ve servetin dağılımı ile ilgili bakış açısı' },
  { name: 'Sivil Özgürlükler', description: 'Bireysel özgürlüklerin devlet otoritesi ile dengesi' },
  { name: 'Güvenlik ve Devlet', description: 'Milli güvenlik öncelikleri ve devletin rolü' },
  { name: 'Sekülerizm', description: 'Din ve devlet ilişkisi' },
  { name: 'Kimlik ve Göç', description: 'Ulusal kimlik ve göç politikaları' },
  { name: 'Dış Politika', description: 'Uluslararası ilişkiler ve dış politika yaklaşımı' },
  { name: 'AB İlişkileri', description: 'Avrupa Birliği ile ilişkiler ve uyum süreci' },
  { name: 'Eğitim ve Sosyal Politika', description: 'Eğitim sistemi ve sosyal politikalar' },
  { name: 'Çevre ve Kalkınma', description: 'Çevre koruma ve ekonomik kalkınma dengesi' },
]

const FAQ_ITEMS = [
  {
    question: 'Oy Ver Gitsin nedir?',
    answer:
      'Oy Ver Gitsin, Türkiye\'deki seçmenlerin siyasi görüşlerini kısa ve anonim bir anketle analiz ederek hangi siyasi partiye ne kadar yakın olduklarını gösteren tarafsız bir siyasi eşleşme platformudur.',
  },
  {
    question: 'Anket ne kadar sürer?',
    answer:
      '10 ideolojik eksen üzerinden hazırlanmış kısa sorulardan oluşur ve birkaç dakika içinde tamamlanabilir.',
  },
  {
    question: 'Verilerim anonim mi tutuluyor?',
    answer:
      'Evet. Anket tamamen anonimdir; ad, e-posta veya telefon gibi kimliğinizi ortaya çıkaracak herhangi bir bilgi talep edilmez.',
  },
  {
    question: 'Eşleşme sonucu nasıl hesaplanıyor?',
    answer:
      'Cevaplarınızdan her ideolojik eksen için bir puan hesaplanır ve bu puanlar Türkiye\'deki siyasi partilerin eksen pozisyonlarıyla karşılaştırılır. Sonuçta her parti için bir benzerlik yüzdesi elde edilir. Algoritma sabit kurallıdır ve herhangi bir partiye avantaj sağlamaz.',
  },
  {
    question: 'Hangi partiler karşılaştırmaya dahil?',
    answer:
      'AKP, CHP, MHP, İYİ Parti, DEVA, Gelecek Partisi, Saadet Partisi, TİP, Vatan Partisi, Yeşil Sol Parti, Zafer Partisi ve Memleket Partisi dahil olmak üzere Türkiye\'deki başlıca partiler karşılaştırmaya dahildir.',
  },
]

export default function Home() {
  const faqStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map((item) => ({
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
      <section className="bg-brand-ink">
        <Container className="grid items-center gap-12 py-24 md:grid-cols-2 md:py-32">
          <div className="text-center md:text-left">
            <h1 className="font-heading text-5xl font-semibold text-white md:text-6xl">
              Oy Ver Gitsin
            </h1>
            <p className="mt-6 text-xl text-white/70">
              Türkiye Siyasi Eşleşme Platformu
            </p>
            <p className="mt-4 max-w-xl text-white/60">
              Siyasi görüşlerinizi anonim ve kısa bir anketle analiz edin; tarafsız bir
              eşleşme mantığıyla size en yakın partileri keşfedin.
            </p>
            <div className="mt-10 flex justify-center gap-4 md:justify-start">
              <Link href="/consent">
                <Button variant="primary">Anketi Başlat</Button>
              </Link>
            </div>
          </div>
          <div className="hidden md:block" aria-hidden="true">
            <svg viewBox="0 0 400 400" className="mx-auto w-full max-w-sm text-brand-accent/40">
              <circle cx="200" cy="200" r="160" fill="none" stroke="currentColor" strokeWidth="1" />
              <circle cx="200" cy="200" r="110" fill="none" stroke="currentColor" strokeWidth="1" />
              <circle cx="200" cy="200" r="60" fill="none" stroke="currentColor" strokeWidth="1" />
              <line x1="200" y1="40" x2="200" y2="360" stroke="currentColor" strokeWidth="1" />
              <line x1="40" y1="200" x2="360" y2="200" stroke="currentColor" strokeWidth="1" />
            </svg>
          </div>
        </Container>
      </section>

      <section className="bg-surface py-20">
        <Container>
          <h2 className="text-center font-heading text-3xl font-semibold text-ink-primary">
            Nasıl Çalışır
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((step) => (
              <Card key={step.number}>
                <span className="font-heading text-3xl font-semibold text-brand-accent">
                  {step.number}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-ink-primary">{step.title}</h3>
                <p className="mt-2 text-sm text-ink-secondary">{step.description}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-surface-muted py-20">
        <Container>
          <div className="flex flex-wrap justify-center gap-4">
            {TRUST_SIGNALS.map((signal) => (
              <Badge key={signal.title} className="flex-col items-start gap-1 px-5 py-4 text-left">
                <span className="font-semibold text-ink-primary">{signal.title}</span>
                <span className="text-xs text-ink-muted">{signal.description}</span>
              </Badge>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-surface py-20">
        <Container>
          <h2 className="text-center font-heading text-3xl font-semibold text-ink-primary">
            10 İdeolojik Eksen
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-ink-secondary">
            Anket, Türkiye siyasetini yansıtan 10 ideolojik eksende sorular içerir. Her eksende
            verdiğiniz cevaplar, partilerin bu eksenlerdeki konumlarıyla karşılaştırılır.
          </p>
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {IDEOLOGICAL_AXES.map((axis) => (
              <Card key={axis.name}>
                <h3 className="text-base font-semibold text-ink-primary">{axis.name}</h3>
                <p className="mt-1 text-sm text-ink-secondary">{axis.description}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-surface-muted py-20">
        <Container>
          <h2 className="text-center font-heading text-3xl font-semibold text-ink-primary">
            Sıkça Sorulan Sorular
          </h2>
          <div className="mx-auto mt-12 max-w-3xl space-y-6">
            {FAQ_ITEMS.map((item) => (
              <Card key={item.question}>
                <h3 className="text-base font-semibold text-ink-primary">{item.question}</h3>
                <p className="mt-2 text-sm text-ink-secondary">{item.answer}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-brand-ink py-16">
        <Container className="text-center">
          <h2 className="font-heading text-2xl font-semibold text-white">
            Siyasi duruşunuzu birkaç dakikada keşfedin
          </h2>
          <div className="mt-8">
            <Link href="/consent">
              <Button variant="primary">Anketi Başlat</Button>
            </Link>
          </div>
        </Container>
      </section>
    </main>
  )
}
