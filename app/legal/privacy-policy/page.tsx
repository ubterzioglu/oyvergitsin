import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Gizlilik Politikası'
}

export default function PrivacyPolicyPage() {
  return (
    <article>
      <h1 className="mb-6 font-heading text-3xl font-semibold text-ink-primary">
        Gizlilik Politikası
      </h1>
      <p className="mb-4 text-sm text-ink-muted">Son güncelleme: 20 Temmuz 2026</p>

      <div className="space-y-6 text-ink-secondary">
        <p>
          oyvergitsin.org (&quot;Site&quot;), bağımsız/kişisel bir proje olarak yürütülmektedir; Site&apos;nin
          arkasında ticari bir şirket bulunmamaktadır. Bu Gizlilik Politikası, Site&apos;yi kullanırken
          hangi verilerin toplandığını, nasıl işlendiğini ve haklarınızın neler olduğunu açıklar.
        </p>

        <section>
          <h2 className="mb-2 font-heading text-xl font-semibold text-ink-primary">
            Toplanan Veriler
          </h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>Ankete verdiğiniz cevaplar (siyasi eğilim analizini oluşturmak için)</li>
            <li>Anonim oturum kimliği (tarayıcınızın yerel deposunda tutulan bir kimlik)</li>
            <li>Cihaz/tarayıcı bilgisi ve hash&apos;lenmiş IP adresi (kötüye kullanımı önlemek ve oturum bütünlüğünü sağlamak için)</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 font-heading text-xl font-semibold text-ink-primary">
            Verilerin İşlenme Amacı
          </h2>
          <p>
            Toplanan veriler yalnızca anonim siyasi eğilim analizi yapmak ve size sonuç
            sayfasında bir karşılaştırma sunmak amacıyla işlenir. Cevaplarınız kimliğinizle
            ilişkilendirilecek şekilde saklanmaz; oturum kimliği anonim bir tanımlayıcıdır.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-heading text-xl font-semibold text-ink-primary">
            Üçüncü Taraflarla Paylaşım
          </h2>
          <p>
            Kişisel verileriniz pazarlama amacıyla satılmaz veya üçüncü taraflarla
            paylaşılmaz. Site altyapısı Supabase (veritabanı/kimlik doğrulama) ve
            Vercel benzeri bir barındırma sağlayıcısı üzerinde çalışır; bu sağlayıcılar
            yalnızca Site&apos;nin teknik olarak çalışmasını sağlamak amacıyla veriye erişebilir
            ve verileriniz yurt içi ve/veya yurt dışı sunucularda barındırılabilir.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-heading text-xl font-semibold text-ink-primary">
            Analitik ve İzleme
          </h2>
          <p>
            Site kullanımını anlamak amacıyla Microsoft Clarity analitik hizmeti
            kullanılmaktadır. Bu hizmet, sayfa etkileşimlerinizi (tıklama, kaydırma vb.)
            anonim şekilde kaydedebilir. Detaylar için{' '}
            <a
              href="/legal/cookie-policy"
              className="text-brand-accent underline underline-offset-4 hover:text-brand-accent-hover"
            >
              Çerez Politikası
            </a>{' '}
            sayfasına bakabilirsiniz.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-heading text-xl font-semibold text-ink-primary">
            Saklama Süresi
          </h2>
          <p>
            Anonim anket verileri, istatistiksel analiz amacıyla makul bir süre boyunca
            saklanabilir. Verilerinizin silinmesini talep edebilirsiniz; ancak oturum
            anonim olduğundan, belirli bir cevabı kimliğinizle eşleştirerek silme talebini
            işleme koymak teknik olarak mümkün olmayabilir.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-heading text-xl font-semibold text-ink-primary">
            İletişim
          </h2>
          <p>
            Gizlilikle ilgili sorularınız için{' '}
            <a
              href="mailto:supabase@oyvergitsin.org"
              className="text-brand-accent underline underline-offset-4 hover:text-brand-accent-hover"
            >
              supabase@oyvergitsin.org
            </a>{' '}
            adresinden bize ulaşabilirsiniz.
          </p>
        </section>
      </div>
    </article>
  )
}
