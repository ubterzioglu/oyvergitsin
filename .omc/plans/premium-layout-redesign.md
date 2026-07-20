# Premium Layout Redesign - Oy Ver Gitsin

**Tarih:** 2026-07-20
**Durum:** Kullanici onayi bekleniyor
**Karmasiklik:** ORTA-YUKSEK (6 fazda ~18 dosya)

---

## Baglam

Oyvergitsin, Next.js 14 (App Router) + Tailwind CSS + Supabase kullanan bir Turkiye siyasi parti eslestirme platformu. Su anda:
- Marka adi her yerde "Oy Ver Gitsin" yerine yanlis sekilde "Oy Ver Gitsin" yazili (Turkce "oy" = oy, "oy" anlamsiz)
- Hicbir reusable component yok; her sayfa kendi inline JSX'ini tekrarliyor
- Header/nav yok, footer'da alakasiz bir nakliyat backlinki var
- Landing page neredeyse bos (tek bir centered card)
- Tasarim sistemi yok: Tailwind default'lari, tutarsiz shadow/radius, marka rengi belirsiz
- Parti renkleri 3 farkli yerde tekrarlanmis (tailwind.config.ts, globals.css, results/page.tsx)

---

## Faz 0: Marka Duzeltmesi ("Oy" -> "Oy")

**Etkilenen dosyalar:**
- `lib/site.ts` satir 2, 3, 4 - name, shortName, title
- `app/page.tsx` satir 20 - h1 metni
- `README.md` satir 1 (dokumantasyon, opsiyonel)

**Kabul kriteri:** Grep ile `Oy` arandi diginda hicbir .ts/.tsx dosyasinda sonuc donmemeli. `lib/site.ts` uzerinden turetilen tum metadata (OG image, JSON-LD, title template) otomatik olarak duzelmis olacak.

---

## Faz 1: Tasarim Token Sistemi

### 1a. Renk Paleti

Siyasi tarafsizligi korumak icin parti renklerinden bagimsiz, kurumsal bir palet:

| Token | Hex | Kullanim |
|-------|-----|----------|
| `brand-ink` (birincil koyu) | `#1B2A4A` (derin lacivert/navy) | Basliklar, navbar, footer arka plani |
| `brand-accent` | `#C8A256` (eskitmis altin/antique gold) | CTA butonlari, vurgular, badge kenarliklari |
| `brand-accent-hover` | `#B8923E` | Hover state |
| `surface` | `#FAFBFC` | Sayfa arka plani |
| `surface-card` | `#FFFFFF` | Kart arka plani |
| `surface-muted` | `#F1F3F6` | Ikincil arka plan alanlari |
| `text-primary` | `#1A1D23` | Ana metin |
| `text-secondary` | `#5A6270` | Ikincil metin |
| `text-muted` | `#8B919A` | Yardimci metin |
| `border` | `#E2E5EA` | Kart/input kenarliklari |
| `border-strong` | `#CBD0D7` | Vurgulu kenarliklar |

Neden bu secim: Derin lacivert + altin kombinasyonu devlet/kurum/kurumsal kimlik hissi verir (diplomatik palet). Hicbir parti rengine yaklasmaz, tarafsiz ve ciddi duruyor.

### 1b. Tipografi

- **Basliklar:** Source Serif 4 (Google Fonts, degisken font) -- serif baslik + sans body kurumsal premium'un klasik pattern'i
- **Body:** Inter (mevcut, degisiklik yok)
- `next/font/google` ile her iki font da yuklenecek, `tailwind.config.ts`'e `fontFamily.heading` ve `fontFamily.body` olarak eklenecek

### 1c. Tailwind Config Genisletmeleri

`tailwind.config.ts`'e eklenecekler:
- `fontFamily`: `heading` (Source Serif 4) + `body` (Inter)
- `borderRadius`: `card: '1rem'`, `button: '0.625rem'`, `badge: '0.375rem'`
- `boxShadow`: `soft: '0 1px 3px rgba(0,0,0,0.06), 0 6px 16px rgba(0,0,0,0.04)'`, `elevated: '0 2px 8px rgba(0,0,0,0.08), 0 12px 32px rgba(0,0,0,0.06)'`
- `colors`: Yukaridaki brand token'lari

**Dosyalar:** `tailwind.config.ts`, `app/layout.tsx` (font import)
**Kabul kriteri:** `bg-brand-ink`, `text-brand-accent`, `font-heading`, `shadow-soft`, `rounded-card` gibi class'lar calisiyor olmali.

---

## Faz 2: Parti Renk Sistemi Tekillestirme

Yeni dosya `lib/parties.ts` olusturulacak:
- Tek bir `PARTY_COLORS` Record nesnesi (hex kodlari)
- `getPartyColor(shortName)` fonksiyonu buradan export
- `getPartyGradient(shortName)` fonksiyonu CSS gradient string dondurur

Temizlenecek tekrar:
- `tailwind.config.ts` icerisindeki parti renkleri KALDIRILACAK (dinamik parti renkleri Tailwind config'de degil, runtime'da style prop ile uygulanmali)
- `globals.css` icerisindeki `.party-gradient-*` class'lari KALDIRILACAK
- `app/results/[sessionId]/page.tsx` icerisindeki `getPartyColor()` fonksiyonu KALDIRILACAK, `lib/parties.ts`'den import edilecek

**Dosyalar:** Yeni `lib/parties.ts`, degisecek `tailwind.config.ts`, `globals.css`, `app/results/[sessionId]/page.tsx`
**Kabul kriteri:** Grep ile `getPartyColor` arandiginda sadece `lib/parties.ts` (tanim) ve import eden dosyalar donmeli. `.party-gradient-` grep'inde sonuc donmemeli.

---

## Faz 3: Reusable Component Kutuphanesi

`components/ui/` altinda olusturulacak component'ler:

| Component | Karsiligi (mevcut tekrar pattern) |
|-----------|----------------------------------|
| `Button.tsx` | `px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold ...` (5+ yerde tekrar) - variant'lar: `primary`, `secondary`, `ghost` |
| `Card.tsx` | `bg-white rounded-2xl shadow-xl p-8` (4+ yerde) - `shadow-soft`/`shadow-elevated` kullanacak |
| `Container.tsx` | `max-w-6xl mx-auto px-4` / `max-w-3xl mx-auto` - responsive padding, konfigurasyonlu max-width |
| `Badge.tsx` | Parti badge'leri, skor gostergeleri icin |
| `ProgressBar.tsx` | Survey sayfasindaki progress bar |

`components/layout/` altinda:

| Component | Aciklama |
|-----------|----------|
| `Header.tsx` | YENI -- Su an hic yok. Marka logosu/adi (sol), minimal navigasyon (sag). Sticky, `bg-brand-ink` arka plan, altin accent border-bottom. Landing haricindeki tum sayfalarda gorunecek. |
| `Footer.tsx` | MEVCUT FOOTER DEGISECEK -- Ufuksoy Nakliyat backlink'i kaldirilacak. Yerine: "Oy Ver Gitsin" marka adi, "Turkiye Siyasi Eslestirme Platformu" alt yazi, telif hakki, gizlilik/aydinlatma metni linki. `bg-brand-ink text-white` kurumsal gorunum. |

Footer karari gerekceleri: Alakasiz bir nakliyat firmasi backlink'i platformun guvenilirligini zedeler. Siyasi tarafsizlik iddiasi tasirken ucuncu parti ticari linkler barindirmak kullanici guvenini sarsar.

**Dosyalar:** 6 yeni dosya (`components/ui/` ve `components/layout/`), `app/layout.tsx` (Header/Footer import)
**Kabul kriteri:** Her component kendi props interface'ine sahip, mevcut sayfalardaki inline pattern'lerle ayni gorsel sonucu veriyor.

---

## Faz 4: Sayfa Bazli Redesign

### 4a. Landing Page (`app/page.tsx`) -- EN KRITIK

**Su an:** Tek bir centered div, h1, alt baslik, bir buton.

**Olacak:**
- **Hero Section:** Tam genislikte, `bg-brand-ink` koyu arka plan, sol tarafta buyuk serif baslik ("Oy Ver Gitsin") + alt baslik + CTA butonu, sag tarafta dekoratif geometrik element veya soyut Turkiye haritasi silueti (CSS/SVG ile, harici gorsel yok)
- **Nasil Calisir:** 3 adimli horizontal kart dizisi (ikon + baslik + aciklama): "Anketi Baslat" -> "Sorulari Yanitla" -> "Sonuclari Gor"
- **Guven Sinyalleri:** "Tamamen Anonim", "Tarafsiz Algoritma", "Acik Kaynak" gibi 3 badge/kart
- **CTA Tekrar:** Sayfa sonunda ikinci bir CTA blogu
- Admin paneli linki footer'a tasiniyor (landing'den kaldirilacak)

### 4b. Consent Page (`app/consent/page.tsx`)

- `Card` component'ine gecis
- `Button` component'ine gecis (primary + secondary variant)
- Basliga ikon eklenmesi (kalkan/kilit SVG -- guvenlik hissi)
- Mavi gradient yerine `brand-accent` altin CTA

### 4c. Survey Page (`app/survey/page.tsx`)

- `Card`, `Button`, `Container`, `ProgressBar` component'lerine gecis
- Progress bar rengi `brand-accent` (altin)
- Secili secenek kenarligi `brand-accent` (mavi yerine)
- Soru kartinda `shadow-soft` (shadow-xl yerine)

### 4d. Results Page (`app/results/[sessionId]/page.tsx`)

- `Card`, `Button`, `Container`, `Badge` component'lerine gecis
- `lib/parties.ts`'den import edilen renk fonksiyonlari
- Radar chart rengi `brand-ink` (#1B2A4A) (mavi yerine)
- Parti listesi kartlarinda `shadow-soft`

### 4e. Admin Layout (`app/admin/layout.tsx`)

- Navbar `bg-brand-ink` arka plan, beyaz metin
- Admin sayfa iceriklerine dokunulmayacak (islevsel, sadece navbar renk uyumu yeterli)

**Dosyalar:** `app/page.tsx`, `app/consent/page.tsx`, `app/survey/page.tsx`, `app/results/[sessionId]/page.tsx`, `app/admin/layout.tsx`
**Kabul kriteri:** Tum sayfalarda tutarli renk paleti, tutarli shadow/radius, hicbir sayfada inline tekrar pattern kalmamis.

---

## Faz 5: Global Stil Temizligi

- `globals.css`: Dark mode CSS variable'lari kaldirilacak (kullanilmiyor, karisiklik yaratiyor), `.party-gradient-*` class'lari kaldirilacak (Faz 2'de `lib/parties.ts`'e tasindi), body gradient kaldirilacak (sayfa bazli arka planlar kullaniliyor)
- `app/layout.tsx`: Footer degistirilecek (Faz 3'te olusturulan `Footer.tsx`), Header eklenecek, body class'ina `font-body` eklenmesi

**Dosyalar:** `globals.css`, `app/layout.tsx`
**Kabul kriteri:** `globals.css`'de sadece Tailwind directives + minimal :root token'lari kalmis, gereksiz class yok.

---

## Uygulama Sirasi

| Sira | Faz | Gerekce |
|------|-----|---------|
| 1 | Faz 0 - Marka duzeltmesi | Anlik, diger her seyin temeli |
| 2 | Faz 1 - Tasarim token'lari | Tum component'ler ve sayfalar buna bagli |
| 3 | Faz 2 - Parti renk tekillestirme | Sonuc sayfasi redesign'indan once temizlenmeli |
| 4 | Faz 3 - Component kutuphanesi | Sayfa redesign'larindan once hazir olmali |
| 5 | Faz 4 - Sayfa redesign'lari | Token + component hazir, simdi uygulanir |
| 6 | Faz 5 - Global stil temizligi | En son, her sey yerine oturduktan sonra temizlik |

---

## Kapsam Disi (Bilinçli Olarak)

- Dark mode implementasyonu (mevcut dark mode variable'lari kullanilmiyor, bu scope'a dahil degil)
- Logo/favicon tasarimi (gorsel asset uretimi gerektirir, ayri bir calisma)
- Admin CRUD sayfa icerikleri (islevsel, sadece navbar renk uyumu yeterli)
- Responsive mobile optimizasyon (mevcut Tailwind class'lari zaten responsive, bu bir gorsel kimlik calismasi)
- Authentication/guvenlik (farkli scope)
