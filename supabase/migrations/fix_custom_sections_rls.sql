-- Fix RLS policies for custom_sections and custom_items
-- This migration adds WITH CHECK clauses to enable INSERT operations

-- Drop existing policies
DROP POLICY IF EXISTS "Users manage own sections" ON custom_sections;
DROP POLICY IF EXISTS "Users manage own items" ON custom_items;

-- Recreate policies with WITH CHECK for INSERT support
CREATE POLICY "Users manage own sections" ON custom_sections 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own items" ON custom_items 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);
