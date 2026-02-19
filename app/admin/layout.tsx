import Link from 'next/link'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex items-center px-4">
                <Link href="/admin" className="text-xl font-bold text-gray-900">
                  Yönetim Paneli
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <Link href="/admin" className="text-gray-700 hover:text-gray-900">
                  Dashboard
                </Link>
                <Link href="/admin/axes" className="text-gray-700 hover:text-gray-900">
                  Eksenler
                </Link>
                <Link href="/admin/questions" className="text-gray-700 hover:text-gray-900">
                  Sorular
                </Link>
                <Link href="/admin/parties" className="text-gray-700 hover:text-gray-900">
                  Partiler
                </Link>
                <Link href="/admin/consent" className="text-gray-700 hover:text-gray-900">
                  Onay Metinleri
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <Link href="/" className="text-gray-500 hover:text-gray-700">
                Ana Sayfa
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 px-4">{children}</main>
    </div>
  )
}
