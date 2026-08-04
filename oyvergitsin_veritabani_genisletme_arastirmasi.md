# OyVerGitsin Veritabanı Genişletme ve Güncel Parti Kataloğu Araştırması

**Depo:** `https://github.com/ubterzioglu/oyvergitsin`  
**Araştırma tarihi:** 4 Ağustos 2026  
**Amaç:** Mevcut veritabanını, eşleştirme sonuçlarını ve ölçümleri anlamlı biçimde iyileştirecek şekilde genişletmek; Türkiye’de gündemde ve resmî sicilde bulunan siyasi partileri güvenli biçimde sisteme dahil etmek.

---

## 1. Yönetici özeti

`oyvergitsin`, doğrudan seçim sonucu veya oy oranı tahmini yapan bir uygulamadan ziyade, kullanıcının politika tercihlerini ideolojik eksenler üzerinde puanlayıp partilerin kayıtlı pozisyonlarıyla karşılaştıran bir siyasi eşleştirme uygulamasıdır.

Araştırmanın en önemli sonucu şudur:

> Bütün partileri veritabanına eklemek ile bütün partileri eşleştirme sonucuna dahil etmek aynı işlem olmamalıdır.

Önerilen üç katmanlı yapı:

1. **Resmî katalog:** Yargıtay Cumhuriyet Başsavcılığı sicilinde bulunan bütün partiler.
2. **Araştırılmış partiler:** Programı, beyannamesi ve resmî açıklamaları incelenmiş partiler.
3. **Eşleştirmeye uygun partiler:** Aktif eksenlerin en az %75’inde yeterli ve kaynaklı pozisyona sahip partiler.

Bütün resmî partilerin doğrudan `is_active=true` yapılarak hesaplamaya sokulması, uygulamanın kapsamını artırırken sonuçların bilimsel güvenilirliğini düşürebilir.

---

## 2. Depoda tespit edilen kritik sorunlar

### 2.1 Rastgele parti pozisyonları

Ana seed işlemi parti–eksen skorlarını `Math.random()` kullanarak üretiyor.

Bu durum:

- aynı cevapların farklı kurulumlarda farklı sonuç vermesine,
- testlerin deterministik olmamasına,
- araştırılmamış partilerin gerçekte sahip olmadıkları ideolojik konumlarla eşleştirmeye girmesine,
- sıralama ve top-1 sonuçlarının rastgele değişmesine

neden olabilir.

**Karar:** Üretim seed’inden rastgele pozisyon üretimi tamamen kaldırılmalıdır.

Araştırılmamış partiler:

```text
match_status = catalog_only
```

veya:

```text
match_status = researching
```

olarak tutulmalı; sonuç sıralamasına dahil edilmemelidir.

---

### 2.2 `short_name UNIQUE` kısıtı resmî sicille uyumlu değil

Mevcut şemada:

```sql
short_name VARCHAR(50) UNIQUE NOT NULL
```

bulunuyor.

Ancak resmî kayıtlarda aynı kısa adı kullanan farklı partiler vardır. Örnekler:

- Adalet Partisi — `AP`
- Asil Parti — `AP`
- Kadın Partisi — `KP`
- Kızılelma Partisi — `KP`

Bazı partilerin kısa adı resmî kaynakta `-` veya boş olarak da bulunabilir.

**Karar:**

- `short_name` nullable ve benzersiz olmayan bir gösterim alanı olmalı.
- Teknik kimlik olarak `canonical_slug` kullanılmalı.
- Resmî kaynak kimliği için `registry_external_id` kullanılmalı.
- Upsert işlemleri kısa ad üzerinden yapılmamalı.

---

### 2.3 YSP–DEM–HDP veri tutarsızlığı

Depodaki yaşam döngüsü migration’ı YSP kaydını DEM olarak güncellerken bazı seed, renk ve pozisyon script’leri hâlâ `YSP` anahtarını kullanıyor.

Bu durum çalışma sırasına göre:

- eski adın geri gelmesine,
- parti renginin fallback griye düşmesine,
- güncelleme script’inin partiyi bulamamasına,
- hukuki tüzel kişilik ile siyasi ardıllığın karıştırılmasına

neden olabilir.

**Karar:** Parti adları ve ilişkileri ayrı modellenmeli.

Önerilen tablolar:

```text
party_aliases
party_name_history
party_events
party_relations
```

Örnek ilişki türleri:

```text
renamed_to
successor_of
merged_into
electoral_list_used_by
political_line_related
```

---

### 2.4 Hukuki aktiflik ile eşleştirme uygunluğu karışıyor

Tek bir `is_active` alanı iki farklı anlam taşıyor:

1. Parti hukuken faal mi?
2. Parti eşleştirme motoruna girecek kadar araştırılmış mı?

Bu iki kavram ayrılmalıdır.

Öneri:

```text
registry_status:
  active
  dissolved
  closed_by_court
  merged
  unknown
```

```text
match_status:
  catalog_only
  researching
  eligible
  suspended
```

---

### 2.5 Sonuç ekranı 150–190 parti için ölçeklenmiyor

Mevcut sonuç sayfası, benzerliği hesaplanan bütün partileri aynı listede gösteriyor.

190 partiyle:

- mobil deneyim bozulur,
- kullanıcı önemli sonuçları ayırt edemez,
- DOM büyür,
- sonuç payload’ı gereksiz şişer.

Önerilen UI:

- İlk 5 sonuç varsayılan açık.
- İlk 10 sonuç genişletilebilir.
- Tüm sonuçlar arama ve filtreyle açılabilir.
- Araştırılmamış partiler ayrı katalog ekranında gösterilir.
- “Katalogda X parti daha var; henüz yeterli politika verisi bulunmuyor” özeti kullanılır.

---

## 3. Yeni parti eklenmesinin sonuçlara etkisi

Mevcut eşleştirme yaklaşımı ağırlıklı Manhattan uzaklığına dayanıyor:

\[
d_p = \sum_a \lambda_a |U_a - P_{pa}|
\]

\[
match_p = 100\left(1-\frac{d_p}{200\sum_a\lambda_a}\right)
\]

Burada:

- \(U_a\): kullanıcının eksen skoru
- \(P_{pa}\): partinin eksen pozisyonu
- \(\lambda_a\): kullanıcının eksen önem ağırlığı

### Yeni parti eklendiğinde değişmeyenler

- Kullanıcının eksen skorları
- Mevcut partilerin mutlak benzerlik yüzdeleri
- Eski, değişmez snapshot sonuçları

### Yeni parti eklendiğinde değişenler

- Parti sıralaması
- Birinci çıkan parti
- İlk iki ve ilk üç arasındaki fark
- Yakın sonuç uyarısı
- Parti görünürlük oranları
- Yüzdelik sıralama
- “En sık eşleşen parti” agregasyonları
- Ortalama maksimum eşleşme skoru

Bu nedenle parti seti genişletilirken eski kullanıcı cevapları üzerinde gölge hesaplama yapılmalıdır.

Ölçülmesi gereken metrikler:

```text
top1_change_rate
top2_margin
top3_band
eligible_party_count
rank_transition_matrix
party_top1_share
party_top3_share
null_result_rate
score_entropy
position_sensitivity
```

---

## 4. Yakın sonuç metriğindeki olası hata

Sonuç ekranındaki yakınlık kontrolü birinci ile ikinci parti yerine, üç veya daha fazla sonuç varsa birinci ile üçüncü parti arasındaki farkı kullanıyor:

```ts
ranked[Math.min(2, ranked.length - 1)]
```

Amaç birinci–ikinci farkını göstermekse indeks `1` olmalı.

Önerilen açık metrikler:

```text
top2_margin = score[0] - score[1]
top3_band   = score[0] - score[2]
```

İlk üç sonuç aynı bantta mı sorusu ile ilk iki sonuç arasındaki marj ayrı gösterilmelidir.

---

## 5. Önerilen hedef veri modeli

### 5.1 `parties`

```sql
parties (
  id UUID PRIMARY KEY,
  registry_external_id TEXT,
  canonical_slug TEXT UNIQUE,
  official_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  short_name TEXT,
  registry_status TEXT NOT NULL,
  match_status TEXT NOT NULL,
  founded_on DATE,
  dissolved_on DATE,
  official_website_url TEXT,
  color VARCHAR(7),
  logo_url TEXT,
  registry_checked_at TIMESTAMPTZ,
  source_confidence TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

### 5.2 Parti isimleri ve yaşam döngüsü

```sql
party_aliases (
  id UUID PRIMARY KEY,
  party_id UUID REFERENCES parties(id),
  alias TEXT NOT NULL,
  alias_type TEXT NOT NULL,
  valid_from DATE,
  valid_to DATE,
  source_url TEXT
)
```

```sql
party_events (
  id UUID PRIMARY KEY,
  party_id UUID REFERENCES parties(id),
  event_type TEXT NOT NULL,
  event_date DATE,
  description TEXT,
  source_url TEXT
)
```

```sql
party_relations (
  id UUID PRIMARY KEY,
  from_party_id UUID REFERENCES parties(id),
  to_party_id UUID REFERENCES parties(id),
  relation_type TEXT NOT NULL,
  valid_from DATE,
  valid_to DATE,
  source_url TEXT
)
```

### 5.3 Sürümlü parti pozisyonları

Mevcut `party_positions` tablosu tek güncel değer tuttuğu için tarihsel değişiklikleri ve metodoloji sürümlerini izlemek zorlaşıyor.

Öneri:

```sql
party_position_sets (
  id UUID PRIMARY KEY,
  axis_model_id UUID NOT NULL,
  version TEXT NOT NULL,
  status TEXT NOT NULL,
  effective_from DATE,
  published_at TIMESTAMPTZ,
  methodology_url TEXT,
  created_at TIMESTAMPTZ,
  UNIQUE (axis_model_id, version)
)
```

```sql
party_position_values (
  id UUID PRIMARY KEY,
  position_set_id UUID NOT NULL,
  party_id UUID NOT NULL,
  axis_id UUID NOT NULL,
  score SMALLINT CHECK (score BETWEEN -100 AND 100),
  confidence TEXT NOT NULL,
  rationale TEXT NOT NULL,
  coded_by TEXT,
  reviewed_by TEXT,
  created_at TIMESTAMPTZ,
  UNIQUE (position_set_id, party_id, axis_id)
)
```

Önerilen güven seviyeleri:

```text
high
medium
low
derived
```

Bir partinin `eligible` olabilmesi için:

```text
registry_status = active
eligible_axis_count >= ceil(active_axis_count * 0.75)
low_confidence_axis_count = 0
evidence_source_count >= eligible_axis_count
```

---

## 6. Kaynak ve kanıt modeli

Parti pozisyonları doğrudan tek bir sayısal değer olarak girilmemeli; her değer kanıtla ilişkilendirilmelidir.

Önerilen kaynak önceliği:

1. Parti programı
2. Seçim beyannamesi
3. Resmî parti açıklaması
4. TBMM oylama ve yasama davranışı
5. Lider ve yetkili açıklamaları
6. Akademik veya uzman veri seti
7. Türetilmiş değer

Aynı kaynak birden fazla ekseni destekleyebileceği için kaynakları normalleştirmek daha uygundur:

```sql
sources (
  id UUID PRIMARY KEY,
  source_type TEXT,
  title TEXT,
  publisher TEXT,
  published_on DATE,
  url TEXT,
  archived_url TEXT,
  content_hash TEXT,
  metadata JSONB
)
```

```sql
position_evidence_links (
  position_value_id UUID REFERENCES party_position_values(id),
  source_id UUID REFERENCES sources(id),
  evidence_weight NUMERIC,
  excerpt TEXT,
  notes TEXT,
  PRIMARY KEY (position_value_id, source_id)
)
```

---

## 7. Anket verileri için ayrı model

Anket oy oranları ile politika benzerliği birbirine karıştırılmamalıdır.

Bir kullanıcının bir partiyle %80 politika benzerliği göstermesi:

- o partinin %80 oy alacağı,
- kullanıcının kesin o partiye oy vereceği,
- eşleştirme skorunun oy potansiyeli olduğu

anlamına gelmez.

Önerilen tablolar:

```sql
polls (
  id UUID PRIMARY KEY,
  pollster TEXT NOT NULL,
  fieldwork_start DATE,
  fieldwork_end DATE NOT NULL,
  published_at TIMESTAMPTZ,
  geography_type TEXT NOT NULL,
  geography_code TEXT,
  sample_size INTEGER,
  mode TEXT,
  question_wording TEXT,
  undecided_treatment TEXT,
  confidence_level NUMERIC,
  reported_margin_of_error NUMERIC,
  source_url TEXT NOT NULL,
  source_type TEXT NOT NULL,
  notes TEXT
)
```

```sql
poll_subgroups (
  id UUID PRIMARY KEY,
  poll_id UUID REFERENCES polls(id),
  dimension TEXT NOT NULL,
  label TEXT NOT NULL,
  sample_size INTEGER,
  weighted_base NUMERIC,
  notes TEXT
)
```

```sql
poll_results (
  id UUID PRIMARY KEY,
  poll_id UUID REFERENCES polls(id),
  party_id UUID REFERENCES parties(id),
  subgroup_id UUID REFERENCES poll_subgroups(id),
  raw_party_label TEXT NOT NULL,
  observation_type TEXT NOT NULL,
  share NUMERIC CHECK (share BETWEEN 0 AND 100),
  lower_bound NUMERIC,
  upper_bound NUMERIC,
  is_other_bucket BOOLEAN NOT NULL DEFAULT false,
  is_hypothetical BOOLEAN NOT NULL DEFAULT false
)
```

Önerilen `observation_type` değerleri:

```text
declared_vote_intention
hypothetical_party_scenario
vote_potential
leader_preference
party_loyalty
```

---

## 8. Seçim sonucu ve sandalye simülasyonu

Depoda mevcut haliyle:

- D’Hondt
- seçim çevresi
- milletvekili sayısı
- ülke barajı
- ittifak
- ortak liste
- sandalye tahmini

modülü bulunmuyor.

Bu özellik, eşleştirme sisteminden ayrı geliştirilmelidir.

Önerilen tablolar:

```text
elections
election_districts
election_district_seat_counts
election_parties
electoral_alliances
alliance_memberships
joint_lists
election_vote_observations
seat_simulation_runs
seat_simulation_results
```

Önemli ayrım:

- ittifak üyeliği,
- başka partinin listesinden seçime girme,
- siyasi iş birliği,
- ortak aday,
- ortak liste

aynı veri değildir.

---

## 9. Sonuç snapshot yapısı

Tam sonuç payload’ını JSONB olarak saklamak geçmiş sonuçların değişmezliği açısından doğru bir yaklaşımdır.

Ancak 190 parti için her oturumda ayrıntılı açıklama saklamak gereksiz hacim oluşturabilir.

Önerilen yapı:

```ts
interface CompactPartyMatch {
  partyId: string
  partyName: string
  shortName: string | null
  color: string | null
  similarity: number
  rank: number
  axesUsed: number
}

interface DetailedPartyMatch extends CompactPartyMatch {
  agreements: AxisComparison[]
  disagreements: AxisComparison[]
}

interface ResultPayload {
  algorithmVersion: number
  partySetVersion: string
  positionSetVersion: string
  eligiblePartyCount: number
  topMatches: DetailedPartyMatch[]
  remainingMatches: CompactPartyMatch[]
}
```

Ayrıca analitik sorgular için yalnızca ilk 10 veya ilk 20 sonucu normalize etmek mümkündür:

```sql
result_party_scores (
  snapshot_id UUID NOT NULL,
  party_id UUID NOT NULL,
  rank SMALLINT,
  similarity SMALLINT,
  axes_used SMALLINT NOT NULL,
  is_top_k BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (snapshot_id, party_id)
)
```

---

## 10. Önerilen additive migration

```sql
BEGIN;

ALTER TABLE parties
  DROP CONSTRAINT IF EXISTS parties_short_name_key;

ALTER TABLE parties
  ALTER COLUMN short_name DROP NOT NULL;

ALTER TABLE parties
  ADD COLUMN IF NOT EXISTS registry_external_id TEXT,
  ADD COLUMN IF NOT EXISTS canonical_slug TEXT,
  ADD COLUMN IF NOT EXISTS official_name TEXT,
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS registry_status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS match_status TEXT NOT NULL DEFAULT 'catalog_only',
  ADD COLUMN IF NOT EXISTS founded_on DATE,
  ADD COLUMN IF NOT EXISTS dissolved_on DATE,
  ADD COLUMN IF NOT EXISTS official_website_url TEXT,
  ADD COLUMN IF NOT EXISTS registry_checked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS source_confidence TEXT NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE parties
SET
  official_name = COALESCE(official_name, name),
  display_name = COALESCE(display_name, name),
  registry_status = CASE
    WHEN is_active = false THEN 'dissolved'
    ELSE registry_status
  END,
  match_status = CASE
    WHEN is_active = true THEN 'researching'
    ELSE 'suspended'
  END;

CREATE UNIQUE INDEX IF NOT EXISTS ux_parties_canonical_slug
  ON parties(canonical_slug)
  WHERE canonical_slug IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_parties_registry_external_id
  ON parties(registry_external_id)
  WHERE registry_external_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_parties_registry_status
  ON parties(registry_status);

CREATE INDEX IF NOT EXISTS idx_parties_match_status
  ON parties(match_status);

ALTER TABLE parties
  ADD CONSTRAINT parties_registry_status_check
  CHECK (
    registry_status IN (
      'active',
      'dissolved',
      'closed_by_court',
      'merged',
      'unknown'
    )
  );

ALTER TABLE parties
  ADD CONSTRAINT parties_match_status_check
  CHECK (
    match_status IN (
      'catalog_only',
      'researching',
      'eligible',
      'suspended'
    )
  );

CREATE TABLE IF NOT EXISTS party_aliases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  alias TEXT NOT NULL,
  alias_type TEXT NOT NULL,
  valid_from DATE,
  valid_to DATE,
  source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (party_id, alias, alias_type)
);

CREATE TABLE IF NOT EXISTS party_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_date DATE,
  description TEXT,
  source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS party_relations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_party_id UUID NOT NULL REFERENCES parties(id),
  to_party_id UUID NOT NULL REFERENCES parties(id),
  relation_type TEXT NOT NULL,
  valid_from DATE,
  valid_to DATE,
  source_url TEXT,
  CHECK (from_party_id <> to_party_id),
  UNIQUE (from_party_id, to_party_id, relation_type, valid_from)
);

CREATE TABLE IF NOT EXISTS party_membership_observations (
  party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  observed_on DATE NOT NULL,
  member_count BIGINT NOT NULL CHECK (member_count >= 0),
  source_url TEXT,
  source_snapshot_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (party_id, observed_on)
);

COMMIT;
```

İlk migration’da eski `name`, `is_active` ve `dissolved_at` alanları kaldırılmamalıdır. Kod tamamen yeni alanlara taşındıktan sonra ayrı bir cleanup migration hazırlanmalıdır.

---

## 11. Resmî parti kataloğu

Aşağıdaki liste araştırma sırasında Yargıtay Cumhuriyet Başsavcılığı siyasi parti sicili arayüzünde görülen sıra kayıtlarının transkripsiyonudur.

> Not: 106, 107 ve 159 numaralı satırlar kaynak arayüzünde boş veya `-` olarak görülmüştür. Bu satırlar gerçek parti kaydı gibi import edilmemeli, karantina veya veri kalite tablosuna alınmalıdır.

| No | Parti | No | Parti | No | Parti | No | Parti |
|---:|---|---:|---|---:|---|---:|---|
| 1 | Adalet Birlik Partisi | 49 | Değer Partisi | 97 | İnsan ve Özgürlük Partisi | 145 | Toplumcu Kurtuluş Partisi |
| 2 | Adalet Partisi | 50 | Demokrasi ve Atılım Partisi | 98 | İşçi Demokrasisi Partisi | 146 | Toplumsal Özgürlük Partisi |
| 3 | Adalet ve Çağrı Partisi | 51 | Demokrasi Zamanı Partisi | 99 | İYİ Parti | 147 | Toprak Partisi |
| 4 | Adalet ve Gençlik Partisi | 52 | Demokratik Bölgeler Partisi | 100 | Kadın Partisi | 148 | Tuğra Partisi |
| 5 | Adalet ve Hürriyet Partisi | 53 | Demokratik Sol Parti | 101 | Karar Parti | 149 | Turan Hareketi Partisi |
| 6 | Adalet ve Kalkınma Partisi | 54 | Demokrat Parti | 102 | Kızılelma Partisi | 150 | Turan Partisi |
| 7 | Adil Türkiye Partisi | 55 | Denge Partisi | 103 | Kızıl Parti | 151 | Türkiye Emekliler Partisi |
| 8 | Aklı Selim Gençler Partisi | 56 | Devlet Partisi | 104 | Komünist Parti | 152 | Türkiye Emekliler ve Çalışanlar Partisi |
| 9 | Al Sancak Partisi | 57 | Devrimci İşçi Partisi | 105 | Kutlu Parti | 153 | Türkiye Emekliler ve Emekçiler Partisi |
| 10 | Alternatif Parti | 58 | Devrimci Sosyalist İşçi Partisi | 106 | Kaynakta boş | 154 | Türkiye Güven Partisi |
| 11 | Anadolu Birliği Partisi | 59 | Devrim Partisi | 107 | Kaynakta boş | 155 | Türkiye İşçi Partisi |
| 12 | Anadolu Cumhuriyet Partisi | 60 | Diriliş ve Değişim Partisi | 108 | Küresel Adalet ve Liyakat Partisi | 156 | Türkiye İttifakı Partisi |
| 13 | Anadolu Çınarları Partisi | 61 | Doğru Parti | 109 | Liberal Demokrat Parti | 157 | Türkiye Komünist Hareketi |
| 14 | Anadolu Medeniyet Partisi | 62 | Doğru Yol Partisi | 110 | Liberal Parti | 158 | Türkiye Komünist Partisi |
| 15 | Anahtar Parti | 63 | Doğuş Partisi | 111 | Merkez Ana Parti | 159 | Kaynakta boş |
| 16 | Anavatan Partisi | 64 | Dost Parti | 112 | Merkez Parti | 160 | Türkiye’m Partisi |
| 17 | Ana Yol Partisi | 65 | Ebedi Nizam Partisi | 113 | Merkez Sağ Parti | 161 | Türkiye’nin Sesi Altınçağ Partisi |
| 18 | Anka Partisi | 66 | Egemen Türkiye Partisi | 114 | Millet Partisi | 162 | Türkiye Sosyalist İşçi Partisi |
| 19 | Asil Parti | 67 | Emekçi Hareket Partisi | 115 | Milli Beraberlik Partisi | 163 | Türkiye Sosyalist Partisi |
| 20 | Ata Partisi | 68 | Emekliler ve Yurttaşlar Partisi | 116 | Milli Birlik ve Gelişim Partisi | 164 | Türkiye Uyanış Partisi |
| 21 | Aydınlık Geleceğin Partisi | 69 | Emek Partisi | 117 | Milli Diriliş Partisi | 165 | Türkiye Yüzyılı Partisi |
| 22 | Bağımsızlık Partisi | 70 | Eşitlik ve Adalet Partisi | 118 | Milli Kalkınma Partisi | 166 | Ulusal Kurtuluş ve And Birliği Partisi |
| 23 | Bağımsız Türkiye Partisi | 71 | Evrensel Medeniyet Partisi | 119 | Milli Mücadele Partisi | 167 | Ulusal Parti |
| 24 | Barış ve Eşitlik Partisi | 72 | Ezilenlerin Sosyalist Partisi | 120 | Milli Parti | 168 | Ulusun Partisi |
| 25 | Bereket Partisi | 73 | Fetih Partisi | 121 | Milli Ulusal Parti | 169 | Umuda Yürüyüş Partisi |
| 26 | Birleşik Devrimci Parti | 74 | Gelecek Partisi | 122 | Milliyetçi Cumhuriyet Partisi | 170 | Ülkem Partisi |
| 27 | Birleşik Komünist Parti | 75 | Genç Parti | 123 | Milliyetçi Hareket Partisi | 171 | Üreten Türkiye Partisi |
| 28 | Birlik ve İlerleme Partisi | 76 | Genç Türkiye Partisi | 124 | Milliyetçi Türkiye Partisi | 172 | Vatan Partisi |
| 29 | Birlik ve Yükseliş Partisi | 77 | Güç Birliği Partisi | 125 | Milli Yol Partisi | 173 | Vatan ve Hürriyet Partisi |
| 30 | Bizim Parti | 78 | Güçlü Anadolu Partisi | 126 | Müdafaa-i Hukuk Hareketi Partisi | 174 | Yeni Çağ Partisi |
| 31 | Büyük Birlik Partisi | 79 | Güçlü Parti | 127 | Ocak Partisi | 175 | Yeniden Diriliş Partisi |
| 32 | Büyük İktidar Partisi | 80 | Güçlü Türkiye Partisi | 128 | Osmanlı Partisi | 176 | Yeniden Doğuş Partisi |
| 33 | Büyük Medeniyet Partisi | 81 | Güçlü Yol Partisi | 129 | Önce Vatan Partisi | 177 | Yeniden Refah Partisi |
| 34 | Büyük Parti | 82 | Güven Adalet ve Aydınlık Partisi | 130 | Ötüken Birliği Partisi | 178 | Yeniden Umut Partisi |
| 35 | Büyük Türkiye Partisi | 83 | Güzel Parti | 131 | Özgürlük ve Sosyalizm Partisi | 179 | Yenilik Partisi |
| 36 | Cihan Partisi | 84 | Hak Birliği Hareketi Partisi | 132 | Saadet Partisi | 180 | YENİ Parti |
| 37 | Cumhuriyetçi Aydınlık Partisi | 85 | Hak ve Adalet Partisi | 133 | Sağduyu Partisi | 181 | Yeni Türkiye Partisi |
| 38 | Cumhuriyetçi Milletin Partisi | 86 | Hak ve Hakikat Partisi | 134 | Sağ Parti | 182 | Yeni Yol |
| 39 | Cumhuriyetçi Sol Parti | 87 | Hak ve Huzur Partisi | 135 | Sevgi ve Saygı Partisi | 183 | Yeni Yüzyıl Partisi |
| 40 | Cumhuriyetçi Vatanseverler Partisi | 88 | Hak ve Özgürlükler Partisi | 136 | Sol Parti | 184 | Yerli ve Milli Parti |
| 41 | Cumhuriyet Emek Partisi | 89 | Halkın Kurtuluş Partisi | 137 | Son Parti | 185 | Yeşil Sol Parti |
| 42 | Cumhuriyet Halk Partisi | 90 | Halkın Sesi Partisi | 138 | Sosyal Demokrat Halkçı Parti | 186 | Yurt Partisi |
| 43 | Cumhuriyet Partisi | 91 | Halkların Demokratik Partisi | 139 | Sosyalist Cumhuriyet Partisi | 187 | Yüce Diriliş Partisi |
| 44 | Cumhuriyet ve Adalet Partisi | 92 | Halkların Eşitlik ve Demokrasi Partisi | 140 | Sosyalist Emekçiler Partisi | 188 | Yükselen Türkiye Partisi |
| 45 | Cumhuriyet ve İstiklal Partisi | 93 | Huzur ve Güven Partisi | 141 | Sosyalist Eşitlik Partisi–Dördüncü Enternasyonal | 189 | Yükseliş Partisi |
| 46 | Çağdaş Türkiye Partisi | 94 | Hür Dava Partisi | 142 | Sosyalist İktidar Partisi | 190 | Zafer Partisi |
| 47 | Çağdaş Yeni Nesil Partisi | 95 | Hürriyet Partisi | 143 | Sosyalist Yeniden Kuruluş Partisi |  |  |
| 48 | Çoğulcu Demokrasi Partisi | 96 | İnsanca Yaşam Partisi | 144 | Teknoloji Kalkınma Partisi |  |  |

---

## 12. Eşleştirme için önerilen öncelikli parti seti

Bütün resmî partiler kataloğa alınmalı; fakat politika pozisyonu araştırması aşamalı yapılmalıdır.

### Birinci öncelik

- Adalet ve Kalkınma Partisi
- Cumhuriyet Halk Partisi
- Milliyetçi Hareket Partisi
- Halkların Eşitlik ve Demokrasi Partisi
- İYİ Parti
- Yeniden Refah Partisi
- Zafer Partisi
- Anahtar Parti
- Türkiye İşçi Partisi
- YENİ Parti

### İkinci öncelik

- Saadet Partisi
- Büyük Birlik Partisi
- Demokrasi ve Atılım Partisi
- Gelecek Partisi
- Demokrat Parti
- Hür Dava Partisi
- Bağımsız Türkiye Partisi
- Emek Partisi
- Sol Parti
- Türkiye Komünist Partisi
- Vatan Partisi

### Katalog

Diğer bütün resmî kayıtlar:

```text
match_status = catalog_only
```

olarak sisteme eklenmeli; yeterli ve kaynaklı eksen pozisyonu olmadan sıralamaya sokulmamalıdır.

---

## 13. Parti import stratejisi

Import işlemi doğrudan üretim tablosuna körlemesine yazmamalıdır.

Önerilen süreç:

```text
registry_fetch
→ staging table
→ schema validation
→ duplicate detection
→ empty-row quarantine
→ identity reconciliation
→ dry-run report
→ approved upsert
→ post-import validation
```

Import kimliği sırasıyla:

1. Yargıtay detay kaydındaki değişmez resmî kimlik
2. Bu kimlik yoksa ad + kuruluş tarihi + kaynak URL hash’i
3. Asla kısa ad veya sıra numarası değil

Örnek TypeScript yaklaşımı:

```ts
const rows = accepted.map((party) => ({
  registry_external_id: party.registryExternalId,
  canonical_slug: toCanonicalSlug(
    party.officialName,
    party.registryExternalId,
  ),
  official_name: party.officialName,
  display_name: party.officialName,
  name: party.officialName, // geçici eski kod uyumluluğu
  short_name:
    party.shortName && party.shortName !== '-'
      ? party.shortName
      : null,
  registry_status: party.registryStatus,
  match_status: 'catalog_only',
  founded_on: party.foundedOn,
  registry_checked_at: new Date().toISOString(),
  source_confidence: 'official_registry',
  metadata: {
    registrySourceUrl: party.sourceUrl,
  },
}))
```

---

## 14. Veri doğrulama sorguları

### Çakışan resmî kimlikler

```sql
SELECT registry_external_id, count(*)
FROM parties
WHERE registry_external_id IS NOT NULL
GROUP BY registry_external_id
HAVING count(*) > 1;
```

### Çakışan kısa adlar

Bu sonuç hata değil, kalite raporu olmalıdır:

```sql
SELECT
  short_name,
  array_agg(official_name ORDER BY official_name)
FROM parties
WHERE short_name IS NOT NULL
GROUP BY short_name
HAVING count(*) > 1;
```

### Geçersiz adlar

```sql
SELECT *
FROM parties
WHERE official_name IS NULL
   OR btrim(official_name) IN ('', '-');
```

### Uygun partilerin eksen kapsamı

```sql
WITH active_model AS (
  SELECT id
  FROM axis_models
  WHERE is_active = true
  LIMIT 1
),
active_axes AS (
  SELECT id
  FROM axes
  WHERE axis_model_id = (SELECT id FROM active_model)
),
coverage AS (
  SELECT
    p.id,
    p.official_name,
    count(DISTINCT pp.axis_id) AS coded_axes,
    (SELECT count(*) FROM active_axes) AS total_axes
  FROM parties p
  LEFT JOIN party_positions pp
    ON pp.party_id = p.id
   AND pp.axis_id IN (SELECT id FROM active_axes)
  WHERE p.match_status = 'eligible'
  GROUP BY p.id, p.official_name
)
SELECT *
FROM coverage
WHERE coded_axes < ceil(total_axes * 0.75);
```

### Kanıtsız pozisyonlar

```sql
SELECT pp.id, p.official_name, a.slug
FROM party_positions pp
JOIN parties p ON p.id = pp.party_id
JOIN axes a ON a.id = pp.axis_id
LEFT JOIN party_position_evidence e
  ON e.party_position_id = pp.id
GROUP BY pp.id, p.official_name, a.slug
HAVING count(e.id) = 0;
```

---

## 15. Test planı

### Migration testleri

- Mevcut partiler kaybolmamalı.
- Eski uygulama additive migration sonrasında çalışmaya devam etmeli.
- Aynı kısa ada sahip iki parti kaydedilebilmeli.
- `registry_external_id` benzersiz kalmalı.
- Eski snapshot’lar değişmemeli.

### Algoritma testleri

```ts
it('yeni parti eklemek mevcut partinin mutlak skorunu değiştirmez', () => {
  // Aynı kullanıcı ve aynı parti pozisyonunda skor sabit kalmalı.
})

it('yeni parti top-1 sırasını değiştirebilir', () => {
  // Yeni parti kullanıcıya daha yakınsa birinci olabilir.
})

it('catalog_only parti eşleştirmeye girmez', () => {
  // Pozisyon satırı olsa bile sorgu filtresi dışında kalmalı.
})

it('aynı kısa ad farklı partiler için geçerlidir', () => {
  // Kimlik UUID/slug üzerinden ayrılmalı.
})
```

### Veri kalite testleri

- Her `eligible` parti en az %75 eksen kapsamına sahip olmalı.
- Her kullanılan pozisyonun en az bir kanıtı olmalı.
- `low` güven seviyeli zorunlu eksen kalmamalı.
- Rastgele seed kalmamalı.
- İki temiz kurulum aynı checksum’ı üretmeli.

### UI testleri

- İlk render en fazla 5–10 parti kartı.
- Arama ve sayfalama çalışmalı.
- Aynı kısa ada sahip partiler logoları ve tam adlarıyla ayrılmalı.
- Renk kontrastı erişilebilir olmalı.
- Mobil sonuç sayfası 190 katalog kaydıyla bozulmamalı.

### Performans hedefleri

```text
active party + positions query p95 <= 25 ms
complete API p95 artışı <= 50 ms
ilk render edilen parti kartı <= 10
snapshot payload gzip öncesi <= 250 KB
snapshot payload gzip sonrası <= 75 KB
Lighthouse mobile performance >= 85
```

---

## 16. Aşamalı uygulama yol haritası

### Aşama 0 — Mevcut durumun dondurulması

- Üretim `parties`, `party_positions`, evidence ve snapshot tablolarının salt-okunur dökümü alınır.
- Satır sayıları ve checksum’lar kaydedilir.
- Mevcut algoritma sürümü ve parti kümesi belgelenir.

### Aşama 1 — Kritik veri hatalarının temizlenmesi

- Rastgele seed kaldırılır.
- YSP–DEM–HDP kimlik ve ad ilişkileri düzeltilir.
- Renk haritası veritabanına taşınır.
- `short_name UNIQUE` kaldırılır.
- `registry_status` ve `match_status` ayrılır.

### Aşama 2 — Resmî katalog

- Yargıtay kayıtları staging tabloya alınır.
- Boş satırlar karantinaya alınır.
- Resmî kimlik, kuruluş tarihi ve adlar doğrulanır.
- Bütün doğrulanmış partiler `catalog_only` olarak eklenir.
- Sonuç sıralaması henüz değiştirilmez.

### Aşama 3 — Öncelikli partilerin araştırılması

İlk 10–20 parti için:

- parti programı,
- seçim beyannamesi,
- resmî açıklamalar,
- yasama davranışları

toplanır.

Her pozisyon iki araştırmacı tarafından bağımsız kodlanmalı; büyük farklar üçüncü değerlendirmeyle çözülmelidir.

### Aşama 4 — Gölge hesaplama

Eski kullanıcı cevapları iki kez hesaplanır:

1. Eski parti seti
2. Yeni parti seti

Raporlanacak metrikler:

- top-1 değişim oranı
- sıra geçiş matrisi
- ilk üç görünürlük oranı
- null oranı
- top-2 ve top-3 marjları
- pozisyon duyarlılığı
- API gecikmesi
- payload büyüklüğü

### Aşama 5 — UI ve kademeli aktivasyon

- İç ekip
- %5 trafik
- %25 trafik
- %100 trafik

Feature flag önerileri:

```text
PARTY_CATALOG_V2_ENABLED
PARTY_MATCH_SET_V2_ENABLED
POLLING_DATA_ENABLED
SEAT_SIMULATOR_ENABLED
RESULT_PAYLOAD_COMPACT_ENABLED
```

### Aşama 6 — Anket ve seçim modülü

Bu modül eşleştirme sisteminden ayrı geliştirilmelidir.

- Anket tarihçesi
- Demografik alt gruplar
- İl bazlı sonuçlar
- Seçim çevreleri
- İttifak ve ortak listeler
- D’Hondt
- Monte Carlo belirsizlik simülasyonu

---

## 17. Önerilen komut sırası

```bash
npm run db:reset
npm run db:migrate supabase/migrations/011_party_registry_v2.sql

node scripts/import-party-registry.js --dry-run
node scripts/import-party-registry.js

node scripts/validate-party-catalog.js
node scripts/validate-party-position-coverage.js

npm test
npx tsc --noEmit
npm run lint
npm run build
npm run test:e2e
npm run smoke
npm run audit:rls
```

---

## 18. Geri dönüş stratejisi

Veri silmek yerine özellik bayrağıyla eski davranışa dönmek daha güvenlidir.

| Sorun | Geri dönüş |
|---|---|
| Yeni partiler hatalı sonuç üretiyor | `PARTY_MATCH_SET_V2_ENABLED=false` |
| Katalog importunda yanlış kayıt var | İlgili import batch’i pasifleştirilir |
| UI yavaşladı | İlk 5 dışındaki sonuçlar isteğe bağlı yüklenir |
| Yeni pozisyon seti hatalı | Set `withdrawn`, önceki set `active` yapılır |
| Snapshot şişmesi | Yeni oturumlarda top-K normalize edilir |
| Migration sorun çıkardı | Eski kolonlar korunduğu için eski sorgulara dönülür |

Eski snapshot’lar topluca yeniden hesaplanmamalı veya silinmemelidir.

---

## 19. Nihai öneri

İlk geliştirme döngüsünde şu dört konu zorunlu olarak çözülmelidir:

1. Rastgele parti pozisyonlarının kaldırılması
2. Kısa ad benzersizliği kısıtının kaldırılması
3. YSP–DEM–HDP kimlik ve ad modelinin düzeltilmesi
4. Resmî katalog ile eşleştirmeye uygun parti kümesinin ayrılması

Daha sonra bütün resmî partiler kataloğa alınmalı; yalnızca yeterli ve kaynaklı politika verisi bulunan partiler sonuç sıralamasına dahil edilmelidir.

En güvenli ürün yaklaşımı:

```text
Bütün partiler katalogda
+ kaynaklı partiler eşleştirmede
+ anketler ayrı modülde
+ sandalye tahmini ayrı modülde
+ eski sonuçlar değişmez snapshot olarak korunur
```

---

## 20. Temel kaynaklar

- Yargıtay Cumhuriyet Başsavcılığı — Siyasi Parti Sicili
- Yüksek Seçim Kurulu — 14 Mayıs 2023 seçim sonuçları ve resmî belgeler
- Parti programları ve resmî web siteleri
- Yayımlanmış anket şirketi sonuçları ve metodoloji açıklamaları
- Depodaki Supabase migration, seed, scoring engine, party-match ve results sayfası kodları

> Parti kataloğu ve güncel siyasi veriler zamanla değişebileceği için import işlemi tarihli registry snapshot’ları ve kaynak hash’leriyle sürümlenmelidir.
