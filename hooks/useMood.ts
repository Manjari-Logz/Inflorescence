import { useContext } from 'react';
import { MoodContext } from '@/contexts/MoodContext';

export function useMood() {
  const context = useContext(MoodContext);
  if (!context) {
    console.warn('[useMood] must be used within MoodProvider. Returning fallback.');
    return {
      todayMood: null,
      recentMoods: [],
      loading: false,
      setMood: async () => {},
      refresh: async () => {},
    };
  }
  return context;
}
