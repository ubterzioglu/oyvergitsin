-- Siyaset Radari scheduled feed
-- Discovery records remain private until an administrator approves them.

BEGIN;

CREATE TABLE IF NOT EXISTS radar_feed_items (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider          VARCHAR(40) NOT NULL,
  provider_item_id  TEXT,
  topic             VARCHAR(40) NOT NULL
                      CHECK (topic IN ('party_switch', 'parliament', 'press_freedom', 'election', 'general_politics')),
  title             TEXT NOT NULL,
  description       TEXT,
  source_name       TEXT NOT NULL,
  source_url        TEXT,
  article_url       TEXT NOT NULL UNIQUE,
  image_url         TEXT,
  published_at      TIMESTAMP WITH TIME ZONE,
  discovered_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  search_query      TEXT,
  source_confidence VARCHAR(20) NOT NULL DEFAULT 'standard'
                      CHECK (source_confidence IN ('official', 'high', 'standard', 'low')),
  review_status     VARCHAR(20) NOT NULL DEFAULT 'pending'
                      CHECK (review_status IN ('pending', 'approved', 'rejected', 'archived')),
  visibility        VARCHAR(20) NOT NULL DEFAULT 'private'
                      CHECK (visibility IN ('private', 'public')),
  reviewed_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at       TIMESTAMP WITH TIME ZONE,
  review_note       TEXT,
  raw_payload       JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_radar_feed_items_updated_at ON radar_feed_items;
CREATE TRIGGER trg_radar_feed_items_updated_at
  BEFORE UPDATE ON radar_feed_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_radar_feed_items_public
  ON radar_feed_items (visibility, review_status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_radar_feed_items_pending
  ON radar_feed_items (review_status, discovered_at DESC);
CREATE INDEX IF NOT EXISTS idx_radar_feed_items_topic
  ON radar_feed_items (topic, published_at DESC);

CREATE TABLE IF NOT EXISTS radar_scan_runs (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requested_source VARCHAR(30) NOT NULL,
  trigger_source   VARCHAR(20) NOT NULL
                     CHECK (trigger_source IN ('admin', 'cron')),
  status           VARCHAR(20) NOT NULL DEFAULT 'running'
                     CHECK (status IN ('running', 'completed', 'partial', 'failed')),
  started_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at     TIMESTAMP WITH TIME ZONE,
  outcomes         JSONB NOT NULL DEFAULT '[]'::jsonb,
  error_message    TEXT,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_radar_scan_runs_started
  ON radar_scan_runs (started_at DESC);

ALTER TABLE radar_feed_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE radar_scan_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read approved radar feed"
  ON radar_feed_items FOR SELECT
  USING (review_status = 'approved' AND visibility = 'public');
CREATE POLICY "Admin manage radar feed"
  ON radar_feed_items FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Admin manage radar scan runs"
  ON radar_scan_runs FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

COMMIT;
