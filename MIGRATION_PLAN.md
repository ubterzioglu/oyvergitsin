# Plan: Yeni Supabase DB'ye Geçiş ve Veri Migrasyonu

## Durum Özeti

**Eski DB ref:** `8068ca9136860e0c323555cbdbf2d35835f58cb8`
**Yeni DB ref:** `ytcckzqafbfshiztlqaq`
**Eski DB erişimi:** Aktif
**Auth migration:** Evet — auth kullanıcıları da taşınacak

---

## Adım 1: `.env.local` Güncelle

Eski credential'ları yeni ile değiştir:

```
NEXT_PUBLIC_SUPABASE_URL=https://ytcckzqafbfshiztlqaq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<satır 13 JWT>
SUPABASE_SERVICE_KEY=<satır 11 JWT>
```

---

## Adım 2: Yeni DB'ye Şema Uygula

```bash
npx supabase db push
```

`001_initial_schema.sql` uygulanır -> 14 tablo, indexler, RLS politikaları.

---

## Adım 3: Veri Migrasyon Script'i Yaz

`scripts/migrate-data.js` -- tek dosya, self-contained Node.js script.

### 3a. Script yapısı

```
migrate-data.js
|-- CONFIG (eski/yeni URL + service keys)
|-- Helper: fetchAll(table) -> eski DB'den tum satirlari cek
|-- Helper: insertBatch(table, rows) -> yeni DB'ye batch insert
|-- Helper: fetchAuthUsers() -> eski DB auth admin API
|-- Helper: createAuthUser(user) -> yeni DB auth admin API
|-- MIGRATION ORDER (asagida)
|-- Main: sirayla her tabloyu migrate et
```

### 3b. Migration sirasi ve detaylar

#### Faz 1: Auth Kullanicilari
```
Eski DB: GET /auth/v1/admin/users (service key ile, paginated)
-> Tum kullanicilari listele (id, email, created_at, vb.)
-> Yeni DB: POST /auth/v1/admin/users (her kullanici icin)
  - email_confirm: true
  - id: eski UUID korunacak (FK bozulmasin diye)
  - app_metadata, user_metadata da tasinacak
```

**Not:** `admin.createUser()` ile UUID belirtilebilir -- boylece ID mapping'e gerek kalmaz:

```js
const { data, error } = await newSupabase.auth.admin.createUser({
  email: user.email,
  email_confirm: true,
  id: user.id,
})
```

**Bu sayede FK reference'lar bozulmaz.**

**Sifre notu:** Eski DB'den password hash alinamaz. Kullanicilar sifre sifirlama yapmali, VEYA gecici rastgele sifre atanip mail gonderilmeli.

#### Faz 2: Icerik Tablolari (FK sirasina gore)

| # | Tablo | FK Bagimliligi | Not |
|---|---|---|---|
| 1 | `roles` | -- | Upsert ile (UNIQUE name) |
| 2 | `consent_texts` | -- | |
| 3 | `axis_models` | -- | |
| 4 | `parties` | -- | |
| 5 | `questions` | -- | |
| 6 | `axes` | axis_models | |
| 7 | `user_roles` | roles, auth.users | Faz 1 sonrasi |
| 8 | `question_options` | questions | |
| 9 | `scoring_rules` | questions, axes | |
| 10 | `party_positions` | parties, axes | |
| 11 | `sessions` | auth.users | user_id nullable |
| 12 | `answers` | sessions, questions | |
| 13 | `result_snapshots` | sessions | |
| 14 | `behavior_events` | sessions | |

#### Faz 3: SQL Dosyasi Uretimi (Opsiyonel)

Script ayni zamanda `scripts/migration-data.sql` dosyasi da uretir:

```sql
-- Oyvergitsin Veri Migrasyonu
-- Kaynak: 8068ca... (eski)
-- Hedef: ytcckzq... (yeni)

BEGIN;

INSERT INTO roles (id, name, created_at) VALUES
  ('uuid...', 'admin', '...')
ON CONFLICT (name) DO NOTHING;

-- ... diger tablolar

COMMIT;
```

### 3c. Hata Yonetimi

- Batch insert (100'er satir)
- `ON CONFLICT DO NOTHING` ile duplicate handling
- Hata durumunda log + devam et
- Sonunda ozet rapor: { tablo: { ok: N, fail: N } }

---

## Adim 4: Migration'i Calistir

```bash
node scripts/migrate-data.js
```

Output: konsol loglari + `scripts/migration-data.sql`

---

## Adim 5: Dogrulama

```bash
node scripts/verify-migration.js
```

Karsilastirma:
- Her tabloda row count (eski vs yeni)
- Ornek data spot check (parties listesi, questions count)
- Auth kullanici sayisi
- Uygulama local test: `npm run dev`

---

## Dosya Degisiklikleri

| Dosya | Islem | Aciklama |
|---|---|---|
| `.env.local` | Guncelle | Yeni credential'lar |
| `scripts/migrate-data.js` | Yeni olustur | Ana migrasyon script'i |
| `scripts/migration-data.sql` | Script output | SQL dump (referans icin) |

**Toplam dosya:** 1 duzenleme + 1 yeni dosya
