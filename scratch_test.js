const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('d:\\inflorese\\Inflorescence\\.env', 'utf8');
const lines = envFile.split('\n');
let url = '', key = '';
for (const line of lines) {
  if (line.startsWith('EXPO_PUBLIC_SUPABASE_URL=')) {
    url = line.split('=')[1].trim();
  }
  if (line.startsWith('EXPO_PUBLIC_SUPABASE_ANON_KEY=')) {
    key = line.split('=')[1].trim();
  }
}

const supabase = createClient(url, key);

async function test() {
  console.log('Testing insert into hackathons...');
  const testHackathon = {
    user_id: '00000000-0000-0000-0000-000000000000', // Use dummy uuid
    name: 'Test Hackathon',
    theme: 'AI',
    problem_statement: 'Solve AI challenges',
    organizer: 'Test Org',
    registration_link: 'http://test.com',
    start_date: '2026-06-19',
    end_date: '2026-06-25',
    mode: 'Online',
    location: 'Internet'
  };

  const { data: hData, error: hError } = await supabase.from('hackathons').insert(testHackathon).select();
  console.log('hackathons insert result:', hData);
  if (hError) {
    console.error('hackathons insert error:', hError.code, hError.message);
  }

  console.log('Testing insert into hackathon_rounds...');
  const testRound = {
    hackathon_id: '00000000-0000-0000-0000-000000000000',
    name: 'Round 1',
    deadline: '2026-06-20T12:00:00.000Z',
    requirements: 'Write a proposal',
    mode: 'Online',
    location: 'Zoom',
    status: 'Pending',
    round_number: 1,
    required_documents: 'Resume, PDF',
    submission_link: 'http://submit.com',
    venue: 'Virtual Room',
    notes: 'Be on time'
  };
  const { data: rData, error: rError } = await supabase.from('hackathon_rounds').insert(testRound).select();
  console.log('hackathon_rounds insert result:', rData);
  if (rError) {
    console.error('hackathon_rounds insert error:', rError.code, rError.message);
  }
}

test();
