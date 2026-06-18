import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from '@/template';
import { moodService, MoodEntry } from '@/services/moodService';

interface MoodContextType {
  todayMood: MoodEntry | null;
  recentMoods: MoodEntry[];
  loading: boolean;
  setMood: (mood: string, score: number, notes?: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const MoodContext = createContext<MoodContextType | undefined>(undefined);

export function MoodProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [todayMood, setTodayMood] = useState<MoodEntry | null>(null);
  const [recentMoods, setRecentMoods] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [today, recent] = await Promise.all([
      moodService.fetchTodayMood(user.id),
      moodService.fetchRecentMoods(user.id),
    ]);
    if (today.data) setTodayMood(today.data);
    if (recent.data) setRecentMoods(recent.data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) { load(); } else { setTodayMood(null); setRecentMoods([]); }
  }, [user, load]);

  const setMood = async (mood: string, score: number, notes?: string) => {
    if (!user) return;
    const { data } = await moodService.setMood(user.id, mood, score, notes);
    if (data) {
      setTodayMood(data);
      setRecentMoods(prev => [data, ...prev.filter(m => m.date !== data.date)]);
    }
  };

  return (
    <MoodContext.Provider value={{ todayMood, recentMoods, loading, setMood, refresh: load }}>
      {children}
    </MoodContext.Provider>
  );
}
