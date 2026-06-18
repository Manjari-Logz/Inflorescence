import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from '@/template';
import { tasksService, Task } from '@/services/tasksService';
import { badgesService } from '@/services/badgesService';

interface TasksContextType {
  tasks: Task[];
  loading: boolean;
  addTask: (input: Omit<Task, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  removeTask: (id: string) => Promise<void>;
  completeTask: (id: string) => Promise<{ badge?: string; badgeName?: string } | null>;
  refresh: () => Promise<void>;
}

export const TasksContext = createContext<TasksContextType | undefined>(undefined);

export function TasksProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await tasksService.fetch(user.id);
    if (data) setTasks(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) { load(); } else { setTasks([]); }
  }, [user, load]);

  const addTask = async (input: Omit<Task, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return;
    const { data } = await tasksService.create({ ...input, user_id: user.id });
    if (data) setTasks(prev => [data, ...prev]);
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const { error } = await tasksService.update(id, updates);
    if (!error) setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const removeTask = async (id: string) => {
    const { error } = await tasksService.remove(id);
    if (!error) setTasks(prev => prev.filter(t => t.id !== id));
  };

  const completeTask = async (id: string): Promise<{ badge?: string; badgeName?: string } | null> => {
    if (!user) return null;
    const completedAt = new Date().toISOString();
    const { error } = await tasksService.update(id, { completed: true, completed_at: completedAt });
    if (error) return null;
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: true, completed_at: completedAt } : t));
    const completedCount = tasks.filter(t => t.completed).length + 1;
    const result = await badgesService.checkAndAwardTaskBadge(user.id, completedCount);
    if (result.awarded) return { badge: result.type, badgeName: result.name };
    return null;
  };

  return (
    <TasksContext.Provider value={{ tasks, loading, addTask, updateTask, removeTask, completeTask, refresh: load }}>
      {children}
    </TasksContext.Provider>
  );
}
