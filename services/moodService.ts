import supabase from '@/lib/supabase';

export interface MoodEntry {
  id: string;
  user_id: string;
  mood: string;
  mood_score: number;
  date: string;
  notes?: string;
  created_at: string;
}

export const MOOD_OPTIONS = [
  { label: 'Happy', emoji: '😀', score: 5 },
  { label: 'Good', emoji: '😊', score: 4 },
  { label: 'Neutral', emoji: '😐', score: 3 },
  { label: 'Sad', emoji: '😔', score: 2 },
  { label: 'Very Sad', emoji: '😭', score: 1 },
];

export const MOTIVATIONAL_QUOTES = [
  { quote: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
  { quote: 'Believe you can and you are halfway there.', author: 'Theodore Roosevelt' },
  { quote: 'It does not matter how slowly you go as long as you do not stop.', author: 'Confucius' },
  { quote: 'Success is not final, failure is not fatal: it is the courage to continue that counts.', author: 'Winston Churchill' },
  { quote: 'The future belongs to those who believe in the beauty of their dreams.', author: 'Eleanor Roosevelt' },
  { quote: 'Do not watch the clock; do what it does. Keep going.', author: 'Sam Levenson' },
  { quote: 'Everything you have ever wanted is on the other side of fear.', author: 'George Addair' },
  { quote: 'Success usually comes to those who are too busy to be looking for it.', author: 'Henry David Thoreau' },
  { quote: 'Opportunities do not happen. You create them.', author: 'Chris Grosser' },
  { quote: 'When you feel like giving up, remember why you started.', author: 'Unknown' },
  { quote: 'Push yourself, because no one else is going to do it for you.', author: 'Unknown' },
  { quote: 'Great things never come from comfort zones.', author: 'Unknown' },
  { quote: 'Dream it. Wish it. Do it.', author: 'Unknown' },
  { quote: 'Your limitation is only your imagination.', author: 'Unknown' },
  { quote: 'Work hard in silence, let your success be your noise.', author: 'Frank Ocean' },
];

export const moodService = {
  async fetchTodayMood(userId: string) {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('mood_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single();
    return { data: data as MoodEntry | null };
  },

  async fetchRecentMoods(userId: string, limit = 7) {
    const { data, error } = await supabase
      .from('mood_entries')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(limit);
    return { data: data as MoodEntry[] | null, error: error?.message ?? null };
  },

  async setMood(userId: string, mood: string, score: number, notes?: string) {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('mood_entries')
      .upsert({ user_id: userId, mood, mood_score: score, date: today, notes }, { onConflict: 'user_id,date' })
      .select()
      .single();
    return { data: data as MoodEntry | null, error: error?.message ?? null };
  },

  getRandomQuote() {
    return MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
  },
};
