-- Migration: Add order field to custom_sections table
-- This adds an order field to preserve section ordering

-- Add the order column if it doesn't exist
ALTER TABLE custom_sections ADD COLUMN IF NOT EXISTS order INTEGER DEFAULT 0;

-- Create index on order for better performance
CREATE INDEX IF NOT EXISTS idx_custom_sections_order ON custom_sections(user_id, order);

-- Update existing sections to have sequential order values based on creation time
UPDATE custom_sections 
SET order = subquery.row_num - 1
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) as row_num
  FROM custom_sections
) subquery
WHERE custom_sections.id = subquery.id AND custom_sections.order = 0;
