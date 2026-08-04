# Agent Rules for oyvergitsin

Bu dosya bu repoda çalışan ajanlar için bağlayıcı çalışma notudur. Amaç hızlı kod üretmek değil; mevcut Next.js + Supabase yapısını bozmadan, güvenli ve test edilebilir değişiklik yapmaktır.

## Proje Özeti

`oyvergitsin.org`, Türkiye siyaseti için anonim siyasi eşleşme platformudur. Kullanıcı akışı:

- Ana sayfa -> açık rıza -> anket -> sonuçlar
- Admin paneli -> eksenler, sorular, partiler, rıza metinleri, radar/haber kaynakları
- API -> oturum, soru, cevap, tamamlama, sonuç ve admin/radar uçları

Teknik yapı:

- Next.js App Router ve TypeScript
- Supabase Postgres, Auth ve RLS
- Tailwind CSS
- Vitest scoring testleri
- Playwright E2E survey akışı

## Dosya Haritası

- `app/`: Next.js sayfaları, layout'lar ve API route handler'ları
- `components/`: UI, survey, admin, results, layout bileşenleri
- `lib/scoring/`: eşleşme algoritması, tipler ve testler
- `lib/supabase/`: client/server/route Supabase yardımcıları
- `lib/radar/`: haber/radar kaynak işleme mantığı
- `supabase/migrations/`: veritabanı şema değişiklikleri
- `scripts/`: seed, migration, audit, smoke ve doğrulama komutları
- `docs/`: operasyon, araştırma, tasarım ve metodoloji notları
- `.next/`, `.logs/`, `.omc/`, `.superpowers/`: üretilmiş veya yerel çalışma çıktıları; görev açıkça istemedikçe dokunma

## Çalışma Kuralları

- Mevcut kod stilini takip et: TypeScript, 2 boşluk girinti, single quote, semicolon yok.
- Uzun relative import yerine `@/` alias kullan.
- UI değişikliklerinde mevcut bileşenleri (`Button`, `Card`, `Container`, survey bileşenleri) tercih et.
- Scoring core'u framework bağımsız tut: `lib/scoring/core.ts` ve yakınındaki saf hesaplama dosyalarına Supabase veya Next.js import etme.
- Veri çekme ve Supabase bağımlılığı `lib/scoring/engine.ts`, API route'ları veya uygun server helper içinde kalmalı.
- Kullanıcıya ait veya yerel üretilmiş dosyaları temizleme, resetleme, formatlama ya da silme. Özellikle `.env*`, `.omc/`, `.logs/`, `.next/` dosyalarında dikkatli ol.
- Gizli anahtarları commitlenecek dosyalara yazma. Örnek env dosyalarında sadece placeholder kullan.

## Supabase ve Güvenlik

- RLS güvenlik sınırıdır. API tarafında yapılan session ownership kontrolü Supabase REST endpoint'ini tek başına korumaz.
- `lib/supabase/`, `app/api/*`, admin sayfaları ve migration değişikliklerinde RLS etkisini ayrıca düşün.
- Public anon key ile erişilebilecek tablolar için policy kontrolü yapmadan güvenli varsayımda bulunma.
- Eski sonuç snapshot'larını bozmamak için parti/eksen satırlarını silmek yerine lifecycle veya aktiflik alanlarını kullan.
- `result_snapshots.result_payload` v2 sonrası sonuç gövdesini saklar; eski sonuçların sonradan değişmemesi gerekir.

## Axis Model ve Scoring Notları

- Aktif soru modeli `axis_models` üzerinden belirlenir.
- `/api/questions` ve scoring engine yalnız aktif modeli kullanmalıdır.
- `v1` demo, `v2` metodoloji soru setidir.
- İnaktif modeli yerelde önizlemek için `PREVIEW_AXIS_MODEL_VERSION=v2 npm run dev` kullanılabilir; bunu prod ortamına taşıma.
- Parti eşleşmesinde kapalı/inaktif partiler yeni hesaplamaya girmemeli, ancak eski snapshot'lar çözülebilmelidir.

## Komutlar

- Bağımlılık: `npm install`
- Dev server: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`
- Unit test: `npm test`
- E2E: `npm run test:e2e`
- API smoke: `npm run smoke`
- RLS audit: `npm run audit:rls`
- Migration uygula: `npm run db:migrate <file.sql>`
- Seed: `npm run db:seed`
- v2 seed: `npm run v2:seed`
- v2 party positions: `npm run v2:positions`
- v2 doğrulama: `npm run v2:verify`
- v2 aktivasyon: `npm run v2:activate`

`supabase db push` etkileşimli parola isteyebilir; otomasyon için mevcut `npm run db:migrate <file.sql>` yolunu tercih et.

`npm run test:e2e` ve `npm run smoke` gerçek oturum ve cevap yazar. Varsayılan hedef localhost olmalı; remote hedef için yalnız ayrı test ortamında `ALLOW_REMOTE_TEST_WRITES=true` kullanılabilir.

## Test Stratejisi

- Scoring değişikliklerinde ilgili `lib/scoring/*.test.ts` dosyalarını çalıştır veya güncelle.
- Survey akışı, önem toggle'ı, "Fikrim yok", sonuç sayfası veya API zinciri değişirse Playwright veya smoke test çalıştır.
- API route ve RLS etkisi olan değişikliklerde `npm run audit:rls` çıktısını dikkate al.
- UI-only küçük değişikliklerde en azından `npm run lint` veya ilgili build kontrolünü çalıştır.

## Kod İnceleme Kontrol Listesi

- Aktif axis model filtresi korunuyor mu?
- Eski snapshot'ların görüntülenmesi bozuluyor mu?
- Public/admin ayrımı doğru Supabase client ile yapılıyor mu?
- RLS politikasına ihtiyaç doğuran yeni tablo/endpoint var mı?
- Hata mesajları kullanıcıya Türkçe ve anlaşılır dönüyor mu?
- Yeni env değişkenleri `.env.local.example` veya ilgili dokümana eklendi mi?
- Testler değişikliğin riskine uygun mu?

## Yapılmaması Gerekenler

- `.env`, `.env.local` veya gerçek secret içeren dosyaları paylaşma ya da commit'e hazırlama.
- Generated build çıktısını (`.next/`, standalone node_modules, loglar) elle düzenleme.
- Scoring algoritmasını UI ihtiyacı için doğrudan bükme; önce veri sözleşmesini netleştir.
- RLS yerine yalnız middleware/API kontrolüne güvenme.
- Production’da `SESSION_HASH_SECRET` olmadan session endpoint’inin çalışacağını varsayma.
- Survey, results, consent, admin veya API route’larına üçüncü taraf analytics/session replay ekleme.
- Büyük refactor'ı küçük bug fix ile karıştırma.
