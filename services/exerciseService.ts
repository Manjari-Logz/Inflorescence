import { getSupabaseClient } from '@/template';

export type ExerciseType = 'running' | 'walking' | 'workout' | 'yoga' | 'cycling';

export interface ExerciseLog {
  id: string;
  user_id: string;
  type: ExerciseType;
  duration_minutes: number;
  distance_km: number;
  calories: number;
  notes?: string;
  date: string;
  created_at: string;
}

export const EXERCISE_TYPES: { key: ExerciseType; label: string; icon: string; color: string }[] = [
  { key: 'running', label: 'Running', icon: 'directions-run', color: '#FF5722' },
  { key: 'walking', label: 'Walking', icon: 'directions-walk', color: '#4CAF50' },
  { key: 'workout', label: 'Workout', icon: 'fitness-center', color: '#FF9800' },
  { key: 'yoga', label: 'Yoga', icon: 'self-improvement', color: '#AB47BC' },
  { key: 'cycling', label: 'Cycling', icon: 'directions-bike', color: '#29B6F6' },
];

export const exerciseService = {
  async fetch(userId: string) {
    const client = getSupabaseClient();
    const { data, error } = await client.from('exercise_logs').select('*').eq('user_id', userId).order('date', { ascending: false });
    return { data: data as ExerciseLog[] | null, error: error?.message ?? null };
  },

  async create(input: Omit<ExerciseLog, 'id' | 'created_at'>) {
    const client = getSupabaseClient();
    const { data, error } = await client.from('exercise_logs').insert(input).select().single();
    return { data: data as ExerciseLog | null, error: error?.message ?? null };
  },

  async update(id: string, updates: Partial<ExerciseLog>) {
    const client = getSupabaseClient();
    const { error } = await client.from('exercise_logs').update(updates).eq('id', id);
    return { error: error?.message ?? null };
  },

  async remove(id: string) {
    const client = getSupabaseClient();
    const { error } = await client.from('exercise_logs').delete().eq('id', id);
    return { error: error?.message ?? null };
  },

  getWeeklyStats(logs: ExerciseLog[]) {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recent = logs.filter(l => new Date(l.date) >= weekAgo);
    const byType: Record<string, number> = {};
    EXERCISE_TYPES.forEach(t => { byType[t.key] = 0; });
    recent.forEach(l => { byType[l.type] = (byType[l.type] ?? 0) + l.duration_minutes; });
    const totalMinutes = recent.reduce((a, l) => a + l.duration_minutes, 0);
    const totalDistance = recent.reduce((a, l) => a + Number(l.distance_km), 0);
    return { totalMinutes, totalDistance, byType, sessions: recent.length };
  },
};
