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
