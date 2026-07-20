# Legal Pages (Privacy, Terms, KVKK, Cookies) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add four static legal content pages (Privacy Policy, Terms of Use, KVKK Disclosure, Cookie Policy) under `/legal/`, and link them side-by-side in the site footer.

**Architecture:** A shared `app/legal/layout.tsx` sets `noindex` metadata and wraps children in the existing `Container`/`Card` components. Each page is a small server component with static Turkish-language content, styled with explicit utility classes (no `prose` — the typography plugin isn't installed in this project). The footer gets a new link row above the existing content, using Next.js `Link`.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS (utility classes only, no typography plugin), existing `Container`/`Card` UI components.

## Global Constraints

- Contact email in all legal text: `supabase@oyvergitsin.org`
- Site owner framed as an independent/personal project — no company name, no MERSİS/trade registry info
- Infrastructure described generically: Supabase (database/auth) + Vercel-like hosting, no specific data-center claims
- All four pages get `robots: { index: false, follow: false }` (same pattern as `app/consent/layout.tsx`)
- Do NOT use `prose`/`prose-neutral` classes — `@tailwindcss/typography` is not installed (`tailwind.config.ts` has `plugins: []`); use explicit text utility classes matching `Card`/`Button` conventions instead (`text-ink-primary`, `text-ink-secondary`, `font-heading`)
- Do not modify `app/consent/page.tsx` or the existing nakliyat link / copyright line in the footer
- Language: Turkish, matching the tone of `app/consent/page.tsx`

---

### Task 1: Shared legal layout

**Files:**
- Create: `app/legal/layout.tsx`

**Interfaces:**
- Produces: `LegalLayout` default export — a server component taking `{ children: React.ReactNode }`, rendering a `<div className="flex min-h-screen items-start justify-center bg-surface p-4 py-12">` wrapping `Container size="md"` wrapping `Card elevated` wrapping `children`, plus a "Son güncelleme" note and a back-to-home link. Later tasks (2-5) render their content as `children` of this layout, so their page content must NOT re-wrap in `Container`/`Card` themselves.

- [ ] **Step 1: Write the layout file**

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { Card } from '@/components/ui/Card'

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false
  }
}

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen items-start justify-center bg-surface p-4 py-12">
      <Container size="md">
        <Card elevated>
          {children}
          <div className="mt-8 border-t border-border pt-4 text-sm">
            <Link href="/" className="text-brand-accent underline underline-offset-4 hover:text-brand-accent-hover">
              Ana sayfaya dön
            </Link>
          </div>
        </Card>
      </Container>
    </div>
  )
}
```

- [ ] **Step 2: Verify the file compiles**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: No errors referencing `app/legal/layout.tsx`

- [ ] **Step 3: Commit**

```bash
git add app/legal/layout.tsx
git commit -m "feat: add shared layout for legal pages"
```

---

### Task 2: Privacy Policy page

**Files:**
- Create: `app/legal/privacy-policy/page.tsx`

**Interfaces:**
- Consumes: renders as `children` inside `app/legal/layout.tsx` (Task 1) — do not add `Container`/`Card` wrappers here.
- Produces: page reachable at `/legal/privacy-policy`, linked by Footer (Task 6) as `href="/legal/privacy-policy"`.

- [ ] **Step 1: Write the page file**

```tsx
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
          Oy Ver Gitsin ("Site"), bağımsız/kişisel bir proje olarak yürütülmektedir; Site'nin
          arkasında ticari bir şirket bulunmamaktadır. Bu Gizlilik Politikası, Site'yi kullanırken
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
```

- [ ] **Step 2: Verify the page compiles**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: No errors referencing `app/legal/privacy-policy/page.tsx`

- [ ] **Step 3: Commit**

```bash
git add app/legal/privacy-policy/page.tsx
git commit -m "feat: add privacy policy page"
```

---

### Task 3: Terms of Use page

**Files:**
- Create: `app/legal/terms-of-use/page.tsx`

**Interfaces:**
- Consumes: renders as `children` inside `app/legal/layout.tsx` (Task 1) — no `Container`/`Card` wrappers.
- Produces: page reachable at `/legal/terms-of-use`, linked by Footer (Task 6) as `href="/legal/terms-of-use"`.

- [ ] **Step 1: Write the page file**

```tsx
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
          Oy Ver Gitsin&apos;i ("Site") kullanarak aşağıdaki şartları kabul etmiş
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
            Site "olduğu gibi" sunulmaktadır. Sitenin kesintisiz veya hatasız
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
```

- [ ] **Step 2: Verify the page compiles**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: No errors referencing `app/legal/terms-of-use/page.tsx`

- [ ] **Step 3: Commit**

```bash
git add app/legal/terms-of-use/page.tsx
git commit -m "feat: add terms of use page"
```

---

### Task 4: KVKK Disclosure page

**Files:**
- Create: `app/legal/kvkk-disclosure/page.tsx`

**Interfaces:**
- Consumes: renders as `children` inside `app/legal/layout.tsx` (Task 1) — no `Container`/`Card` wrappers.
- Produces: page reachable at `/legal/kvkk-disclosure`, linked by Footer (Task 6) as `href="/legal/kvkk-disclosure"`.

- [ ] **Step 1: Write the page file**

```tsx
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
          ("KVKK") m.10 uyarınca, Oy Ver Gitsin ("Site") üzerinden kişisel
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
            işlemenin hukuki dayanağını oluşturur.
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
```

- [ ] **Step 2: Verify the page compiles**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: No errors referencing `app/legal/kvkk-disclosure/page.tsx`

- [ ] **Step 3: Commit**

```bash
git add app/legal/kvkk-disclosure/page.tsx
git commit -m "feat: add KVKK disclosure page"
```

---

### Task 5: Cookie Policy page

**Files:**
- Create: `app/legal/cookie-policy/page.tsx`

**Interfaces:**
- Consumes: renders as `children` inside `app/legal/layout.tsx` (Task 1) — no `Container`/`Card` wrappers.
- Produces: page reachable at `/legal/cookie-policy`, linked by Footer (Task 6) as `href="/legal/cookie-policy"`, and linked from Privacy Policy (Task 2) as `href="/legal/cookie-policy"`.

- [ ] **Step 1: Write the page file**

```tsx
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
          Bu Çerez Politikası, Oy Ver Gitsin&apos;in ("Site") kullandığı çerezleri ve
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
```

- [ ] **Step 2: Verify the page compiles**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: No errors referencing `app/legal/cookie-policy/page.tsx`

- [ ] **Step 3: Commit**

```bash
git add app/legal/cookie-policy/page.tsx
git commit -m "feat: add cookie policy page"
```

---

### Task 6: Link legal pages in the footer

**Files:**
- Modify: `components/layout/Footer.tsx`

**Interfaces:**
- Consumes: routes produced by Tasks 2-5 (`/legal/privacy-policy`, `/legal/terms-of-use`, `/legal/kvkk-disclosure`, `/legal/cookie-policy`)

- [ ] **Step 1: Read the current file to confirm line numbers**

Run: view `components/layout/Footer.tsx` — confirm the `<footer>` element starts at line 7 and the existing `<div className="mx-auto max-w-6xl px-4 py-3 ...">` is the single content row.

- [ ] **Step 2: Add a `Link` import and a new legal-links row above the existing content div**

Replace the full file contents with:

```tsx
import Link from 'next/link'
import { siteConfig } from '@/lib/site'

const LEGAL_LINKS = [
  { href: '/legal/privacy-policy', label: 'Gizlilik Politikası' },
  { href: '/legal/terms-of-use', label: 'Kullanım Şartları' },
  { href: '/legal/kvkk-disclosure', label: 'KVKK Aydınlatma Metni' },
  { href: '/legal/cookie-policy', label: 'Çerez Politikası' },
]

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-brand-accent/30 bg-brand-ink text-white/80">
      <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-x-4 gap-y-1 px-4 pt-3 text-[11px] text-white/50">
        {LEGAL_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="underline underline-offset-4 transition-colors hover:text-brand-accent"
          >
            {link.label}
          </Link>
        ))}
      </div>
      <div className="mx-auto max-w-6xl px-4 py-3 text-center text-[11px] leading-relaxed text-white/50">
        <span className="font-heading font-semibold text-white/80">{siteConfig.shortName}</span>
        {' · '}
        Türkiye Siyasi Eşleşme Platformu
        {' · '}
        Faydali baglanti:{' '}
        <a
          href="https://ufuksoynakliyat.com.tr/pendik-evden-eve-nakliyat"
          rel="dofollow"
          target="_blank"
          className="font-medium text-brand-accent underline underline-offset-4 transition-colors hover:text-brand-accent-hover"
          title="Pendik Evden Eve Nakliyat - Ufuksoy Nakliyat A.Ş."
          aria-label="Pendik Evden Eve Nakliyat Firması Ufuksoy Nakliyat A.Ş."
        >
          Pendik Evden Eve Nakliyat
        </a>{' '}
        Firması Ufuksoy Nakliyat A.Ş.
        {' · '}
        © {year} {siteConfig.shortName}. Tüm hakları saklıdır.
      </div>
    </footer>
  )
}
```

- [ ] **Step 3: Verify the file compiles**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: No errors referencing `components/layout/Footer.tsx`

- [ ] **Step 4: Commit**

```bash
git add components/layout/Footer.tsx
git commit -m "feat: link legal pages in footer"
```

---

### Task 7: Build verification and manual check

**Files:** none (verification only)

- [ ] **Step 1: Run a full production build**

Run: `npm run build`
Expected: Build succeeds; output lists `/legal/privacy-policy`, `/legal/terms-of-use`, `/legal/kvkk-disclosure`, `/legal/cookie-policy` as static routes (○ symbol in the Next.js build route table)

- [ ] **Step 2: Start the dev server and manually verify**

Run: `npm run dev` (in background)

Then in a browser, visit `http://localhost:3000/` and confirm:
- Footer shows 4 legal links side-by-side above the existing copyright line
- Clicking each link navigates to the correct `/legal/...` route
- Each legal page renders its title, content, and a "Ana sayfaya dön" link back to `/`
- View page source (or check Next.js metadata) on one legal page and confirm `<meta name="robots" content="noindex,nofollow">` is present

- [ ] **Step 3: Stop the dev server**

Kill the background dev server process once verification is complete.

- [ ] **Step 4: Commit if any manual fixes were needed**

If Step 2 revealed issues requiring code changes, fix them, re-run Steps 1-2, then:

```bash
git add -A
git commit -m "fix: address manual verification issues in legal pages"
```

If no fixes were needed, no commit is required for this task.
