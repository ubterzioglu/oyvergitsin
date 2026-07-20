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
    'Turkiye\'de siyasi gorusunuzu kisa bir anketle analiz edin ve size en yakin partileri tarafsiz bir eslesme mantigiyla gorun.',
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

export default function Home() {
  return (
    <main>
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
