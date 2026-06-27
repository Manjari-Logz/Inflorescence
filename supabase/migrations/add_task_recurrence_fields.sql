-- Add recurrence and reminder fields to tasks table
-- Run this migration in Supabase SQL Editor

-- Add recurrence fields
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS repeat_type TEXT DEFAULT 'none' CHECK (repeat_type IN ('none', 'daily'));
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_dates JSONB DEFAULT '[]';

-- Add reminder fields
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reminder_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reminder_time TEXT; -- Format: "HH:MM" in 24-hour format
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS notification_id TEXT;

-- Add index for faster queries on recurring tasks
CREATE INDEX IF NOT EXISTS idx_tasks_repeat_type ON tasks(repeat_type);
CREATE INDEX IF NOT EXISTS idx_tasks_reminder_enabled ON tasks(reminder_enabled);
