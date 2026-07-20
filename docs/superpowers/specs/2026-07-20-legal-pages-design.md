# Yasal Sayfalar (Gizlilik, Kullanım Şartları, KVKK, Çerez) — Tasarım

## Amaç

"Oy Ver Gitsin" siyasi eşleşme platformu, kullanıcıların siyasi görüşlerini (KVKK m.6 ve GDPR m.9 kapsamında özel nitelikli kişisel veri) topluyor. Şu an sitede sadece anket akışı içinde kısa bir rıza metni var; ayrı, keşfedilebilir yasal sayfalar yok. Bu, sitenin yasal risklerini azaltmak amacıyla footer'dan erişilebilir 4 yasal sayfa ekler:

1. Gizlilik Politikası
2. Kullanım Şartları
3. KVKK Aydınlatma Metni
4. Çerez Politikası

**Not:** Bu metinler taslak niteliğindedir, gerçek hukuki danışmanlık yerine geçmez. Amaç, sitenin en azından temel şeffaflık/açıklama yükümlülüklerini karşılayan, kod tabanıyla çelişmeyen, temkinli bir çerçeve sunmaktır.

## Kapsam Dışı

- Gerçek bir avukat/hukuk danışmanı incelemesi (kullanıcı bunu ayrıca yaptırmalı)
- KVKK başvuru formu / VERBİS kaydı gibi operasyonel süreçler
- Çerez onay banner'ı (cookie consent UI) — sadece politika metni ekleniyor, banner ayrı bir iş
- Mevcut consent sayfasının (`app/consent/page.tsx`) içeriğinin değiştirilmesi

## Route Yapısı

```
app/legal/
  layout.tsx              # ortak metadata (noindex) + prose sarmalayıcı
  privacy-policy/page.tsx
  terms-of-use/page.tsx
  kvkk-disclosure/page.tsx
  cookie-policy/page.tsx
```

- `app/legal/layout.tsx`: `robots: { index: false, follow: false }` (consent sayfasındaki pattern ile aynı), sayfaları `Container` + `Card` ile sarar, ortak "Son güncelleme: {tarih}" ve geri dön linki içerir.
- Her `page.tsx`: sadece `export const metadata` (title) + içerik JSX'i. Server component, statik.

## İçerik Yaklaşımı

Her sayfa `prose prose-neutral max-w-none` class'ıyla, mevcut consent sayfasındaki tipografi ve ton ile tutarlı yazılacak. Başlıklar `<h2>`, madde listeleri `<ul>`.

**Ortak bilgiler (tüm sayfalarda tutarlı olacak):**
- Veri sorumlusu / site sahibi: bağımsız/kişisel proje olarak tanımlanır (ticari unvan kullanılmaz)
- İletişim: supabase@oyvergitsin.org
- Altyapı: Supabase (veritabanı/auth) + Vercel benzeri hosting — sunucu konumu için genel ifade ("yurt içi/yurt dışı sunucular" gibi), spesifik veri merkezi adı iddia edilmeyecek

**Gizlilik Politikası içeriği:**
- Toplanan veri türleri: anket cevapları, oturum/cihaz bilgisi (fingerprint), IP (hash'lenmiş — koddaki `behavior_events`/risk skorlama ile tutarlı)
- İşleme amacı: anonim siyasi eğilim analizi
- Üçüncü taraf paylaşımı: yok (satış/pazarlama amaçlı paylaşım yapılmadığı belirtilir)
- Analitik: Microsoft Clarity kullanıldığı açıkça belirtilir (kod tabanında `layout.tsx` içinde görülüyor)
- Saklama süresi: genel/temkinli ifade — spesifik olmayan ama makul bir çerçeve
- Veri güvenliği: RLS, hash'leme gibi teknik önlemlere genel atıf

**Kullanım Şartları içeriği:**
- Sitenin bilgilendirme/eğlence amaçlı olduğu, sonuçların bağlayıcı bir oy tavsiyesi olmadığı (sorumluluk reddi — bu kritik: "sonuçlar kesin doğruluk taşımaz, resmi bir kaynak değildir")
- Fikri mülkiyet, kullanım kısıtları (kötüye kullanım, otomatik veri çekme yasağı)
- Sorumluluk sınırlaması
- Değişiklik hakkı

**KVKK Aydınlatma Metni içeriği (6698 sayılı KVKK m.10 formatına uygun):**
- Veri sorumlusunun kimliği
- İşlenen kişisel veri kategorileri
- İşleme amacı ve hukuki sebebi (açık rıza — m.5/6)
- Aktarılabileceği taraflar (varsa hosting/altyapı sağlayıcıları — Supabase/Vercel, yurt dışı aktarım notu)
- Toplama yöntemi (web formu üzerinden)
- İlgili kişinin hakları (KVKK m.11 — bilgi talep etme, düzeltme, silme vb.)

**Çerez Politikası içeriği:**
- Kullanılan çerez/izleme teknolojisi: Microsoft Clarity (analitik), `localStorage` (sessionId saklama — teknik/zorunlu)
- Çerez türleri ve amaçları
- Kullanıcının tarayıcı ayarlarından çerezleri nasıl kontrol edebileceği

## Footer Değişikliği

`components/layout/Footer.tsx` içine mevcut satırın üstüne, yasal linklerin yan yana durduğu yeni bir satır eklenir:

```
Gizlilik Politikası · Kullanım Şartları · KVKK Aydınlatma Metni · Çerez Politikası
```

- `flex flex-wrap justify-center gap-x-3 gap-y-1` ile responsive
- Mevcut nakliyat linkine ve copyright satırına dokunulmaz
- Next.js `Link` component'i kullanılır (internal route)

## Test / Doğrulama

- `npm run build` ile route'ların derlendiği doğrulanır
- Her sayfanın `noindex` metadata'sının doğru çıktığı kontrol edilir
- Footer'da 4 linkin görünüp doğru route'lara gittiği manuel kontrol edilir (dev server üzerinden)
