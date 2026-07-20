import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'KVKK Aydınlatma Metni'
}

export default function KvkkDisclosurePage() {
  return (
    <article>
      <h1 className="mb-6 font-heading text-3xl font-semibold text-ink-primary">
        KVKK Aydınlatma Metni
      </h1>
      <p className="mb-4 text-sm text-ink-muted">Son güncelleme: 20 Temmuz 2026</p>

      <div className="space-y-6 text-ink-secondary">
        <p>
          İşbu Aydınlatma Metni, 6698 sayılı Kişisel Verilerin Korunması Kanunu
          (&quot;KVKK&quot;) m.10 uyarınca, Oy Ver Gitsin (&quot;Site&quot;) üzerinden kişisel
          verilerinizin işlenmesine ilişkin olarak sizi bilgilendirmek amacıyla
          hazırlanmıştır.
        </p>

        <section>
          <h2 className="mb-2 font-heading text-xl font-semibold text-ink-primary">
            Veri Sorumlusu
          </h2>
          <p>
            Site, bağımsız/kişisel bir proje olarak yürütülmekte olup veri sorumlusu
            sıfatıyla Site&apos;yi işleten kişidir. İletişim için:{' '}
            <a
              href="mailto:supabase@oyvergitsin.org"
              className="text-brand-accent underline underline-offset-4 hover:text-brand-accent-hover"
            >
              supabase@oyvergitsin.org
            </a>
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-heading text-xl font-semibold text-ink-primary">
            İşlenen Kişisel Veri Kategorileri
          </h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              Siyasi görüş verisi (KVKK m.6 kapsamında özel nitelikli kişisel veri):
              ankete verdiğiniz cevaplar
            </li>
            <li>İşlem güvenliği verisi: anonim oturum kimliği, hash&apos;lenmiş IP adresi, cihaz/tarayıcı bilgisi</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 font-heading text-xl font-semibold text-ink-primary">
            İşleme Amacı ve Hukuki Sebebi
          </h2>
          <p>
            Kişisel verileriniz, açık rızanıza dayanılarak (KVKK m.5/1 ve özel
            nitelikli veriler için m.6/2), yalnızca anonim siyasi eğilim analizi
            yapmak ve size karşılaştırmalı sonuç sunmak amacıyla işlenmektedir.
            Ankete başlamadan önce sunulan Açık Rıza Metni&apos;ni onaylamanız, bu
            işlemlerin hukuki dayanağını oluşturur.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-heading text-xl font-semibold text-ink-primary">
            Kişisel Verilerin Aktarılması
          </h2>
          <p>
            Verileriniz, Site&apos;nin teknik altyapısını sağlayan Supabase
            (veritabanı/kimlik doğrulama hizmeti) ve Vercel benzeri bir barındırma
            sağlayıcısı aracılığıyla işlenmekte olup, bu kapsamda yurt dışına veri
            aktarımı söz konusu olabilir. Veriler, pazarlama veya ticari amaçla
            üçüncü kişilerle paylaşılmaz.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-heading text-xl font-semibold text-ink-primary">
            Kişisel Veri Toplamanın Yöntemi
          </h2>
          <p>
            Kişisel verileriniz, Site üzerindeki anket formunu doldurmanız yoluyla,
            elektronik ortamda doğrudan sizden toplanmaktadır.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-heading text-xl font-semibold text-ink-primary">
            KVKK m.11 Uyarınca Haklarınız
          </h2>
          <p>KVKK&apos;nın 11. maddesi uyarınca, veri sorumlusuna başvurarak:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme,</li>
            <li>İşlenmişse buna ilişkin bilgi talep etme,</li>
            <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme,</li>
            <li>Yurt içinde/yurt dışında aktarıldığı üçüncü kişileri bilme,</li>
            <li>Eksik/yanlış işlenmişse düzeltilmesini isteme,</li>
            <li>KVKK m.7 şartları çerçevesinde silinmesini/yok edilmesini isteme,</li>
            <li>İşlemlerin aktarıldığı üçüncü kişilere bildirilmesini isteme,</li>
            <li>Otomatik işleme sonucu aleyhinize bir sonucun ortaya çıkmasına itiraz etme,</li>
            <li>Kanuna aykırı işleme sebebiyle zarara uğramanız hâlinde zararın giderilmesini talep etme</li>
          </ul>
          <p className="mt-2">
            haklarına sahipsiniz. Bu haklarınızı kullanmak için{' '}
            <a
              href="mailto:supabase@oyvergitsin.org"
              className="text-brand-accent underline underline-offset-4 hover:text-brand-accent-hover"
            >
              supabase@oyvergitsin.org
            </a>{' '}
            adresine başvurabilirsiniz.
          </p>
        </section>
      </div>
    </article>
  )
}
