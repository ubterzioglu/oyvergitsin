'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

interface Stats {
  totalSessions: number
  completedSessions: number
  totalQuestions: number
  totalParties: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalSessions: 0,
    completedSessions: 0,
    totalQuestions: 0,
    totalParties: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const [sessionsRes, questionsRes, partiesRes] = await Promise.all([
        supabase.from('sessions').select('*', { count: 'exact', head: true }),
        supabase.from('questions').select('*', { count: 'exact', head: true }),
        supabase.from('parties').select('*', { count: 'exact', head: true })
      ])

      const { count: completedCount } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .not('completed_at', 'is', null)

      setStats({
        totalSessions: sessionsRes.count || 0,
        completedSessions: completedCount || 0,
        totalQuestions: questionsRes.count || 0,
        totalParties: partiesRes.count || 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {loading ? (
        <div className="text-gray-600">Yükleniyor...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl font-bold text-blue-600">{stats.totalSessions}</div>
            <div className="text-gray-600">Toplam Oturum</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl font-bold text-green-600">{stats.completedSessions}</div>
            <div className="text-gray-600">Tamamlanan Oturum</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl font-bold text-purple-600">{stats.totalQuestions}</div>
            <div className="text-gray-600">Toplam Soru</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl font-bold text-orange-600">{stats.totalParties}</div>
            <div className="text-gray-600">Toplam Parti</div>
          </div>
        </div>
      )}

      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Hızlı İşlemler</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/admin/axes"
            className="block p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all"
          >
            <h3 className="font-semibold text-blue-900">Eksenleri Yönet</h3>
            <p className="text-sm text-blue-700">İdeolojik eksenleri düzenle</p>
          </a>
          <a
            href="/admin/questions"
            className="block p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-all"
          >
            <h3 className="font-semibold text-green-900">Soruları Yönet</h3>
            <p className="text-sm text-green-700">Anket sorularını düzenle</p>
          </a>
          <a
            href="/admin/parties"
            className="block p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-all"
          >
            <h3 className="font-semibold text-purple-900">Partileri Yönet</h3>
            <p className="text-sm text-purple-700">Parti bilgilerini düzenle</p>
          </a>
        </div>
      </div>

      <AdminGuide />
    </div>
  )
}

function AdminGuide() {
  return (
    <div className="mt-8 bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">Kullanım Kılavuzu</h2>

      <div className="space-y-6 text-sm text-gray-700">
        <section>
          <h3 className="font-semibold text-gray-900 mb-1">Site nedir?</h3>
          <p>
            &quot;Oy Ver Gitsin&quot;, ziyaretçilere bir anket doldurtup cevaplarına göre
            hangi Türkiye siyasi partisine ne kadar yakın olduklarını gösteren bir
            eşleştirme platformudur. Akış: <strong>Ana sayfa → Onay (consent) →
            Anket → Sonuçlar</strong>. Ziyaretçi anketi bitirdiğinde sistem, cevaplarını
            10 ideolojik eksende puanlar ve bu puanları partilerin eksen
            pozisyonlarıyla karşılaştırıp bir benzerlik yüzdesi hesaplar.
          </p>
        </section>

        <section>
          <h3 className="font-semibold text-gray-900 mb-1">Veri modeli nasıl işliyor?</h3>
          <ol className="list-decimal list-inside space-y-1">
            <li>
              <strong>Eksenler</strong> (<a href="/admin/axes" className="text-blue-600 hover:underline">Eksenler</a>) —
              &quot;Ekonomi: Piyasa vs Devlet&quot;, &quot;Sekülerizm&quot; gibi 10 ideolojik
              boyut. Her ekseni -100 ile +100 arası bir skor temsil eder.
            </li>
            <li>
              <strong>Sorular ve seçenekler</strong> (<a href="/admin/questions" className="text-blue-600 hover:underline">Sorular</a>) —
              ziyaretçiye sorulan sorular ve her sorunun cevap seçenekleri.
              Bir soruyu düzenlerken seçenekleri de aynı ekrandan yönetirsin.
            </li>
            <li>
              <strong>Puanlama kuralları</strong> — soru detay sayfasında, her
              seçenek için &quot;bu cevap işaretlenirse şu eksene şu kadar puan
              eklensin&quot; kuralı tanımlanır. Bir kullanıcı anketi tamamladığında
              işaretlediği tüm seçeneklerin puanları eksen bazında toplanır ve
              [-100, 100] aralığına sıkıştırılır.
            </li>
            <li>
              <strong>Partiler</strong> (<a href="/admin/parties" className="text-blue-600 hover:underline">Partiler</a>) —
              her partinin her eksendeki kendi pozisyonu (-100..100) tanımlıdır.
              Sonuç ekranında, kullanıcının eksen skorları ile partilerin eksen
              skorları arasındaki fark üzerinden bir benzerlik yüzdesi hesaplanıp
              partiler sıralanır.
            </li>
          </ol>
        </section>

        <section>
          <h3 className="font-semibold text-gray-900 mb-1">Pratik notlar</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>
              Bir soru veya eksen silinirse, ona bağlı seçenekler / puanlama
              kuralları / parti pozisyonları da otomatik silinir — panel silmeden
              önce uyarı gösterir.
            </li>
            <li>
              Soru tipi olarak 25 farklı seçenek sunulur, ancak anket ekranı bugün
              yalnızca <em>seçenek tabanlı</em> tipleri (tekli/çoklu seçim, likert,
              açılır liste vb.) doğru şekilde gösterir. Diğer tipler ileride
              kullanılmak üzere veri girişine açıktır.
            </li>
            <li>Sıra numaraları (order_index), ilgili tablodaki ▲ / ▼ butonlarıyla değiştirilebilir.</li>
            <li>Değişiklikler kaydedildiği anda canlı ankete yansır — ayrı bir yayınlama adımı yoktur.</li>
          </ul>
        </section>
      </div>
    </div>
  )
}
