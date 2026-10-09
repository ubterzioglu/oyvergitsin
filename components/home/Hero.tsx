import Image from 'next/image'
import { Container } from '@/components/ui/Container'
import { PlayfulCta } from '@/components/home/PlayfulCta'

const CHIPS = [
  { label: 'Anonim', icon: '🕶️' },
  { label: 'Ücretsiz', icon: '🎁' },
  { label: 'Tarafsız algoritma', icon: '⚖️' },
]

// Hero'daki tek "akılda kalan an": logo bir oy pusulası gibi hafif yatık
// duruyor, üstüne damga iniyor. Gerisi sakin tutuldu.
export function Hero() {
  return (
    <section className="relative overflow-hidden bg-surface">
      <div
        className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(#0E6E7D26_1.5px,transparent_1.5px)] [background-size:22px_22px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-accent-tint"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-16 -left-12 hidden h-40 w-72 -rotate-6 rounded-[2rem] bg-accent-tint md:block"
        aria-hidden="true"
      />

      <Container className="relative grid items-center gap-12 py-16 md:grid-cols-[1.1fr_0.9fr] md:py-24">
        <div>
          <h1 className="font-heading text-4xl font-black leading-[1.05] tracking-tight text-ink-primary text-balance sm:text-5xl md:text-6xl">
            Sandığa gitmeden önce bir bak: kime yakınsın?
          </h1>
          <p className="mt-6 max-w-xl text-lg text-ink-secondary">
            Birkaç dakikalık anonim bir anketle görüşlerini Türkiye&apos;deki partilerin duruşlarıyla
            karşılaştır. Kimse seni görmez, kimse seni yönlendirmez.
          </p>

          <div className="mt-8 flex flex-wrap gap-3" role="list">
            {CHIPS.map((chip, index) => (
              <span
                key={chip.label}
                role="listitem"
                className={`inline-flex items-center gap-2 rounded-full border-2 border-ink-primary bg-white px-4 py-1.5 text-sm font-bold text-ink-primary ${
                  index % 2 === 0 ? '-rotate-2' : 'rotate-1'
                }`}
              >
                <span aria-hidden="true">{chip.icon}</span>
                {chip.label}
              </span>
            ))}
          </div>

          <div className="mt-10">
            <PlayfulCta />
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md md:max-w-none">
          <div className="-rotate-3 rounded-[1.75rem] border-2 border-ink-primary bg-white p-4 shadow-[10px_10px_0_0_#0E6E7D] sm:p-6">
            <Image
              src="/brand/oyvergitsin-logo.png"
              alt="oyvergitsin.org: oy pusulası atılan sandık. Tüm partiler aynı yerde, seçme sırası sende."
              width={1536}
              height={1024}
              priority
              sizes="(min-width: 768px) 40vw, 90vw"
              className="h-auto w-full"
            />
          </div>
          <div
            className="stamp-in absolute -bottom-6 -right-2 flex h-24 w-24 items-center justify-center rounded-full border-2 border-ink-primary bg-accent text-center text-sm font-extrabold leading-tight text-white shadow-[3px_3px_0_0_#191C1E] sm:-right-6 sm:h-28 sm:w-28 sm:text-base"
            aria-hidden="true"
          >
            birkaç
            <br />
            dakika
          </div>
        </div>
      </Container>
    </section>
  )
}
