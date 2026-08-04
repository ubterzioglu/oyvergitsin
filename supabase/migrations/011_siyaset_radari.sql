-- Siyaset Radari MVP
-- Public-interest political/journalism data with admin review before publication.
-- Sensitive person-linked records are visible publicly only after approval.

BEGIN;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TABLE IF NOT EXISTS public_people (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug              TEXT NOT NULL UNIQUE,
  full_name         TEXT NOT NULL,
  primary_role      VARCHAR(30) NOT NULL CHECK (primary_role IN ('politician', 'journalist', 'both')),
  province          TEXT,
  electoral_district TEXT,
  bio               TEXT,
  x_handle          TEXT,
  review_status     VARCHAR(20) NOT NULL DEFAULT 'pending'
                      CHECK (review_status IN ('pending', 'approved', 'rejected', 'archived')),
  visibility        VARCHAR(20) NOT NULL DEFAULT 'private'
                      CHECK (visibility IN ('private', 'public')),
  last_verified_at  TIMESTAMP WITH TIME ZONE,
  reviewed_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at       TIMESTAMP WITH TIME ZONE,
  review_note       TEXT,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_public_people_updated_at ON public_people;
CREATE TRIGGER trg_public_people_updated_at
  BEFORE UPDATE ON public_people
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_public_people_public
  ON public_people (visibility, review_status, primary_role, province);
CREATE INDEX IF NOT EXISTS idx_public_people_name
  ON public_people USING gin (to_tsvector('simple', full_name));

CREATE TABLE IF NOT EXISTS political_affiliation_events (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id           UUID NOT NULL REFERENCES public_people(id) ON DELETE CASCADE,
  event_type          VARCHAR(30) NOT NULL
                        CHECK (event_type IN ('elected', 'party_join', 'party_leave', 'party_switch', 'independent', 'party_rename', 'other')),
  from_party_name     TEXT,
  to_party_name       TEXT,
  province            TEXT,
  electoral_district  TEXT,
  happened_on         DATE,
  summary             TEXT,
  source_name         TEXT NOT NULL,
  source_url          TEXT NOT NULL,
  source_confidence   VARCHAR(20) NOT NULL DEFAULT 'standard'
                        CHECK (source_confidence IN ('official', 'high', 'standard', 'low')),
  review_status       VARCHAR(20) NOT NULL DEFAULT 'pending'
                        CHECK (review_status IN ('pending', 'approved', 'rejected', 'archived')),
  visibility          VARCHAR(20) NOT NULL DEFAULT 'private'
                        CHECK (visibility IN ('private', 'public')),
  last_verified_at    TIMESTAMP WITH TIME ZONE,
  reviewed_by         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at         TIMESTAMP WITH TIME ZONE,
  review_note         TEXT,
  raw_payload         JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_political_affiliation_events_updated_at ON political_affiliation_events;
CREATE TRIGGER trg_political_affiliation_events_updated_at
  BEFORE UPDATE ON political_affiliation_events
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_political_events_public
  ON political_affiliation_events (visibility, review_status, event_type, happened_on DESC);
CREATE INDEX IF NOT EXISTS idx_political_events_person
  ON political_affiliation_events (person_id, happened_on DESC);
CREATE INDEX IF NOT EXISTS idx_political_events_province
  ON political_affiliation_events (province);

CREATE TABLE IF NOT EXISTS journalist_status_events (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id           UUID NOT NULL REFERENCES public_people(id) ON DELETE CASCADE,
  outlet              TEXT,
  job_title           TEXT,
  status              VARCHAR(30) NOT NULL
                        CHECK (status IN ('detained', 'imprisoned', 'convicted', 'released', 'unknown')),
  status_label        TEXT NOT NULL,
  started_on          DATE,
  ended_on            DATE,
  summary             TEXT,
  source_name         TEXT NOT NULL,
  source_url          TEXT NOT NULL,
  source_confidence   VARCHAR(20) NOT NULL DEFAULT 'standard'
                        CHECK (source_confidence IN ('official', 'high', 'standard', 'low')),
  review_status       VARCHAR(20) NOT NULL DEFAULT 'pending'
                        CHECK (review_status IN ('pending', 'approved', 'rejected', 'archived')),
  visibility          VARCHAR(20) NOT NULL DEFAULT 'private'
                        CHECK (visibility IN ('private', 'public')),
  last_verified_at    TIMESTAMP WITH TIME ZONE,
  reviewed_by         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at         TIMESTAMP WITH TIME ZONE,
  review_note         TEXT,
  raw_payload         JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_journalist_status_events_updated_at ON journalist_status_events;
CREATE TRIGGER trg_journalist_status_events_updated_at
  BEFORE UPDATE ON journalist_status_events
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_journalist_events_public
  ON journalist_status_events (visibility, review_status, status, last_verified_at DESC);
CREATE INDEX IF NOT EXISTS idx_journalist_events_person
  ON journalist_status_events (person_id, last_verified_at DESC);

CREATE TABLE IF NOT EXISTS public_data_evidence (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id             UUID REFERENCES public_people(id) ON DELETE CASCADE,
  political_event_id    UUID REFERENCES political_affiliation_events(id) ON DELETE CASCADE,
  journalist_event_id   UUID REFERENCES journalist_status_events(id) ON DELETE CASCADE,
  subject_type          VARCHAR(30) NOT NULL CHECK (subject_type IN ('person', 'political_event', 'journalist_event', 'election_result')),
  source_type           VARCHAR(30) NOT NULL CHECK (source_type IN ('official', 'ngo', 'news', 'archive', 'manual')),
  source_name           TEXT NOT NULL,
  source_url            TEXT NOT NULL,
  title                 TEXT,
  excerpt               TEXT,
  published_at          TIMESTAMP WITH TIME ZONE,
  captured_at           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  source_confidence     VARCHAR(20) NOT NULL DEFAULT 'standard'
                          CHECK (source_confidence IN ('official', 'high', 'standard', 'low')),
  review_status         VARCHAR(20) NOT NULL DEFAULT 'pending'
                          CHECK (review_status IN ('pending', 'approved', 'rejected', 'archived')),
  visibility            VARCHAR(20) NOT NULL DEFAULT 'private'
                          CHECK (visibility IN ('private', 'public')),
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (
    person_id IS NOT NULL
    OR political_event_id IS NOT NULL
    OR journalist_event_id IS NOT NULL
    OR subject_type = 'election_result'
  )
);

DROP TRIGGER IF EXISTS trg_public_data_evidence_updated_at ON public_data_evidence;
CREATE TRIGGER trg_public_data_evidence_updated_at
  BEFORE UPDATE ON public_data_evidence
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_public_data_evidence_public
  ON public_data_evidence (visibility, review_status, subject_type);
CREATE INDEX IF NOT EXISTS idx_public_data_evidence_person
  ON public_data_evidence (person_id);

CREATE TABLE IF NOT EXISTS public_data_review_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_table   TEXT NOT NULL,
  subject_id      UUID NOT NULL,
  action          VARCHAR(30) NOT NULL,
  actor_user_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  note            TEXT,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_public_data_review_logs_subject
  ON public_data_review_logs (subject_table, subject_id);

CREATE TABLE IF NOT EXISTS election_results_by_area (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  election_year       INTEGER NOT NULL,
  election_type       VARCHAR(40) NOT NULL,
  area_level          VARCHAR(30) NOT NULL CHECK (area_level IN ('country', 'province', 'district', 'electoral_district')),
  area_name           TEXT NOT NULL,
  province            TEXT,
  electoral_district  TEXT,
  party_name          TEXT NOT NULL,
  vote_count          INTEGER,
  vote_share          NUMERIC(6, 3),
  seat_count          INTEGER,
  source_name         TEXT NOT NULL,
  source_url          TEXT NOT NULL,
  source_confidence   VARCHAR(20) NOT NULL DEFAULT 'official'
                        CHECK (source_confidence IN ('official', 'high', 'standard', 'low')),
  review_status       VARCHAR(20) NOT NULL DEFAULT 'pending'
                        CHECK (review_status IN ('pending', 'approved', 'rejected', 'archived')),
  visibility          VARCHAR(20) NOT NULL DEFAULT 'private'
                        CHECK (visibility IN ('private', 'public')),
  last_verified_at    TIMESTAMP WITH TIME ZONE,
  raw_payload         JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (election_year, election_type, area_level, area_name, party_name)
);

DROP TRIGGER IF EXISTS trg_election_results_by_area_updated_at ON election_results_by_area;
CREATE TRIGGER trg_election_results_by_area_updated_at
  BEFORE UPDATE ON election_results_by_area
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_election_results_public
  ON election_results_by_area (visibility, review_status, election_year DESC, area_level, area_name);

ALTER TABLE public_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE political_affiliation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE journalist_status_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_data_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_data_review_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE election_results_by_area ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read approved people"
  ON public_people FOR SELECT USING (review_status = 'approved' AND visibility = 'public');
CREATE POLICY "Admin manage public people"
  ON public_people FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Public read approved political events"
  ON political_affiliation_events FOR SELECT USING (review_status = 'approved' AND visibility = 'public');
CREATE POLICY "Admin manage political events"
  ON political_affiliation_events FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Public read approved journalist events"
  ON journalist_status_events FOR SELECT USING (review_status = 'approved' AND visibility = 'public');
CREATE POLICY "Admin manage journalist events"
  ON journalist_status_events FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Public read approved evidence"
  ON public_data_evidence FOR SELECT USING (review_status = 'approved' AND visibility = 'public');
CREATE POLICY "Admin manage public data evidence"
  ON public_data_evidence FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Admin manage public data review logs"
  ON public_data_review_logs FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Public read approved election results"
  ON election_results_by_area FOR SELECT USING (review_status = 'approved' AND visibility = 'public');
CREATE POLICY "Admin manage election results"
  ON election_results_by_area FOR ALL USING (is_admin()) WITH CHECK (is_admin());

COMMIT;
