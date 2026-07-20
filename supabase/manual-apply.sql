-- Oyvergitsin manual SQL bundle
-- Generated at: 2026-07-20T13:03:32.441Z
-- Apply in Supabase SQL Editor if `supabase db push` is not available.

-- >>> 001_initial_schema.sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);

-- Consent texts table
CREATE TABLE IF NOT EXISTS consent_texts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version INTEGER UNIQUE NOT NULL,
  text TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Axis models table
CREATE TABLE IF NOT EXISTS axis_models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  version VARCHAR(20) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Axes table
CREATE TABLE IF NOT EXISTS axes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  axis_model_id UUID NOT NULL REFERENCES axis_models(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Parties table
CREATE TABLE IF NOT EXISTS parties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  short_name VARCHAR(50) UNIQUE NOT NULL,
  color VARCHAR(7) NOT NULL,
  logo_url TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Party positions table
CREATE TABLE IF NOT EXISTS party_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  axis_id UUID NOT NULL REFERENCES axes(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= -100 AND score <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(party_id, axis_id)
);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  description TEXT,
  required BOOLEAN DEFAULT true,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Question options table
CREATE TABLE IF NOT EXISTS question_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  value TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scoring rules table
CREATE TABLE IF NOT EXISTS scoring_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  answer_value TEXT NOT NULL,
  axis_id UUID NOT NULL REFERENCES axes(id) ON DELETE CASCADE,
  score_modifier INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_hash VARCHAR(64) NOT NULL,
  device_hash VARCHAR(64) NOT NULL,
  consent_version INTEGER NOT NULL,
  is_guest BOOLEAN DEFAULT true,
  risk_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Answers table
CREATE TABLE IF NOT EXISTS answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  answer_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, question_id)
);

-- Result snapshots table
CREATE TABLE IF NOT EXISTS result_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  axis_scores JSONB NOT NULL,
  party_similarities JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Behavior events table
CREATE TABLE IF NOT EXISTS behavior_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_completed_at ON sessions(completed_at);
CREATE INDEX IF NOT EXISTS idx_answers_session_id ON answers(session_id);
CREATE INDEX IF NOT EXISTS idx_answers_question_id ON answers(question_id);
CREATE INDEX IF NOT EXISTS idx_scoring_rules_question_id ON scoring_rules(question_id);
CREATE INDEX IF NOT EXISTS idx_party_positions_party_id ON party_positions(party_id);
CREATE INDEX IF NOT EXISTS idx_party_positions_axis_id ON party_positions(axis_id);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(type);
CREATE INDEX IF NOT EXISTS idx_questions_order ON questions(order_index);
CREATE INDEX IF NOT EXISTS idx_behavior_events_session_id ON behavior_events(session_id);
CREATE INDEX IF NOT EXISTS idx_behavior_events_timestamp ON behavior_events(timestamp);

-- Enable Row Level Security
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_texts ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE axes ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoring_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE result_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavior_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Public read access for certain tables
CREATE POLICY "Public read for parties" ON parties FOR SELECT USING (true);
CREATE POLICY "Public read for party positions" ON party_positions FOR SELECT USING (true);
CREATE POLICY "Public read for consent texts" ON consent_texts FOR SELECT USING (true);
CREATE POLICY "Public read for axes" ON axes FOR SELECT USING (true);
CREATE POLICY "Public read for questions" ON questions FOR SELECT USING (true);
CREATE POLICY "Public read for question options" ON question_options FOR SELECT USING (true);

-- Session and answer policies (create only)
CREATE POLICY "Create session" ON sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Create answer" ON answers FOR INSERT WITH CHECK (true);

-- Admin only policies for system tables
-- These will need to be updated with proper admin role checks
CREATE POLICY "Admin only modify roles" ON roles FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role_id = (SELECT id FROM roles WHERE name = 'admin')
  )
);

CREATE POLICY "Admin only modify consent texts" ON consent_texts FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role_id = (SELECT id FROM roles WHERE name = 'admin')
  )
);

CREATE POLICY "Admin only modify axis models" ON axis_models FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role_id = (SELECT id FROM roles WHERE name = 'admin')
  )
);

CREATE POLICY "Admin only modify axes" ON axes FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role_id = (SELECT id FROM roles WHERE name = 'admin')
  )
);

CREATE POLICY "Admin only modify parties" ON parties FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role_id = (SELECT id FROM roles WHERE name = 'admin')
  )
);

CREATE POLICY "Admin only modify party positions" ON party_positions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role_id = (SELECT id FROM roles WHERE name = 'admin')
  )
);

CREATE POLICY "Admin only modify questions" ON questions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role_id = (SELECT id FROM roles WHERE name = 'admin')
  )
);

CREATE POLICY "Admin only modify question options" ON question_options FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role_id = (SELECT id FROM roles WHERE name = 'admin')
  )
);

CREATE POLICY "Admin only modify scoring rules" ON scoring_rules FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role_id = (SELECT id FROM roles WHERE name = 'admin')
  )
);

CREATE POLICY "Admin read sessions" ON sessions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role_id = (SELECT id FROM roles WHERE name = 'admin')
  )
);

CREATE POLICY "Admin read answers" ON answers FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role_id = (SELECT id FROM roles WHERE name = 'admin')
  )
);

CREATE POLICY "Admin read result snapshots" ON result_snapshots FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role_id = (SELECT id FROM roles WHERE name = 'admin')
  )
);

CREATE POLICY "Admin read behavior events" ON behavior_events FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role_id = (SELECT id FROM roles WHERE name = 'admin')
  )
);

-- User can read their own sessions, answers, results
CREATE POLICY "User read own sessions" ON sessions FOR SELECT USING (
  user_id = auth.uid()
);

CREATE POLICY "User read own answers" ON answers FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.id = answers.session_id
    AND sessions.user_id = auth.uid()
  )
);

CREATE POLICY "User read own result snapshots" ON result_snapshots FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.id = result_snapshots.session_id
    AND sessions.user_id = auth.uid()
  )
);

-- >>> 002_public_survey_policies.sql
-- Allow the anonymous survey flow to run without requiring a service-role key.
-- Session IDs are random UUIDs, so public access remains scoped to rows that the client already knows.

DROP POLICY IF EXISTS "Public read for scoring rules" ON scoring_rules;
CREATE POLICY "Public read for scoring rules"
  ON scoring_rules
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public read answers" ON answers;
CREATE POLICY "Public read answers"
  ON answers
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public update sessions" ON sessions;
CREATE POLICY "Public update sessions"
  ON sessions
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public read result snapshots" ON result_snapshots;
CREATE POLICY "Public read result snapshots"
  ON result_snapshots
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public create result snapshots" ON result_snapshots;
CREATE POLICY "Public create result snapshots"
  ON result_snapshots
  FOR INSERT
  WITH CHECK (true);

-- >>> 003_public_session_select.sql
-- The anonymous survey flow inserts a session row and then reads back its own id
-- (see app/api/sessions/route.ts: `.insert(...).select('id').single()`).
-- With only the anon key, RLS blocked that SELECT (no public read policy existed
-- for sessions, and "User read own sessions" requires auth.uid() = user_id, which
-- guest sessions never satisfy since user_id is NULL). PostgREST then returned zero
-- rows and .single() threw, surfacing as "Failed to create session" (500) in the UI.
-- Session ids are random UUIDs, so scoping public SELECT to them is safe.
DROP POLICY IF EXISTS "Public read own session by id" ON sessions;
CREATE POLICY "Public read own session by id"
  ON sessions
  FOR SELECT
  USING (true);

-- >>> 004_fix_roles_rls_recursion.sql
-- Every "Admin only ..." / "Admin read ..." policy re-checks admin status via:
--   EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid()
--           AND user_roles.role_id = (SELECT id FROM roles WHERE name = 'admin'))
-- Because "Admin only modify roles" is FOR ALL on `roles` itself, that subquery's own
-- `SELECT id FROM roles` re-triggers the roles RLS check, which re-runs the same
-- subquery, recursing until Postgres raises "infinite recursion detected in policy
-- for relation roles" (42P17). This surfaced when a plain anon SELECT against
-- `sessions` had multiple permissive SELECT policies (Admin read sessions ORed with
-- the public ones added in 002/003) and Postgres evaluated the admin branch too.
--
-- Fix: move the admin check into a SECURITY DEFINER function. Definer functions run
-- with the privileges of their owner and bypass RLS on the tables they query, so the
-- lookup no longer re-enters `roles`' own policies.
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles
    JOIN roles ON roles.id = user_roles.role_id
    WHERE user_roles.user_id = auth.uid()
      AND roles.name = 'admin'
  );
$$;

DROP POLICY IF EXISTS "Admin only modify roles" ON roles;
CREATE POLICY "Admin only modify roles" ON roles FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admin only modify consent texts" ON consent_texts;
CREATE POLICY "Admin only modify consent texts" ON consent_texts FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admin only modify axis models" ON axis_models;
CREATE POLICY "Admin only modify axis models" ON axis_models FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admin only modify axes" ON axes;
CREATE POLICY "Admin only modify axes" ON axes FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admin only modify parties" ON parties;
CREATE POLICY "Admin only modify parties" ON parties FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admin only modify party positions" ON party_positions;
CREATE POLICY "Admin only modify party positions" ON party_positions FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admin only modify questions" ON questions;
CREATE POLICY "Admin only modify questions" ON questions FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admin only modify question options" ON question_options;
CREATE POLICY "Admin only modify question options" ON question_options FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admin only modify scoring rules" ON scoring_rules;
CREATE POLICY "Admin only modify scoring rules" ON scoring_rules FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admin read sessions" ON sessions;
CREATE POLICY "Admin read sessions" ON sessions FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "Admin read answers" ON answers;
CREATE POLICY "Admin read answers" ON answers FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "Admin read result snapshots" ON result_snapshots;
CREATE POLICY "Admin read result snapshots" ON result_snapshots FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "Admin read behavior events" ON behavior_events;
CREATE POLICY "Admin read behavior events" ON behavior_events FOR SELECT USING (is_admin());

-- >>> 005_session_ownership_token.sql
-- Sessions were previously protected only by UUID knowledge: the "Public update
-- sessions" policy allowed anyone to UPDATE any session row (USING (true)/WITH CHECK
-- (true)), and "answers"/"result_snapshots"/"sessions" SELECT policies were similarly
-- USING (true). Anyone who obtained a sessionId (e.g. from a shared results URL)
-- could read another respondent's answers/results or rewrite their session fields.
--
-- Fix: sessions now carry a token_hash (SHA-256 of a random token minted at creation
-- time and returned to the client only once, via an httpOnly cookie — see
-- lib/session-token.ts). Ownership-sensitive operations are enforced primarily in the
-- API route layer (route handlers can read the httpOnly cookie; Postgres RLS cannot).
-- These RLS changes are defense-in-depth: they remove the blanket USING (true)/WITH
-- CHECK (true) grants so that direct anon-key access (bypassing the API routes) can no
-- longer read or write session-scoped data purely by guessing/knowing a UUID.
--
-- token_hash is nullable to avoid breaking any pre-existing rows from before this
-- migration; such rows simply become permanently un-updatable via the public policy
-- (they have no token to prove ownership with), which is the correct fail-closed
-- behavior for legacy rows with no known owner.

ALTER TABLE sessions ADD COLUMN IF NOT EXISTS token_hash VARCHAR(64);

-- Public UPDATE on sessions is no longer needed: the API route layer performs
-- session completion/updates using the service-role client after verifying the
-- session-token cookie server-side. Remove the blanket public UPDATE policy.
DROP POLICY IF EXISTS "Public update sessions" ON sessions;

-- Public SELECT on sessions/answers/result_snapshots is no longer needed for the
-- normal flow either (API routes use the service-role client). Remove the blanket
-- public SELECT policies added in 002/003; "User read own sessions" (auth.uid()-based)
-- and "Admin read sessions" continue to cover the authenticated/admin cases.
DROP POLICY IF EXISTS "Public read own session by id" ON sessions;
DROP POLICY IF EXISTS "Public read answers" ON answers;
DROP POLICY IF EXISTS "Public read result snapshots" ON result_snapshots;

-- Keep "Create session" / "Create answer" / "Public create result snapshots" INSERT
-- policies as-is: the anonymous survey flow still needs to INSERT via the anon key
-- as a fallback when SUPABASE_SERVICE_KEY isn't configured (see lib/supabase/route.ts
-- getRouteClient()/getPublicServerClient()), and INSERT-only access cannot be used to
-- read or tamper with another respondent's existing data.

-- >>> 006_radar_news_pipeline.sql
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

