// 1. Intercept require to mock react-native AsyncStorage
const Module = require('module');
const originalRequire = Module.prototype.require;
const storage: Record<string, string> = {};
Module.prototype.require = function (id: string) {
  if (id === '@react-native-async-storage/async-storage') {
    return {
      default: {
        getItem: async (key: string) => storage[key] || null,
        setItem: async (key: string, val: string) => {
          storage[key] = val;
        },
        removeItem: async (key: string) => {
          delete storage[key];
        },
      }
    };
  }
  return originalRequire.apply(this, arguments);
};

// 2. Import the builder after mock is in place
import { OfflineQueryBuilder } from './template/core/OfflineQueryBuilder';

async function runTests() {
  console.log('--- RUNNING OFFLINE QUERY BUILDER TESTS ---');
  
  // Seed database
  const mockTasks = [
    { id: '1', user_id: 'u1', title: 'Task One', priority: 1, completed: false, tags: ['work', 'urgent'] },
    { id: '2', user_id: 'u1', title: 'Task Two', priority: 2, completed: true, tags: ['personal'] },
    { id: '3', user_id: 'u2', title: 'Task Three', priority: 3, completed: false, tags: ['work'] },
    { id: '4', user_id: 'u2', title: 'Task Four', priority: 4, completed: true, tags: ['urgent'] },
  ];
  storage['@offline_db_tasks'] = JSON.stringify(mockTasks);

  // Test 1: Basic Select and Equality (eq)
  const select1 = new OfflineQueryBuilder('tasks');
  const res1 = await select1.select('*').eq('user_id', 'u1');
  console.log('Test 1 (eq user_id=u1) count:', res1.data.length);
  if (res1.data.length !== 2) throw new Error('Test 1 failed');

  // Test 2: Inequality (neq)
  const select2 = new OfflineQueryBuilder('tasks');
  const res2 = await select2.select('*').neq('user_id', 'u1');
  console.log('Test 2 (neq user_id=u1) count:', res2.data.length);
  if (res2.data.length !== 2) throw new Error('Test 2 failed');

  // Test 3: Greater Than (gt) and Greater Than Equal (gte)
  const select3 = new OfflineQueryBuilder('tasks');
  const res3 = await select3.select('*').gt('priority', 2);
  console.log('Test 3 (gt priority=2) count:', res3.data.length);
  if (res3.data.length !== 2) throw new Error('Test 3 failed');

  const select4 = new OfflineQueryBuilder('tasks');
  const res4 = await select4.select('*').gte('priority', 2);
  console.log('Test 4 (gte priority=2) count:', res4.data.length);
  if (res4.data.length !== 3) throw new Error('Test 4 failed');

  // Test 5: Less Than (lt) and Less Than Equal (lte)
  const select5 = new OfflineQueryBuilder('tasks');
  const res5 = await select5.select('*').lt('priority', 3);
  console.log('Test 5 (lt priority=3) count:', res5.data.length);
  if (res5.data.length !== 2) throw new Error('Test 5 failed');

  const select6 = new OfflineQueryBuilder('tasks');
  const res6 = await select6.select('*').lte('priority', 3);
  console.log('Test 6 (lte priority=3) count:', res6.data.length);
  if (res6.data.length !== 3) throw new Error('Test 6 failed');

  // Test 7: IN operator
  const select7 = new OfflineQueryBuilder('tasks');
  const res7 = await select7.select('*').in('id', ['1', '3']);
  console.log('Test 7 (in id=[1,3]) count:', res7.data.length);
  if (res7.data.length !== 2) throw new Error('Test 7 failed');

  // Test 8: Like & ILike wildcards
  const select8 = new OfflineQueryBuilder('tasks');
  const res8 = await select8.select('*').like('title', '%One');
  console.log('Test 8 (like %One) count:', res8.data.length);
  if (res8.data.length !== 1) throw new Error('Test 8 failed');

  const select9 = new OfflineQueryBuilder('tasks');
  const res9 = await select9.select('*').ilike('title', '%one');
  console.log('Test 9 (ilike %one) count:', res9.data.length);
  if (res9.data.length !== 1) throw new Error('Test 9 failed');

  // Test 10: Array Contains
  const select10 = new OfflineQueryBuilder('tasks');
  const res10 = await select10.select('*').contains('tags', ['work']);
  console.log('Test 10 (contains work) count:', res10.data.length);
  if (res10.data.length !== 2) throw new Error('Test 10 failed');

  // Test 11: Array Overlap
  const select11 = new OfflineQueryBuilder('tasks');
  const res11 = await select11.select('*').overlap('tags', ['urgent', 'personal']);
  console.log('Test 11 (overlap urgent/personal) count:', res11.data.length);
  if (res11.data.length !== 3) throw new Error('Test 11 failed');

  // Test 12: Range (slice)
  const select12 = new OfflineQueryBuilder('tasks');
  const res12 = await select12.select('*').order('priority', { ascending: true }).range(1, 2);
  console.log('Test 12 (range 1-2) count:', res12.data.length);
  if (res12.data.length !== 2 || res12.data[0].id !== '2' || res12.data[1].id !== '3') throw new Error('Test 12 failed');

  // Test 13: Limit and Single
  const select13 = new OfflineQueryBuilder('tasks');
  const res13 = await select13.select('*').limit(2);
  console.log('Test 13 (limit 2) count:', res13.data.length);
  if (res13.data.length !== 2) throw new Error('Test 13 failed');

  const select14 = new OfflineQueryBuilder('tasks');
  const res14 = await select14.select('*').eq('id', '1').single();
  console.log('Test 14 (single) title:', res14.data.title);
  if (!res14.data || res14.data.id !== '1') throw new Error('Test 14 failed');

  const select15 = new OfflineQueryBuilder('tasks');
  const res15 = await select15.select('*').eq('id', '999').maybeSingle();
  console.log('Test 15 (maybeSingle empty) result:', res15.data);
  if (res15.data !== null) throw new Error('Test 15 failed');

  // Test 16: Insert and return select
  const insertBuilder = new OfflineQueryBuilder('tasks');
  const insertRes = await insertBuilder.insert({ title: 'Task Five', priority: 5, completed: false }).select().single();
  console.log('Test 16 (insert + select + single) inserted id:', insertRes.data.id);
  if (!insertRes.data.id || insertRes.data.title !== 'Task Five') throw new Error('Test 16 failed');

  // Test 17: Update and return select
  const updateBuilder = new OfflineQueryBuilder('tasks');
  const updateRes = await updateBuilder.update({ title: 'Task One Edited' }).eq('id', '1').select().single();
  console.log('Test 17 (update + select + single) updated title:', updateRes.data.title);
  if (updateRes.data.title !== 'Task One Edited') throw new Error('Test 17 failed');

  // Test 18: OR filters
  const select18 = new OfflineQueryBuilder('tasks');
  const res18 = await select18.select('*').or('id.eq.1,id.eq.2');
  console.log('Test 18 (or id.eq.1,id.eq.2) count:', res18.data.length);
  if (res18.data.length !== 2) throw new Error('Test 18 failed');

  // Test 19: Defensive Error Handling (Proxy check)
  console.log('Test 19: testing defensive error throwing on unsupported methods...');
  const errorBuilder: any = new OfflineQueryBuilder('tasks');
  try {
    errorBuilder.textSearch('title', 'test');
    throw new Error('Test 19 failed: did not throw error on unsupported method textSearch');
  } catch (err: any) {
    console.log('Test 19 succeeded: threw expected error:', err.message);
    if (!err.message.includes('Unsupported query builder method "textSearch"')) throw new Error('Test 19 unexpected error message');
  }

  console.log('\n>>> ALL OFFLINE BUILDER TESTS COMPLETED SUCCESSFULLY! <<<');
}

runTests().catch(err => {
  console.error('Test run failed with error:', err);
  process.exit(1);
});
