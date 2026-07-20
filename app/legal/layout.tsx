import type { Metadata } from 'next'
import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { Card } from '@/components/ui/Card'

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false
  }
}

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen items-start justify-center bg-surface p-4 py-12">
      <Container size="md">
        <Card elevated>
          {children}
          <div className="mt-8 border-t border-border pt-4 text-sm">
            <Link href="/" className="text-brand-accent underline underline-offset-4 hover:text-brand-accent-hover">
              Ana sayfaya dön
            </Link>
          </div>
        </Card>
      </Container>
    </div>
  )
}
