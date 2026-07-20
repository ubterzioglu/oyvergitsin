import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Yonetim Paneli',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true
    }
  }
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-surface-muted">
      <nav className="bg-brand-ink shadow-md">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex items-center px-4">
                <Link href="/admin" className="font-heading text-xl font-semibold text-white">
                  Yönetim Paneli
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <Link href="/admin" className="text-white/80 hover:text-white">
                  Dashboard
                </Link>
                <Link href="/admin/axes" className="text-white/80 hover:text-white">
                  Eksenler
                </Link>
                <Link href="/admin/questions" className="text-white/80 hover:text-white">
                  Sorular
                </Link>
                <Link href="/admin/parties" className="text-white/80 hover:text-white">
                  Partiler
                </Link>
                <Link href="/admin/consent" className="text-white/80 hover:text-white">
                  Onay Metinleri
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <Link href="/" className="text-white/60 hover:text-white">
                Ana Sayfa
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  )
}
