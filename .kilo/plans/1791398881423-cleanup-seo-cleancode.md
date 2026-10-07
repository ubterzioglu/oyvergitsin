# Dosya Temizliği + SEO/GEO + Clean Code — Birleştirilmiş Plan

## Özet

3 çalışma başlığı tek planda birleştirildi: dosya temizliği, SEO/GEO düzeltmeleri, clean code iyileştirmeleri.
Küçük batch'ler halinde, onay gerektirmeyenlerden onay gerektirenlere doğru sıralandı.
Test komutları kullanıcı tarafından çalıştırılacak.

---

## BÖLÜM A — Onay Gerektirmeyen Batch'ler (Küçükten Büyüğe)

### Batch A1: Footer Spam Backlink Temizliği [SEO] [KRİTİK]

**Dosya:** `components/layout/Footer.tsx`

**Sorun:** Footer'da alakasız 5 dofollow backlink var (nakliyat, hurda, erotik shop). Bunlar SEO itibar riski ve Google spam sinyali.

**Değişiklik:**
- Satır 40-91 arası "Faydali baglanti" bölümünü tamamen kaldır
- Footer sadece legal linkler + feedback + copyright olarak kalsın
- `rel="dofollow"` olan tüm dış linkleri sil

**Risk:** Yok. Bu linklerin siteye hiçbir katkısı yok.

**Doğrulama:**
```
npm run lint
npm run build
```

---

### Batch A2: Eski Video Dosyalarını Temizleme [DOSYA] 

**Dosyalar:**
- `public/videos/hero-bg.old.mp4`
- `public/videos/hero-bg.old2.mp4`

**Aksiyon:** Bu iki dosyayı sil. Yalnızca `hero-bg.mp4` kalmalı.

**Not:** Fork dizinlerindeki (`oyvergitsin-*/public/videos/`) eski videolara dokunulmayacak (onay batch'inde değerlendirilecek).

**Risk:** Yok. Dosyalar `.old` uzantılı, kullanılmıyor.

**Doğrulama:**
```
npm run build
```

---

### Batch A3: `: any` Tip Kullanımlarını Giderme [CLEAN CODE]

**Dosya:** `lib/siyaset-radari/public-data.ts`

**Sorun:** 5 adet `any` tip kullanımı var (satır 89, 101, 120, 138, 156). Hepsi Supabase row-mapper fonksiyonlarında.

**Değişiklik:**
- Her `row: any` için Supabase tablo tipini kullan. Eğer `@/lib/supabase` içinde generated tip varsa onu, yoksa `Record<string, unknown>` kullanıp erişimleri tip-safe hale getir.
- Alternatif: En azından `Record<string, unknown>` yapıp property access'leri `as string` ile düzelt.

**Risk:** Düşük. Sadece tip tanımları değişiyor, runtime davranışı aynı.

**Doğrulama:**
```
npm run lint
npx tsc --noEmit
npm test
```

---

### Batch A4: `public/logo.png` Temizliği [DOSYA] [SEO]

**Dosya:** `public/logo.png` (ana proje — eğer varsa)

**Sorun:** `app/manifest.ts` yorumlarında "Eski marka logosu (public/logo.png, 1.8 MB) kaldırıldı" yazıyor ama dosya hala mevcut olabilir.

**Aksiyon:** Ana projede `public/logo.png` varsa sil. Fork'lardakine dokunma.

**Risk:** Yok. Manifest zaten bu dosyayı referans etmiyor.

**Doğrulama:**
```
npm run build
```

---

### Batch A5: `supabase.zip` Temizliği [DOSYA]

**Dosya:** `supabase.zip` (proje kökü)

**Sorun:** `supabase/` dizininin yedeği olan  arşiv dosyası. `.gitignore`'da `*.zip` ile ignore edilmiş ama diskte duruyor.

**Aksiyon:** Sil.

**Risk:** Yok. `supabase/` dizini zaten mevcut, migration'lar `supabase/migrations/` altında.

**Doğrulama:**
```
npm run lint
```

---

### Batch A6: `tsconfig.tsbuildinfo` Temizliği [DOSYA] [CLEAN CODE]

**Dosya:** `tsconfig.tsbuildinfo` (proje kökü, eğer varsa)

**Sorun:** Build artifact. `.gitignore`'da var ama diskte kalmış olabilir.

**Aksiyon:** Sil.

**Doğrulama:**
```
npx tsc --noEmit
```

---

## BÖLÜM B — Onay Gerektiren Batch'ler

### Batch B1: `oyvergitsin-*` Fork Dizinlerinin Temizliği [DOSYA] [KRİTİK]

**17 dizin:**
`oyvergitsin-admin/`, `oyvergitsin-api/`, `oyvergitsin-design/`, `oyvergitsin-geo/`, `oyvergitsin-home/`, `oyvergitsin-int/`, `oyvergitsin-legal/`, `oyvergitsin-logo/`, `oyvergitsin-method/`, `oyvergitsin-radar/`, `oyvergitsin-radar-v2/`, `oyvergitsin-results/`, `oyvergitsin-seo/`, `oyvergitsin-shell/`, `oyvergitsin-survey/`, `oyvergitsin-tokens/`, `oyvergitsin-ui/`

**Sorun:** Her biri ana projenin tam kopyası. Her birinde `node_modules/`, `.next/`, `package-lock.json` var. Devasa disk israfı.

**Seçenekler:**
1. **Hepsini sil** — Eğer hiçbiri aktif geliştirme için kullanılmıyorsa
2. **İçeriklerini inceleyip koruma kararı al** — Hangisinde önemli değişiklik var?
3. **Git'e ekle ve ignore et** — `.gitignore`'a `oyvergitsin-*/` ekle (zaten untracked olabilirler)

**Kullanıcı kararı gerekli:** Bu dizinler aktif mi? Silinebilir mi?

---

### Batch B2: Legal Sayfaları Indexing Kararı [SEO]

**Dosya:** `app/legal/layout.tsx`

**Mevcut durum:** Tüm legal sayfalar `noindex, nofollow` — Google'da görünmüyorlar.

**Soru:** Legal sayfalar (Gizlilik Politikası, KVKK, Çerez, Kullanım Şartları) index edilmeli mi?
- **Evet ise:** `layout.tsx`'deki `robots: { index: false, follow: false }` kaldır. KVKK ve gizlilik sayfaları trust sinyali olarak değerli.
- **Hayır ise:** Değişiklik yok.

**Kullanıcı kararı gerekli.**

---

### Batch B3: `.well-known/security.txt` Ekleme [SEO] [GEO]

**Yeni dosya:** `public/.well-known/security.txt`

**İçerik önerisi:**
```
Contact: mailto:supabase@oyvergitsin.org
Preferred-Languages: tr, en
Canonical: https://oyvergitsin.org/.well-known/security.txt
```

**Amaç:** Güvenlik araştırmacılarının vulnerability bildirim yolu. SEO'ya dolaylı katkı (trust sinyali).

**Kullanıcı kararı gerekli:** İsteniyor mu?

---

### Batch B4: `llms.txt` İçerik Güncellemesi [GEO]

**Dosya:** `public/llms.txt` + `scripts/generate-llms-txt.js`

**Mevcut durum:** `llms.txt` 8 eksen, 12 parti, 25 soru, v2 model bilgisi içeriyor. Script ile üretiliyor.

**Potansiyel iyileştirmeler:**
- `llms-full.txt` ekle (daha detaylı, her eksenin açıklaması + örnek sorular)
- Script'e son güncelleme tarihi ekle
- Parti listesinde aktif/pasif ayrımı

**Kullanıcı kararı gerekli:** Hangi iyileştirmeler isteniyor?

---

### Batch B5: ESLint Config Güçlendirme [CLEAN CODE]

**Dosya:** `.eslintrc.json`

**Mevcut:** Sadece `next/core-web-vitals` extend ediyor.

**Önerilen ekleme:**
```json
{
  "extends": "next/core-web-vitals",
  "rules": {
    "no-unused-vars": "warn",
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

**Etki:** Gelecekte `any` kullanımı ve unused import'lar uyarı verecek.

**Kullanıcı kararı gerekli:** İsteniyor mu?

---

### Batch B6: `any` Tiplerini Supabase Generated Tiplerle Değiştirme [CLEAN CODE]

**Dosya:** `lib/siyaset-radari/public-data.ts`

**Batch A3'ten devam:** Eğer Supabase generated tipler varsa (`supabase/types.ts` gibi), `Record<string, unknown>` yerine gerçek tablo tiplerini kullan.

**Kullanıcı kararı gerekli:** Supabase tip generation kullanılıyor mu?

---

## Uygulama Sırası

| # | Batch | Onay? | Tahmini Dosya Sayısı |
|---|-------|-------|---------------------|
| 1 | A1 — Footer spam temizliği | Hayır | 1 |
| 2 | A2 — Eski video temizliği | Hayır | 2 silme |
| 3 | A3 — `: any` tip düzeltme | Hayır | 1 |
| 4 | A4 — `public/logo.png` temizliği | Hayır | 0-1 |
| 5 | A5 — `supabase.zip` temizliği | Hayır | 1 silme |
| 6 | A6 — `tsconfig.tsbuildinfo` temizliği | Hayır | 0-1 |
| 7 | B1 — Fork dizin temizliği | **Evet** | 17 dizin |
| 8 | B2 — Legal indexing kararı | **Evet** | 1 |
| 9 | B3 — security.txt ekleme | **Evet** | 1 yeni |
| 10 | B4 — llms.txt güncelleme | **Evet** | 1-2 |
| 11 | B5 — ESLint güçlendirme | **Evet** | 1 |
| 12 | B6 — Supabase tip mapping | **Evet** | 1-2 |

---

## Test Stratejisi

Her batch sonrası kullanıcı şu komutları çalıştıracak:

| Batch | Test Komutları |
|-------|---------------|
| A1 | `npm run lint` → `npm run build` |
| A2 | `npm run build` |
| A3 | `npm run lint` → `npx tsc --noEmit` → `npm test` |
| A4 | `npm run build` |
| A5 | `npm run lint` |
| A6 | `npx tsc --noEmit` |
| B1 | `npm run lint` → `npm run build` |
| B2 | `npm run build` → manuel: sayfayı aç, meta tag kontrol et |
| B3 | `npm run build` → manuel: `/.well-known/security.txt` URL'ini kontrol et |
| B4 | `npm run geo:llms` → `public/llms.txt` içeriğini kontrol et |
| B5 | `npm run lint` |
| B6 | `npm run lint` → `npx tsc --noEmit` → `npm test` |

---

## Kapsam Dışı

- Fork dizinlerindeki (`oyvergitsin-*/`) kaynak kod değişiklikleri — sadece ana proje
- Veritabanı migration'ları
- Yeni sayfa veya özellik ekleme
- Performans optimizasyonu (LCP, CWV)
- i18n / çoklu dil desteği
