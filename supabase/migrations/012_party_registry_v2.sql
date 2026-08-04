-- Party registry v2: official catalog identity and match eligibility.
--
-- Additive migration only. Legacy columns (`name`, `short_name`, `is_active`,
-- `party_positions`) are intentionally kept so existing snapshots and code keep
-- working during the staged rollout.

BEGIN;

ALTER TABLE parties
  DROP CONSTRAINT IF EXISTS parties_short_name_key;

ALTER TABLE parties
  ALTER COLUMN short_name DROP NOT NULL;

ALTER TABLE parties
  ALTER COLUMN description DROP NOT NULL;

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
  canonical_slug = COALESCE(
    canonical_slug,
    lower(trim(both '-' from regexp_replace(coalesce(nullif(short_name, ''), id::text), '[^[:alnum:]]+', '-', 'g')))
  ),
  registry_status = CASE
    WHEN is_active = false THEN 'dissolved'
    ELSE registry_status
  END,
  match_status = CASE
    WHEN is_active = true THEN 'eligible'
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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'parties_registry_status_check'
  ) THEN
    ALTER TABLE parties
      ADD CONSTRAINT parties_registry_status_check
      CHECK (registry_status IN ('active', 'dissolved', 'closed_by_court', 'merged', 'unknown'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'parties_match_status_check'
  ) THEN
    ALTER TABLE parties
      ADD CONSTRAINT parties_match_status_check
      CHECK (match_status IN ('catalog_only', 'researching', 'eligible', 'suspended'));
  END IF;
END $$;

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

CREATE TABLE IF NOT EXISTS party_name_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  short_name TEXT,
  valid_from DATE,
  valid_to DATE,
  source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (party_id, name, valid_from)
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
  from_party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  to_party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL,
  valid_from DATE,
  valid_to DATE,
  source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
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

CREATE INDEX IF NOT EXISTS idx_party_aliases_party_id
  ON party_aliases(party_id);

CREATE INDEX IF NOT EXISTS idx_party_aliases_alias
  ON party_aliases(alias);

CREATE INDEX IF NOT EXISTS idx_party_name_history_party_id
  ON party_name_history(party_id);

CREATE INDEX IF NOT EXISTS idx_party_events_party_id
  ON party_events(party_id, event_date DESC);

CREATE INDEX IF NOT EXISTS idx_party_events_type
  ON party_events(event_type);

CREATE INDEX IF NOT EXISTS idx_party_relations_from
  ON party_relations(from_party_id);

CREATE INDEX IF NOT EXISTS idx_party_relations_to
  ON party_relations(to_party_id);

ALTER TABLE party_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_name_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_membership_observations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read party aliases"
  ON party_aliases FOR SELECT USING (true);
CREATE POLICY "Admin manage party aliases"
  ON party_aliases FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Public read party name history"
  ON party_name_history FOR SELECT USING (true);
CREATE POLICY "Admin manage party name history"
  ON party_name_history FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Public read party events"
  ON party_events FOR SELECT USING (true);
CREATE POLICY "Admin manage party events"
  ON party_events FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Public read party relations"
  ON party_relations FOR SELECT USING (true);
CREATE POLICY "Admin manage party relations"
  ON party_relations FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Public read party membership observations"
  ON party_membership_observations FOR SELECT USING (true);
CREATE POLICY "Admin manage party membership observations"
  ON party_membership_observations FOR ALL USING (is_admin()) WITH CHECK (is_admin());

COMMIT;
