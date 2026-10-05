# Tasarım Yönü Seçenekleri — B9 Onay Kapısı

> **Durum:** KARAR BELGESİ — bu belge bir tasarım yönü SEÇMEZ; proje sahibinin
> seçebileceği üç somut yön sunar. Onay gelmeden B10 (token katmanı) başlamaz.
>
> **Tarih:** 2026-10-02 · **Kapsam:** tüm site kabuğu (renk, tipografi, boşluk/yuvarlaklık).
> Parti verilerinin renkleri (`lib/parties.ts` / `parties.color`) hiçbir yönde değişmez.
>
> **Önizlemeler (tarayıcıda açın, aynı içerik üç yönde):**
> - `docs/design-preview-a-kamusal-ekran.html`
> - `docs/design-preview-b-sessiz-spektrum.html`
> - `docs/design-preview-c-oy-pusulasi.html`

---

## 1. Mevcut durum envanteri (okunarak çıkarıldı, varsayım değil)

**Token'lar** (`tailwind.config.ts`, `app/globals.css`):

| Grup | Değerler |
|---|---|
| `rainbow.*` (6 renk + 6 tint + `blue-hover`) | `#F5C518` `#F5821F` `#E8385C` `#7B4FE0` `#1E9BE0` `#3CB043` · tintler ~%95 açıklıkta pastel · hover `#1580BD` |
| `surface.*` | `#FAFBFC` (zemin) · `#FFFFFF` (kart) · `#F1F3F6` (muted) |
| `ink.*` | `#1A1D23` · `#5A6270` · `#8B919A` |
| `border.*` | `#E2E5EA` · `#CBD0D7` |
| Tipografi | heading + body: Apple sistem fontu yığını (`--font-heading`/`--font-body`, globals.css) |
| Radius / gölge | card `1rem` · button `0.625rem` · badge `0.375rem` · `soft`/`elevated` gölgeler |

**Kullanım haritası** (tarama sonucu):

- `rainbow-*` sınıfları: **76 kullanım, ~25 dosya** (app + components).
- **Etkileşim rengi = `rainbow-blue`**: `Button` primary, `ProgressBar`, tüm linkler, focus halkaları, `MatrixQuestion`/`SliderQuestion`/form alanları.
- **`RAINBOW_ACCENTS` dizisi** (6 hex, döngüsel kart accent'i): `app/page.tsx:37` (güven sinyalleri, 10 eksen kartı, SSS kartları) ve `app/survey/page.tsx:25` (soru kartı üst kenarı + soru numarası rozetleri).
- **Anlamsal renkler**: `LikertScale` (katılmıyorum=kırmızı, katılıyorum=yeşil, fikrim yok=mor), `ImportanceToggle` (turuncu), `CoverageBadge` (yeşil/sarı/kırmızı tint), `MatchReasons` (yeşil/kırmızı sol kenar).
- `globals.css`: `.rainbow-gradient-border` yardımcı sınıfı.
- Marka kaydı: `docs/superpowers/plans/2026-07-20-rainbow-layout-redesign.md` — "6 renkli rainbow palet, bölüm bazlı pastel arka plan, döngüsel kart accent" yeni marka olarak kayıtlı.

**Sayfalar yerelde görüldü** (dev server :3100): `/`, `/metodoloji`, `/siyaset-radari`, `/consent` → 200; hero video + cam kart, beyaz bölüm zeminleri, border-l rainbow vurgular doğrulandı. Not: ana sayfa metni "10 İdeolojik Eksen" diyor; aktif model v2'de **8 eksen** var — hangi yön seçilirse seçilsin B12'de düzeltilmeli.

### Çözümlenmemiş çelişki (taraf tutulmuyor)

Kayıtlı marka notu rainbow paletini **marka rengi** ilan ediyor; proje sahibi ise sonradan
**rainbow'u bırakma** yönünde karar belirtti (plan B9: "tüm site yeniden tasarım, palet
yeniden ele alınsın (rainbow bırakılıyor)"). Bu belge iki yolu da ciddiye alır:
**Yön B** marka kaydını sürdürür (ehlileştirerek), **Yön A ve C** sahip kararını uygular
(tamamen bırakır). Hangisi seçilirse seçilsin, uygulama başlarken marka kaydı
güncellenmelidir (plan B9'un açık uyarısı).

### Tarafsızlık ölçütü — neden bu kadar kritik

Kabuk renkleri, `parties.color` alanındaki gerçek parti renkleriyle çağrışım kurmamalı.
Canlı veritabanından okunan parti renkleri: AKP `#F7941D` (turuncu), CHP `#E30A17` (kırmızı),
MHP `#F2B705` (sarı), İYİ `#0B1F3A` (lacivert), DEVA `#7A3DB8` / Saadet `#6A1BB3` (mor),
Gelecek `#1B6FB3` (mavi), DEM `#0F7A3A` / Zafer `#00964C` (yeşil), TİP `#333333`,
Vatan `#D10F2F`, Memleket `#FDD007`, YENİ PARTİ `#E41E26`.

**Ölçülen çakışma — mevcut rainbow paleti parti renkleriyle neredeyse birebir:**
WCAG parlaklık kontrastı 1.0'a ne kadar yakınsa renkler o kadar ayırt edilemez.
Mevcut 6 accent'in en yakın parti rengine uzaklığı:

| Rainbow accent | En yakın parti rengi | Kontrast | Hue farkı |
|---|---|---|---|
| `#F5C518` sarı | MHP `#F2B705` | **1.12** | 2° |
| `#F5821F` turuncu | AKP `#F7941D` | **1.14** | 5° |
| `#E8385C` kırmızı | CHP `#E30A17` | **1.19** | 8° |
| `#7B4FE0` mor | DEVA `#7A3DB8` | **1.27** | 12° |
| `#3CB043` yeşil | Zafer `#00964C` | **1.37** | 26° |
| `#1E9BE0` mavi | Gelecek `#1B6FB3` | **1.72** | 6° |

Yani bugünkü kabuk paleti, parti renk yelpazesinin **tamamıyla** çakışıyor: ana sayfadaki
bir kartın turuncu üst kenarı AKP'yi, sarı kenar MHP'yi çağrıştırabilir. Bu, üç yönün de
çözmek zorunda olduğu temel sorun.

---

## 2. Yön A — "Kamusal Ekran"

**Karakter:** Kamu yayıncısı ciddiyetinde, veri doğrulama masası estetiği — grafit kabuk,
tek vurgu rengi (petrol), mono veri etiketleri; **kimlere:** tarafsızlığı ilk bakışta
hissetmek isteyen, sonuçların güvenilir kurum verisi gibi okunmasını bekleyen seçmen.

### Palet

| Token | Hex | Rol |
|---|---|---|
| paper | `#F7F8F8` | sayfa zemini (serin açık gri) |
| card | `#FFFFFF` | kartlar |
| ink | `#191C1E` | birincil metin, buton zeminleri |
| ink-secondary | `#566164` | ikincil metin |
| ink-muted | `#828B8D` | yardımcı etiketler |
| line / line-strong | `#DDE3E3` / `#C3CDCD` | 1px hairline kenarlıklar |
| **accent (petrol)** | `#0E6E7D` | link, focus, aktif durum, CTA |
| accent-hover | `#0B5A66` | CTA hover |
| accent-tint | `#E1F0F2` | seçili Likert zemini, bilgi şeritleri |

### Tipografi, boşluk, yuvarlaklık

- **Yazı:** body + heading mevcut sistem yığını (değişmez); **yalnızca veri** (soru sayacı,
  yüzdeler, eksen numaraları, `last_verified_at`) `ui-monospace` yığınına geçer — "doğrulanmış
  kamu verisi" hissi buradan gelir. Harici font yok (next/font gerekmez, sıfır maliyet).
- **Ölçek:** radius card `10px`, kontrol `8px`, badge `4px` (bugünkünden keskin).
  Boşluk 4/8/12/16/24/32/48/64; bölüm padding 40–72px. Gölge kullanımı azaltılır:
  kartlar gölgeyle değil 1px kenarlıkla ayrılır (`shadow-soft` yalnızca hover'da).

### Rainbow ile ilişkisi: **tamamen bırakıyor**

Proje sahibinin "rainbow bırakılıyor" kararını doğrudan uygular. 6 döngüsel accent tek
vurgu rengine iner; kartlardaki `borderTopColor` döngüsü ve soru-rozet gökkuşağı kalkar.
Gerekçe: yukarıdaki ölçüm — rainbow'un 6 rengi de bir parti rengiyle 1.1–1.7 kontrast
mesafesinde; tarafsızlık iddiası olan bir platformda kabuk hiçbir partiyle aynı renkte
konuşamaz.

### Siyasi tarafsızlık değerlendirmesi

- Petrol (hue 188°) Türkiye parti yelpazesinde **hiçbir partinin rengi değil**; en yakın
  komşular Gelecek mavisi (207°, Δ19°) ve Zafer/DEM yeşili (145–150°, Δ38°). Dürüst not:
  Δ19° küçük bir mesafedir; petrol yine de "turkuaz" okunur ve mavi değil. Azaltıcı önlem:
  petrol **yalnızca etkileşim donanımında** (buton, link, focus, seçim durumu) kullanılır,
  asla bir oluşumu/partiyi temsil eden bir dolgu olmaz; parti renkleri yalnızca veri
  görselleştirmede kalır. Böylece "renk = parti" okuması bozulmaz.
- Tek renk + grafit kabuk, parti çubuklarını sayfadaki **en doygun öğe** yapar: veri öne çıkar.

### Erişilebilirlik (hesaplandı — WCAG 2.1)

| Çift | Oran | Sonuç |
|---|---|---|
| ink `#191C1E` / paper `#F7F8F8` | **16.10** | AAA |
| ink / card beyaz | **17.13** | AAA |
| secondary `#566164` / card | **6.38** | AA ✓ |
| secondary / paper | **6.00** | AA ✓ |
| beyaz / petrol buton `#0E6E7D` | **5.92** | AA ✓ |
| petrol link / card | **5.92** | AA ✓ |
| petrol / accent-tint | **5.06** | AA ✓ |
| beyaz / petrol-hover `#0B5A66` | **7.87** | AAA |

Tüm metin çiftleri AA'yı geçiyor; petrol, UI bileşen kontrastı (3:1) eşiğini de geçiyor.

### Koda maliyeti

- `tailwind.config.ts`: `rainbow.*` (13 token) silinir → `accent`/`accent-hover`/`accent-tint`
  eklenir; surface/ink/border hafif serinleşir; radius/gölge ölçeği güncellenir.
- `app/globals.css`: `.rainbow-gradient-border` silinir; mono veri sınıfı eklenir.
- `RAINBOW_ACCENTS` dizileri (`app/page.tsx`, `app/survey/page.tsx`) kalkar.
- **~25–30 dosyada ~76 sınıf kullanımı** mekanik olarak `accent`/`ink` karşılıklarıyla değişir.
- Anlamsal yeniden tasarım isteyen 4 bileşen: `LikertScale` (kırmızı/yeşil/mor tonlar →
  petrol/ink nötr şema), `ImportanceToggle` (turuncu → ink), `CoverageBadge` (yeşil/sarı/kırmızı
  tint → nötr yoğunluk skalası), `MatchReasons` (yeşil/kırmızı kenar → ink/accent).
- Kapsam B10 (token) + B11 (UI bileşenleri) + B12–B18 (sayfalar) ile birebir uyumlu;
  B10'da token katmanı yazılırsa sayfa geçişleri find-replace ağırlıklı olur.

### Karşı argüman — neden YANLIŞ seçim olabilir

Petrol + grafit + mono etiket, "kurumsal SaaS" soğukluğuna kayabilir; 18–25 yaş seçmende
resmi daire hissi yaratabilir. Mevcut rainbow kimliğini tanıyan kullanıcılar için marka
sürekliliği sıfırlanır (kayıtlı marka notuyla çelişki çözülmeden kalır). Ve en sert eleştiri:
petrol, Gelecek mavisiyle aynı mavi-yeşil bölgede yaşıyor; mutlak tarafsızlık arayan biri
için Yön C daha tutarlıdır.

---

## 3. Yön B — "Sessiz Spektrum"

**Karakter:** Gökkuşağı kimliğini koruyan ama sesini kısan yöndür — spektrum artık bağırmaz,
fısıldar; **kimlere:** mevcut marka kaydına ("rainbow = oyvergitsin.org") bağlı kalmak
isteyen, çok renkli kimliği fark edilirlik değeri olarak gören sahip.

### Palet

Kabuk nötrleşir, spektrum ehlileşir (doygunluk ~%35–45 düşürüldü, parlaklık kısıldı):

| Token | Hex | Eski karşılığı |
|---|---|---|
| paper | `#FAFAF8` | surface (hafif ısındı) |
| card | `#FFFFFF` | aynı |
| ink | `#1B1D22` | ink-primary |
| ink-secondary | `#5A5F68` | aynı |
| spectrum-yellow | `#B08A1E` | `#F5C518` |
| spectrum-orange | `#B0652A` | `#F5821F` |
| spectrum-red | `#A84357` | `#E8385C` |
| spectrum-purple | `#6E52A6` | `#7B4FE0` |
| spectrum-blue (steel) | `#3D7291` | `#1E9BE0` |
| spectrum-green | `#4A7C4E` | `#3CB043` |
| interactive | ink `#1B1D22` (buton) · steel `#3D7291` (link) | rainbow-blue |

### Tipografi, boşluk, yuvarlaklık

Mevcut sistem yığını ve radius ölçeği (card `1rem`, button `0.625rem`) **aynen korunur** —
bu yönün kimliği tipografide değil renkte. Değişen tek kural: spektrum renkleri yalnızca
**3px üst kenar, küçük nokta/rozet ve seçim tonu** olarak kullanılır; asla büyük dolgu,
buton zemin veya başlık rengi olmaz. Pastel tint zeminler kalır ama solgunlaştırılır.

### Rainbow ile ilişkisi: **sadeleştiriyor (koruyor ama indirgiyor)**

Marka kaydını silmez, günceller: "6 canlı renk" → "6 solgun spektrum rengi, yalnızca bilgi
taşıdıkları yerlerde". Döngüsel accent mantığı (eksi/eksen kartlarında renk = sıra) korunur;
etkileşim rengi spektrumdan çıkarılır (ink/steel). Gerekçe: çok renklilik bu platformun
anlatabileceği gerçek bir şey — "görüş yelpazesi" — ama bugünkü haliyle parti renkleriyle
çakıştığı için kısılmalı.

### Siyasi tarafsızlık değerlendirmesi

Dürüst tespit: **bu yön çakışmayı azaltır ama ortadan kaldırmaz.** Spektrum renkleri hâlâ
partilerin kullandığı hue ailelerinde yaşıyor (sarı≈MHP, turuncu≈AKP, kırmızı≈CHP, mor≈DEVA,
yeşil≈DEM/Zafer, mavi≈Gelecek). Fark eden şeyler: (1) doygunluk/parlaklık düşürüldüğü için
"parti bayrağı" değil "solgun spektrum" okunurlar; (2) parti çubukları sayfadaki tek doygun
renk kalır — hiyerarşi veri lehine düzelir; (3) etkileşim rengi spektrumdan çıktığı için
"tıklanabilir = mavi" ile "parti = mavi" ayrışır. Yine de ana sayfadaki turuncu kenarlı bir
kart, AKP'yi bilen bir gözde çağrışım üretmeye devam edebilir.

### Erişilebilirlik (hesaplandı)

| Çift | Oran | Sonuç |
|---|---|---|
| ink / paper | **16.13** | AAA |
| secondary / card | **6.42** | AA ✓ |
| beyaz / ink buton | **16.86** | AAA |
| beyaz / steel link | **5.23** | AA ✓ |
| spectrum-red / kendi tinti `#F6E9EC` | **4.93** | AA ✓ |

Spektrum renkleri **metin olarak kullanılmaz** (kural: yalnızca kenar/rozet/tint). UI bileşen
kontrastı (3:1, metin dışı): yellow **3.23** ✓ (sınırda — tint zeminde kalır), orange **4.43** ✓,
green **4.90** ✓, blue **5.23** ✓, red **5.82** ✓, purple **6.14** ✓. Yellow'un metin
olması gerekirse koyu varyant `#8F6F14` (beyaz üstü **4.72**, AA ✓).

### Koda maliyeti — **en düşük maliyetli yön**

- Token **adları korunur**, yalnızca **değerleri** değişir: `tailwind.config.ts` tek dosyada
  13 hex güncellenir → 76 sınıf kullanımının büyük kısmı **hiç dokunulmadan** yeni görünür.
- `RAINBOW_ACCENTS` dizileri (2 dosya: `app/page.tsx`, `app/survey/page.tsx`) yeni hex'lerle değişir.
- `globals.css` `.rainbow-gradient-border` yeni değerlerle güncellenir.
- Buton/link etkileşim rengini ink/steel'e çevirmek için `Button.tsx`, `ProgressBar.tsx` ve
  link sınıfları (~40 kullanım) — istenirse `rainbow-blue` token'ına steel değeri verilerek
  bu da tek dosyaya indirilebilir (ama ad yanıltıcı kalır; B10'da yeniden adlandırma önerilir).
- Toplam: **3–6 dosya** anlamlı değişiklik; anlamsal bileşen yeniden tasarımı yok
  (LikertScale/ImportanceToggle/CoverageBadge token değerleriyle otomatik yumuşar).

### Karşı argüman — neden YANLIŞ seçim olabilir

Proje sahibinin belirttiği karar "rainbow **bırakılıyor**" idi; Yön B bu kararı sulandırır —
çelişkiyi çözmek yerine erteler. Yarı-yolda kalma riski somut: ne eski oyuncu kimliği taşır
ne de yeni ciddi kimliği; "eski sitenin solmuş hali" algısı üretebilir. Tarafsızlık eleştirisi
hiçbir zaman tam susmaz (hue aileleri aynı kalır). Ayrıca token adları (`rainbow-blue` = steel)
anlamsızlaşır; B10'da yeniden adlandırma borcu doğar.

---

## 4. Yön C — "Oy Pusulası"

**Karakter:** Konusu olan nesneye dönüşen yön — sitenin kendisi bir oy pusulası gibi davranır:
kâğıt beyazı, mürekkep siyahı, kutu kutu tercih alanları, serif başlıklar; **kimlere:**
"tarafsızlığı kanıtlanabilir olsun" diyen, aracın kendisinin mesaj olmasını isteyen sahip.

### Palet

| Token | Hex | Rol |
|---|---|---|
| paper | `#FAF9F5` | ılık pusula kâğıdı |
| card | `#FFFFFF` | kutular |
| ink | `#17181A` | mürekkep — metin, kenarlık, buton |
| ink-secondary | `#5C5D5E` | ikincil metin |
| ink-muted | `#8B8C8D` | yardımcı |
| rule | `#D8D6CE` | iç cetvel çizgileri |

**Renkli token yok.** Kabukta tek bir renkli piksel bile bulunmaz; sitede renk **yalnızca**
parti verisinde (`parties.color`) ve sonuç grafiklerinde yaşar.

### Tipografi, boşluk, yuvarlaklık

- **Yazı:** başlıklar serif (`Georgia/"Times New Roman"` yığını — resmi belge/pusula hissi,
  harici font yok); gövde sistem sans; sayılar `tabular-nums`.
- **Ölçek:** radius `4px` (kutular neredeyse köşeli — pusula kutusu); çift cetvel
  (`3px double`) bölüm ayraçları ve kart dış çerçevesi; iç içe 1px çerçeve (kart içinde
  5px inset çizgi) pusula bordürünü taklit eder. Gölge **sıfır** — her şey çizgiyle ayrılır.
  Boşluk cömert: bölüm 38–76px, satır yüksekliği 1.6.
- **Motif:** seçim = mühür. Likert kutuları kare pusula kutuları; seçili kutu siyaha döner
  (mühür basılmış gibi); "Fikrim yok" kesikli çizgili ayrı kutu.

### Rainbow ile ilişkisi: **tamamen bırakıyor (sıfıra indiriyor)**

Sahip kararını en uç noktaya taşır: rainbow'un yerini başka bir renk **almaz**, rengin
yerini malzeme (kâğıt/mürekkep) alır. Gerekçe: renksiz kabuk tarafsızlığın kanıtlanabilir
hali — "bu site hiçbir rengin tarafında değil" cümlesi tasarıma birebir çevrilir ve parti
renkleri ilk kez %100 anlam yükü taşır.

### Siyasi tarafsızlık değerlendirmesi

- **Mutlak.** Kabukta hue olmadığı için hiçbir parti rengiyle çakışma matematiksel olarak
  imkânsız (kontrast tablosu: parti renkleri yalnızca beyaz kâğıt üstünde, hepsi ≥3:1).
- Tek dikkat noktası: lacivert-siyaha yakın mürekkep `#17181A`, İYİ Parti'nin koyu
  laciverti `#0B1F3A` ile karıştırılamaz — mürekkep yalnızca metin/çizgi olarak kullanılır,
  hiçbir veri alanında dolgu olmaz; İYİ çubuğu her zaman kendi `#0B1F3A` değeriyle çizilir.
- Risk alanı renk değil ton: pusula estetiği "resmi devlet belgesi" hissi verebilir;
  bu, tarafsızlık değil samimiyet ekseninde tartışılmalıdır (bkz. karşı argüman).

### Erişilebilirlik (hesaplandı)

| Çift | Oran | Sonuç |
|---|---|---|
| ink / paper | **16.86** | AAA |
| secondary / paper | **6.26** | AA ✓ |
| secondary / card | **6.60** | AA ✓ |
| beyaz / ink buton | **17.77** | AAA |
| ink / rule çizgisi | **12.21** | AAA |

Sitenin en yüksek kontrastlı yönü. Renkle durum bildiren hiçbir öğe kalmadığı için
renk körlüğü kategorik olarak sorun olmaktan çıkar; seçili durum siyah-beyaz inversion
ile bildirilir (WCAG 1.4.1 "Use of Color" tam uyum). Focus halkası 2px ink + 2px paper
boşluk (double outline) ile görünür kalır.

### Koda maliyeti

- Yön A ile aynı dosya kapsamı (**~25–30 dosya, ~76 kullanım**) + fazlası:
  `tailwind.config.ts`'ten `rainbow.*` tamamen silinir (yerine renk gelmez), radius/gölge
  token'ları değişir (`shadow-soft/elevated` kullanımdan kalkar — ~15 ek kullanım),
  `globals.css` font değişkenleri serif/sans ayrımına döner.
- `LikertScale` bileşeni yeniden yazılır (ton sistemi → kutu/mühür sistemi),
  `ImportanceToggle`, `CoverageBadge` (renkli tint → metin + çizgi yoğunluğu),
  `MatchReasons`, `ProgressBar`, soru-stepper rozetleri (`app/survey/page.tsx`) yeniden tasarlanır.
- `Card` bileşenine "çift çerçeve" varyantı eklenir. En yüksek görsel yeniden yazım maliyeti.

### Karşı argüman — neden YANLIŞ seçim olabilir

Siyah-beyaz + serif + köşeli kutu kombinasyonu, "ciddi editoryal" ile "soğuk bürokrasi"
arasında ince bir çizgide durur; genç seçmende resmî daire hissi yaratma riski üç yönün
en yükseği. Renksiz kabuk, etkileşim affordance'ını (tıklanabilirlik ipucu) yalnızca
çizgi/ağırlık inversion'ına yükler — alışılmış renkli CTA'nın dönüşüm oranına etkisi
bilinmiyor (A/B testi gerektirir). Ayrıca bu estetik (hairline cetveller, sıfıra yakın
radius, kâğıt tonu) güncel tasarım araçlarında çok tekrarlanan bir kalıba yakındır;
pusula motifi iyi işlenmezse "şablon gazete sitesi"ne düşebilir — motifin başarısı
uygulama kalitesine diğer iki yönden daha bağımlı.

---

## 5. Karşılaştırma özeti

| | A · Kamusal Ekran | B · Sessiz Spektrum | C · Oy Pusulası |
|---|---|---|---|
| Rainbow | tamamen bırakır | sadeleştirir (kısar) | tamamen bırakır |
| Marka kaydıyla ilişki | sahip kararını uygular, kayıt güncellenir | kaydı sürdürür, günceller | sahip kararını uçlaştırır, kayıt güncellenir |
| Tarafsızlık | güçlü (tek accent parti-dışı hue; Δ19° komşuluk notuyla) | kısmi (hue aileleri aynı kalır) | mutlak (renksiz kabuk) |
| Etkileşim rengi | petrol `#0E6E7D` | ink buton + steel link | ink inversion |
| Tipografi | sistem + mono veri | sistem (değişmez) | serif başlık + sistem gövde |
| En düşük kontrast (metin) | 5.06 (AA ✓) | 4.93 (AA ✓) | 6.26 (AA ✓) |
| Kod maliyeti | ~25–30 dosya, 4 bileşen yeniden | **3–6 dosya**, yeniden tasarım yok | ~30 dosya, 5+ bileşen yeniden |
| Ana risk | kurumsal soğukluk | yarı-yolda kalma, çelişkinin sürmesi | bürokratik soğukluk, kalıp-estetik riski |

## 6. Tavsiye (karar proje sahibinindir)

**Tavsiye: Yön A — "Kamusal Ekran".** Gerekçe:

1. Proje sahibinin kayıtlı kararını ("rainbow bırakılıyor") uygular; Yön B bu kararla açık
   çelişir ve çelişkiyi çözmek yerine dondurur.
2. Yön C kadar mutlak olmasa da **yeterli** tarafsızlık sağlar: tek accent Türkiye parti
   yelpazesinde yok, parti renkleri sayfadaki tek doygun veri olarak kalır. C'nin mutlaklığı,
   A'nın sağlayamadığı bir ölçülebilir fayda değil — çağrışım riski A'da zaten pratik olarak sıfır.
3. Renkli etkileşim affordance'ını korur (CTA, focus, seçim durumu): C'nin inversion-only
   şemasının dönüşüm/odak riskini almaz; B'nin "hangi mavi tıklanabilir?" belirsizliğini üretmez.
4. Maliyeti C'den düşük, B'den yüksek ama B10–B18 planı zaten tam yeniden tasarım öngörüyor;
   A bu planın doğal token mimarisiyle (accent + nötr skala) birebir örtüşür.

**İkinci tercih:** mutlak tarafsızlık her şeyin önündeyse **C**; marka sürekliliği ve minimum
maliyet her şeyin önündeyse **B** (ama B seçilirse sahip kararının resmen geri alındığı
kayda geçirilmeli).

**Seçimden bağımsız ilk adım:** hangi yön onaylanırsa onaylansın, uygulama başlarken
`docs/superpowers/plans/2026-07-20-rainbow-layout-redesign.md` içindeki marka kaydı
güncellenmeli (plan B9'un açık şartı) ve ana sayfadaki "10 İdeolojik Eksen" ifadesi
aktif modelin 8 ekseniyle düzeltilmeli.

**Onay kapısı:** Bu belge karar vermez. B10 (token katmanı), proje sahibi A/B/C'den birini
açıkça seçmeden başlamaz. Seçim bildirildiğinde bu belgeye "Karar" bölümü eklenir.

---

## 7. KARAR — Yön A "Kamusal Ekran" (2026-10-02)

Proje sahibi **Yön A**'yı seçti. B9 kapandı; B10 (token katmanı) başlayabilir.

### Kararın dayandığı kanıt — bağımsız doğrulandı

Belgedeki tarafsızlık analizi `lib/parties.ts` içindeki `PARTY_COLORS`
sabitine karşı yeniden hesaplandı. Sonuç iddiayı doğruluyor, hatta kontrast
üst sınırı belgedekinden biraz daha yüksek çıktı:

| accent | en yakın parti | hue farkı | kontrast |
|---|---|---|---|
| yellow `#F5C518` | MHP `#F2B705` | 1.9° | 1.12 |
| orange `#F5821F` | AKP `#F7941D` | 5.0° | 1.14 |
| red `#E8385C` | Vatan `#D10F2F` | 2.4° | 1.35 |
| purple `#7B4FE0` | DEVA `#7A3DB8` | 11.5° | 1.27 |
| blue `#1E9BE0` | Gelecek `#1B6FB3` | 5.5° | 1.72 |
| green `#3CB043` | YSP `#0F7A3A` | 20.5° | 1.94 |

**6/6 accent, bir parti renginden ayırt edilemiyor** (hepsi 30° hue eşiğinin
altında). Tarafsızlık iddia eden bir platformda kabuk renginin parti rengi
gibi okunması yapısal bir sorun; A bunu kökten çözüyor.

### B10 için düzeltilmiş kapsam — bu belgedeki envanteri EZER

Bu belgedeki "76 kullanım / ~25 dosya" sayımı birleşme öncesi dalda yapılmış.
`integration/2026-10-02` üzerinde (B1–B8 birleşmiş hâl) birinci elden sayım:

- **100** adet `rainbow-*` sınıf kullanımı, **33** dosyada
- `rainbow-gradient-border` yardımcı sınıfı 3 yerde
- En yoğun dosya **`components/survey/LikertScale.tsx` (15)** — bu belgede ve
  planın ilk hâlinde hiç geçmiyordu, B10'un asıl kaldıracı burası
- Sonraki yoğunlar: `SiyasetRadariDashboard.tsx` (8), `Footer.tsx` (8),
  `siyaset-radari/kisi/[slug]/page.tsx` (4)

### B10'un atlamaması gereken şey

`tailwind.config.ts`'i güncellemek YETMEZ. Token katmanını bypass eden iki
hardcoded hex dizisi var:

```
app/page.tsx:44         const RAINBOW_ACCENTS = ['#F5C518','#F5821F','#E8385C','#7B4FE0','#1E9BE0','#3CB043']
app/survey/page.tsx:14  const RAINBOW_ACCENTS = ['#F5C518','#F5821F','#E8385C','#7B4FE0','#1E9BE0','#3CB043']
```

Inline `style={{ borderTopColor }}` / `boxShadow` olarak uygulandıkları için
Tailwind'den geçmiyorlar. Sadece config değişirse site yarı geçmiş kalır:
ana sayfa kartları ve anket soru kartı eski rainbow renklerini göstermeye
devam eder. Kullanım yerleri: `app/page.tsx:50,78,128`,
`app/survey/page.tsx:256,321`.

### Yön B'nin düşürülme gerekçesi

B en düşük maliyetli yöndü (3–6 dosya) ve marka kaydındaki rainbow kararını
sürdüren tek yöndü. Düşürüldü çünkü çakışan hue'ları yerinde bıraktığı için
6/6 çakışmayı tam çözmüyor — yani sorunun kendisini değil görünürlüğünü
azaltıyordu.
