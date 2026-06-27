import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { exerciseService, ExerciseLog } from '@/services/exerciseService';

interface ExerciseContextType {
  logs: ExerciseLog[];
  loading: boolean;
  addLog: (input: Omit<ExerciseLog, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  updateLog: (id: string, updates: Partial<ExerciseLog>) => Promise<void>;
  removeLog: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const ExerciseContext = createContext<ExerciseContextType | undefined>(undefined);

export function ExerciseProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ExerciseLog[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await exerciseService.fetch(user.id);
    if (data) setLogs(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) load(); else setLogs([]);
  }, [user, load]);

  const addLog = async (input: Omit<ExerciseLog, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return;
    const { data } = await exerciseService.create({ ...input, user_id: user.id });
    if (data) setLogs(prev => [data, ...prev]);
  };

  const updateLog = async (id: string, updates: Partial<ExerciseLog>) => {
    const { error } = await exerciseService.update(id, updates);
    if (!error) setLogs(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const removeLog = async (id: string) => {
    const { error } = await exerciseService.remove(id);
    if (!error) setLogs(prev => prev.filter(l => l.id !== id));
  };

  return (
    <ExerciseContext.Provider value={{ logs, loading, addLog, updateLog, removeLog, refresh: load }}>
      {children}
    </ExerciseContext.Provider>
  );
}
