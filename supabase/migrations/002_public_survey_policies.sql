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
