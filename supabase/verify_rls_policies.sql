-- Verification Script: Check RLS Policies on custom_sections and custom_items
-- Run this in Supabase SQL Editor before applying any migrations

-- Check custom_sections policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies 
WHERE tablename IN ('custom_sections', 'custom_items')
ORDER BY tablename, policyname;

-- Alternative view: Get policy definitions
SELECT 
  'custom_sections' as table_name,
  string_agg(
    'Policy: ' || policyname || 
    ' | Command: ' || cmd || 
    ' | USING: ' || COALESCE(qual, 'NULL') || 
    ' | WITH CHECK: ' || COALESCE(with_check, 'NULL'),
    E'\n'
  ) as policy_details
FROM pg_policies 
WHERE tablename = 'custom_sections'
GROUP BY table_name

UNION ALL

SELECT 
  'custom_items' as table_name,
  string_agg(
    'Policy: ' || policyname || 
    ' | Command: ' || cmd || 
    ' | USING: ' || COALESCE(qual, 'NULL') || 
    ' | WITH CHECK: ' || COALESCE(with_check, 'NULL'),
    E'\n'
  ) as policy_details
FROM pg_policies 
WHERE tablename = 'custom_items'
GROUP BY table_name;
