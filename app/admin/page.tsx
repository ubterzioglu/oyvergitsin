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

const WEEKLY_UPDATES = [
  {
    date: '4 Ağustos 2026',
    title: 'Anket akışı daha güvenli ve daha anlaşılır hale geldi',
    items: [
      'Kullanıcı artık son soruya atlayıp doğrudan sonuç alamıyor. Sonuç ekranına geçmeden önce bütün soruların cevaplandığı ve dikkat kontrolünün doğru işaretlendiği kontrol ediliyor.',
      'Eksik veya yanlış cevap varsa ekranda sade bir uyarı çıkıyor ve kullanıcı otomatik olarak düzeltilmesi gereken ilk soruya götürülüyor.',
      'Bu kontrol sadece ekranda değil, sonuç oluşturan API tarafında da yapılıyor. Yani kullanıcı tarayıcıdan isteği kurcalasa bile eksik anketle sonuç üretilemiyor.',
    ],
  },
  {
    date: '4 Ağustos 2026',
    title: 'Soru seçeneklerinin mobil görünümü toparlandı',
    items: [
      'Katılıyorum ve katılmıyorum seçenekleri her ekranda alt alta gelecek şekilde sabitlendi. Böylece bazı sorularda yan yana, bazılarında alt alta görünme karışıklığı bitti.',
      'Katılmıyorum tarafı pastel kırmızı, katılıyorum tarafı pastel yeşil, kararsız seçenekler gri tonla ayrıldı. Renkler sadece kenarlık ve seçim göstergesinde kullanıldı.',
      'Fikrim yok artık ayrı küçük bir buton değil; diğer cevaplarla aynı boyda altıncı seçenek olarak görünüyor. Rengi mor tonunda ayrıştırıldı.',
      'Mobilde kart yüksekliği, başlık, seçenek aralıkları, ilerleme metni ve alt soru numaraları sıkılaştırıldı. Soru numaraları artık ilk ekranda daha rahat görünüyor.',
    ],
  },
  {
    date: '4 Ağustos 2026',
    title: 'Siyaset Radarı ilk sürümü eklendi',
    items: [
      'oyvergitsin içine yeni bir Siyaset Radarı bölümü eklendi. Bu bölüm parti değiştiren siyasetçiler, il durumu ve gazeteci durum kayıtlarını kaynaklı şekilde göstermeye hazırlandı.',
      'Public tarafta /siyaset-radari ve kişi detay sayfaları var. Admin tarafında ise kaynak tarama, manuel parti geçişi ekleme ve onay/red kuyruğu var.',
      'TBMM sandalye dağılımı ve TGS gazeteci listesi için ilk importer altyapısı eklendi. Kayıtlar otomatik yayınlanmıyor, önce admin onayı bekliyor.',
      'Yeni tablolar RLS ile korundu. Ziyaretçiler sadece onaylanmış ve public işaretli kayıtları görebiliyor.',
    ],
  },
  {
    date: '4 Ağustos 2026',
    title: 'Parti kayıtları ve admin kullanımı genişledi',
    items: [
      'Parti kayıtları için daha sağlam bir temel atıldı. Parti yaşam döngüsü, durum bilgisi ve eşleşmeye dahil edilme mantığı daha kontrollü hale getirildi.',
      'Admin girişinde kullanıcı adıyla giriş akışı eklendi. Arka planda Supabase Auth kullanılmaya devam ediyor.',
      'Production container tarafında session hash secret aktarımı netleştirildi. Bu, anonim oturum sahipliği kontrolünün production ortamında güvenli çalışması için önemli.',
    ],
  },
  {
    date: '29 Temmuz 2026',
    title: 'Metodoloji ve sonuç altyapısı ciddi şekilde yenilendi',
    items: [
      'VAA metodoloji v2 çalışması uygulamaya taşındı. Eksen modeli, scoring motoru ve sonuç ekranı yeni metodolojiye göre güncellendi.',
      'Metodoloji sayfası artık statik cache ile eski veri göstermiyor; aktif modeli her istekte güncel okuyacak şekilde düzeltildi.',
      'Geliştirme amaçlı soru setinin yayımlanmış yöntem gibi görünmesi engellendi. Ziyaretçiye gösterilen metodoloji ile aktif veri daha tutarlı hale getirildi.',
      'Sonuç snapshot yapısı güçlendirildi. Eski sonuçların sonradan parti konumu veya soru seti değişti diye sessizce değişmemesi için sonuç gövdesi saklanıyor.',
    ],
  },
  {
    date: '29 Temmuz 2026',
    title: 'Parti pozisyonları, testler ve küçük düzeltmeler yapıldı',
    items: [
      'Eksik parti pozisyonları kodlandı, bazı v1 veri hataları düzeltildi ve göç ekseni kaynaklardan yeniden değerlendirildi.',
      'Zafer Partisi adındaki yazım hatası düzeltildi. Kapanan veya adı değişen partiler için silmek yerine yaşam döngüsü yaklaşımı korundu.',
      'Gerçek tarayıcı E2E testi eklendi. Bu testler iki CSP problemini yakaladı ve ilgili güvenlik ayarları düzeltildi.',
      'Geçici dev log dosyasının repodan çıkarılması ve dokümantasyon güncellemeleriyle repo bakımı yapıldı.',
    ],
  },
]

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

      <UpdatesSection />

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

function UpdatesSection() {
  return (
    <section className="mb-8 rounded-lg bg-white p-6 shadow-md">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-900">Güncellemeler</h2>
        <p className="mt-1 text-sm text-gray-600">
          Son 1 haftada yapılan işleri teknik commit diliyle değil, günlük kullanım açısından özetledik.
        </p>
      </div>

      <div className="space-y-5">
        {WEEKLY_UPDATES.map((update) => (
          <article key={`${update.date}-${update.title}`} className="border-t border-gray-200 pt-5 first:border-t-0 first:pt-0">
            <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-800">
                {update.date}
              </span>
              <h3 className="text-base font-semibold text-gray-900">{update.title}</h3>
            </div>
            <ul className="list-inside list-disc space-y-1 text-sm leading-6 text-gray-700">
              {update.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
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

      <div className="space-y-6 text-sm leading-6 text-gray-700">
        <section>
          <h3 className="mb-1 font-semibold text-gray-900">Platformun amacı</h3>
          <p>
            &quot;oyvergitsin.org&quot;, ziyaretçinin siyasi tercihlerini kişisel kimlik bilgisi almadan
            ölçer ve bu tercihleri Türkiye&apos;deki partilerin kayıtlı politika konumlarıyla
            karşılaştırır. Ziyaretçi akışı <strong>Ana sayfa → Açık rıza → Anket → Sonuçlar</strong>{' '}
            şeklindedir. Sonuç ekranı oy verme talimatı değildir; yalnızca kullanıcının verdiği
            cevaplar ile yayımlanmış parti konumları arasındaki benzerliği gösterir.
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-semibold text-gray-900">Günlük kontrol akışı</h3>
          <ol className="list-inside list-decimal space-y-1">
            <li>
              <strong>Dashboard</strong> ekranında toplam oturum, tamamlanan oturum, puanlanan madde
              ve konumlandırılmış parti sayılarını kontrol edin. Bu sayılar ani düşerse anket veya
              Supabase bağlantısında sorun olabilir.
            </li>
            <li>
              <strong>Cevaplar</strong> ekranında yeni tamamlanan oturumları örnekleyin. Çok kısa
              sürede tamamlanan, bütün cevapları aynı olan veya eksik görünen oturumlar veri kalitesi
              açısından işaretlenmelidir.
            </li>
            <li>
              <strong>Sorular</strong>, <strong>Eksenler</strong> ve <strong>Partiler</strong>{' '}
              ekranlarında aktif modelin beklenen veriyle geldiğini kontrol edin. Panel salt okunur
              olduğu için beklenmeyen bir değer görürseniz değişiklik kod ve seed akışından yapılır.
            </li>
            <li>
              <strong>Haberler</strong> veya siyaset radarı ekranlarında bekleyen kaynak, aday haber
              ve tarama hatalarını gözden geçirin. Şüpheli, ilgisiz veya yanıltıcı içerikleri
              yayımlamayın.
            </li>
          </ol>
        </section>

        <section>
          <h3 className="mb-1 font-semibold text-gray-900">Panel neden salt okunur?</h3>
          <p className="mb-2">
            Eksenler, sorular, seçenekler, puanlama kuralları ve parti konumları aynı metodolojinin
            parçalarıdır. Panelden yapılan tek bir elle düzenleme, örneğin bir eksenin yönünü
            değiştirmek veya bir partinin skorunu güncellemek, sonuçları sessizce tutarsız hale
            getirebilir. Bu yüzden metodoloji verisi admin panelinden serbestçe düzenlenmez.
          </p>
          <p>
            Değişiklik akışı kod üzerinden yürür: veri dosyası veya migration hazırlanır, seed
            komutu çalıştırılır, scoring doğrulamaları yapılır, sonra deploy edilir. Böylece her
            değişiklik git geçmişinde kalır, incelenebilir ve gerektiğinde geri alınabilir.
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-semibold text-gray-900">Soru ve metodoloji değişikliği</h3>
          <ul className="list-inside list-disc space-y-1">
            <li>
              Aktif soru seti <strong>axis_models</strong> üzerinden belirlenir. Ziyaretçiye yalnızca
              aktif modelin soruları gösterilir; eski modeller arşiv olarak korunur.
            </li>
            <li>
              Yeni soru seti önce pasif model olarak hazırlanmalıdır. Yerelde önizleme gerekiyorsa{' '}
              <code className="rounded bg-gray-100 px-1">PREVIEW_AXIS_MODEL_VERSION</code> kullanılabilir;
              bu ayar production ortamına taşınmamalıdır.
            </li>
            <li>
              Soru, seçenek veya puanlama kuralı değişirse ilgili scoring testleri ve v2 doğrulama
              komutları çalıştırılmalıdır. Sonuç üretimi değişiyorsa eski snapshot&apos;ların
              görüntülenmesi ayrıca kontrol edilmelidir.
            </li>
            <li>
              Parti kapatma veya pasifleştirme işlemleri silme ile yapılmamalıdır. Eski sonuçlar
              geçmişteki parti bilgisini çözebilmeli, yeni hesaplamalar ise yalnız aktif partileri
              dikkate almalıdır.
            </li>
          </ul>
        </section>

        <section>
          <h3 className="mb-1 font-semibold text-gray-900">Cevaplar ve sonuçlar ekranı</h3>
          <p className="mb-2">
            Cevaplar ekranı oturum bazında hangi soruya hangi değerin verildiğini gösterir. Oturumlar
            anonimdir; ad, e-posta, telefon veya açık konum toplanmaz. IP ve cihaz bilgisi hash olarak
            saklanır ve panelde gösterilmez.
          </p>
          <ul className="list-inside list-disc space-y-1">
            <li>
              Bir oturumun sonucu, tamamlanma anında üretilen snapshot üzerinden korunur. Sonradan
              parti konumu veya soru seti değişse bile eski sonuçlar geriye dönük değişmemelidir.
            </li>
            <li>
              Ziyaretçi yalnızca kendi sonuç linkini açabilmelidir. Doğru oturum çerezi yoksa sonuç
              API&apos;si <code className="rounded bg-gray-100 px-1">403</code> döner.
            </li>
            <li>
              Toplu dışa aktarma bilinçli olarak eklenmemiştir. Siyasi görüş verisi KVKK kapsamında
              hassas kabul edilir; cevap ekranını yalnız gerekli olduğunda kullanın.
            </li>
          </ul>
        </section>

        <section>
          <h3 className="mb-1 font-semibold text-gray-900">Haber ve radar yönetimi</h3>
          <ul className="list-inside list-disc space-y-1">
            <li>
              Kaynak eklerken yayın sahibini, dilini, ülkesini, güven düzeyini ve kullanım şartlarını
              kontrol edin. Kaynak şartları belirsizse otomatik taramaya açmayın.
            </li>
            <li>
              Tarama adayları otomatik olarak toplanır; yayımlama kararı editoryal kontrolden sonra
              verilmelidir. Başlık, özet, kaynak URL&apos;si ve görsel kaynağı haberle tutarlı olmalıdır.
            </li>
            <li>
              Aynı haber farklı kaynaklardan geldiyse tekrar yayınlamak yerine adayları mükerrer
              olarak işaretleyin. Düşük alaka skorlu haberler siyasi bağlamı net değilse reddedilmelidir.
            </li>
            <li>
              Admin aksiyonları kullanıcı id&apos;siyle loglanır. Onay, ret ve mükerrer işaretleme
              kararlarında kısa ama açıklayıcı not bırakmak sonraki incelemeleri kolaylaştırır.
            </li>
          </ul>
        </section>

        <section>
          <h3 className="mb-1 font-semibold text-gray-900">Erişim ve güvenlik</h3>
          <ul className="list-inside list-disc space-y-1">
            <li>
              Panele giriş Supabase Auth ile yapılır. Kullanıcı adı alanı, sunucu tarafında tanımlı
              admin e-postasına eşlenir; şifre Supabase Auth üzerinde doğrulanır.
            </li>
            <li>
              Admin yetkisi yalnız oturum açmakla bitmez. Middleware ve admin API uçları ayrıca{' '}
              <code className="rounded bg-gray-100 px-1">is_admin()</code> RPC kontrolü yapar.
            </li>
            <li>
              Production ortamında <code className="rounded bg-gray-100 px-1">SESSION_HASH_SECRET</code>{' '}
              zorunludur. Eksikse oturum oluşturma güvenli şekilde kapanır ve üretim akışı bozulur.
            </li>
            <li>
              Gerçek secret değerlerini repoya, dokümana veya issue yorumlarına yazmayın. Env
              değişkenleri deploy panelinde saklanmalı, örnek dosyalarda yalnız placeholder kalmalıdır.
            </li>
          </ul>
        </section>

        <section>
          <h3 className="mb-1 font-semibold text-gray-900">Sorun giderme</h3>
          <ul className="list-inside list-disc space-y-1">
            <li>
              Giriş başarısızsa önce kullanıcı adı, admin e-postası ve Supabase Auth şifresinin aynı
              ortamda tanımlı olduğunu kontrol edin. Admin seed çalıştırıldıktan sonra mevcut kullanıcı
              şifresi de env&apos;deki değerle güncellenir.
            </li>
            <li>
              Panel açılıyor ama veriler boş geliyorsa aktif eksen modeli, RLS politikaları ve Supabase
              anon key ayarlarını kontrol edin.
            </li>
            <li>
              Anket veya sonuç akışı bozulursa önce localhost üzerinde smoke akışı çalıştırın. Remote
              test yazımı yalnız ayrı test ortamında ve bilinçli olarak açılmalıdır.
            </li>
            <li>
              Deploy sonrası beklenmeyen davranışta önce env farklarını, sonra migration/seed sırasını,
              en son uygulama loglarını kontrol edin.
            </li>
          </ul>
        </section>
      </div>
    </div>
  )
}
