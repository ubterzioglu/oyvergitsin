import type { ReactNode } from 'react'
import { Container } from '@/components/ui/Container'
import { RadarSubnav } from '@/components/siyaset-radari/RadarSubnav'

interface Props {
  title: string
  description: string
  children: ReactNode
}

/** Siyaset Radarı sayfalarının ortak başlığı + alt menüsü. */
export function RadarPageShell({ title, description, children }: Props) {
  return (
    <main className="bg-surface">
      <section className="border-b border-border bg-surface-muted py-12">
        <Container>
          <div className="max-w-3xl">
            {/* Tek accent, tek yerde: sayfanın ne olduğunu söyleyen üst etiket. */}
            <p className="data-figure text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              Siyaset Radarı · Kaynaklı · Doğrulama tarihli
            </p>
            <h1 className="mt-3 font-heading text-4xl font-semibold text-ink-primary">{title}</h1>
            <p className="mt-4 text-base text-ink-secondary">{description}</p>
          </div>
        </Container>
      </section>

      <section className="py-10">
        <Container>
          <RadarSubnav />
          <div className="mt-8">{children}</div>
        </Container>
      </section>
    </main>
  )
}
