import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Anket Sonuclari',
  robots: {
    index: false,
    follow: false,
    nocache: true
  }
}

export default function ResultsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
