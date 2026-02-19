import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Öy Ver Gitsin - Türkiye Siyasi Eşleşme Platformu',
  description: 'Siyasi görüşlerinizi analiz edin ve hangi partiye yakın olduğunuzu öğrenin',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
