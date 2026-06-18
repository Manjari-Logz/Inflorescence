import { useContext } from 'react';
import { TasksContext } from '@/contexts/TasksContext';

export function useTasks() {
  const context = useContext(TasksContext);
  if (!context) throw new Error('useTasks must be used within TasksProvider');
  return context;
}
