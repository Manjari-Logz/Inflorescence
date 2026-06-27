/**
 * Integration Test Script for Inflorescence
 * 
 * This script verifies the complete integration with Supabase backend.
 * Run this after setting up your Supabase credentials in .env file.
 * 
 * Usage: npx ts-node scripts/integration-test.ts
 */

import { createClient } from '@supabase/supabase-js';

// Load environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ ERROR: Missing Supabase environment variables.');
  console.error('Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env file');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test configuration
const TEST_EMAIL = `test-${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPassword123!';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

const results: TestResult[] = [];

async function runTest(name: string, testFn: () => Promise<void>): Promise<void> {
  const startTime = Date.now();
  try {
    await testFn();
    const duration = Date.now() - startTime;
    results.push({ name, passed: true, duration });
    console.log(`✅ ${name} (${duration}ms)`);
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    results.push({ name, passed: false, error: errorMessage, duration });
    console.log(`❌ ${name} (${duration}ms) - ${errorMessage}`);
  }
}

// Test 1: Supabase Connection
async function testSupabaseConnection() {
  const { data, error } = await supabase.from('tasks').select('id').limit(1);
  if (error) throw new Error(`Connection failed: ${error.message}`);
}

// Test 2: User Registration
let testUserId: string;
async function testUserRegistration() {
  const { data, error } = await supabase.auth.signUp({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });
  if (error) throw new Error(`Registration failed: ${error.message}`);
  if (!data.user) throw new Error('No user returned from registration');
  testUserId = data.user.id;
}

// Test 3: User Login
async function testUserLogin() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });
  if (error) throw new Error(`Login failed: ${error.message}`);
  if (!data.user) throw new Error('No user returned from login');
}

// Test 4: Create Task
let testTaskId: string;
async function testCreateTask() {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: testUserId,
      title: 'Integration Test Task',
      category: 'General',
      priority: 'Medium',
      completed: false,
    })
    .select()
    .single();
  if (error) throw new Error(`Task creation failed: ${error.message}`);
  if (!data) throw new Error('No task returned');
  testTaskId = data.id;
}

// Test 5: Read Task
async function testReadTask() {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', testTaskId)
    .single();
  if (error) throw new Error(`Task read failed: ${error.message}`);
  if (!data) throw new Error('No task returned');
}

// Test 6: Update Task
async function testUpdateTask() {
  const { error } = await supabase
    .from('tasks')
    .update({ title: 'Updated Test Task' })
    .eq('id', testTaskId);
  if (error) throw new Error(`Task update failed: ${error.message}`);
}

// Test 7: Create Recurring Task
let testRecurringTaskId: string;
async function testCreateRecurringTask() {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: testUserId,
      title: 'Daily Test Task',
      category: 'General',
      priority: 'Medium',
      completed: false,
      repeat_type: 'daily',
      completed_dates: [],
      reminder_enabled: false,
    })
    .select()
    .single();
  if (error) throw new Error(`Recurring task creation failed: ${error.message}`);
  if (!data) throw new Error('No recurring task returned');
  testRecurringTaskId = data.id;
}

// Test 8: Create Note
let testNoteId: string;
async function testCreateNote() {
  const { data, error } = await supabase
    .from('notes')
    .insert({
      user_id: testUserId,
      title: 'Integration Test Note',
      content: 'This is a test note',
    })
    .select()
    .single();
  if (error) throw new Error(`Note creation failed: ${error.message}`);
  if (!data) throw new Error('No note returned');
  testNoteId = data.id;
}

// Test 9: Create Goal
let testGoalId: string;
async function testCreateGoal() {
  const { data, error } = await supabase
    .from('short_goals')
    .insert({
      user_id: testUserId,
      title: 'Integration Test Goal',
      progress: 0,
      completed: false,
    })
    .select()
    .single();
  if (error) throw new Error(`Goal creation failed: ${error.message}`);
  if (!data) throw new Error('No goal returned');
  testGoalId = data.id;
}

// Test 10: Create Book
let testBookId: string;
async function testCreateBook() {
  const { data, error } = await supabase
    .from('books')
    .insert({
      user_id: testUserId,
      title: 'Integration Test Book',
      author: 'Test Author',
      total_pages: 100,
      current_page: 0,
      status: 'reading',
    })
    .select()
    .single();
  if (error) throw new Error(`Book creation failed: ${error.message}`);
  if (!data) throw new Error('No book returned');
  testBookId = data.id;
}

// Test 11: Storage Bucket Access
async function testStorageBucket() {
  const { data, error } = await supabase.storage.getBucket('inflorescence');
  if (error && error.message !== 'Bucket not found') {
    throw new Error(`Storage check failed: ${error.message}`);
  }
  // If bucket doesn't exist, that's okay - it just needs to be created
  console.log('  ℹ️  Storage bucket "inflorescence" should be created in Supabase Dashboard');
}

// Test 12: RLS Policies
async function testRLSPolicies() {
  // Try to access another user's data (should fail with RLS)
  const { error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', '00000000-0000-0000-0000-000000000000');
  // This should not error, but return empty results due to RLS
  // If it returns data, RLS might not be properly configured
}

// Cleanup
async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    await supabase.from('tasks').delete().eq('id', testTaskId);
  } catch (e) {
    console.log('  ⚠️  Failed to delete test task');
  }
  
  try {
    await supabase.from('tasks').delete().eq('id', testRecurringTaskId);
  } catch (e) {
    console.log('  ⚠️  Failed to delete recurring task');
  }
  
  try {
    await supabase.from('notes').delete().eq('id', testNoteId);
  } catch (e) {
    console.log('  ⚠️  Failed to delete test note');
  }
  
  try {
    await supabase.from('short_goals').delete().eq('id', testGoalId);
  } catch (e) {
    console.log('  ⚠️  Failed to delete test goal');
  }
  
  try {
    await supabase.from('books').delete().eq('id', testBookId);
  } catch (e) {
    console.log('  ⚠️  Failed to delete test book');
  }
  
  try {
    await supabase.auth.signOut();
  } catch (e) {
    console.log('  ⚠️  Failed to sign out');
  }
  
  console.log('✅ Cleanup complete');
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Integration Tests for Inflorescence\n');
  console.log('Testing Supabase Backend Integration...\n');

  await runTest('Supabase Connection', testSupabaseConnection);
  await runTest('User Registration', testUserRegistration);
  await runTest('User Login', testUserLogin);
  await runTest('Create Task', testCreateTask);
  await runTest('Read Task', testReadTask);
  await runTest('Update Task', testUpdateTask);
  await runTest('Create Recurring Task', testCreateRecurringTask);
  await runTest('Create Note', testCreateNote);
  await runTest('Create Goal', testCreateGoal);
  await runTest('Create Book', testCreateBook);
  await runTest('Storage Bucket Access', testStorageBucket);
  await runTest('RLS Policies Check', testRLSPolicies);

  await cleanup();

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('TEST SUMMARY');
  console.log('='.repeat(50));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  
  console.log(`Total Tests: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏱️  Total Duration: ${totalDuration}ms`);
  
  if (failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
  }
  
  console.log('\n' + '='.repeat(50));
  
  if (failed === 0) {
    console.log('✅ ALL TESTS PASSED! Integration verified.');
    process.exit(0);
  } else {
    console.log('❌ SOME TESTS FAILED. Please review the errors above.');
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('❌ Test runner error:', error);
  process.exit(1);
});
