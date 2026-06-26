-- Verification Script: Custom Sections Debugging
-- Run this in Supabase SQL Editor to diagnose the issue

-- 1. Check if tables exist
SELECT 
    'custom_sections' as table_name,
    EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'custom_sections') as exists
UNION ALL
SELECT 
    'custom_items' as table_name,
    EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'custom_items') as exists;

-- 2. Check table structure for custom_sections
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'custom_sections'
ORDER BY ordinal_position;

-- 3. Check if order column exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'custom_sections' AND column_name = 'order') 
        THEN 'order column EXISTS'
        ELSE 'order column MISSING - run migration add_order_to_custom_sections.sql'
    END as order_status;

-- 4. Check RLS policies on custom_sections
SELECT 
    policyname,
    cmd,
    qual AS using_expression,
    with_check AS with_check_expression
FROM pg_policies 
WHERE tablename = 'custom_sections';

-- 5. Check RLS policies on custom_items
SELECT 
    policyname,
    cmd,
    qual AS using_expression,
    with_check AS with_check_expression
FROM pg_policies 
WHERE tablename = 'custom_items';

-- 6. Check if RLS is enabled
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('custom_sections', 'custom_items');

-- 7. Test direct insert (replace USER_ID with actual UUID from auth.users)
-- Uncomment and replace USER_ID to test:
-- INSERT INTO custom_sections (user_id, name, color, icon, "order")
-- VALUES ('USER_ID', 'Test Section', '#FF0000', 'folder', 0)
-- RETURNING *;

-- 8. Check for any triggers on custom_sections
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'custom_sections';
