-- Radar News Pipeline
-- RSS/Atom kaynaklarindan gunluk tarama yapip haber adaylarini admin onay
-- kuyruguna dusuren sistem. Hicbir haber otomatik yayinlanmaz.
-- Referans: corteqsmvp/supabase/migrations/20260615100000_add_radar_news_pipeline.sql
-- Admin kontrolu bu projenin mevcut is_admin() SECURITY DEFINER fonksiyonuyla yapilir
-- (bkz. 004_fix_roles_rls_recursion.sql) — argumansiz, auth.uid() kullanir.

BEGIN;

-- ─────────────────────────────────────────────
-- 1. news_sources
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS news_sources (
  id                   UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                 VARCHAR(200) NOT NULL,
  source_type          VARCHAR(20) NOT NULL CHECK (source_type IN ('rss', 'atom')),
  endpoint_url         TEXT        NOT NULL,
  website_url          TEXT,
  language             VARCHAR(10),
  country              VARCHAR(10),
  category_default     VARCHAR(50),
  trust_level          VARCHAR(20) NOT NULL DEFAULT 'standard'
                         CHECK (trust_level IN ('official', 'high', 'standard', 'discovery_only')),
  is_enabled           BOOLEAN     NOT NULL DEFAULT false,
  terms_checked        BOOLEAN     NOT NULL DEFAULT false,
  terms_checked_at     TIMESTAMP WITH TIME ZONE,
  terms_notes          TEXT,
  max_items_per_scan   INTEGER     NOT NULL DEFAULT 50,
  timeout_ms           INTEGER     NOT NULL DEFAULT 12000,
  last_success_at      TIMESTAMP WITH TIME ZONE,
  last_error_at        TIMESTAMP WITH TIME ZONE,
  last_error_message   TEXT,
  created_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION set_news_sources_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_news_sources_updated_at ON news_sources;
CREATE TRIGGER trg_news_sources_updated_at
  BEFORE UPDATE ON news_sources
  FOR EACH ROW EXECUTE FUNCTION set_news_sources_updated_at();

-- ─────────────────────────────────────────────
-- 2. news_scan_runs
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS news_scan_runs (
  id                    UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  trigger_type          VARCHAR(20) NOT NULL CHECK (trigger_type IN ('cron', 'manual')),
  status                VARCHAR(20) NOT NULL CHECK (status IN ('running', 'completed', 'partial', 'failed')),
  started_at            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at          TIMESTAMP WITH TIME ZONE,
  started_by            UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  source_count          INTEGER NOT NULL DEFAULT 0,
  fetched_count         INTEGER NOT NULL DEFAULT 0,
  inserted_count        INTEGER NOT NULL DEFAULT 0,
  duplicate_count       INTEGER NOT NULL DEFAULT 0,
  filtered_count        INTEGER NOT NULL DEFAULT 0,
  failed_source_count   INTEGER NOT NULL DEFAULT 0,
  error_message         TEXT,
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_news_scan_runs_started_at ON news_scan_runs (started_at DESC);

-- ─────────────────────────────────────────────
-- 3. news_candidates
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS news_candidates (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id                 UUID NOT NULL REFERENCES news_sources(id) ON DELETE CASCADE,
  scan_run_id                UUID REFERENCES news_scan_runs(id) ON DELETE SET NULL,
  source_name                VARCHAR(200) NOT NULL,
  source_url                 TEXT,
  original_url                TEXT NOT NULL,
  canonical_url               TEXT NOT NULL,
  title                       TEXT NOT NULL,
  normalized_title            TEXT NOT NULL,
  summary                     TEXT,
  image_source_url            TEXT,
  category                    VARCHAR(50),
  language                    VARCHAR(10),
  country                     VARCHAR(10),
  published_at                 TIMESTAMP WITH TIME ZONE,
  relevance_score              INTEGER NOT NULL DEFAULT 0,
  relevance_reasons            JSONB NOT NULL DEFAULT '[]'::jsonb,
  canonical_url_hash           VARCHAR(64) NOT NULL,
  content_hash                 VARCHAR(64) NOT NULL,
  review_status                 VARCHAR(20) NOT NULL DEFAULT 'pending'
                                  CHECK (review_status IN ('pending', 'approved', 'rejected', 'duplicate', 'archived')),
  approved_news_post_id         UUID,
  duplicate_of_candidate_id     UUID REFERENCES news_candidates(id) ON DELETE SET NULL,
  reviewed_by                    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at                    TIMESTAMP WITH TIME ZONE,
  review_note                    TEXT,
  raw_payload                    JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at                     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at                     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (canonical_url_hash)
);

CREATE OR REPLACE FUNCTION set_news_candidates_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_news_candidates_updated_at ON news_candidates;
CREATE TRIGGER trg_news_candidates_updated_at
  BEFORE UPDATE ON news_candidates
  FOR EACH ROW EXECUTE FUNCTION set_news_candidates_updated_at();

CREATE INDEX IF NOT EXISTS idx_news_candidates_review_status ON news_candidates (review_status);
CREATE INDEX IF NOT EXISTS idx_news_candidates_content_hash ON news_candidates (content_hash);
CREATE INDEX IF NOT EXISTS idx_news_candidates_source_id ON news_candidates (source_id);
CREATE INDEX IF NOT EXISTS idx_news_candidates_relevance_score ON news_candidates (relevance_score DESC);

-- ─────────────────────────────────────────────
-- 4. news_review_logs
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS news_review_logs (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id   UUID NOT NULL REFERENCES news_candidates(id) ON DELETE CASCADE,
  action         VARCHAR(30) NOT NULL,
  actor_user_id  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  note           TEXT,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_news_review_logs_candidate_id ON news_review_logs (candidate_id);

-- ─────────────────────────────────────────────
-- 5. news_keywords
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS news_keywords (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  keyword      TEXT NOT NULL,
  language     VARCHAR(10) NOT NULL,
  category     VARCHAR(50),
  weight       INTEGER NOT NULL DEFAULT 0,
  is_negative  BOOLEAN NOT NULL DEFAULT false,
  is_enabled   BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION set_news_keywords_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_news_keywords_updated_at ON news_keywords;
CREATE TRIGGER trg_news_keywords_updated_at
  BEFORE UPDATE ON news_keywords
  FOR EACH ROW EXECUTE FUNCTION set_news_keywords_updated_at();

-- ─────────────────────────────────────────────
-- 6. news_posts — onaylanmis, yayina hazir haberler
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS news_posts (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title                   TEXT NOT NULL,
  summary                 TEXT,
  source_name             VARCHAR(200) NOT NULL,
  source_url              TEXT,
  original_url            TEXT NOT NULL,
  image_url               TEXT,
  category                VARCHAR(50),
  language                VARCHAR(10),
  country                 VARCHAR(10),
  published_at            TIMESTAMP WITH TIME ZONE,
  status                  VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  radar_candidate_id      UUID REFERENCES news_candidates(id) ON DELETE SET NULL,
  approved_by             UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at             TIMESTAMP WITH TIME ZONE,
  created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION set_news_posts_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_news_posts_updated_at ON news_posts;
CREATE TRIGGER trg_news_posts_updated_at
  BEFORE UPDATE ON news_posts
  FOR EACH ROW EXECUTE FUNCTION set_news_posts_updated_at();

CREATE INDEX IF NOT EXISTS idx_news_posts_status_published ON news_posts (status, published_at DESC);

ALTER TABLE news_candidates
  ADD CONSTRAINT fk_news_candidates_approved_news_post
  FOREIGN KEY (approved_news_post_id) REFERENCES news_posts(id) ON DELETE SET NULL;

-- ─────────────────────────────────────────────
-- 7. RLS
-- ─────────────────────────────────────────────
ALTER TABLE news_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_scan_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_review_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_posts ENABLE ROW LEVEL SECURITY;

-- Admin: tam erisim (sources, scan_runs, candidates, review_logs, keywords)
CREATE POLICY "Admin manage news sources" ON news_sources FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin manage news scan runs" ON news_scan_runs FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin manage news candidates" ON news_candidates FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin manage news review logs" ON news_review_logs FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin manage news keywords" ON news_keywords FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- news_posts: herkes aktif haberleri okuyabilir (anasayfa), admin tam erisim
CREATE POLICY "Public read active news posts" ON news_posts FOR SELECT USING (status = 'active');
CREATE POLICY "Admin manage news posts" ON news_posts FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ─────────────────────────────────────────────
-- 8. Seed: baslangic keyword seti
-- ─────────────────────────────────────────────
INSERT INTO news_keywords (keyword, language, category, weight, is_negative, is_enabled) VALUES
  ('Türkiye siyaset',      'tr', 'siyaset', 30, false, true),
  ('seçim',                'tr', 'siyaset', 25, false, true),
  ('parti',                'tr', 'siyaset', 15, false, true),
  ('meclis',                'tr', 'siyaset', 15, false, true),
  ('Türkish politics',     'en', 'siyaset', 30, false, true),
  ('Turkey election',      'en', 'siyaset', 25, false, true),
  ('spor magazin',          'tr', NULL,       0, true,  true),
  ('clickbait',             'en', NULL,       0, true,  true),
  ('inanamayacaksınız',     'tr', NULL,       0, true,  true)
ON CONFLICT DO NOTHING;

COMMIT;
