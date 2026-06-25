import { useContext } from 'react';
import { TasksContext } from '@/contexts/TasksContext';

export function useTasks() {
  const context = useContext(TasksContext);
  if (!context) {
    console.warn('[useTasks] must be used within TasksProvider. Returning fallback state.');
    return {
      tasks: [],
      loading: false,
      addTask: async () => {},
      updateTask: async () => {},
      removeTask: async () => {},
      completeTask: async () => null,
      archiveTask: async () => {},
      restoreTask: async () => {},
      refresh: async () => {},
      
      // Fallback History Fields & Methods
      history: [],
      historyLoading: false,
      addHistory: async () => {},
      removeHistory: async () => {},
      clearHistory: async () => {},
      searchHistory: () => [],
      filterHistory: () => [],
      refreshHistory: async () => {},
    };
  }
  return context;
}
