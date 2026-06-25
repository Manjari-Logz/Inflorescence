-- Migration: Create History Table and Indexes
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

DROP POLICY IF EXISTS "Users manage own history" ON history;
CREATE POLICY "Users manage own history" ON history
  FOR ALL USING (auth.uid() = user_id);
