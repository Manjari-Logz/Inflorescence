import { useContext } from 'react';
import { HabitsContext } from '@/contexts/HabitsContext';

export function useHabits() {
  const ctx = useContext(HabitsContext);
  if (!ctx) {
    console.warn('[useHabits] must be used within HabitsProvider. Returning fallback state.');
    return {
      habits: [],
      loading: false,
      addHabit: async () => {},
      updateHabit: async () => {},
      deleteHabit: async () => {},
      logHabit: async () => {},
      unlogHabit: async () => {},
      refresh: async () => {},
    };
  }
  return ctx;
}
