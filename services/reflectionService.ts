import { getSupabaseClient } from '@/template';

export interface Reflection {
  id: string;
  user_id: string;
  prompt: string;
  content: string;
  date: string;
  created_at: string;
}

export const DAILY_PROMPTS = [
  'What are three things you are grateful for today?',
  'What did you learn today that surprised you?',
  'What challenge did you face, and how did you handle it?',
  'What would make tomorrow a great day?',
  'Who made a positive impact on you today?',
  'What is one thing you could have done better today?',
  'What progress did you make toward your goals today?',
  'What moment today made you smile?',
  'What is weighing on your mind right now?',
  'How did you take care of yourself today?',
  'What skill did you practice or improve today?',
  'What are you looking forward to this week?',
  'Describe your energy level today and why.',
  'What would your future self thank you for doing today?',
];

export const reflectionService = {
  getDailyPrompt(date = new Date()): string {
    const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
    return DAILY_PROMPTS[dayOfYear % DAILY_PROMPTS.length];
  },

  async fetch(userId: string) {
    const client = getSupabaseClient();
    const { data, error } = await client.from('reflections').select('*').eq('user_id', userId).order('date', { ascending: false });
    return { data: data as Reflection[] | null, error: error?.message ?? null };
  },

  async getToday(userId: string, date: string) {
    const client = getSupabaseClient();
    const query = client.from('reflections').select('*').eq('user_id', userId).eq('date', date);

    if (typeof (query as any).maybeSingle === 'function') {
      const { data } = await (query as any).maybeSingle();
      return data as Reflection | null;
    } else {
      const { data } = await (query as any).limit(1);
      return (data?.[0] ?? null) as Reflection | null;
    }
  },

  async create(input: Omit<Reflection, 'id' | 'created_at'>) {
    const client = getSupabaseClient();
    const { data, error } = await client.from('reflections').insert(input).select().single();
    return { data: data as Reflection | null, error: error?.message ?? null };
  },

  async update(id: string, updates: Partial<Reflection>) {
    const client = getSupabaseClient();
    const { data, error } = await client.from('reflections').update(updates).eq('id', id).select().single();
    return { data: data as Reflection | null, error: error?.message ?? null };
  },

  async remove(id: string) {
    const client = getSupabaseClient();
    const { error } = await client.from('reflections').delete().eq('id', id);
    return { error: error?.message ?? null };
  },
};
