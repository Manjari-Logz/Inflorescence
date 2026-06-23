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
  archiveTask: (id: string) => Promise<void>;
  restoreTask: (id: string) => Promise<void>;
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
    // Optimistic update
    const tempId = `temp_${Date.now()}`;
    const optimistic: Task = { ...input, id: tempId, user_id: user.id, created_at: new Date().toISOString() };
    setTasks(prev => [optimistic, ...prev]);
    const { data, error } = await tasksService.create({ ...input, user_id: user.id });
    if (data) {
      setTasks(prev => prev.map(t => t.id === tempId ? data : t));
    } else {
      setTasks(prev => prev.filter(t => t.id !== tempId));
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    const { error } = await tasksService.update(id, updates);
    if (error) await load(); // revert on error
  };

  const removeTask = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    const { error } = await tasksService.remove(id);
    if (error) await load();
  };

  const completeTask = async (id: string): Promise<{ badge?: string; badgeName?: string } | null> => {
    if (!user) return null;
    const completedAt = new Date().toISOString();
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: true, completed_at: completedAt } : t));
    const { error } = await tasksService.update(id, { completed: true, completed_at: completedAt });
    if (error) { await load(); return null; }
    const completedCount = tasks.filter(t => t.completed).length + 1;
    const result = await badgesService.checkAndAwardTaskBadge(user.id, completedCount);
    if (result.awarded) {
      const badgeName = 'name' in result ? result.name : result.type;
      return { badge: result.type, badgeName };
    }
    return null;
  };

  const archiveTask = async (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, archived: true } : t));
    await tasksService.update(id, { archived: true } as any);
  };

  const restoreTask = async (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, archived: false } : t));
    await tasksService.update(id, { archived: false } as any);
  };

  return (
    <TasksContext.Provider value={{ tasks, loading, addTask, updateTask, removeTask, completeTask, archiveTask, restoreTask, refresh: load }}>
      {children}
    </TasksContext.Provider>
  );
}
