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
