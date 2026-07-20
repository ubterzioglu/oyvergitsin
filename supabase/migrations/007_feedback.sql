CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Create feedback" ON feedback FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin read feedback" ON feedback FOR SELECT USING (is_admin());

CREATE POLICY "Admin update feedback" ON feedback FOR UPDATE USING (is_admin());
