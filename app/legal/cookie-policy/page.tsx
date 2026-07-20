import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Çerez Politikası'
}

export default function CookiePolicyPage() {
  return (
    <article>
      <h1 className="mb-6 font-heading text-3xl font-semibold text-ink-primary">
        Çerez Politikası
      </h1>
      <p className="mb-4 text-sm text-ink-muted">Son güncelleme: 20 Temmuz 2026</p>

      <div className="space-y-6 text-ink-secondary">
        <p>
          Bu Çerez Politikası, oyvergitsin.org&apos;un (&quot;Site&quot;) kullandığı çerezleri ve
          benzeri izleme teknolojilerini açıklar.
        </p>

        <section>
          <h2 className="mb-2 font-heading text-xl font-semibold text-ink-primary">
            Kullanılan Teknolojiler
          </h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong>Zorunlu depolama (localStorage):</strong> Anket akışının
              çalışabilmesi için anonim bir oturum kimliği tarayıcınızın yerel
              deposunda tutulur. Bu, sitenin temel işlevi için gereklidir ve devre
              dışı bırakılamaz.
            </li>
            <li>
              <strong>Analitik (Microsoft Clarity):</strong> Site kullanımını
              anlamak amacıyla sayfa etkileşimlerinizi (tıklama, kaydırma, gezinme)
              anonim şekilde kaydeden bir analitik hizmeti kullanılır.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 font-heading text-xl font-semibold text-ink-primary">
            Çerezleri Nasıl Kontrol Edebilirsiniz
          </h2>
          <p>
            Çoğu tarayıcı, çerezleri ve site verilerini yönetmenize veya silmenize
            olanak tanır. Tarayıcınızın ayarlar menüsünden çerezleri
            engelleyebilir veya mevcut çerezleri silebilirsiniz. Ancak zorunlu
            depolamayı engellemeniz durumunda anket akışı düzgün çalışmayabilir.
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
              className="text-rainbow-blue underline underline-offset-4 hover:text-rainbow-blue-hover"
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
