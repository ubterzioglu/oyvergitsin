'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

interface Stats {
  totalSessions: number
  completedSessions: number
  scoredQuestions: number
  positionedParties: number
  activeModel: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalSessions: 0,
    completedSessions: 0,
    scoredQuestions: 0,
    positionedParties: 0,
    activeModel: '—',
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const activeModel = await supabase
          .from('axis_models')
          .select('id, name')
          .eq('is_active', true)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle()

        const modelId = activeModel.data?.id

        const [sessionsRes, completedRes, questionsRes] = await Promise.all([
          supabase.from('sessions').select('*', { count: 'exact', head: true }),
          supabase
            .from('sessions')
            .select('*', { count: 'exact', head: true })
            .not('completed_at', 'is', null),
          modelId
            ? supabase
                .from('questions')
                .select('*', { count: 'exact', head: true })
                .eq('axis_model_id', modelId)
                .eq('is_scored', true)
            : Promise.resolve({ count: 0 }),
        ])

        let positionedParties = 0
        if (modelId) {
          const { data: axes } = await supabase.from('axes').select('id').eq('axis_model_id', modelId)
          const axisIds = (axes ?? []).map((axis) => axis.id)

          if (axisIds.length > 0) {
            const { data: positions } = await supabase
              .from('party_positions')
              .select('party_id')
              .in('axis_id', axisIds)
            positionedParties = new Set((positions ?? []).map((p) => p.party_id)).size
          }
        }

        setStats({
          totalSessions: sessionsRes.count || 0,
          completedSessions: completedRes.count || 0,
          scoredQuestions: questionsRes.count || 0,
          positionedParties,
          activeModel: activeModel.data?.name ?? 'bulunamadı',
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold text-gray-900">Dashboard</h1>

      {loading ? (
        <div className="text-gray-600">Yükleniyor...</div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Stat value={stats.totalSessions} label="Toplam Oturum" color="text-blue-600" />
            <Stat value={stats.completedSessions} label="Tamamlanan Oturum" color="text-green-600" />
            <Stat value={stats.scoredQuestions} label="Puanlanan Madde" color="text-purple-600" />
            <Stat value={stats.positionedParties} label="Konumlandırılmış Parti" color="text-orange-600" />
          </div>

          <div className="mb-8 rounded-lg bg-white p-4 shadow-md">
            <span className="text-sm text-gray-500">Aktif eksen modeli</span>
            <p className="font-semibold text-gray-900">{stats.activeModel}</p>
          </div>
        </>
      )}

      <div className="mb-8 rounded-lg bg-white p-6 shadow-md">
        <h2 className="mb-4 text-xl font-bold">Hızlı erişim</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <QuickLink
            href="/admin/responses"
            title="Cevapları incele"
            description="Kim hangi soruya ne cevap verdi"
            className="bg-blue-50 text-blue-900 hover:bg-blue-100"
          />
          <QuickLink
            href="/admin/questions"
            title="Soru setini gör"
            description="Maddeler, seçenekler, puanlama kuralları"
            className="bg-green-50 text-green-900 hover:bg-green-100"
          />
          <QuickLink
            href="/metodoloji"
            title="Yayımlanan metodoloji"
            description="Ziyaretçiye gösterilen şeffaflık sayfası"
            className="bg-purple-50 text-purple-900 hover:bg-purple-100"
          />
        </div>
      </div>

      <AdminGuide />
    </div>
  )
}

function Stat({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
      <div className="text-gray-600">{label}</div>
    </div>
  )
}

function QuickLink({
  href,
  title,
  description,
  className,
}: {
  href: string
  title: string
  description: string
  className: string
}) {
  return (
    <Link href={href} className={`block rounded-lg p-4 transition-all ${className}`}>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm opacity-80">{description}</p>
    </Link>
  )
}

function AdminGuide() {
  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <h2 className="mb-4 text-xl font-bold">Kullanım kılavuzu</h2>

      <div className="space-y-6 text-sm text-gray-700">
        <section>
          <h3 className="mb-1 font-semibold text-gray-900">Site nedir?</h3>
          <p>
            &quot;oyvergitsin.org&quot;, ziyaretçinin politika görüşlerini ölçüp Türkiye&apos;deki
            partilerin kayıtlı konumlarıyla ne kadar örtüştüğünü gösteren bir araçtır. Akış:{' '}
            <strong>Ana sayfa → Onay → Anket → Sonuçlar</strong>. Sonuç bir oy verme tavsiyesi
            değildir; yöntem <Link href="/metodoloji" className="text-blue-600 hover:underline">/metodoloji</Link>{' '}
            sayfasında yayımlanır.
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-semibold text-gray-900">Panel neden salt okunur?</h3>
          <p className="mb-2">
            Eksenler, sorular, puanlama kuralları ve parti konumları birbirine bağlıdır. Panelden
            yapılan tek bir elle düzenleme — bir eksenin kutbunu ters çevirmek, bir maddenin puanını
            değiştirmek, bir parti skorunu güncellemek — puanlama kurallarını ve parti kanıt
            kayıtlarını sessizce tutarsız hale getirir: sonuçlar bozulur ama hiçbir yerde hata
            görünmez.
          </p>
          <p>
            Bu yüzden içerik kodda tutulur. Değişiklik akışı:{' '}
            <code className="rounded bg-gray-100 px-1">scripts/data/*.js</code> düzenlenir → seed
            komutu çalıştırılır → testler ve doğrulama koşar → deploy edilir. Sürüm geçmişi git&apos;te
            kalır, geri alınabilir.
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-semibold text-gray-900">Eksen modeli sürümleri</h3>
          <p>
            Soru seti <strong>eksen modeline</strong> bağlıdır ve ankette yalnızca <em>aktif</em>{' '}
            modelin soruları görünür. Yeni bir soru seti pasif olarak hazırlanır, doğrulanır, sonra
            tek adımda devreye alınır. Eski sürümler arşiv olarak kalır; o dönemde alınmış sonuçlar
            açılmaya devam eder.
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-semibold text-gray-900">Veri görünürlüğü ve gizlilik</h3>
          <ul className="list-inside list-disc space-y-1">
            <li>
              <strong>Cevaplar ekranı</strong> oturum bazında hangi soruya ne cevap verildiğini
              gösterir. Oturumlar anonimdir: ad, e-posta, telefon veya konum toplanmaz. IP ve cihaz
              bilgisi yalnızca hash olarak saklanır ve panelde gösterilmez.
            </li>
            <li>
              <strong>Ziyaretçi</strong> yalnızca kendi sonucunu görür. Başkasının sonuç linkini
              bilse bile, tarayıcısında doğru oturum çerezi yoksa API isteği{' '}
              <code className="rounded bg-gray-100 px-1">403</code> ile reddeder.
            </li>
            <li>
              <strong>Panele erişim</strong> middleware ile korunur; giriş yapılmamışsa veya hesap
              admin yetkisine sahip değilse oturum kapatılır.
            </li>
            <li>
              Siyasi görüş KVKK kapsamında özel nitelikli kişisel veridir. Cevap ekranını yalnızca
              gerçekten gerekli olduğunda kullanın; toplu dışa aktarma özelliği bilinçli olarak
              eklenmemiştir.
            </li>
          </ul>
        </section>
      </div>
    </div>
  )
}
