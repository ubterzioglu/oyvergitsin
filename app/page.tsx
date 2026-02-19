import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center p-8">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Öy Ver Gitsin
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Türkiye Siyasi Eşleşme Platformu
        </p>
        <Link
          href="/consent"
          className="inline-block px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg"
        >
          Anketi Başlat
        </Link>
        <div className="mt-8">
          <Link
            href="/admin"
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Yönetim Paneli
          </Link>
        </div>
      </div>
    </main>
  )
}
