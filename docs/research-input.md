# Oy Ver Gitsin — Anket & Skorlama Araştırma Girdisi

Bu doküman, "Oy Ver Gitsin" siyasi eşleşme platformunun anket sorularını, ideolojik
eksenlerini ve parti-eksen skorlarını **gerçek, güncel, kaynaklı** verilerle doldurmak
için hazırlanmıştır. Şu anda uygulamada bulunan veriler `scripts/seed.js` dosyasından
gelen **placeholder/dummy** verilerdir — parti pozisyonları rastgele (`Math.random()`)
atanmıştır ve anket soru seti sadece 25 soru tipini örneklemek için yazılmıştır, gerçek
bir anket içeriği değildir.

## Nasıl kullanılır

1. Bu dosyanın tamamını ChatGPT (Deep Research) içine yapıştır.
2. Aşağıdaki her bölümdeki talimatı takip ederek JSON bloklarını doldurmasını iste.
3. Kaynak kullanmasını (parti programları, güncel haberler, TBMM oylama kayıtları,
   parti sözcü açıklamaları vb.) ve her skor için kısa bir gerekçe/kaynak notu
   eklemesini iste.
4. Doldurulmuş JSON'ları bana geri getir; `scripts/seed.js` ve ilgili migration'lara
   entegre edeceğim.

**Önemli:** JSON'ların key/id yapısını (slug, short_name) bozmadan, sadece `score`,
`description` ve `notes` gibi değer alanlarını doldur/güncelle.

---

## 1. İdeolojik Eksenler (10 adet)

Her eksen -100 ile +100 arasında bir skor alır. Kutupların anlamı eksene göre
değişir — aşağıda her eksen için "-100 ne demek, +100 ne demek" açıkça tanımlanmalı
(şu an eksik, bunu da doldur).

```json
{
  "axes": [
    {
      "slug": "economy_market_state",
      "name": "Ekonomi: Piyasa vs Devlet",
      "description": "Ekonomik kararların piyasa mekanizmaları mı yoksa devlet müdahalesi mi ile yönetilmesi gerektiği",
      "negative_100_meaning": "TAMAMLA: -100 hangi uç görüşü temsil ediyor?",
      "positive_100_meaning": "TAMAMLA: +100 hangi uç görüşü temsil ediyor?"
    },
    {
      "slug": "income_distribution",
      "name": "Gelir Dağılımı",
      "description": "Gelir ve servetin dağılımı ile ilgili bakış açısı",
      "negative_100_meaning": "TAMAMLA",
      "positive_100_meaning": "TAMAMLA"
    },
    {
      "slug": "civil_liberties",
      "name": "Sivil Özgürlükler",
      "description": "Bireysel özgürlüklerin devlet otoritesi ile dengesi",
      "negative_100_meaning": "TAMAMLA",
      "positive_100_meaning": "TAMAMLA"
    },
    {
      "slug": "security_state",
      "name": "Güvenlik ve Devlet",
      "description": "Milli güvenlik öncelikleri ve devletin rolü",
      "negative_100_meaning": "TAMAMLA",
      "positive_100_meaning": "TAMAMLA"
    },
    {
      "slug": "secularism",
      "name": "Sekülerizm",
      "description": "Din ve devlet ilişkisi",
      "negative_100_meaning": "TAMAMLA",
      "positive_100_meaning": "TAMAMLA"
    },
    {
      "slug": "identity_migration",
      "name": "Kimlik ve Göç",
      "description": "Ulusal kimlik ve göç politikaları",
      "negative_100_meaning": "TAMAMLA",
      "positive_100_meaning": "TAMAMLA"
    },
    {
      "slug": "foreign_policy",
      "name": "Dış Politika",
      "description": "Uluslararası ilişkiler ve dış politika yaklaşımı",
      "negative_100_meaning": "TAMAMLA",
      "positive_100_meaning": "TAMAMLA"
    },
    {
      "slug": "eu_relations",
      "name": "AB İlişkileri",
      "description": "Avrupa Birliği ile ilişkiler ve uyum süreci",
      "negative_100_meaning": "TAMAMLA",
      "positive_100_meaning": "TAMAMLA"
    },
    {
      "slug": "education_social_policy",
      "name": "Eğitim ve Sosyal Politika",
      "description": "Eğitim sistemi ve sosyal politikalar",
      "negative_100_meaning": "TAMAMLA",
      "positive_100_meaning": "TAMAMLA"
    },
    {
      "slug": "environment_growth",
      "name": "Çevre ve Kalkınma",
      "description": "Çevre koruma ve ekonomik kalkınma dengesi",
      "negative_100_meaning": "TAMAMLA",
      "positive_100_meaning": "TAMAMLA"
    }
  ]
}
```

**Talimat (Deep Research'e):** Yukarıdaki her eksen için `negative_100_meaning` ve
`positive_100_meaning` alanlarını doldur. Gerekirse `description` metnini de daha
isabetli hale getirmek için güncelle (slug'ı değiştirme).

---

## 2. Partiler ve Profilleri (12 adet)

```json
{
  "parties": [
    { "short_name": "AKP", "name": "Adalet ve Kalkınma Partisi", "color": "#F7941D", "description": "TAMAMLA: 2-3 cümlelik güncel, tarafsız parti profili" },
    { "short_name": "CHP", "name": "Cumhuriyet Halk Partisi", "color": "#E30A17", "description": "TAMAMLA" },
    { "short_name": "MHP", "name": "Milliyetçi Hareket Partisi", "color": "#F2B705", "description": "TAMAMLA" },
    { "short_name": "İYİ", "name": "İYİ Parti", "color": "#0B1F3A", "description": "TAMAMLA" },
    { "short_name": "DEVA", "name": "Demokrasi ve Atılım Partisi", "color": "#7A3DB8", "description": "TAMAMLA" },
    { "short_name": "Gelecek", "name": "Gelecek Partisi", "color": "#1B6FB3", "description": "TAMAMLA" },
    { "short_name": "Saadet", "name": "Saadet Partisi", "color": "#6A1BB3", "description": "TAMAMLA" },
    { "short_name": "TİP", "name": "Türkiye İşçi Partisi", "color": "#333333", "description": "TAMAMLA" },
    { "short_name": "Vatan", "name": "Vatan Partisi", "color": "#D10F2F", "description": "TAMAMLA" },
    { "short_name": "YSP", "name": "Yeşil Sol Parti", "color": "#0F7A3A", "description": "TAMAMLA" },
    { "short_name": "Zafer", "name": "Zafer Partisi", "color": "#00964C", "description": "TAMAMLA" },
    { "short_name": "Memleket", "name": "Memleket Partisi", "color": "#FDD007", "description": "TAMAMLA" }
  ]
}
```

**Talimat:** Her parti için tarafsız, güncel (2025-2026 itibarıyla) 2-3 cümlelik
profil yaz. Parti isim/renk/short_name alanlarını değiştirme — sadece
`description` doldurulacak. Eğer bir partinin ismi/durumu güncel değilse
(kapanma, birleşme, isim değişikliği vb.) `"notes"` alanı ekleyip belirt.

---

## 3. Parti × Eksen Pozisyon Matrisi (EN KRİTİK BÖLÜM)

Uygulamadaki mevcut değerler tamamen rastgele üretilmiştir ve **gerçeği
yansıtmamaktadır**. Bu bölümün amacı, her parti için her eksende gerçek/tahmini
bir konum (-100 ile +100 arası tam sayı) belirlemek.

```json
{
  "party_positions": {
    "AKP": {
      "economy_market_state": { "score": null, "rationale": "", "sources": [] },
      "income_distribution": { "score": null, "rationale": "", "sources": [] },
      "civil_liberties": { "score": null, "rationale": "", "sources": [] },
      "security_state": { "score": null, "rationale": "", "sources": [] },
      "secularism": { "score": null, "rationale": "", "sources": [] },
      "identity_migration": { "score": null, "rationale": "", "sources": [] },
      "foreign_policy": { "score": null, "rationale": "", "sources": [] },
      "eu_relations": { "score": null, "rationale": "", "sources": [] },
      "education_social_policy": { "score": null, "rationale": "", "sources": [] },
      "environment_growth": { "score": null, "rationale": "", "sources": [] }
    },
    "CHP": { "...": "AKP ile aynı 10 eksen anahtarını kullan" },
    "MHP": { "...": "aynı yapı" },
    "İYİ": { "...": "aynı yapı" },
    "DEVA": { "...": "aynı yapı" },
    "Gelecek": { "...": "aynı yapı" },
    "Saadet": { "...": "aynı yapı" },
    "TİP": { "...": "aynı yapı" },
    "Vatan": { "...": "aynı yapı" },
    "YSP": { "...": "aynı yapı" },
    "Zafer": { "...": "aynı yapı" },
    "Memleket": { "...": "aynı yapı" }
  }
}
```

**Talimat (Deep Research'e):**
- 12 parti × 10 eksen = 120 hücrenin tamamını doldur.
- Her hücrede `score`: -100..+100 arası tam sayı (yukarıdaki eksen tanımlarındaki
  kutup anlamlarına göre).
- `rationale`: skorun neden verildiğine dair 1 cümlelik gerekçe.
- `sources`: mümkünse parti programı, resmi açıklama, oylama kaydı, güvenilir
  haber kaynağı (URL veya kaynak adı + tarih).
- Kaynak bulunamayan eksenlerde `"sources": []` bırak ama `rationale` içinde
  "tahmini, doğrudan kaynak bulunamadı" diye belirt.
- Yanıtını **tam JSON olarak, `"..."` kısaltmaları olmadan** (yani gerçekten
  12 parti × 10 eksen açık yazılmış) geri ver.

---

## 4. Anket Soruları ve Puanlama Kuralları

Mevcut `scripts/seed.js` içinde 25 soru var ama bunlar sadece desteklenen 25 soru
**tipini** örneklemek için yazılmış, gerçek anket içeriği değil. Aşağıda desteklenen
soru tipleri listelenmiştir:

```json
{
  "supported_question_types": [
    "single_choice", "multi_choice", "dropdown_single", "dropdown_multi",
    "ranking", "forced_choice_pair", "matrix_single", "matrix_multi",
    "likert_5", "likert_7", "slider_0_100", "numeric_input",
    "allocation", "scenario_single", "scenario_multi", "vignette_likert",
    "open_text_short", "open_text_long", "image_choice_single",
    "image_choice_multi", "file_upload", "date_input",
    "consent_checkbox_group", "attention_check", "captcha_placeholder"
  ]
}
```

**Talimat (Deep Research'e):** 10 eksenin her birini ölçmek üzere, aşağıdaki
formatta **her eksen için 2-4 soru** öner (toplam ~20-35 soru). Sorular Türkiye
siyasi bağlamına uygun, tarafsız ifade edilmiş, kutuplaştırıcı olmayan dilde olmalı.
Soru tipi mecburi değil ama yukarıdaki listeden seçilmeli — `likert_5`,
`single_choice` ve `slider_0_100` en kolay puanlanan tipler olduğu için onlara
ağırlık verilebilir.

```json
{
  "questions": [
    {
      "axis_slug": "economy_market_state",
      "text": "TAMAMLA: soru metni",
      "type": "likert_5 | single_choice | slider_0_100 | ...",
      "options": [
        { "value": "TAMAMLA", "text": "TAMAMLA", "score_modifier_for_axis": 0 }
      ]
    }
  ]
}
```

`score_modifier_for_axis`: bu seçeneğin işaretlenmesi durumunda ilgili eksene
eklenecek puan (-100..+100 aralığında, `lib/scoring/engine.ts` bu değerleri
doğrudan toplar).

---

## 5. Mevcut Kod Bağlamı (referans, değiştirmene gerek yok)

- Skorlama mantığı: kullanıcı cevaplarına göre her eksen için puanlar toplanır,
  [-100, 100] aralığına sıkıştırılır (clamp, ortalama değil).
- Parti benzerliği: `similarity = 100 - ortalama(|kullanıcı_skoru - parti_skoru|)`
  formülüyle her eksende hesaplanıp partiler arasında karşılaştırılır.
- Kaynak dosyalar: `lib/scoring/engine.ts`, `scripts/seed.js`,
  `supabase/migrations/001_initial_schema.sql`.

---

## Deep Research'e Genel Talimat

> Yukarıdaki 4 bölümü (Eksenler, Partiler, Parti×Eksen Matrisi, Sorular) sırayla
> doldur. Güncel (son 12 ay) parti programları, resmi açıklamalar, TBMM oylama
> kayıtları ve güvenilir haber kaynaklarını kullan. Belirsiz/tartışmalı skorlarda
> tarafsız kal ve gerekçeni açıkça yaz. Cevabını bu MD yapısındaki JSON bloklarını
> aynı şema ile doldurarak, eksiksiz ve kopyala-yapıştıra hazır şekilde ver.
