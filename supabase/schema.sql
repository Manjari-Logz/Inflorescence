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
  difficulty TEXT DEFAULT 'Medium',
  estimated_time INTEGER DEFAULT 0,
  progress INTEGER DEFAULT 0,
  notes TEXT,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Add archived column if upgrading existing schema
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;

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

-- Exercise (extended)
CREATE TABLE IF NOT EXISTS exercise_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  duration_minutes INTEGER DEFAULT 0,
  distance_km NUMERIC(6,2) DEFAULT 0,
  weight_kg NUMERIC(5,1),
  intensity TEXT DEFAULT 'Medium',
  calories INTEGER DEFAULT 0,
  mood_before TEXT,
  mood_after TEXT,
  notes TEXT,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Money Vault
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  payment_method TEXT DEFAULT 'Cash',
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS money_vault_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cash_in_hand NUMERIC(12,2) DEFAULT 0,
  wallet_balance NUMERIC(12,2) DEFAULT 0,
  bank_balance NUMERIC(12,2) DEFAULT 0,
  savings_goal NUMERIC(12,2) DEFAULT 0,
  emergency_fund NUMERIC(12,2) DEFAULT 0,
  monthly_budget NUMERIC(12,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE money_vault_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own exercise" ON exercise_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own expenses" ON expenses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own vault settings" ON money_vault_settings FOR ALL USING (auth.uid() = user_id);

-- Books (extended)
ALTER TABLE books ADD COLUMN IF NOT EXISTS genre TEXT DEFAULT 'Other';
ALTER TABLE books ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE books ADD COLUMN IF NOT EXISTS target_date DATE;

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
CREATE POLICY "Users manage own hackathon rounds" ON hackathon_rounds FOR ALL USING (
  auth.uid() = (SELECT user_id FROM hackathons WHERE id = hackathon_rounds.hackathon_id)
);
CREATE POLICY "Users manage own study chambers" ON study_chambers FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own goals" ON goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own achievements" ON achievements FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own notifications" ON notifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own settings" ON settings FOR ALL USING (auth.uid() = user_id);

-- Badges
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  module TEXT,
  earned_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own badges" ON badges FOR ALL USING (auth.uid() = user_id);

-- Short Goals
CREATE TABLE IF NOT EXISTS short_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  due_date DATE,
  progress INTEGER DEFAULT 0,
  checklist JSONB DEFAULT '[]',
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE short_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own short goals" ON short_goals FOR ALL USING (auth.uid() = user_id);

-- Long Goals
CREATE TABLE IF NOT EXISTS long_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vision TEXT NOT NULL,
  milestones JSONB DEFAULT '[]',
  timeline TEXT,
  resources TEXT,
  notes TEXT,
  progress INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE long_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own long goals" ON long_goals FOR ALL USING (auth.uid() = user_id);

-- Dreams
CREATE TABLE IF NOT EXISTS dreams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'Life',
  notes TEXT,
  target_year INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE dreams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own dreams" ON dreams FOR ALL USING (auth.uid() = user_id);

-- Study Domains
CREATE TABLE IF NOT EXISTS study_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE study_domains ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own study domains" ON study_domains FOR ALL USING (auth.uid() = user_id);

-- Study Subjects
CREATE TABLE IF NOT EXISTS study_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID NOT NULL REFERENCES study_domains(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  study_hours NUMERIC(6,1) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE study_subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own study subjects" ON study_subjects FOR ALL USING (auth.uid() = user_id);

-- Study Resources
CREATE TABLE IF NOT EXISTS study_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES study_subjects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE study_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own study resources" ON study_resources FOR ALL USING (auth.uid() = user_id);

-- Pomodoro Sessions
CREATE TABLE IF NOT EXISTS pomodoro_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  duration_minutes INTEGER DEFAULT 25,
  type TEXT DEFAULT '25/5',
  completed BOOLEAN DEFAULT TRUE,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE pomodoro_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own pomodoro sessions" ON pomodoro_sessions FOR ALL USING (auth.uid() = user_id);

-- Mood Logs
CREATE TABLE IF NOT EXISTS mood_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mood TEXT NOT NULL,
  mood_score INTEGER DEFAULT 3,
  notes TEXT,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);
ALTER TABLE mood_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own mood logs" ON mood_logs FOR ALL USING (auth.uid() = user_id);


-- Habits
CREATE TABLE IF NOT EXISTS habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  frequency TEXT DEFAULT 'daily',
  streak INTEGER DEFAULT 0,
  last_completed DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own habits" ON habits FOR ALL USING (auth.uid() = user_id);

-- Habit Logs
CREATE TABLE IF NOT EXISTS habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(habit_id, date)
);
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own habit logs" ON habit_logs FOR ALL USING (auth.uid() = user_id);

-- Notes
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  /** Optional parent entity */
  parent_type TEXT,
  parent_id UUID,
  /** Optional tags as JSON array */
  tags JSONB,
  /** Optional color label */
  color TEXT,
  /** Pin flag */
  pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own notes" ON notes FOR ALL USING (auth.uid() = user_id);

-- Notifications update
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

-- History
CREATE TABLE IF NOT EXISTS history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_title TEXT NOT NULL,
  description TEXT,
  project_id UUID,
  project_name TEXT,
  category TEXT DEFAULT 'General',
  priority TEXT DEFAULT 'Medium',
  tags JSONB DEFAULT '[]',
  notes TEXT,
  estimated_time INTEGER DEFAULT 0,
  actual_time INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  archived BOOLEAN DEFAULT FALSE,
  completed_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_history_completed_at ON history(completed_at);
CREATE INDEX IF NOT EXISTS idx_history_task_id ON history(task_id);
CREATE INDEX IF NOT EXISTS idx_history_project_id ON history(project_id);
CREATE INDEX IF NOT EXISTS idx_history_category ON history(category);

ALTER TABLE history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own history" ON history FOR ALL USING (auth.uid() = user_id);


