-- Inflorescence Supabase Schema
-- Run in Supabase SQL Editor

-- Storage bucket (create via dashboard: inflorescence, public)

-- Books
CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT,
  total_pages INTEGER DEFAULT 0,
  current_page INTEGER DEFAULT 0,
  cover_url TEXT,
  pdf_url TEXT,
  status TEXT DEFAULT 'reading',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'General',
  priority TEXT DEFAULT 'Medium',
  deadline DATE,
  importance INTEGER DEFAULT 0,
  urgency INTEGER DEFAULT 0,
  difficulty TEXT DEFAULT 'Medium',
  estimated_time INTEGER DEFAULT 0,
  progress INTEGER DEFAULT 0,
  notes TEXT,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS task_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hackathons
CREATE TABLE IF NOT EXISTS hackathons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  theme TEXT,
  problem_statement TEXT,
  organizer TEXT,
  registration_link TEXT,
  start_date DATE,
  end_date DATE,
  online BOOLEAN DEFAULT TRUE,
  team_members TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hackathon_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hackathon_id UUID NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  deadline DATE,
  requirements TEXT,
  status TEXT DEFAULT 'Pending',
  mode TEXT DEFAULT 'Online',
  location TEXT,
  round_number INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Study Chambers
CREATE TABLE IF NOT EXISTS study_chambers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subject TEXT,
  description TEXT,
  status TEXT DEFAULT 'active',
  focus_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Goals
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'Short Term',
  target_date DATE,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Achievements
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  module TEXT,
  earned_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  trigger_at TIMESTAMPTZ,
  delivered BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Podcasts
CREATE TABLE IF NOT EXISTS podcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  host TEXT,
  platform TEXT DEFAULT 'youtube',
  url TEXT,
  thumbnail_url TEXT,
  duration_minutes INTEGER DEFAULT 0,
  playlist_order INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Placement
CREATE TABLE IF NOT EXISTS placement_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT,
  package_amount TEXT,
  resume_url TEXT,
  stage TEXT DEFAULT 'applied',
  notes TEXT,
  deadline DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Custom Sections
CREATE TABLE IF NOT EXISTS custom_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#29B6F6',
  icon TEXT DEFAULT 'folder',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS custom_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES custom_sections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  requirements TEXT,
  deadline DATE,
  attachment_url TEXT,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exercise
CREATE TABLE IF NOT EXISTS exercise_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  duration_minutes INTEGER DEFAULT 0,
  distance_km NUMERIC(6,2) DEFAULT 0,
  calories INTEGER DEFAULT 0,
  notes TEXT,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reflections
CREATE TABLE IF NOT EXISTS reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  content TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Push tokens
CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, token)
);

-- RLS policies (enable RLS on all tables)
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE podcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE placement_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE hackathons ENABLE ROW LEVEL SECURITY;
ALTER TABLE hackathon_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_chambers ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own books" ON books FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own podcasts" ON podcasts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own placement" ON placement_companies FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own sections" ON custom_sections FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own items" ON custom_items FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own exercise" ON exercise_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own reflections" ON reflections FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own tokens" ON push_tokens FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own tasks" ON tasks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own task progress" ON task_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own hackathons" ON hackathons FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own hackathon rounds" ON hackathon_rounds FOR ALL USING (auth.uid() = auth.uid());
CREATE POLICY "Users manage own study chambers" ON study_chambers FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own goals" ON goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own achievements" ON achievements FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own notifications" ON notifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own settings" ON settings FOR ALL USING (auth.uid() = user_id);
