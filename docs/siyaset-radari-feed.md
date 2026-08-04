# Siyaset Radarı Günlük / Haftalık Feed

Bu yapı siyasi içerikleri otomatik olarak **bulur**, fakat otomatik olarak yayımlamaz. Her yeni kayıt önce `pending/private` durumunda editoryal kuyruğa girer. Yalnız admin tarafından onaylanan kayıtlar kamu sayfasında ve public API'de görünür.

## Veri akışı

1. GitHub Actions günlük veya haftalık zamanlamayla korumalı cron endpoint'ini çağırır.
2. Günlük tarama:
   - TBMM güncel sandalye dağılımını kontrol eder.
   - GNews üzerinden son 48 saatteki Türkçe/Türkiye siyasi içeriklerini bulur.
3. Haftalık tarama:
   - TBMM verisini kontrol eder.
   - TGS cezaevindeki gazeteciler kaynağını kontrol eder.
   - GNews için son 7 günü tarar.
4. Yeni haberler `radar_feed_items` tablosuna `pending/private` olarak yazılır.
5. Admin `/admin/siyaset-radari/feed` ekranında kaynağı açar ve kaydı onaylar, reddeder veya arşivler.
6. Onaylanan kayıtlar `/siyaset-radari` sayfasındaki **Güncel Akış** bölümünde ve `/api/public/siyaset-radari/feed` endpoint'inde görünür.

## Kurulum sırası

### 1. Migration

Hedef Supabase veritabanında aşağıdaki migration uygulanmalıdır:

```bash
npm run db:migrate supabase/migrations/013_siyaset_radari_feed.sql
```

Migration iki tablo ekler:

- `radar_feed_items`: bulunan ve editoryal incelemeye giren içerikler
- `radar_scan_runs`: günlük/haftalık tarama geçmişi ve sonuçları

### 2. Uygulama environment değişkenleri

Coolify/production ortamına ekleyin:

```env
CRON_SECRET=<32+ byte random hex>
GNEWS_API_KEY=<GNews API key>
GNEWS_MAX_ARTICLES=10
GNEWS_LOOKBACK_HOURS=48
```

Secret üretimi:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

`GNEWS_API_KEY` ve `CRON_SECRET` server-only değerlerdir. `NEXT_PUBLIC_` öneki kullanılmamalıdır.

### 3. GitHub Actions ayarları

Repository → Settings → Secrets and variables → Actions:

- **Secret:** `CRON_SECRET`
  - Coolify'daki `CRON_SECRET` ile tamamen aynı değer olmalıdır.
- **Variable:** `RADAR_BASE_URL`
  - Production için `https://oyvergitsin.org`
  - Tanımlanmazsa workflow bu adresi varsayılan olarak kullanır.

Workflow dosyası: `.github/workflows/siyaset-radari-feed.yml`

Zamanlama:

- Günlük: `03:17 UTC`
- Haftalık kapsamlı kontrol: Pazar `04:23 UTC`
- Actions ekranından `workflow_dispatch` ile elle de çalıştırılabilir.

## GNews sorguları

İlk sürüm üç konu kümesini tarar:

- Parti değiştirme, partiye katılma, istifa ve bağımsız milletvekili haberleri
- TBMM, milletvekili ve sandalye dağılımı haberleri
- Gazeteci tutuklama, gözaltı ve tahliye haberleri

Sorgular `lang=tr`, `country=tr`, `sortby=publishedAt` parametreleriyle çalışır. API anahtarı URL'ye eklenmez; `X-Api-Key` header'ı ile gönderilir.

## Güvenlik ve editoryal kurallar

- Otomatik tarama sonucu doğrudan kamuya yayımlanmaz.
- Haber metninin tamamı saklanmaz veya yeniden yayımlanmaz; başlık, kısa açıklama ve kaynak bağlantısı tutulur.
- Aynı `article_url` ikinci kez gelirse yeni kayıt açılmaz; metadata güncellenir ve mevcut editoryal durum korunur.
- Public RLS politikası yalnız `approved/public` kayıtları gösterir.
- Cron endpoint'i `Authorization: Bearer <CRON_SECRET>` olmadan çalışmaz.
- Tarama geçmişi admin-only `radar_scan_runs` tablosunda tutulur.

## Manuel kontrol

Admin paneli:

- `/admin/siyaset-radari/feed`
  - Sadece haber taraması
  - Günlük tarama
  - Haftalık tarama
  - Onay / ret / arşiv
  - Son tarama sonuçları

Public:

- `/siyaset-radari`
- `/api/public/siyaset-radari/feed`

## Hata kontrolü

- `GNEWS_API_KEY tanımlı olmadığı için haber taraması atlandı.`
  - Production environment değerini ve redeploy işlemini kontrol edin.
- Cron endpoint `401` döndürüyor.
  - GitHub Secret ile Coolify env değerinin aynı olduğunu kontrol edin.
- `radar_scan_runs` veya `radar_feed_items` bulunamadı.
  - Migration 013 uygulanmamıştır.
- Workflow 500 döndürüyor.
  - Admin panelindeki son tarama kayıtlarını ve uygulama loglarını inceleyin.
