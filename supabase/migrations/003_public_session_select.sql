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
