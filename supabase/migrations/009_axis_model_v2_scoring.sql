-- Eksen modeli v2 ve metodoloji tabanlı puanlama alanları.
--
-- Bu migration tamamen additive'dir: mevcut v1 eksenleri, demo soruları ve
-- kayıtlı sonuçlar olduğu gibi kalır. v2 içeriği pasif bir axis_model olarak
-- seed edilir; devreye alma tek bir `is_active` güncellemesidir.
--
-- Kaynak metodoloji: resultdeepresearch.html (§5 puanlama, §6 parti kodlama).

-- ---------------------------------------------------------------------------
-- 1. Eksen kutup tanımları
-- ---------------------------------------------------------------------------
-- Bir eksenin -100 ve +100 uçlarının ne anlama geldiği şu ana kadar yalnızca
-- docs/ altında yazılıydı. Sonuç ekranı ve /metodoloji sayfası bunu göstereceği
-- için veriye taşınıyor.
ALTER TABLE axes ADD COLUMN IF NOT EXISTS pole_negative TEXT;
ALTER TABLE axes ADD COLUMN IF NOT EXISTS pole_positive TEXT;

-- ---------------------------------------------------------------------------
-- 2. Soruların eksen modeline bağlanması ve puanlama meta verisi
-- ---------------------------------------------------------------------------
-- axis_model_id: motor ve /api/questions yalnızca aktif modelin sorularını
--   kullanır. Demo sorular v1'e bağlı kalıp v2 devreye girince ankettten düşer.
-- code: insan tarafından okunabilir madde kimliği (ör. "ekonomi_1"). Seed'in
--   idempotent olabilmesi ve dokümanlarda maddeye atıf yapılabilmesi için.
-- is_scored: açık metin, CAPTCHA, dikkat kontrolü gibi ideolojik skora
--   girmeyen maddeler.
-- weight: madde ağırlığı w_i (§5.1).
-- max_contribution: maddenin maksimum mutlak katkısı M_i. NULL ise motor
--   scoring_rules satırlarından türetir; slider/allocation gibi kuralı olmayan
--   tiplerde zorunludur.
ALTER TABLE questions ADD COLUMN IF NOT EXISTS axis_model_id UUID REFERENCES axis_models(id);
ALTER TABLE questions ADD COLUMN IF NOT EXISTS code VARCHAR(50);
ALTER TABLE questions ADD COLUMN IF NOT EXISTS is_scored BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS weight NUMERIC(4,2) NOT NULL DEFAULT 1.0;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS max_contribution INTEGER;

-- Dikkat kontrolü maddelerinin beklenen cevabı. Skor üretmez; yalnızca
-- result_snapshots.quality_flags içine "geçti / kaldı" bilgisi yazılır.
ALTER TABLE questions ADD COLUMN IF NOT EXISTS expected_value VARCHAR(100);

-- Kod yalnızca kendi eksen modeli içinde benzersizdir; farklı sürümler aynı
-- kodu (ör. "ekonomi_1") yeniden kullanabilir.
CREATE UNIQUE INDEX IF NOT EXISTS idx_questions_model_code
  ON questions(axis_model_id, code)
  WHERE code IS NOT NULL;

ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_weight_positive;
ALTER TABLE questions ADD CONSTRAINT questions_weight_positive CHECK (weight > 0);

ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_max_contribution_positive;
ALTER TABLE questions ADD CONSTRAINT questions_max_contribution_positive
  CHECK (max_contribution IS NULL OR max_contribution > 0);

CREATE INDEX IF NOT EXISTS idx_questions_axis_model ON questions(axis_model_id);

-- Mevcut demo sorularını aktif (v1) modele bağla. Aksi halde axis_model_id
-- NULL kalır ve v2 aktifleştiğinde hangi modele ait oldukları belirsizleşir.
UPDATE questions
SET axis_model_id = (SELECT id FROM axis_models WHERE is_active = true ORDER BY created_at LIMIT 1)
WHERE axis_model_id IS NULL;

-- axes, questions ve question_options zaten herkese açık okunabilir (001).
-- Anket ekranı hangi modelin aktif olduğunu bilmeden doğru soruları çekemez,
-- bu yüzden axis_models de okunabilir olmalı. Yazma hâlâ yalnızca admin.
DROP POLICY IF EXISTS "Public read for axis models" ON axis_models;
CREATE POLICY "Public read for axis models" ON axis_models FOR SELECT USING (true);

-- ---------------------------------------------------------------------------
-- 3. Kullanıcı önem ağırlığı (lambda)
-- ---------------------------------------------------------------------------
-- Kullanıcı bir maddeyi "benim için önemli" işaretlerse, o maddenin ekseni
-- parti uzaklığı hesabında 1.0 yerine 1.5 ağırlıkla girer (§5.2).
ALTER TABLE answers ADD COLUMN IF NOT EXISTS is_important BOOLEAN NOT NULL DEFAULT false;

-- ---------------------------------------------------------------------------
-- 4. Snapshot'ların algoritma sürümüne bağlanması
-- ---------------------------------------------------------------------------
-- Eski snapshot'lar v1 algoritmasıyla (ham toplam + kırpma) üretildi ve yeniden
-- hesaplanmayacak. Sonuç sayfası hangi metodolojiyle üretildiğini bilmeli.
ALTER TABLE result_snapshots ADD COLUMN IF NOT EXISTS algorithm_version SMALLINT NOT NULL DEFAULT 1;
ALTER TABLE result_snapshots ADD COLUMN IF NOT EXISTS axis_model_id UUID REFERENCES axis_models(id);
ALTER TABLE result_snapshots ADD COLUMN IF NOT EXISTS axis_coverage JSONB;
ALTER TABLE result_snapshots ADD COLUMN IF NOT EXISTS quality_flags JSONB;

-- Sonuç sayfasının ihtiyaç duyduğu tam gövde (kapsama etiketleri, eksen
-- adları, "neden bu sonuç" karşılaştırmaları). axis_scores yalnızca id -> skor
-- eşlemesi tuttuğu için sayfa bu bilgileri ondan yeniden kuramaz; yeniden
-- HESAPLAMAK da doğru değildir, çünkü parti konumları sonradan güncellenirse
-- kullanıcının gördüğü sonuç değişir. Snapshot değişmez olmalıdır.
ALTER TABLE result_snapshots ADD COLUMN IF NOT EXISTS result_payload JSONB;

-- ---------------------------------------------------------------------------
-- 5. Parti pozisyonu kanıt kayıtları
-- ---------------------------------------------------------------------------
-- Metodoloji raporu §6, her parti-eksen konumu için tarihli kaynak, gerekçe ve
-- sürüm geçmişinin yayımlanmasını şart koşuyor. Bu tablo /metodoloji sayfasının
-- veri kaynağıdır; public read kasıtlıdır.
CREATE TABLE IF NOT EXISTS party_position_evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  party_position_id UUID NOT NULL REFERENCES party_positions(id) ON DELETE CASCADE,
  source_type VARCHAR(50) NOT NULL,
  source_title TEXT NOT NULL,
  source_url TEXT,
  source_date DATE,
  quote TEXT,
  rationale TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- source_type: kanıt hiyerarşisi (§6, "Kanıt hiyerarşisi uygula" adımı).
--   secim_beyannamesi > parti_programi > resmi_aciklama > tbmm_davranis > uzman_veri
--   turetilmis: v1 eksen skorundan kurallı dönüşümle elde edilmiş, doğrudan
--   kaynak kodlaması değil. Şeffaflık sayfasında ayrı gösterilir.
ALTER TABLE party_position_evidence DROP CONSTRAINT IF EXISTS party_position_evidence_source_type_check;
ALTER TABLE party_position_evidence ADD CONSTRAINT party_position_evidence_source_type_check
  CHECK (source_type IN (
    'secim_beyannamesi',
    'parti_programi',
    'resmi_aciklama',
    'tbmm_davranis',
    'uzman_veri',
    'turetilmis'
  ));

CREATE INDEX IF NOT EXISTS idx_party_position_evidence_position
  ON party_position_evidence(party_position_id);

ALTER TABLE party_position_evidence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read for party position evidence" ON party_position_evidence;
CREATE POLICY "Public read for party position evidence"
  ON party_position_evidence FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin only modify party position evidence" ON party_position_evidence;
CREATE POLICY "Admin only modify party position evidence"
  ON party_position_evidence FOR ALL USING (is_admin());
