# Kalan İşler — Ajan Promptları

**Kime yazıldı:** Promptu bir ajana yapıştıracak kişi. Blok kopyala-yapıştır içindir.

**Güncelleme — 2026-10-05:** Bu belge ilk hâlinde B13, B18 ve B19 için üç prompt
içeriyordu. **B13 ve B18 bitti ve `main`'de** (`42b8381`, `f03bb5b`; `main` =
`04f77bb`). Geriye yalnızca **B19** kaldı, aşağıda güncel tabanla yeniden yazıldı.

Güncel durum için tek doğru kaynak: `docs/plan-2026-10-02-bakim-tbmm-seo-tasarim.md`
(en üstteki **DURUM** bölümü). Bağlam, token referansı ve tuzaklar:
`docs/devam-2026-10-03.md`.

---

## B19 — alias temizliği

Ajanın kapsamı **çok küçük**: üç dosya, bir sınıf değişimi, iki silme. Büyük bir
batch değil; ağırlık doğrulamada (özellikle build çıktısı ölçümü).

```
Depo: C:\temp_private\oyvergitsin (Next.js 14 + TypeScript + Tailwind + Supabase)
ÖNCE OKU: docs/plan-2026-10-02-bakim-tbmm-seo-tasarim.md — üstteki DURUM bölümü
ve "B19 — Alias temizliği" bölümü.

TABAN: main (04f77bb). B0–B18 burada.
  git fetch origin main
  git log --oneline -1 origin/main      → 04f77bb veya sonrası olmalı
Değilse DUR ve bildir.

İZOLE ÇALIŞ — ana checkout'ta ASLA dal değiştirme (yerel main klasörü eski bir
commit'te ve çözülmemiş bir .omc girdisi var; orada commit atılamaz):
  git worktree add C:\temp_private\oyvergitsin-cleanup -b design/cleanup origin/main
  cmd /c mklink /J "C:\temp_private\oyvergitsin-cleanup\node_modules" "C:\temp_private\oyvergitsin\node_modules"
  Copy-Item C:\temp_private\oyvergitsin\.env.local C:\temp_private\oyvergitsin-cleanup\
Worktree'yi repo kök dizininin İÇİNE açma (daha önce kök dizine 17 boş gitlink
girip main'de `git submodule update --init`'i bozmuştu).

OWNS: tailwind.config.ts, app/globals.css, components/feedback/FeedbackModal.tsx
Başka hiçbir dosyaya yazma. lib/scoring/*, app/api/**, supabase/migrations/** ASLA.

NEDEN VAR: B10, rainbow.* token'larını silmedi, nötr değerlere yeniden bağladı —
o gün 33 dosyada 100 sınıf kullanımı vardı ve silmek sayfaların rengini düşürürdü.
Artık kullanım kalmadı; borç kapanıyor.

YAP:
1. components/feedback/FeedbackModal.tsx:66 — `focus:border-rainbow-blue`
   → `focus:border-accent`. (Tek işlevsel kalıntı bu.)
2. Şu komutun çıktısı BOŞ olmalı (yorum satırları sayılmaz):
     git grep -nE "(bg|text|border|ring|fill|stroke|from|to|via)-rainbow-" -- app components
   Boş değilse DUR, hangi dosyanın kaldığını bildir, temizliğe başlama.
3. tailwind.config.ts: `rainbow:` bloğunu (13 token) ve üstündeki "GEÇİCİ ALIAS"
   açıklamasını sil.
4. app/globals.css: `.rainbow-gradient-border` yardımcısını ve açıklamasını sil.
   ÖNCE `git grep rainbow-gradient-border` ile hiçbir yerde kullanılmadığını teyit et.

KANITLA (iddia etme, çıktı göster):
  a) TEMİZ build ve ölçüm — .next/static içinde şu altı hex için toplam 0 adet:
       F5C518  F5821F  E8385C  7B4FE0  1E9BE0  3CB043
     Yalnızca kaynak taraması YETMEZ: bir noktada CSS tamamen temizken JS paketi
     14 tane eski hex taşıyordu (inline style'lar Tailwind'den geçmez).
  b) npm test (144 test) / npm run lint / npm run build yeşil
  c) npm run test:e2e 6/6 — BASE_URL AYARLAMA (canlıya yazar!)
       TUZAK: ilk koşuda 1 test düşerse regresyon sanma. Next dev /consent'i
       derlerken 60sn sınırını aşıyor. Önce `npx next dev -p 3000` başlat,
       /consent ve /survey'i bir kez aç, sonra e2e koş.
  d) git diff --name-only yalnızca üç Owns dosyası
  e) Tüm sayfaları (/, /survey, /siyaset-radari, /metodoloji, /legal/*, /admin/login)
     tarayıcıda gez; hiçbir yerde renk kaybı olmadığını gör.

Commit: conventional + CLAUDE.md trailer formatı (Constraint: / Rejected: /
Confidence: / Scope-risk: / Not-tested:). Mesajı dosyaya yaz, `git commit -F <dosya>`
(PowerShell'de `-F -` pipe ÇALIŞMIYOR). main'e MERGE ETME, dalı bırak ve bildir.
```

---

## Proje sahibinde bekleyenler (ajan dokunmaz)

1. **`app/opengraph-image.png`** — hâlâ eski logo (97.206 bayt). En son iş;
   siteyi paylaşan herkes bu görseli görüyor. Başka bir görselle değiştirilecek.
2. **16 TBMM kaydını admin panelinden onayla.** Veri hazır (592 sandalye, AKP 280)
   ama hepsi `pending`/`private`; onaylanana kadar pasta grafiği boş görünür.
3. `public/logo.png` (1.8 MB) — hiçbir koddan referans almıyor, silinebilir.
4. İsteğe bağlı: BBC Türkçe haber kaynağı kapalı (`is_enabled=false`); kullanım
   şartlarını kontrol ettikten sonra `/admin/radar/sources`'tan etkinleştir.
5. Yerel `main` klasörü eski (`76395c0`) ve çözülmemiş `.omc/project-memory.json`
   (`DU`) girdisi var; `git pull` öncesi çözülmeli. 17 silinmiş worktree kaydı için
   `git worktree prune`.

### Script tuzağı

`npm run radar:tbmm -- --dry-run` **çalışmıyor** — `--dry-run` bayrağını npm
kendisi tüketiyor, kuru koşu sanılan komut veritabanına gerçekten yazıyor. Doğrusu:

```powershell
node scripts/refresh-tbmm-seats.js --dry-run
```
