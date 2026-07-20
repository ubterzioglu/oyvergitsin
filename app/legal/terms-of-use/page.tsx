import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kullanım Şartları'
}

export default function TermsOfUsePage() {
  return (
    <article>
      <h1 className="mb-6 font-heading text-3xl font-semibold text-ink-primary">
        Kullanım Şartları
      </h1>
      <p className="mb-4 text-sm text-ink-muted">Son güncelleme: 20 Temmuz 2026</p>

      <div className="space-y-6 text-ink-secondary">
        <p>
          oyvergitsin.org&apos;u (&quot;Site&quot;) kullanarak aşağıdaki şartları kabul etmiş
          sayılırsınız. Site, bağımsız/kişisel bir proje olarak yürütülmektedir.
        </p>

        <section>
          <h2 className="mb-2 font-heading text-xl font-semibold text-ink-primary">
            Sitenin Amacı ve Sorumluluk Reddi
          </h2>
          <p>
            Site, kullanıcıların kendi beyan ettikleri cevaplara dayanarak eğlence ve
            bilgilendirme amaçlı bir siyasi eğilim karşılaştırması sunar. Sonuçlar
            resmi, bağlayıcı veya kesin doğrulukta bir oy tavsiyesi değildir; Site
            herhangi bir siyasi parti veya kuruluşla resmi bir bağlantıya sahip
            değildir ve tarafsız/bağımsız bir kaynak olarak sunulmamaktadır.
            Kullanıcılar oy tercihlerini kendi araştırmalarına dayanarak vermelidir.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-heading text-xl font-semibold text-ink-primary">
            Kullanım Kuralları
          </h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>Siteyi otomatik araçlarla (bot, scraper) taramak veya kitlesel veri çekmek yasaktır.</li>
            <li>Siteyi hukuka aykırı, yanıltıcı veya zarar verici amaçlarla kullanmak yasaktır.</li>
            <li>Sitenin işleyişine müdahale eden (aşırı istek gönderme, güvenlik açığı istismarı vb.) davranışlar yasaktır.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 font-heading text-xl font-semibold text-ink-primary">
            Fikri Mülkiyet
          </h2>
          <p>
            Site&apos;nin tasarımı, metinleri ve yazılımı, aksi belirtilmedikçe Site
            sahibine aittir. İçeriğin ticari amaçla izinsiz kopyalanması veya
            dağıtılması yasaktır.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-heading text-xl font-semibold text-ink-primary">
            Sorumluluğun Sınırlandırılması
          </h2>
          <p>
            Site &quot;olduğu gibi&quot; sunulmaktadır. Sitenin kesintisiz veya hatasız
            çalışacağı garanti edilmez. Site sahibi, Site&apos;nin kullanımından
            doğabilecek doğrudan veya dolaylı zararlardan, yürürlükteki mevzuatın
            izin verdiği azami ölçüde sorumlu tutulamaz.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-heading text-xl font-semibold text-ink-primary">
            Değişiklikler
          </h2>
          <p>
            Bu Kullanım Şartları zaman zaman güncellenebilir. Güncel sürüm her zaman
            bu sayfada yayınlanır.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-heading text-xl font-semibold text-ink-primary">
            İletişim
          </h2>
          <p>
            Sorularınız için{' '}
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
