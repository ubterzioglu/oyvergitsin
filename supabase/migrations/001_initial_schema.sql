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
