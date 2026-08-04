# Party Registry v2 Implementation Plan - 2026-08-04

Kaynak: `oyvergitsin_veritabani_genisletme_arastirmasi.md`

Bu planın amacı bütün resmi partileri katalogda tutmak, fakat yalnız yeterli ve kaynaklı politika pozisyonu bulunan partileri eşleştirme sonuçlarına dahil etmektir. `siyaset-radari` MVP migration'ı bu plandan ayrıdır; parti kataloğu v2 çalışması ayrı migration ve ayrı doğrulama komutlarıyla ilerlemelidir.

## Temel Kararlar

- `parties.is_active` tek başına eşleştirme filtresi olmaktan çıkarılacak.
- Hukuki durum `registry_status`, eşleştirme uygunluğu `match_status` ile ayrılacak.
- `short_name` benzersiz teknik kimlik olarak kullanılmayacak; nullable gösterim alanı olacak.
- Teknik kimlik için `canonical_slug`, resmi kaynak kimliği için `registry_external_id` kullanılacak.
- Araştırılmamış partiler `catalog_only` veya `researching` kalacak; sonuç sıralamasına girmeyecek.
- Rastgele parti pozisyonu üretimi production seed akışından kaldırılacak.
- Eski result snapshot'lar yeniden hesaplanmayacak ve silinmeyecek.

## Aşama 0 - Güvenli Başlangıç

Amaç: Mevcut canlı davranışı belgelemek ve geri dönüş noktasını netleştirmek.

İşler:
- Production `parties`, `party_positions`, `party_position_evidence`, `result_snapshots` satır sayıları kaydedilecek.
- Aktif `axis_models` id/version bilgisi kaydedilecek.
- Mevcut eşleştirme motorunun parti filtresi ve sonuç payload formatı belgelenecek.
- `scripts/seed.js` içindeki `Math.random()` ile üretilen parti pozisyonları envantere alınacak.

Kabul kriterleri:
- Satır sayısı ve checksum raporu `docs/audits/` altına yazılmış.
- Eski davranışa dönüş için hangi env/feature flag'in kullanılacağı netleşmiş.

## Aşama 1 - Additive Migration

Amaç: Eski kodu kırmadan yeni parti kimlik modelini eklemek.

Yeni migration: `supabase/migrations/012_party_registry_v2.sql`

İçerik:
- `parties.short_name` üzerindeki UNIQUE ve NOT NULL varsayımları kaldırılacak.
- `parties` tablosuna şu alanlar eklenecek:
  - `registry_external_id`
  - `canonical_slug`
  - `official_name`
  - `display_name`
  - `registry_status`
  - `match_status`
  - `founded_on`
  - `dissolved_on`
  - `official_website_url`
  - `registry_checked_at`
  - `source_confidence`
  - `metadata`
- Partial unique index:
  - `canonical_slug where canonical_slug is not null`
  - `registry_external_id where registry_external_id is not null`
- Yaşam döngüsü tabloları:
  - `party_aliases`
  - `party_name_history`
  - `party_events`
  - `party_relations`
  - `party_membership_observations`

Kabul kriterleri:
- Migration eski kolonları silmiyor.
- Mevcut uygulama migration sonrası build edebiliyor.
- Aynı `short_name` değerine sahip iki farklı parti eklenebiliyor.
- `registry_status` ve `match_status` check constraint'leri çalışıyor.

## Aşama 2 - Kodun Yeni Alanları Okuması

Amaç: DB modeli hazırken uygulama davranışını kontrollü taşımak.

İşler:
- `lib/scoring/engine.ts` parti sorgusu `match_status = 'eligible'` filtresini destekleyecek.
- Geçiş sürecinde feature flag kullanılacak:
  - `PARTY_MATCH_STATUS_FILTER_ENABLED=false` varsayılan eski davranış
  - `true` olduğunda yalnız `eligible` partiler eşleştirmeye girer
- Admin parti ekranı `registry_status`, `match_status`, `official_name`, `display_name` alanlarını göstermeye hazırlanacak.
- Results ekranı aynı kısa ada sahip partileri tam adla ayırt edecek.

Kabul kriterleri:
- Feature flag kapalıyken mevcut sonuçlar değişmiyor.
- Feature flag açıkken `catalog_only` ve `researching` partiler sonuçlara girmiyor.
- Eski snapshot görüntüleme bozulmuyor.

## Aşama 3 - Random Seed Temizliği

Amaç: Kurulum ve test davranışını deterministik hale getirmek.

İşler:
- `scripts/seed.js` içinde `Math.random()` ile `party_positions` üretimi kaldırılacak.
- Demo seed gerekiyorsa sabit fixture kullanılacak veya pozisyon seed'i ayrı komuta taşınacak.
- `derive-party-positions-v2.js` ve `party-positions-v2.js` ana kaynak yapılacak.

Kabul kriterleri:
- `rg "Math.random" scripts lib` production seed için sonuç döndürmüyor.
- İki temiz seed kurulumu aynı parti pozisyon checksum'ını veriyor.
- Scoring testleri deterministik çalışıyor.

## Aşama 4 - Resmi Parti Kataloğu Import Pipeline

Amaç: Bütün resmi partileri körlemesine production tablosuna yazmadan kataloglamak.

Yeni önerilen dosyalar:
- `scripts/data/party-registry-2026-08-04.json`
- `scripts/import-party-registry.js`
- `scripts/validate-party-catalog.js`

Mevcut doğrulama komutu:
- `npm run validate:party-catalog`

Import akışı:
1. Registry snapshot okunur.
2. Boş veya `-` satırlar karantinaya alınır.
3. `official_name`, `registry_external_id`, `canonical_slug` üretilir.
4. Duplicate raporu hazırlanır.
5. `--dry-run` raporu oluşturulur.
6. Onaylı import `match_status = 'catalog_only'` ile upsert yapar.

Kabul kriterleri:
- 106, 107 ve 159 gibi boş kayıtlar `parties` tablosuna yazılmıyor.
- Upsert `short_name` üzerinden yapılmıyor.
- Aynı kısa ad veri kalitesi uyarısıdır, import hatası değildir.
- Import tekrar çalıştırılabilir ve idempotenttir.

## Aşama 5 - YSP / DEM / HDP Kimlik Düzeltmesi

Amaç: Hukuki tüzel kişilik, eski ad ve siyasi ardıllık ilişkilerini karıştırmamak.

İşler:
- Mevcut YSP/DEM/HDP seed ve renk anahtarları envantere alınacak.
- `party_aliases` ile eski adlar bağlanacak.
- `party_relations` ile `renamed_to`, `successor_of`, `political_line_related` ilişkileri kurulacak.
- Renk ve logo verisi `canonical_slug` veya `party_id` üzerinden çözülecek.

Kabul kriterleri:
- Seed sırası eski adı geri getirmiyor.
- DEM rengi fallback griye düşmüyor.
- Eski snapshot'lar eski isimleriyle açılabiliyor.

## Aşama 6 - Pozisyon Setleri ve Kanıt Modeli

Amaç: Parti pozisyonlarını sürümlü ve kaynaklı hale getirmek.

Yeni tablolar:
- `party_position_sets`
- `party_position_values`
- `sources`
- `position_evidence_links`

Geçiş yaklaşımı:
- Mevcut `party_positions` hemen silinmeyecek.
- Yeni pozisyon seti önce pasif/status `draft` tutulacak.
- İlk 10-20 parti için kaynaklı pozisyonlar girilecek.
- `eligible` kararı otomatik coverage kontrolünden geçecek.

Kabul kriterleri:
- Her `eligible` parti aktif eksenlerin en az yüzde 75'inde pozisyona sahip.
- `low` güvenli zorunlu eksen kalmıyor.
- Kullanılan her pozisyonun en az bir kaynak bağlantısı var.

## Aşama 7 - Gölge Hesaplama

Amaç: Yeni parti setinin sonuç davranışına etkisini canlıya almadan ölçmek.

Yeni önerilen script:
- `scripts/shadow-score-party-set-v2.js`

Metrikler:
- `top1_change_rate`
- `top2_margin`
- `top3_band`
- `eligible_party_count`
- `rank_transition_matrix`
- `party_top1_share`
- `party_top3_share`
- `null_result_rate`
- `score_entropy`
- `position_sensitivity`

Kabul kriterleri:
- Eski parti seti ve yeni parti seti aynı tamamlanmış oturumlar üzerinde karşılaştırılmış.
- Top-1 değişim oranı ve payload büyümesi raporlanmış.
- Ürün kararı için eşik değerleri yazılmış.

## Aşama 8 - Results UI Ölçekleme

Amaç: 150-190 parti kataloglanınca sonuç ekranının bozulmaması.

İşler:
- Sonuçlarda ilk 5 varsayılan görünür.
- İlk 10 genişletilebilir.
- Tüm katalog arama/filtre ile ayrı ekranda gösterilir.
- `top2_margin` ve `top3_band` ayrı hesaplanır.
- `ranked[Math.min(2, ranked.length - 1)]` yakın sonuç kontrolü düzeltilir.

Kabul kriterleri:
- İlk render edilen parti kartı sayısı en fazla 10.
- Mobil sonuç ekranı taşma yapmıyor.
- Yakın sonuç mesajı birinci-ikinci farkını kullanıyor.
- Katalogdaki araştırılmamış partiler sonuç sıralamasına karışmıyor.

## Aşama 9 - Aktivasyon

Feature flag sırası:
- `PARTY_CATALOG_V2_ENABLED`
- `PARTY_MATCH_STATUS_FILTER_ENABLED`
- `PARTY_POSITION_SET_V2_ENABLED`
- `RESULT_PAYLOAD_COMPACT_ENABLED`

Yayın sırası:
1. Local doğrulama
2. Staging DB import
3. Gölge hesaplama raporu
4. İç ekip kullanımı
5. Yüzde 5 trafik
6. Yüzde 25 trafik
7. Yüzde 100 trafik

Geri dönüş:
- Hatalı katalog batch'i pasifleştirilir.
- Yeni eşleştirme seti kapatılır.
- Eski snapshot'lar aynen korunur.
- Yeni pozisyon seti `withdrawn`, önceki set `active` yapılır.

## Test Matrisi

Migration:
- Mevcut partiler kaybolmuyor.
- Aynı kısa ad birden fazla partide kullanılabiliyor.
- `registry_external_id` benzersiz kalıyor.
- Eski uygulama additive migration sonrası çalışıyor.

Scoring:
- Yeni parti eklemek mevcut partinin mutlak skorunu değiştirmiyor.
- Yeni parti top-1 sırasını değiştirebiliyor.
- `catalog_only` parti eşleştirmeye girmiyor.
- `eligible` filtresi feature flag ile açılıp kapanıyor.

Data Quality:
- Her `eligible` parti coverage kontrolünden geçiyor.
- Kanıtsız pozisyon raporu boş.
- Random seed kalmıyor.

UI:
- Results ilk render en fazla 10 kart.
- Aynı kısa adlı partiler tam adla ayrılıyor.
- Katalog arama ve filtre mobilde çalışıyor.

Performans:
- Active party + positions query p95 <= 25 ms.
- Complete API p95 artışı <= 50 ms.
- Snapshot payload gzip öncesi <= 250 KB.
- Snapshot payload gzip sonrası <= 75 KB.

## İlk Uygulanacak PR Sırası

1. `012_party_registry_v2.sql` additive migration.
2. `scripts/seed.js` random position üretimini kaldırma.
3. Scoring engine'e feature flag'li `match_status = eligible` filtresi.
4. Party registry import dry-run ve validation scriptleri.
5. YSP/DEM/HDP alias ve relation migration'ı.
6. Results yakınlık metriği düzeltmesi.
7. Results UI top-K ve katalog ayrımı.
8. Pozisyon setleri ve kanıt modeli.

Bu sıra özellikle ilk üç kritik sorunu önce çözer: rastgele pozisyonlar, kısa ad benzersizliği ve eşleştirme uygunluğu ayrımı.
