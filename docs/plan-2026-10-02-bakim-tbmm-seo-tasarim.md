# Uygulama Planı — 2026-10-02

**Bu belge başka ajanların uygulaması için yazılmıştır.** Planı hazırlayan oturumun bağlamı sende yok, bu yüzden her bulgu kanıtıyla birlikte veriliyor. Dosya yolları ve satır numaraları, aksi belirtilmedikçe `origin/main` üzerindedir.

İş **batch**'lere bölünmüştür. Her batch tek bir ajanın tek oturumda bitirebileceği büyüklüktedir ve kendi `Depends on` / `Owns` / `Done when` alanlarını taşır.

---

## DURUM — 2026-10-05 (son)

**19 batch'in 19'u kapandı (B0–B18). `main` = `04f77bb` ve canlıya push edildi.**
Geriye plan dışı küçük bir temizlik (B19) ve proje sahibine ait işler kalıyor — en
altta "Kalan işler".

Önceki devir belgeleri: `docs/devam-2026-10-03.md` (bağlam, token referansı, tuzaklar)
ve `docs/kalan-promptlar-2026-10-03.md` (artık yalnızca B19 geçerli).

| Batch | Durum | Dal / commit |
|---|---|---|
| B0 | ✅ | — (31 commit pull) |
| B1 | ✅ | `fix/tbmm-parser` `aa4d34c` |
| B2 | ✅ | `chore/repo-hygiene` `ad3dd97` + `07904dc` (.omc takipten çıktı) |
| B3 | ✅ | `feat/seo-sitemap` `90b1f53` |
| B4 | ✅ | `feat/llms-jsonld` `47b3d8a` |
| B5 | ✅ | `refactor/api-errors` `d84572c` |
| B6 | 🟡 kod ✅ | `chore/remove-logos` `4b976ba` — `public/logo.png` ve `app/opengraph-image.png` hâlâ takipli (proje sahibi) |
| B7 | ✅ | `refactor/question-renderer` `276fb41` |
| B8 | ✅ | `9add1b3` |
| B9 | ✅ Yön A | `design/direction` `2478272` |
| B10 | ✅ | `design/tokens` `b5ae962` |
| B11 | ✅ | `design/ui-components` `f771afc` |
| B12 | ✅ | `design/home` `2de00ba` |
| B13 | ✅ | `design/radar-v2` `42b8381` |
| B14 | ✅ | `design/survey` `4e4d621` |
| B15 | ✅ | `design/results` `999ad8f` |
| B16 | ✅ | `design/metodoloji` `258c84a` |
| B17 | ✅ | `design/legal` `6cac8ad` |
| B18 | ✅ | `design/admin` `f03bb5b` |
| (plan dışı) shell | ✅ | `design/shell` `99566cf` — kabukta AA kontrast, DEM parti rengi |
| B19 | ⬜ | alias temizliği — aşağıda |

### 2026-10-05'te bulunan ve düzeltilen şeyler

1. **`main`'e 17 boş gitlink girmişti.** `76395c0` ("move oyvergitsin sub-packages
   into main repo") kök dizine `oyvergitsin-admin` … `oyvergitsin-ui` adlı 17
   gitlink (mod 160000) eklemişti; `.gitmodules` yok, işaret ettikleri klasörler
   silinmiş worktree'ler. Ölçüm: `git submodule update --init` main üzerinde
   `fatal: No url found for submodule path 'oyvergitsin-admin'` ile düşüyordu —
   submodule başlatan her clone/CI/dağıtım adımı takılabilirdi. Düzeltme `0d7c61b`
   (yalnızca index girdileri; dosya silinmedi).
   Ders: worktree'leri repo kök dizininin içine açma, `git add -A` öncesi `git
   status` ile `160000` girdilerine bak.
2. **B13'ün testi hiç koşmuyordu.** `components/siyaset-radari/party-colors.test.ts`
   (13 test; "bir partinin dilimi başka partinin markasıyla boyanmaz" dahil)
   `vitest.config.ts` include listesinde olmadığı için `npm test` tarafından
   sessizce atlanıyordu. `04f77bb` ile dahil edildi: 131 → **144 test**, 13/13 geçiyor.
3. **Migration denetimi — canlıya karşı.** 001–013'ün yarattığı tüm tablo ve
   sütunlar canlıda sorgulandı: **eksik nesne 0.** Önceki notlar geçersiz:
   "migration 013 uygulanmamış / `radar_feed_items` yok" doğru değil artık — iki
   tablo da canlıda var (boş). Tek gerçek eksik **008** idi (BBC Türkçe kaynağı,
   `news_sources` boştu); 2026-10-05'te uygulandı ve doğrulandı: 1 kayıt,
   `is_enabled=false`, `terms_checked=false`. 002/003/004 yalnızca RLS politikası
   olduğundan REST ile doğrulanamıyor (oturum akışı e2e'de çalışıyor).
4. **Tam yığın doğrulandı:** `tsc` temiz · lint temiz · 144 test · build 45/45 ·
   **e2e 6/6** (B1–B18 birlikte; uçtan uca anket→sonuç 26.6 sn).

### Canlı veri durumu

- **TBMM:** `election_results_by_area`'da 16 kayıt (592 sandalye, AKP 280) —
  hepsi `pending` / `private`; anon anahtar **0** kayıt görüyor, yani pasta
  grafiği **boş görünür.** Sebep kod değil, editoryal onay bekleniyor.
- **Radar akışı:** `radar_feed_items` mevcut ama 0 kayıt.
- **Haber kaynağı:** `news_sources`'ta yalnızca kapalı BBC Türkçe.

### Kalan işler

**A) B19 — alias temizliği (ajan, ~15 dk).** Gerçek işlevsel kalıntı çok küçük:
`components/feedback/FeedbackModal.tsx:66`'da bir `focus:border-rainbow-blue`
sınıfı; `app/globals.css`'te hiçbir yerde kullanılmayan `.rainbow-gradient-border`;
`tailwind.config.ts`'te `rainbow` alias bloğu. (Önceki sayımdaki
`ImportanceToggle`/`LikertScale`/`survey/page.tsx` eşleşmeleri yalnızca yorum
satırı.) Ayrıntı: aşağıdaki "B19" bölümü.

**B) Proje sahibinde:**
1. `app/opengraph-image.png` — hâlâ eski logo (97.206 bayt). **En son iş;
   hatırlatıldı.** Değiştirilecek.
2. `public/logo.png` (1.8 MB) — hiçbir koddan referans almıyor, silinebilir.
3. **16 TBMM kaydını admin panelinden onayla** — grafik ancak onaydan sonra dolar.
4. (İsteğe bağlı) BBC Türkçe kaynağını kullanım şartlarını kontrol ettikten sonra
   `/admin/radar/sources`'tan etkinleştir.
5. Yerel `main` klasörü `76395c0`'da, geride; ayrıca çözülmemiş
   `.omc/project-memory.json` (`DU`) girdisi var — `git pull` öncesi çözülmeli.
   17 silinmiş worktree kaydı için `git worktree prune`.

**C) Doğrulanmamış (bilinçli):** B12–B18 sayfaları B10'dan sonra toplu olarak
gözle incelenmedi (yalnızca B10 incelendi); PWA kurulumu gerçek cihazda
denenmedi; `llms.txt` üretimi CI'da koşmuyor (eksen modeli değişince elle
`npm run geo:llms`).

### Planın bu oturumda yanlış çıkan üç ön kabulü

1. **"Palet tek yerde tanımlı, değişim mekanik olarak küçük"** — değildi.
   Tailwind'den geçmeyen **beş** ayrı hardcoded hex kümesi vardı (B10 bölümüne
   işlendi). En kötüsü TBMM pasta grafiğinin parti dilimlerini gökkuşağı
   renkleriyle boyamasıydı.
2. **Palet envanteri 70 kullanım / 30 dosya** deniyordu; birleşmiş ağaçta
   **100 kullanım / 33 dosya** çıktı ve en yoğun dosya (`LikertScale.tsx`, 15)
   listede hiç yoktu.
3. **B3'ün "layout'lara noindex koy" maddesi** zaten yapılmıştı; üç özel akış
   layout'u `origin/main`'de noindex taşıyordu.

### Tasarım yönü kararı

**Yön A — "Kamusal Ekran".** Grafit kabuk, tek vurgu rengi petrol `#0E6E7D`,
veri etiketlerinde mono tipografi. Rainbow bırakıldı.

Gerekçe ölçüldü: eski 6 accent'in **6'sı da** bir parti renginden ayırt
edilemiyordu (hue farkı 1.9°–20.5°, hepsi 30° eşiğinin altında). Dürüst not:
petrol de Gelecek Partisi mavisinden **18.7°** uzakta — yani iyileşme hue
mesafesinden değil **kullanım kuralından** geliyor: petrol yalnızca etkileşim
donanımında (buton, link, odak) kullanılır, asla bir oluşumu temsil eden dolgu
olmaz. Parti renkleri yalnızca veri görselleştirmesinde kalır.

---

## Paralel çalışma kuralları

1. **`B0` bitmeden hiçbir batch başlamaz.** Yerel ağaç `origin/main`'den 31 commit geride; `B0` öncesi tüm dosya yolları geçersiz.
2. **Aynı anda çalışan iki batch, `Owns` listesinde ortak dosya bulunduramaz.** Çakışma tablosu aşağıda; şüphede kalırsan seri çalış.
3. Her batch kendi dalında çalışır ve **kendi başına yeşil** bırakır (`npm test && npm run lint && npm run build`).
4. `main`'e birleşme sırası bağımlılık sırasıyla aynıdır. Coolify yalnızca `main`'den dağıtır.

### Bağımlılık grafiği

```
B0 (pull)
 ├─► B1  TBMM parser düzeltmesi        ─┐
 ├─► B2  Repo hijyeni                   │
 ├─► B3  Sitemap + robots + canonical   ├─ hepsi B0 sonrası PARALEL
 ├─► B4  llms.txt + JSON-LD             │
 ├─► B5  API hata kodları               │
 ├─► B6  Logo kaldırma                 ─┘
 │
 ├─► B7  QuestionRenderer ayrıştır ──► B8  17. soru (attention_check)
 │
 └─► B9  Tasarım yönü + onay ──► B10 Token katmanı ──► B11 UI bileşenleri
                                                        │
                                   ┌────────────────────┼────────────────────┐
                                   ▼                    ▼                    ▼
                              B12 Ana sayfa      B13 Siyaset Radarı    B14 Survey
                                   │                    │                    │
                                   ▼                    ▼                    ▼
                              B15 Results        B16 Metodoloji        B17 Legal
                                                                            │
                                                                            ▼
                                                                       B18 Admin
```

### Paralel çalıştırılabilir kümeler

| Dalga | Birlikte çalışabilecek batch'ler | Not |
|---|---|---|
| 1 | **B0** | Tek başına, herkesten önce |
| 2 | **B1, B2, B3, B4, B5, B6, B7, B9** | Sekiz ajan paralel — dosya çakışması yok |
| 3 | **B8** (B7 sonrası), **B10** (B9 sonrası) | B8 ve B10 birbirine paralel |
| 4 | **B11** (B10 sonrası) | Tek başına — tüm UI tabanı |
| 5 | **B12, B13, B14, B16, B17** | Beş ajan paralel (B13 ayrıca B1'i, B14 ayrıca B8'i, B16 ayrıca B4'ü bekler) |
| 6 | **B15, B18** | |

### Dosya sahipliği — çakışma uyarıları

| Dosya | Batch'ler | Kural |
|---|---|---|
| `app/survey/page.tsx` | B7 → B8 → B14 | **Asla paralel değil.** Üçü de aynı `switch`'e dokunuyor. Sırayla. |
| `tailwind.config.ts`, `app/globals.css` | B10 | Yalnız B10. B11+ okur, yazmaz. |
| `components/ui/*` | B11 | Yalnız B11. B12–B18 kullanır, değiştirmez. |
| `app/page.tsx` | B6 (poster), B4 (JSON-LD), B12 (tasarım) | B6 ve B4 küçük ve ayrık; yine de **sırayla** yap: B6 → B4 → B12. |
| `app/manifest.ts` | B6 | Yalnız B6. |
| `.gitignore` | B2 | Yalnız B2. |
| `lib/site.ts` | B3 | B4 okur, yazmaz. |

---

## ✅ B0 — Ön koşul: güncel kodu al — TAMAMLANDI

**Depends on:** —
**Owns:** çalışma ağacının tamamı (tek başına çalışır)

Planı hazırlayan oturumda yerel `main`, `origin/main`'den **31 commit geride**ydi: 99 dosya, +7124 satır. Uzakta komple bir `siyaset-radari` altsistemi, parti kayıt v2 şeması (`supabase/migrations/011–013`) ve `lib/survey/completion.ts` modülü var. Yerel ağaçta `/siyaset-radari` rotası hiç yok; canlıda var.

```bash
git pull --ff-only origin main
npm install          # package.json origin'de değişmiş
npm test             # yeşil taban çizgisi
```

**Done when:** `npm test` yeşil, `app/siyaset-radari/page.tsx` yerelde mevcut.

### Kapsam dışı — canlı 500 hatası

Oturum canlıdaki `/consent` → "Oturum oluşturulurken beklenmeyen bir hata oluştu" ile başladı. **Kodda sorun yoktu.** Supabase projesi servis dışıydı: anon key'li REST isteği Cloudflare **521**, `/api/health` → `supabaseReachable: false`, `/api/questions` → 500. Veritabanı restart edildikten sonra üçü de düzeldi. **Bu kalemde iş yok.** Tek kalıcı ders B5'te.

---

## ✅ B1 — TBMM parser: iki gerçek hata — TAMAMLANDI (`fix/tbmm-parser` aa4d34c)

**Depends on:** B0
**Owns:** `lib/siyaset-radari/parsers/tbmm-seat-distribution.ts`, `…/tbmm-seat-distribution.test.ts`, `scripts/` altında bir tazeleme komutu, `package.json` (tek script satırı)
**Paralel:** B2–B7, B9 ile güvenli

### Durum — altyapı zaten tam

Yapılacak iş yeni özellik değil, mevcut boru hattındaki iki hatayı düzeltmek:

- `lib/siyaset-radari/scan.ts:9` → `TBMM_SEAT_DISTRIBUTION_URL = 'https://www.tbmm.gov.tr/sandalyedagilimi'`
- `lib/siyaset-radari/parsers/tbmm-seat-distribution.ts` → parser + testleri mevcut
- `app/admin/siyaset-radari/page.tsx:148,244` → admin "TBMM Tara" düğmesi
- `components/siyaset-radari/SiyasetRadariDashboard.tsx:185-199` → "Güncel TBMM Dağılımı" pasta grafiği

Grafik şu an **"Onaylı TBMM sandalye verisi yok."** gösteriyor (`SiyasetRadariDashboard.tsx:187`).

### Kanıt — sayfa parse edilebilir durumda

Canlı sayfa çekilip incelendi: veri **sunucu tarafında**, düz HTML tablosu (JS render yok). Sayfada **iki** tablo var.

Tablo 1 — sandalye dağılımı, 2 sütun (`Parti Adı`, `Üye Sayısı`):
```
["ADALET VE KALKINMA PART&#x130;S&#x130;","280"]
["YEN&#x130; PART&#x130;","91"]
["HALKLARIN E&#x15E;&#x130;TL&#x130;K VE DEMOKRAS&#x130; PART&#x130;S&#x130;","56"]
...16 parti...
["Toplam","592"]
```

Tablo 2 — cinsiyet dağılımı, 6 sütun (`Parti Adı`, `Kadın sayı`, `Kadın oran`, `Erkek sayı`, `Erkek oran`, `Parti Toplam`):
```
["ADALET VE KALKINMA PART&#x130;S&#x130;","52","% 18,57","228","% 81,43","280"]
["Genel Toplam","118","% 19,93","474","% 80,07","592"]
```

### Hata 1 — onaltılık HTML entity'leri çözülmüyor

`decodeEntities` yalnızca adlandırılmış birkaç entity'yi çeviriyor:
```js
.replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"')
.replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>')
```
TBMM Türkçe harfleri **sayısal onaltılık** entity gönderiyor: `&#x130;` (İ), `&#xDC;` (Ü), `&#x15E;` (Ş), `&#xC7;` (Ç), `&#x11E;` (Ğ), `&#xD6;` (Ö). Çözülmediği için parti adı `ADALET VE KALKINMA PART&#x130;S&#x130;` çıkıyor → parti kaydıyla eşleşmiyor → kayıt onaya düşmüyor → **grafik boş.**

**Düzeltme:** `&#x[0-9a-fA-F]+;` ve `&#[0-9]+;` kalıplarını `String.fromCodePoint` ile çöz. Adlandırılmış entity'ler korunur.

### Hata 2 — ikinci tablo sandalye verisi sanılıyor

`parseHtmlRows` filtresi `cells.length >= 2`. Bu yüzden 6 sütunlu cinsiyet tablosu da alınıyor ve `[partyName, seatValue]` destructuring'i **kadın sayısını sandalye sanıyor** — AKP için 280 yerine **52**. Her parti iki kez, biri tamamen yanlış değerle kaydediliyor. `Toplam` / `Genel Toplam` filtreleri bunu yakalamıyor.

**Düzeltme:** `cells.length === 2` koşuluna geç. `parsePipeRows` içinde de aynı gevşek `>= 2` var — tutarlı davran.

### Testler (önce kırmızı)

1. Gerçek markup'tan `&#x130;` içeren 2 sütunlu satırlar → parti adları düzgün Türkçe.
2. 6 sütunlu cinsiyet tablosu satırları → **hiç** sonuç üretmemeli.

### Veri tazeleme

Seçilen yaklaşım: **elle kodlanmış veri + script ile tazeleme**; canlıda cron bağımlılığı yaratma. `scripts/` kalıbına uyan bir komut ekle (ör. `npm run radar:tbmm`). Parser düzelince admin "TBMM Tara" da doğru çalışır; kayıtlar yine admin onayından geçer.

**Done when:** Parser canlı HTML'e karşı **16 parti**, toplam **592**, bozuk entity yok, cinsiyet tablosundan sızan satır yok.

---

## ✅ B2 — Repo hijyeni — TAMAMLANDI (`chore/repo-hygiene` ad3dd97 + `07904dc`)

**Depends on:** B0
**Owns:** `.gitignore`, silinen/taşınan dosyalar
**Paralel:** B1, B3–B7, B9 ile güvenli

Git'te **takipli** ama olmaması gerekenler:
```
check.md  deep-research-prompt.md  yeni_deep-research-report.md
.dev-err.log  .dev-out.log  .next-dev.log  .next-dev.err.log
.logs/dev-server.err.log  .logs/dev-server.out.log  .logs/dev.err.log  .logs/dev.out.log
ogogog.png  oyvergitsinlogo.png
```
Takipsiz ama `.gitignore`'da olmayanlar: `supabase.zip` (**98 MB**), `tsconfig.tsbuildinfo`, `.idea/`.

`.gitignore`'u genişlet, takipli olanları `git rm --cached` ile çıkar.

> ⚠️ **`resultdeepresearch.html` silinmemeli.** `CLAUDE.md`'ye göre bu dosya ve `docs/party-positions-v2-derivation.md`, v2 parti pozisyonlarının **kaynak belgeleri**. Silmek yerine `docs/` altına taşı.

> ⚠️ `ogogog.png` ve `oyvergitsinlogo.png` B6 ile örtüşüyor. **B2 bunları `git rm --cached` + sil; B6 bunlara dokunmasın** (B6 yalnızca `public/logo.png` ve kod referanslarıyla ilgilenir).

**Done when:** `git status` temiz, `git ls-files` yukarıdaki listeyi içermiyor, build etkilenmemiş.

---

## ✅ B3 — Sitemap, robots, canonical — TAMAMLANDI (`feat/seo-sitemap` 90b1f53)

**Depends on:** B0
**Owns:** `app/sitemap.ts`, `app/robots.ts`, `lib/site.ts`, `app/consent/layout.tsx`, `app/survey/layout.tsx`, `app/results/layout.tsx`
**Paralel:** B1, B2, B4–B7, B9 ile güvenli

### Mevcut taban

- `app/sitemap.ts` — yalnızca 3 URL: `/`, `/metodoloji`, `/siyaset-radari`
- `app/robots.ts` — `/admin/`, `/consent`, `/survey`, `/results/`, `/api/` kapalı
- `lib/site.ts` — `siteConfig` (locale `tr_TR`, `geoRegion`, `countryCode`, koordinatlar, keywords) + `getSiteUrl()`

Sayfa metadata durumu:
| Sayfa | metadata | render |
|---|---|---|
| `app/page.tsx` | ✅ | server |
| `app/metodoloji/page.tsx` | ✅ | server |
| `app/siyaset-radari/page.tsx` | ✅ | server |
| `app/siyaset-radari/kisi/[slug]/page.tsx` | ✅ | server |
| `app/legal/*` (4 sayfa) | ✅ | server |
| `app/consent/page.tsx` | ❌ | **client** |
| `app/survey/page.tsx` | ❌ | **client** |
| `app/results/[sessionId]/page.tsx` | ❌ | **client** |

### İşler

- `sitemap.ts`'e `/legal/*` dört sayfasını ekle; `/siyaset-radari/kisi/[slug]` kayıtlarını veritabanından **dinamik** üret (`lib/siyaset-radari/public-data.ts` veriyi taşıyor).
- Client component'ler metadata ihraç edemez — `app/consent/layout.tsx`, `app/survey/layout.tsx`, `app/results/layout.tsx` hâlihazırda var; bunlara başlık + açık `noindex` metadata'sı koy.
- `alternates.canonical` ve `hreflang` (`tr-TR`) sayfa bazında tutarlı hâle getir.

**Done when:** `/sitemap.xml` legal sayfalarını ve kişi kayıtlarını içeriyor; özel akışlar `noindex`.

---

## ✅ B4 — llms.txt + JSON-LD (GEO) — TAMAMLANDI (`feat/llms-jsonld` 47b3d8a)

**Depends on:** B0 (içerik doğruluğu için B1'den sonra yapılması **tercih edilir**, zorunlu değil)
**Owns:** `public/llms.txt`, `app/layout.tsx` (JSON-LD bloğu), `app/metodoloji/page.tsx` (JSON-LD), `app/siyaset-radari/page.tsx` (JSON-LD)
**Paralel:** B1, B2, B3, B5, B7, B9 ile güvenli. **B6 ve B12 ile `app/page.tsx` üzerinde çakışır** — sırayla.

"GEO" burada **Generative Engine Optimization** — ChatGPT/Perplexity/AI Overviews gibi üretken arama motorlarında alıntılanabilirlik. (Coğrafi SEO değil; `lib/site.ts` zaten geo alanları taşıyor.)

### İşler

- **`public/llms.txt` bayatlamış.** Şu an "12 siyasi parti" ve "10 eksen" diyor; Sayfalar listesinde yalnızca Ana Sayfa ve Açık Rıza var — `/metodoloji` ve `/siyaset-radari` **hiç geçmiyor**. Güncelle. Parti sayısını parti kaydından/TBMM verisinden **türet**, sabit yazma (yanlış sayı AI yanıtlarına aynen geçer).
- **`/metodoloji`'yi makine-okunur yap** — platformun alıntılanabilir çekirdeği. Skorlama kuralları, eksen tanımları ve parti pozisyon kaynakları için `Dataset` + `FAQPage` JSON-LD.
- **`/siyaset-radari` için `Dataset` JSON-LD** — TBMM sandalye dağılımı kaynaklı; `sourceUrl` ve `last_verified_at` alanlarını `lib/siyaset-radari/public-data.ts`'ten besle.
- Her sayfada **tek ve net bir `h1`**; tanım cümleleri **sunucu tarafında** render edilsin (AI tarayıcıları JS çalıştırmaz).

Mevcut JSON-LD: `app/layout.tsx` ve `app/page.tsx`'te birer blok var — üzerine inşa et, sıfırdan yazma.

**Done when:** JS kapalıyken `/` ve `/metodoloji` kaynağında JSON-LD ve tek `h1` görünüyor; `llms.txt` dört public sayfayı da listeliyor ve sayılar güncel.

---

## ✅ B5 — API hata kodları — TAMAMLANDI (`refactor/api-errors` d84572c)

**Depends on:** B0
**Owns:** `app/api/**/route.ts`, `lib/api/` (yeni), `lib/rate-limit.ts` (dokunulursa)
**Paralel:** B1–B4, B6, B7, B9 ile güvenli

`app/api/sessions/route.ts` `catch` bloğu gerçek hatayı tamamen gizleyip sabit Türkçe mesaj dönüyor. Bu oturumda canlı teşhisi zorlaştıran şey buydu — `/api/health` olmasa altyapı arızası ile kod hatası ayırt edilemezdi.

- Route'lara ayırt edilebilir hata kodu ekle (`{ error, code }`). Kullanıcıya gösterilen Türkçe mesaj nazik kalsın, ama altyapı arızası kullanıcı hatasından ayrılabilsin.
- Rate limit + Zod parse + hata zarfı birden fazla handler'da tekrarlıyor → `lib/api/` altında ince sarmalayıcı. Mevcut parçaları yeniden kullan: `lib/rate-limit.ts` (`isRateLimited`, `getClientIp`), `lib/validation/*`, `lib/supabase/route.ts` (`getRouteClient` / `getPublicServerClient`).

**Done when:** `/api/sessions` hata gövdesi `code` taşıyor; tekrar eden blok tek yerde.

---

## 🟡 B6 — Logoları kaldır — KOD BİTTİ (`chore/remove-logos` 4b976ba); `public/logo.png` ve `app/opengraph-image.png` proje sahibinde

**Depends on:** B0
**Owns:** `public/logo.png`, `app/manifest.ts`, `app/icon.png`, `app/apple-icon.png`, `app/opengraph-image.png`
**Paralel:** B1–B3, B5, B7, B9 ile güvenli. **`app/page.tsx` için B4/B12 ile sırayla.**

Yeni logo sonra yapılacak; şimdilik mevcutlar kaldırılıyor.

- Sil: `public/logo.png` (**1.8 MB**). (`oyvergitsinlogo.png` ve `ogogog.png` **B2'nin işi** — ikisi de hiçbir yerden referans almıyor.)
- Referansları temizle: `app/manifest.ts:16,22` (PWA ikonları), `app/page.tsx:118` (video `poster="/logo.png"`).
- `components/layout/Header.tsx` zaten metin wordmark kullanıyor (`siteConfig.shortName`) → görsel boşluk oluşmaz.
- `app/icon.png`, `app/apple-icon.png`, `app/opengraph-image.png` (Next.js otomatik konvansiyonu) yerine sade geçici görseller koy.

**Done when:** `logo.png`'ye hiçbir referans kalmadı, build yeşil, manifest geçerli.

---

## ✅ B7 — QuestionRenderer'ı ayrıştır — TAMAMLANDI (`refactor/question-renderer` 276fb41)

**Depends on:** B0
**Owns:** `app/survey/page.tsx`, `components/survey/QuestionRenderer.tsx` (yeni)
**Paralel:** B1–B6, B9 ile güvenli. **B8 ve B14 ile asla paralel değil.**

`app/survey/page.tsx` 617 satır (origin'de daha büyük). `switch (question.type)` render bloğunu (316–499) `components/survey/QuestionRenderer.tsx`'e taşı. **Saf taşıma — davranış değişmeyecek**, B8 bunun üstüne gelecek.

**Done when:** `npm test` ve `npm run test:e2e` yeşil, anket akışı birebir aynı.

---

## ✅ B8 — 17. soru: `attention_check` render kolu — TAMAMLANDI (9add1b3)

**Depends on:** **B7**
**Owns:** `components/survey/QuestionRenderer.tsx`, ilgili test
**Paralel:** B10 ile güvenli. B7/B14 ile asla.

`switch (question.type)` bloğunda **`attention_check` için `case` yok** — doğrulandı, `origin/main`'de de yok. Soru `default:` dalına düşüp eski düz buton listesi olarak render ediliyor.

Canlı veriden 17. soru:
```json
{ "type": "attention_check", "code": "dikkat_1", "is_scored": false,
  "expected_value": "disagree", "order_index": 17,
  "text": "Bu soru dikkat kontrolü içindir. Lütfen \"Katılmıyorum\" seçeneğini işaretleyin.",
  "question_options": [strongly_disagree, disagree, neutral, agree, strongly_agree] }
```
Seçenekleri komşu sorularla **birebir aynı Likert ölçeği**; sadece render kolu eksik.

**Düzeltme:** `case 'attention_check'` kolunu `case 'likert_5'` / `case 'likert_7'` ile aynı gövdeye bağla → `LikertScale` + `NoOpinionButton`.

**Puanlama etkilenmez** (doğrulandı):
- `app/survey/page.tsx:37` — zaten `NON_SCORED_TYPES` içinde, Önem işareti gösterilmiyor
- `lib/scoring/core.ts:28` — dikkat kontrollerini ayrı değerlendiriyor
- `lib/scoring/parse-answer.ts:28` — tek değerli tip
- veride `is_scored: false`

Yani **yalnızca sunum katmanı**. `lib/scoring/` saf çekirdeğine dokunma.

**Done when:** 17. soru komşularıyla aynı Likert ölçeği olarak render oluyor, "Fikrim yok" ayrı duruyor, skor çıktısı değişmiyor.

---

## ✅ B9 — Tasarım yönü + palet önerisi — KARAR: Yön A "Kamusal Ekran" (`design/direction` 2478272)

**Depends on:** B0
**Owns:** yalnızca öneri belgesi — **kod yazılmaz**
**Paralel:** B1–B7 ile güvenli

Kullanıcı kararı: **tüm site yeniden tasarım**, **palet yeniden ele alınsın** (rainbow bırakılıyor).

> ⚠️ Bu karar, önceki marka kaydıyla ("rainbow palet = oyvergitsin.org marka rengi") çelişiyor. Uygulamaya başlarken o kaydı güncelle.

`frontend-design` becerisini kullan. "Teknolojik" ama ciddi bir yön gerekiyor — bu bir siyasi **tarafsızlık** platformu. Nötr kabuk şart: veri görselleştirmesi parti renklerini (`lib/parties.ts`, `PARTY_COLORS`) kullanmaya devam edecek, kabuk renkleri bunlarla çakışmamalı.

**2–3 seçenek sun ve onay al. Onay gelmeden B10 başlamaz.**

**Done when:** Kullanıcı bir yön seçti.

---

## ✅ B10 — Token katmanı — TAMAMLANDI (`design/tokens` b5ae962)

**Depends on:** **B9 (onay)**
**Owns:** `tailwind.config.ts`, `app/globals.css`
**Paralel:** B8 ile güvenli

### Değişim yüzeyi — DÜZELTİLDİ (2026-10-02, B1–B8 birleştikten sonra yeniden ölçüldü)

> ⚠️ **Bu bölümün ilk hâli yanlıştı.** "Palet tek yerde tanımlı, değişim mekanik
> olarak küçük" deniyordu. Değil. Aşağıdaki sayılar `integration/2026-10-02`
> üzerinde birinci elden sayıldı; önceki rakamlar `origin/main`'e aitti ve
> B7'nin ayrıştırması yüzeyi kaydırdı.

| Ölçüm | Planın ilk hâli | Gerçek |
|---|---|---|
| `rainbow-*` sınıf kullanımı | 70 | **100** |
| Etkilenen dosya | 30 | **33** |
| En yoğun dosya | `Footer.tsx` (8) | **`components/survey/LikertScale.tsx` (15)** |

`LikertScale.tsx` ilk listede hiç geçmiyordu ama en yüksek yoğunluk orada —
B10'un asıl kaldıracı bu dosya.

Diğer yoğun dosyalar: `SiyasetRadariDashboard.tsx` (8), `Footer.tsx` (8),
`siyaset-radari/kisi/[slug]/page.tsx` (4), `CoverageBadge.tsx` (3),
`QuestionRenderer.tsx` (3), `metodoloji/page.tsx` (3).
`app/globals.css`'teki `rainbow-gradient-border` yardımcı sınıfı 3 yerde kullanılıyor.

#### ⚠️ Token katmanını BYPASS eden iki hardcoded hex dizisi var

Palet `tailwind.config.ts`'te **tek yerde tanımlı değil.** Aynı altı hex değeri
iki sayfa dosyasında düz literal olarak tekrarlanıyor:

```
app/page.tsx:44     const RAINBOW_ACCENTS = ['#F5C518','#F5821F','#E8385C','#7B4FE0','#1E9BE0','#3CB043']
app/survey/page.tsx:14  const RAINBOW_ACCENTS = ['#F5C518','#F5821F','#E8385C','#7B4FE0','#1E9BE0','#3CB043']
```

Bu değerler `tailwind.config.ts`'teki `rainbow.yellow/orange/red/purple/blue/green`
token'larıyla birebir aynı, ama inline `style={{ borderTopColor: ... }}` /
`boxShadow` olarak uygulandıkları için Tailwind'den geçmiyorlar.

**Sonuç:** Yalnızca `tailwind.config.ts` güncellenirse site **yarı geçmiş** halde
kalır — ana sayfadaki kartlar (güven sinyalleri, eksen kartları, SSS) ve anket
sayfasındaki soru kartı/seçenek vurguları eski rainbow renklerini göstermeye
devam eder. B10 bu iki diziyi de ele almalı; tercihen token'lardan türetilen tek
bir kaynağa indirgenmeli (ör. `lib/theme/accents.ts`).

Kullanım yerleri: `app/page.tsx:50,78,128` ve `app/survey/page.tsx:256,321`.

Yeni palet, tipografi ölçeği, yarıçap ve gölge ölçekleri. `globals.css` şu an `--font-heading`/`--font-body` için yalnızca sistem font yığını tanımlıyor — **tipografi burada gerçek bir fırsat.**

**Done when:** Token'lar tanımlı, WCAG AA kontrast oranları doğrulanmış, build yeşil (sayfalar henüz eski görünebilir).

---

## ✅ B11 — Taban UI bileşenleri — TAMAMLANDI (`design/ui-components` f771afc)

**Depends on:** **B10**
**Owns:** `components/ui/*` (`Button`, `Card`, `Badge`, `Container`, `ProgressBar`)
**Paralel:** yok — tek başına çalışsın

Tüm siteye yayıldıkları için en yüksek kaldıraç burada. B12–B18 bunları **kullanır, değiştirmez.**

**Done when:** Beş bileşen yeni token'larla, build ve e2e yeşil.

---

## ✅ B12–B18 — Sayfa yenilemeleri — TAMAMLANDI (`main` 04f77bb)

**Hepsi `Depends on: B11`.** Her biri yalnızca kendi sayfa dosyalarını ve o sayfaya özel bileşenleri sahiplenir.

| Batch | Sayfa | Ek bağımlılık | Owns |
|---|---|---|---|
| **B12** | `/` ana sayfa | B6, B4 (aynı dosya) | `app/page.tsx`, `components/home/*` |
| **B13** | `/siyaset-radari` | **B1** (grafik dolu olmalı) | `app/siyaset-radari/**`, `components/siyaset-radari/*` |
| **B14** | `/survey` | **B8** | `app/survey/page.tsx`, `components/survey/*` |
| **B15** | `/results` | B12 | `app/results/**`, `components/results/*` |
| **B16** | `/metodoloji` | **B4** (JSON-LD aynı dosya) | `app/metodoloji/page.tsx`, `components/methodology/*` |
| **B17** | `/legal/*` | — | `app/legal/**` |
| **B18** | `/admin/*` | B17 | `app/admin/**`, `components/admin/*` |

**Erişilebilirlik (hepsi için):** WCAG AA kontrast; grafiklerde renk tek ayırt edici olmasın.

**Dokunma (hepsi için):** `lib/scoring/*` saf çekirdeği, API route'ları, veritabanı şeması. Tasarım işi yalnızca sunum katmanında.

---

## B19 — Alias temizliği (plana sonradan eklendi)

**Depends on:** B12–B18 (hepsi bitti)
**Owns:** `tailwind.config.ts`, `app/globals.css`, `components/feedback/FeedbackModal.tsx`

B10, `rainbow.*` token'larını silmedi, nötr değerlere yeniden bağladı: o gün 33
dosyada 100 sınıf kullanımı vardı ve silmek sayfaların rengini düşürürdü. Artık
kullanım kalmadı; borç kapanıyor.

1. `FeedbackModal.tsx:66` — `focus:border-rainbow-blue` → `focus:border-accent`.
2. Kalan **işlevsel** kullanım sıfır olmalı. Yorum satırlarındaki "rainbow"
   geçişleri sayılmaz. Kontrol (yorum dışı sınıf kullanımı):
   `git grep -nE "(bg|text|border|ring|fill|stroke|from|to|via)-rainbow-" -- app components`
   → çıktı boş. Boş değilse DUR, hangi dosyanın kaldığını bildir.
3. `tailwind.config.ts`'teki `rainbow:` bloğunu (13 token) ve üstündeki
   "GEÇİCİ ALIAS" açıklamasını sil.
4. `app/globals.css`'teki `.rainbow-gradient-border` yardımcısını sil — şu an
   hiçbir dosyada kullanılmıyor (`git grep rainbow-gradient-border` ile teyit et).
5. **Temiz build al ve çıktıyı ölç:** `.next/static` altında
   `F5C518|F5821F|E8385C|7B4FE0|1E9BE0|3CB043` → **0 adet.** Yalnızca kaynak
   taraması yetmez: bir noktada CSS tamamen temizken JS paketi 14 tane eski hex
   taşıyordu (inline style'lar Tailwind'den geçmez).
6. `npm test` · `lint` · `build` · `test:e2e` (sunucuyu önce ısıt) yeşil. Tüm
   sayfaları tarayıcıda gez, renk kaybı olmadığını gör.

---
## Her batch için doğrulama

```bash
npm test                 # vitest — scoring + parser testleri
npm run lint
npm run build            # tip hataları + Next build
npm run test:e2e         # playwright, kendi dev sunucusunu başlatır
```

Elle (ilgili batch'te):
- **B1:** parser canlı HTML'e karşı 16 parti / toplam 592 / bozuk entity yok; `/siyaset-radari` pasta grafiği dolu
- **B8:** 17. soru Likert olarak render, "Fikrim yok" ayrı, skora girmiyor
- **B3/B4:** JS kapalıyken `/` ve `/metodoloji` kaynağında JSON-LD + tek `h1`; `/sitemap.xml` tam
- **B5:** `/api/health` → `healthy`
- Oturum/cevap tablolarına dokunulduysa: `npm run audit:rls` çıktısı değişmemeli

## Dağıtım uyarısı

`CLAUDE.md`'den: Coolify webhook'u **yalnızca `main`'den** dağıtır — feature branch push'u canlıyı güncellemez. Veritabanı dallar arasında **paylaşılır**, yani şema/veri değişiklikleri kod dağıtılmadan önce canlıya yansır. B1'deki parser düzeltmesi onaylı veri yazacağı için, herhangi bir seed/scan çalıştırmadan önce **canlıda hangi kodun dağıtıldığını doğrula.**

## E2E uyarısı

`npm run test:e2e` hedeflediği veritabanına **gerçek** oturum ve cevap yazar. `BASE_URL=https://... npm run test:e2e` canlıya yazar — dikkat.
