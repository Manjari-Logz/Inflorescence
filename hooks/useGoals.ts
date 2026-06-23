import { useContext } from 'react';
import { GoalsContext } from '@/contexts/GoalsContext';

export function useGoals() {
  const context = useContext(GoalsContext);
  if (!context) {
    console.warn('[useGoals] must be used within GoalsProvider. Returning fallback state.');
    return {
      shortGoals: [],
      longGoals: [],
      dreams: [],
      loading: false,
      addShortGoal: async () => {},
      updateShortGoal: async () => {},
      deleteShortGoal: async () => {},
      addLongGoal: async () => {},
      updateLongGoal: async () => {},
      deleteLongGoal: async () => {},
      addDream: async () => {},
      deleteDream: async () => {},
      refresh: async () => {},
    };
  }
  return context;
}
