import supabase from '@/lib/supabase';

export type ExerciseType =
  | 'running' | 'walking' | 'cycling' | 'swimming'
  | 'gym' | 'yoga' | 'hiit' | 'strength' | 'sports' | 'other';

export type Intensity = 'Low' | 'Medium' | 'High';
export type Mood = 'Great' | 'Good' | 'Neutral' | 'Tired' | 'Bad';

export interface ExerciseLog {
  id: string;
  user_id: string;
  type: ExerciseType;
  duration_minutes: number;
  distance_km: number;
  weight_kg?: number;
  intensity: Intensity;
  calories: number;
  mood_before?: Mood;
  mood_after?: Mood;
  notes?: string;
  date: string;
  created_at: string;
}

export const EXERCISE_TYPES: { key: ExerciseType; label: string; color: string; metMin: number }[] = [
  { key: 'running', label: 'Running', color: '#EF4444', metMin: 9.8 },
  { key: 'walking', label: 'Walking', color: '#22C55E', metMin: 3.5 },
  { key: 'cycling', label: 'Cycling', color: '#3B82F6', metMin: 7.5 },
  { key: 'swimming', label: 'Swimming', color: '#06B6D4', metMin: 8.0 },
  { key: 'gym', label: 'Gym Workout', color: '#F59E0B', metMin: 5.5 },
  { key: 'yoga', label: 'Yoga', color: '#A855F7', metMin: 3.0 },
  { key: 'hiit', label: 'HIIT', color: '#F97316', metMin: 10.0 },
  { key: 'strength', label: 'Strength', color: '#8B5CF6', metMin: 6.0 },
  { key: 'sports', label: 'Sports', color: '#EC4899', metMin: 7.0 },
  { key: 'other', label: 'Other', color: '#64748B', metMin: 4.0 },
];

const INTENSITY_MULTIPLIER: Record<Intensity, number> = { Low: 0.8, Medium: 1.0, High: 1.3 };

/** Returns estimated calories based on MET, weight (default 70kg), intensity */
export function calcCalories(type: ExerciseType, durationMinutes: number, intensity: Intensity, weightKg = 70): number {
  const met = EXERCISE_TYPES.find(t => t.key === type)?.metMin ?? 5;
  return Math.round(met * weightKg * (durationMinutes / 60) * INTENSITY_MULTIPLIER[intensity]);
}

export const exerciseService = {
  async fetch(userId: string) {
    const { data, error } = await supabase
      .from('exercise_logs')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    return { data: data as ExerciseLog[] | null, error: error?.message ?? null };
  },

  async create(input: Omit<ExerciseLog, 'id' | 'created_at'>) {
    
    const { data, error } = await supabase.from('exercise_logs').insert(input).select().single();
    return { data: data as ExerciseLog | null, error: error?.message ?? null };
  },

  async update(id: string, updates: Partial<ExerciseLog>) {
    
    const { error } = await supabase.from('exercise_logs').update(updates).eq('id', id);
    return { error: error?.message ?? null };
  },

  async remove(id: string) {
    
    const { error } = await supabase.from('exercise_logs').delete().eq('id', id);
    return { error: error?.message ?? null };
  },

  getWeeklyStats(logs: ExerciseLog[]) {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recent = logs.filter(l => new Date(l.date) >= weekAgo);
    const byType: Record<string, number> = {};
    EXERCISE_TYPES.forEach(t => { byType[t.key] = 0; });
    recent.forEach(l => { byType[l.type] = (byType[l.type] ?? 0) + l.duration_minutes; });
    return {
      totalMinutes: recent.reduce((a, l) => a + l.duration_minutes, 0),
      totalDistance: recent.reduce((a, l) => a + Number(l.distance_km), 0),
      totalCalories: recent.reduce((a, l) => a + l.calories, 0),
      byType,
      sessions: recent.length,
    };
  },
};
