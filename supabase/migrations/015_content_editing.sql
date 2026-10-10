-- 015 — Anket içeriğini admin panelinden güncelleme (Faz 1)
--
-- Parti pozisyonları artık admin panelinden kanıtıyla birlikte yayınlanıyor.
-- Yayın tek bir fonksiyonla (publish_party_position) tek transaction içinde
-- yapılır: canlı puanlama yarım kalmış bir düzenleme (yeni skor + eski kanıt)
-- görmez. Her yayın/doğrulama content_change_logs'a eski→yeni değerleriyle yazılır.
--
-- Yalnız ekleme yapar; paylaşılan (canlı) veritabanında tekrar çalıştırmak güvenlidir.
-- apply-migration.js dosyayı zaten tek transaction içinde çalıştırır.

-- 1) Pozisyonlar için "son doğrulama" tarihi --------------------------------

ALTER TABLE party_positions ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMP WITH TIME ZONE;

-- Trigger'dan ÖNCE doldurulur; yoksa bu UPDATE updated_at'i de "şimdi" yapardı.
UPDATE party_positions
SET last_verified_at = COALESCE(updated_at, created_at, now())
WHERE last_verified_at IS NULL;

ALTER TABLE party_positions ALTER COLUMN last_verified_at SET DEFAULT now();

-- updated_at bugüne kadar hiç güncellenmiyordu (trigger yoktu). Anlamı: "konum
-- (skor ya da kanıt) en son ne zaman değişti". Yalnız doğrulama (last_verified_at)
-- updated_at'e dokunmamalı; genel set_updated_at() bunu ayırt edemediği için
-- tabloya özel trigger. Kanıt değişiminde publish fonksiyonu updated_at'i açıkça set eder.
CREATE OR REPLACE FUNCTION party_positions_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.score IS DISTINCT FROM OLD.score AND NEW.updated_at IS NOT DISTINCT FROM OLD.updated_at THEN
    NEW.updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS party_positions_set_updated_at ON party_positions;
CREATE TRIGGER party_positions_set_updated_at
  BEFORE UPDATE ON party_positions
  FOR EACH ROW EXECUTE FUNCTION party_positions_touch_updated_at();

-- 2) Genel içerik değişiklik günlüğü ----------------------------------------

CREATE TABLE IF NOT EXISTS content_change_logs (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_table  VARCHAR(40) NOT NULL
                   CHECK (subject_table IN ('party_positions', 'parties', 'questions', 'question_options')),
  -- FK yok: kayıt silinse ya da eksen modeli değişse de günlük okunabilir kalmalı.
  subject_id     UUID NOT NULL,
  action         VARCHAR(20) NOT NULL
                   CHECK (action IN ('publish', 'verify', 'status_change', 'text_edit', 'seed')),
  party_id       UUID,
  axis_id        UUID,
  axis_model_id  UUID,
  party_name     TEXT,
  axis_name      TEXT,
  changes        JSONB NOT NULL DEFAULT '{}'::jsonb,
  note           TEXT,
  public_note    TEXT,
  is_public      BOOLEAN NOT NULL DEFAULT false,
  actor_user_id  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_change_logs_subject
  ON content_change_logs (subject_table, subject_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_change_logs_public
  ON content_change_logs (is_public, created_at DESC);

ALTER TABLE content_change_logs ENABLE ROW LEVEL SECURITY;

-- Herkese açık SELECT yok: actor ve iç notlar gizli kalmalı. Kamuya açık
-- değişiklik listesi public_position_changelog() üzerinden, süzülmüş döner.
DROP POLICY IF EXISTS "Admin only content change logs" ON content_change_logs;
CREATE POLICY "Admin only content change logs"
  ON content_change_logs FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- 3) Pozisyon yayınlama -----------------------------------------------------
--
-- Hata kodları (API bunlara göre HTTP durumu seçer):
--   40001 → çakışma: form açıldıktan sonra kayıt değişmiş (409)
--   22023 → geçersiz girdi (400)

CREATE OR REPLACE FUNCTION publish_party_position(
  p_party_id            UUID,
  p_axis_id             UUID,
  p_expected_updated_at TIMESTAMP WITH TIME ZONE,
  p_score               INTEGER,
  p_evidence            JSONB,
  p_note                TEXT,
  p_public_note         TEXT,
  p_is_public           BOOLEAN,
  p_actor               UUID
)
RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_position      party_positions%ROWTYPE;
  v_old_score     INTEGER;
  v_old_evidence  JSONB;
  v_new_evidence  JSONB;
  v_axis          axes%ROWTYPE;
  v_party_name    TEXT;
  v_updated_at    TIMESTAMP WITH TIME ZONE;
BEGIN
  IF p_score IS NULL OR p_score < -100 OR p_score > 100 THEN
    RAISE EXCEPTION 'Puan -100 ile 100 arasında olmalı.' USING ERRCODE = '22023';
  END IF;

  IF p_evidence IS NULL OR jsonb_typeof(p_evidence) <> 'array' OR jsonb_array_length(p_evidence) = 0 THEN
    RAISE EXCEPTION 'En az bir kanıt gerekli.' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_axis FROM axes WHERE id = p_axis_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Eksen bulunamadı.' USING ERRCODE = '22023';
  END IF;

  SELECT COALESCE(display_name, name) INTO v_party_name FROM parties WHERE id = p_party_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Parti bulunamadı.' USING ERRCODE = '22023';
  END IF;

  -- Satırı kilitle: aynı anda iki yayın birbirini ezmesin.
  SELECT * INTO v_position
  FROM party_positions
  WHERE party_id = p_party_id AND axis_id = p_axis_id
  FOR UPDATE;

  IF FOUND THEN
    IF p_expected_updated_at IS NULL OR v_position.updated_at IS DISTINCT FROM p_expected_updated_at THEN
      RAISE EXCEPTION 'Pozisyon siz düzenlerken değişti. Sayfayı yenileyin.' USING ERRCODE = '40001';
    END IF;

    v_old_score := v_position.score;
    SELECT COALESCE(jsonb_agg(to_jsonb(e) - 'id' - 'party_position_id' - 'created_at' ORDER BY e.created_at), '[]'::jsonb)
      INTO v_old_evidence
      FROM party_position_evidence e
      WHERE e.party_position_id = v_position.id;

    UPDATE party_positions
    SET score = p_score, last_verified_at = now(), updated_at = now()
    WHERE id = v_position.id
    RETURNING * INTO v_position;
  ELSE
    IF p_expected_updated_at IS NOT NULL THEN
      RAISE EXCEPTION 'Pozisyon siz düzenlerken silinmiş. Sayfayı yenileyin.' USING ERRCODE = '40001';
    END IF;

    v_old_score := NULL;
    v_old_evidence := '[]'::jsonb;

    INSERT INTO party_positions (party_id, axis_id, score, last_verified_at)
    VALUES (p_party_id, p_axis_id, p_score, now())
    RETURNING * INTO v_position;
  END IF;

  DELETE FROM party_position_evidence WHERE party_position_id = v_position.id;

  -- now() transaction boyunca sabit; tüm satırlar aynı created_at'i alırsa sıralama
  -- belirsizleşir. Dizi sırası kadar mikrosaniye eklenir: created_at sırası = girilen sıra.
  INSERT INTO party_position_evidence (
    party_position_id, source_type, source_title, source_url, source_date, quote, rationale, created_at
  )
  SELECT
    v_position.id,
    item.value ->> 'source_type',
    item.value ->> 'source_title',
    NULLIF(item.value ->> 'source_url', ''),
    NULLIF(item.value ->> 'source_date', '')::DATE,
    NULLIF(item.value ->> 'quote', ''),
    item.value ->> 'rationale',
    now() + item.ord * INTERVAL '1 microsecond'
  FROM jsonb_array_elements(p_evidence) WITH ORDINALITY AS item(value, ord);

  SELECT COALESCE(jsonb_agg(to_jsonb(e) - 'id' - 'party_position_id' - 'created_at' ORDER BY e.created_at), '[]'::jsonb)
    INTO v_new_evidence
    FROM party_position_evidence e
    WHERE e.party_position_id = v_position.id;

  INSERT INTO content_change_logs (
    subject_table, subject_id, action, party_id, axis_id, axis_model_id,
    party_name, axis_name, changes, note, public_note, is_public, actor_user_id
  ) VALUES (
    'party_positions', v_position.id, 'publish', p_party_id, p_axis_id, v_axis.axis_model_id,
    v_party_name, v_axis.name,
    jsonb_build_object(
      'score', jsonb_build_object('from', v_old_score, 'to', p_score),
      'evidence', jsonb_build_object('before', v_old_evidence, 'after', v_new_evidence)
    ),
    NULLIF(p_note, ''), NULLIF(p_public_note, ''), COALESCE(p_is_public, true), p_actor
  );

  v_updated_at := v_position.updated_at;
  RETURN v_updated_at;
END;
$$;

-- 4) "Doğrulandı, değişiklik yok" -------------------------------------------

CREATE OR REPLACE FUNCTION verify_party_position(
  p_party_position_id UUID,
  p_note              TEXT,
  p_actor             UUID
)
RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_position    party_positions%ROWTYPE;
  v_axis        axes%ROWTYPE;
  v_party_name  TEXT;
BEGIN
  UPDATE party_positions
  SET last_verified_at = now()
  WHERE id = p_party_position_id
  RETURNING * INTO v_position;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pozisyon bulunamadı.' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_axis FROM axes WHERE id = v_position.axis_id;
  SELECT COALESCE(display_name, name) INTO v_party_name FROM parties WHERE id = v_position.party_id;

  INSERT INTO content_change_logs (
    subject_table, subject_id, action, party_id, axis_id, axis_model_id,
    party_name, axis_name, changes, note, is_public, actor_user_id
  ) VALUES (
    'party_positions', v_position.id, 'verify', v_position.party_id, v_position.axis_id, v_axis.axis_model_id,
    v_party_name, v_axis.name,
    jsonb_build_object('score', jsonb_build_object('from', v_position.score, 'to', v_position.score)),
    NULLIF(p_note, ''), false, p_actor
  );

  RETURN v_position.last_verified_at;
END;
$$;

-- Yazma fonksiyonları yalnız sunucudan (service_role, requireAdmin sonrası) çağrılır.
REVOKE ALL ON FUNCTION publish_party_position(UUID, UUID, TIMESTAMP WITH TIME ZONE, INTEGER, JSONB, TEXT, TEXT, BOOLEAN, UUID)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION publish_party_position(UUID, UUID, TIMESTAMP WITH TIME ZONE, INTEGER, JSONB, TEXT, TEXT, BOOLEAN, UUID)
  TO service_role;

REVOKE ALL ON FUNCTION verify_party_position(UUID, TEXT, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION verify_party_position(UUID, TEXT, UUID) TO service_role;

-- 5) Kamuya açık değişiklik listesi -----------------------------------------
-- Görünüm yerine SECURITY DEFINER fonksiyon: yalnız güvenli alanları döner.

CREATE OR REPLACE FUNCTION public_position_changelog(p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  created_at  TIMESTAMP WITH TIME ZONE,
  party_name  TEXT,
  axis_name   TEXT,
  score_from  INTEGER,
  score_to    INTEGER,
  public_note TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    l.created_at,
    l.party_name,
    l.axis_name,
    (l.changes -> 'score' ->> 'from')::INTEGER,
    (l.changes -> 'score' ->> 'to')::INTEGER,
    l.public_note
  FROM content_change_logs l
  WHERE l.is_public AND l.action = 'publish' AND l.subject_table = 'party_positions'
  ORDER BY l.created_at DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 50), 1), 200);
$$;

REVOKE ALL ON FUNCTION public_position_changelog(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public_position_changelog(INTEGER) TO anon, authenticated, service_role;

-- 6) Sonuç izlenebilirliği --------------------------------------------------
-- Sonuç hangi tarihteki parti konumlarıyla hesaplandı.
ALTER TABLE result_snapshots ADD COLUMN IF NOT EXISTS positions_as_of TIMESTAMP WITH TIME ZONE;
