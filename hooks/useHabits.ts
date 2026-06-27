import { useContext } from 'react';
import { HabitsContext } from '@/contexts/HabitsContext';

export function useHabits() {
  const ctx = useContext(HabitsContext);
  if (!ctx) {
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
